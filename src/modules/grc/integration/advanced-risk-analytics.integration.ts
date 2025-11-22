/**
 * Advanced Risk Analytics Integration
 * Phase 3: GRC Enhancement - Advanced Features Part 1
 */

import { supabase } from '@/integrations/supabase/client';
import { logRiskAssess, logExport } from '@/lib/audit/unified-grc-logger';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface RiskHeatMapCell {
  tenant_id: string;
  risk_category: string;
  likelihood_score: number;
  impact_score: number;
  current_likelihood: number;
  current_impact: number;
  risk_status: string;
  risk_count: number;
}

export interface RiskTrendPoint {
  snapshot_date: string;
  risk_category: string;
  total_risks: number;
  high_risks: number;
  medium_risks: number;
  low_risks: number;
  avg_inherent_score: number;
  avg_current_score: number;
}

export interface RiskCorrelation {
  category_a: string;
  category_b: string;
  correlation_strength: number;
  shared_controls: number;
  recommendation: string;
}

// ==========================================
// RISK HEAT MAP
// ==========================================

export async function fetchRiskHeatMap(tenantId: string): Promise<RiskHeatMapCell[]> {
  const { data, error } = await supabase
    .from('vw_risk_heat_map')
    .select('*')
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('[Risk Heat Map] Fetch error:', error);
    throw new Error(`فشل تحميل خريطة المخاطر: ${error.message}`);
  }

  return data || [];
}

// ==========================================
// RISK TRENDS ANALYSIS
// ==========================================

export async function fetchRiskTrends(
  tenantId: string,
  periodDays: number = 90
): Promise<RiskTrendPoint[]> {
  const { data, error } = await supabase.rpc('fn_grc_get_risk_trends', {
    p_tenant_id: tenantId,
    p_period_days: periodDays,
  });

  if (error) {
    console.error('[Risk Trends] Fetch error:', error);
    throw new Error(`فشل تحميل اتجاهات المخاطر: ${error.message}`);
  }

  // Log analytics action
  if (data && data.length > 0) {
    await logRiskAssess(tenantId, {
      action: 'trends_analysis',
      period_days: periodDays,
      data_points: data.length,
    });
  }

  return data || [];
}

// ==========================================
// RISK CORRELATION ANALYSIS
// ==========================================

export async function analyzeRiskCorrelations(
  tenantId: string
): Promise<RiskCorrelation[]> {
  const { data, error } = await supabase.rpc('fn_grc_analyze_risk_correlations', {
    p_tenant_id: tenantId,
  });

  if (error) {
    console.error('[Risk Correlation] Analysis error:', error);
    throw new Error(`فشل تحليل الارتباط: ${error.message}`);
  }

  // Log correlation analysis
  if (data && data.length > 0) {
    await logRiskAssess(tenantId, {
      action: 'correlation_analysis',
      correlations_found: data.length,
    });
  }

  return data || [];
}

// ==========================================
// ADVANCED RISK SCORING (Predictive)
// ==========================================

export interface PredictiveRiskScore {
  risk_id: string;
  risk_code: string;
  risk_title: string;
  current_score: number;
  predicted_score: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  factors: string[];
}

export async function calculatePredictiveRiskScores(
  tenantId: string
): Promise<PredictiveRiskScore[]> {
  // Fetch current risks
  const { data: risks, error } = await supabase
    .from('grc_risks')
    .select(`
      id,
      risk_code,
      risk_title,
      risk_category,
      likelihood_score,
      impact_score,
      current_likelihood_score,
      current_impact_score,
      risk_status,
      created_at
    `)
    .eq('tenant_id', tenantId)
    .eq('is_active', true);

  if (error) {
    console.error('[Predictive Scoring] Fetch error:', error);
    throw new Error(`فشل حساب التوقعات: ${error.message}`);
  }

  // Simple predictive model (can be enhanced with ML)
  const predictiveScores: PredictiveRiskScore[] = (risks || []).map((risk) => {
    const currentScore = 
      (risk.current_likelihood_score || risk.likelihood_score) *
      (risk.current_impact_score || risk.impact_score);
    
    const inherentScore = risk.likelihood_score * risk.impact_score;
    
    // Calculate trend based on score change
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    let predicted_score = currentScore;
    
    if (currentScore > inherentScore * 1.1) {
      trend = 'increasing';
      predicted_score = currentScore * 1.15; // 15% increase prediction
    } else if (currentScore < inherentScore * 0.9) {
      trend = 'decreasing';
      predicted_score = currentScore * 0.85; // 15% decrease prediction
    }
    
    // Confidence based on data age
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(risk.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    const confidence = Math.min(0.9, daysSinceCreation / 180); // Max 90% after 6 months
    
    return {
      risk_id: risk.id,
      risk_code: risk.risk_code,
      risk_title: risk.risk_title,
      current_score: currentScore,
      predicted_score: Math.round(predicted_score * 10) / 10,
      trend,
      confidence: Math.round(confidence * 100) / 100,
      factors: [
        risk.risk_category,
        risk.risk_status,
        trend === 'increasing' ? 'ضوابط ضعيفة' : 'ضوابط فعالة',
      ],
    };
  });

  // Log predictive analysis
  await logRiskAssess(tenantId, {
    action: 'predictive_scoring',
    risks_analyzed: predictiveScores.length,
  });

  return predictiveScores.sort((a, b) => b.predicted_score - a.predicted_score);
}

// ==========================================
// EXPORT ANALYTICS DATA
// ==========================================

export async function exportRiskAnalytics(
  tenantId: string,
  format: 'csv' | 'pdf' | 'xlsx' = 'csv'
): Promise<Blob> {
  // Fetch all analytics data
  const [heatMap, trends, correlations, predictive] = await Promise.all([
    fetchRiskHeatMap(tenantId),
    fetchRiskTrends(tenantId, 90),
    analyzeRiskCorrelations(tenantId),
    calculatePredictiveRiskScores(tenantId),
  ]);

  // Convert to CSV (simple implementation)
  if (format === 'csv') {
    let csvContent = '';
    
    // Heat Map section
    csvContent += 'خريطة المخاطر الحرارية\n';
    csvContent += 'الفئة,الاحتمالية,التأثير,الحالة,العدد\n';
    heatMap.forEach((cell) => {
      csvContent += `${cell.risk_category},${cell.likelihood_score},${cell.impact_score},${cell.risk_status},${cell.risk_count}\n`;
    });
    
    csvContent += '\nالاتجاهات\n';
    csvContent += 'التاريخ,الفئة,الإجمالي,عالية,متوسطة,منخفضة\n';
    trends.forEach((trend) => {
      csvContent += `${trend.snapshot_date},${trend.risk_category},${trend.total_risks},${trend.high_risks},${trend.medium_risks},${trend.low_risks}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Log export
    await logExport(tenantId, 'grc_risk', {
      format,
      sections: ['heat_map', 'trends', 'correlations', 'predictive'],
    });
    
    return blob;
  }
  
  throw new Error(`صيغة التصدير ${format} غير مدعومة حاليًا`);
}
