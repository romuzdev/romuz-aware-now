/**
 * GRC Reports Integration
 * Supabase integration for advanced reporting
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  ReportConfig,
  ReportData,
  ReportSummary,
  HeatMapData,
  RiskTrendAnalysis,
  ControlPerformanceReport,
  ExportOptions,
} from '../types/report.types';

/**
 * Generate Risk Summary Report
 */
export const generateRiskSummaryReport = async (
  config: ReportConfig
): Promise<ReportData> => {
  const startTime = Date.now();

  // Build query with filters
  let query = supabase
    .from('grc_risks')
    .select('*', { count: 'exact' });

  if (config.filters?.categories?.length) {
    query = query.in('category', config.filters.categories);
  }

  if (config.filters?.statuses?.length) {
    query = query.in('status', config.filters.statuses);
  }

  if (config.dateRange) {
    query = query
      .gte('created_at', config.dateRange.from)
      .lte('created_at', config.dateRange.to);
  }

  const { data: risks, error, count } = await query;

  if (error) throw error;

  // Calculate summary statistics
  const summary: ReportSummary = {
    totalRisks: count || 0,
    criticalRisks: risks?.filter(r => r.inherent_score >= 20).length || 0,
    highRisks: risks?.filter(r => r.inherent_score >= 15 && r.inherent_score < 20).length || 0,
    mediumRisks: risks?.filter(r => r.inherent_score >= 8 && r.inherent_score < 15).length || 0,
    lowRisks: risks?.filter(r => r.inherent_score < 8).length || 0,
    risksByStatus: risks?.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {},
    risksByCategory: risks?.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {},
    controlEffectiveness: {
      effective: 0,
      partiallyEffective: 0,
      ineffective: 0,
      notTested: 0,
    },
    treatmentProgress: {
      planned: 0,
      inProgress: 0,
      completed: 0,
    },
  };

  // Get control effectiveness
  const { data: controls } = await supabase
    .from('grc_controls')
    .select('effectiveness_rating');

  if (controls) {
    summary.controlEffectiveness = {
      effective: controls.filter(c => c.effectiveness_rating === 'effective').length,
      partiallyEffective: controls.filter(c => c.effectiveness_rating === 'partially_effective').length,
      ineffective: controls.filter(c => c.effectiveness_rating === 'ineffective').length,
      notTested: controls.filter(c => c.effectiveness_rating === 'not_tested').length,
    };
  }

  // Get treatment plan progress
  const { data: plans } = await supabase
    .from('grc_treatment_plans')
    .select('status');

  if (plans) {
    summary.treatmentProgress = {
      planned: plans.filter(p => p.status === 'planned').length,
      inProgress: plans.filter(p => p.status === 'in_progress').length,
      completed: plans.filter(p => p.status === 'completed').length,
    };
  }

  const executionTime = Date.now() - startTime;

  return {
    id: crypto.randomUUID(),
    type: config.type,
    title: config.title,
    generatedAt: new Date().toISOString(),
    generatedBy: 'current_user',
    config,
    data: {
      summary,
      details: config.includeDetails ? { risks } : undefined,
    },
    metadata: {
      totalRecords: count || 0,
      filteredRecords: risks?.length || 0,
      executionTime,
    },
  };
};

/**
 * Generate Risk Heat Map Data
 */
export const generateHeatMapData = async (): Promise<HeatMapData[]> => {
  const { data: risks, error } = await supabase
    .from('grc_risks')
    .select('id, title, inherent_likelihood, inherent_impact, inherent_score')
    .eq('status', 'assessed');

  if (error) throw error;

  // Group risks by likelihood and impact
  const heatMap: Map<string, HeatMapData> = new Map();

  risks?.forEach(risk => {
    const key = `${risk.inherent_likelihood}-${risk.inherent_impact}`;
    
    if (!heatMap.has(key)) {
      heatMap.set(key, {
        likelihood: risk.inherent_likelihood,
        impact: risk.inherent_impact,
        count: 0,
        risks: [],
      });
    }

    const cell = heatMap.get(key)!;
    cell.count += 1;
    cell.risks.push({
      id: risk.id,
      title: risk.title,
      score: risk.inherent_score,
    });
  });

  return Array.from(heatMap.values());
};

/**
 * Generate Risk Trend Analysis
 */
export const generateRiskTrendAnalysis = async (
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly',
  months: number = 6
): Promise<RiskTrendAnalysis> => {
  const { data: risks, error } = await supabase
    .from('grc_risks')
    .select('created_at, inherent_score, residual_score, category')
    .gte('created_at', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString());

  if (error) throw error;

  // Group by period
  const trendData = new Map<string, {
    totalRisks: number;
    criticalRisks: number;
    highRisks: number;
    inherentScores: number[];
    residualScores: number[];
  }>();

  risks?.forEach(risk => {
    const date = new Date(risk.created_at);
    let periodKey: string;

    switch (period) {
      case 'daily':
        periodKey = date.toISOString().split('T')[0];
        break;
      case 'weekly':
        const week = Math.floor(date.getDate() / 7);
        periodKey = `${date.getFullYear()}-W${week}`;
        break;
      case 'monthly':
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'quarterly':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        periodKey = `${date.getFullYear()}-Q${quarter}`;
        break;
    }

    if (!trendData.has(periodKey)) {
      trendData.set(periodKey, {
        totalRisks: 0,
        criticalRisks: 0,
        highRisks: 0,
        inherentScores: [],
        residualScores: [],
      });
    }

    const periodData = trendData.get(periodKey)!;
    periodData.totalRisks += 1;
    if (risk.inherent_score >= 20) periodData.criticalRisks += 1;
    if (risk.inherent_score >= 15) periodData.highRisks += 1;
    periodData.inherentScores.push(risk.inherent_score);
    if (risk.residual_score) periodData.residualScores.push(risk.residual_score);
  });

  // Calculate averages and format data
  const data = Array.from(trendData.entries())
    .map(([date, stats]) => ({
      date,
      totalRisks: stats.totalRisks,
      criticalRisks: stats.criticalRisks,
      highRisks: stats.highRisks,
      avgInherentScore: stats.inherentScores.reduce((a, b) => a + b, 0) / stats.inherentScores.length,
      avgResidualScore: stats.residualScores.length > 0
        ? stats.residualScores.reduce((a, b) => a + b, 0) / stats.residualScores.length
        : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate trend
  const firstPeriod = data[0];
  const lastPeriod = data[data.length - 1];
  const percentChange = firstPeriod && lastPeriod
    ? ((lastPeriod.totalRisks - firstPeriod.totalRisks) / firstPeriod.totalRisks) * 100
    : 0;

  const trend = percentChange > 5 ? 'increasing' 
    : percentChange < -5 ? 'decreasing' 
    : 'stable';

  return {
    period,
    data,
    insights: {
      trend,
      percentChange,
      recommendations: generateRecommendations(trend, data),
    },
  };
};

/**
 * Generate Control Performance Report
 */
export const generateControlPerformanceReport = async (): Promise<ControlPerformanceReport> => {
  const { data: controls, error } = await supabase
    .from('grc_controls')
    .select(`
      *,
      grc_control_tests!left (
        test_date,
        result
      )
    `);

  if (error) throw error;

  const totalControls = controls?.length || 0;
  const testedControls = controls?.filter(c => 
    c.effectiveness_rating !== 'not_tested'
  ).length || 0;

  const effectiveControls = controls?.filter(c => 
    c.effectiveness_rating === 'effective'
  ).length || 0;

  const byType: Record<string, any> = {};
  const byCategory: Record<string, any> = {};

  controls?.forEach(control => {
    // By type
    if (!byType[control.control_type]) {
      byType[control.control_type] = { total: 0, effective: 0, ineffective: 0 };
    }
    byType[control.control_type].total += 1;
    if (control.effectiveness_rating === 'effective') {
      byType[control.control_type].effective += 1;
    } else if (control.effectiveness_rating === 'ineffective') {
      byType[control.control_type].ineffective += 1;
    }

    // By category
    if (!byCategory[control.category]) {
      byCategory[control.category] = { total: 0, effectiveRate: 0 };
    }
    byCategory[control.category].total += 1;
  });

  // Calculate effective rates
  Object.keys(byCategory).forEach(category => {
    const categoryControls = controls?.filter(c => c.category === category) || [];
    const effective = categoryControls.filter(c => c.effectiveness_rating === 'effective').length;
    byCategory[category].effectiveRate = categoryControls.length > 0
      ? (effective / categoryControls.length) * 100
      : 0;
  });

  return {
    totalControls,
    testedControls,
    effectiveRate: totalControls > 0 ? (effectiveControls / totalControls) * 100 : 0,
    testingCoverage: totalControls > 0 ? (testedControls / totalControls) * 100 : 0,
    overdue: 0, // Will be calculated based on test_frequency
    byType,
    byCategory,
    trends: [], // Will be populated with historical data
  };
};

/**
 * Export Report Data
 */
export const exportReport = async (
  reportData: ReportData,
  options: ExportOptions
): Promise<Blob> => {
  switch (options.format) {
    case 'json':
      return new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json',
      });

    case 'csv':
      return exportToCSV(reportData);

    case 'excel':
      // Will be implemented with a library like exceljs
      throw new Error('Excel export not yet implemented');

    case 'pdf':
      // Will be implemented with a library like jsPDF
      throw new Error('PDF export not yet implemented');

    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
};

/**
 * Export to CSV
 */
const exportToCSV = (reportData: ReportData): Blob => {
  const summary = reportData.data.summary;
  
  let csv = 'Risk Summary Report\n\n';
  csv += `Generated At,${reportData.generatedAt}\n`;
  csv += `Report Type,${reportData.type}\n\n`;
  
  csv += 'Metric,Value\n';
  csv += `Total Risks,${summary.totalRisks}\n`;
  csv += `Critical Risks,${summary.criticalRisks}\n`;
  csv += `High Risks,${summary.highRisks}\n`;
  csv += `Medium Risks,${summary.mediumRisks}\n`;
  csv += `Low Risks,${summary.lowRisks}\n\n`;
  
  csv += 'Status,Count\n';
  Object.entries(summary.risksByStatus).forEach(([status, count]) => {
    csv += `${status},${count}\n`;
  });
  
  return new Blob([csv], { type: 'text/csv' });
};

/**
 * Generate Recommendations based on trends
 */
const generateRecommendations = (
  trend: 'increasing' | 'decreasing' | 'stable',
  data: any[]
): string[] => {
  const recommendations: string[] = [];

  if (trend === 'increasing') {
    recommendations.push('زيادة ملحوظة في عدد المخاطر - يُنصح بمراجعة استراتيجية إدارة المخاطر');
    recommendations.push('تفعيل المزيد من خطط المعالجة للمخاطر عالية الأولوية');
  } else if (trend === 'decreasing') {
    recommendations.push('انخفاض إيجابي في عدد المخاطر - استمرار في نفس النهج');
    recommendations.push('مراجعة الممارسات الناجحة لتطبيقها على مخاطر أخرى');
  } else {
    recommendations.push('استقرار في مستوى المخاطر - الحفاظ على المراقبة المستمرة');
  }

  const lastPeriod = data[data.length - 1];
  if (lastPeriod && lastPeriod.criticalRisks > 0) {
    recommendations.push(`يوجد ${lastPeriod.criticalRisks} مخاطر حرجة تتطلب اهتمام فوري`);
  }

  return recommendations;
};
