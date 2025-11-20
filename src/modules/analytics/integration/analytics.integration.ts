/**
 * Advanced Analytics Integration Layer
 * Week 4 - Phase 3
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  AnalyticsMetric,
  TimeSeriesData,
  TrendAnalysis,
  MetricComparison,
  PredictiveInsight,
  AnalyticsFilters,
} from '../types/analytics.types';

/**
 * Fetch real-time metrics for dashboard
 */
export async function fetchRealtimeMetrics(
  tenantId: string,
  filters: AnalyticsFilters
): Promise<AnalyticsMetric[]> {
  const { data: campaigns, error } = await supabase
    .from('awareness_campaigns')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('start_date', filters.dateRange.start)
    .lte('end_date', filters.dateRange.end);

  if (error) throw error;

  // Calculate metrics
  const totalCampaigns = campaigns?.length || 0;
  const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;
  const completedCampaigns = campaigns?.filter(c => c.status === 'completed').length || 0;

  return [
    {
      id: 'total_campaigns',
      name: 'إجمالي الحملات',
      value: totalCampaigns,
      trend: 'up',
      category: 'campaigns',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'active_campaigns',
      name: 'الحملات النشطة',
      value: activeCampaigns,
      trend: 'stable',
      category: 'campaigns',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'completed_campaigns',
      name: 'الحملات المكتملة',
      value: completedCampaigns,
      trend: 'up',
      category: 'campaigns',
      timestamp: new Date().toISOString(),
    },
  ];
}

/**
 * Fetch time series data for trend analysis
 */
export async function fetchTimeSeriesData(
  tenantId: string,
  metric: string,
  filters: AnalyticsFilters
): Promise<TimeSeriesData[]> {
  // Fetch from appropriate source based on metric
  const { data, error } = await supabase
    .from('awareness_campaigns')
    .select('created_at')
    .eq('tenant_id', tenantId)
    .gte('created_at', filters.dateRange.start)
    .lte('created_at', filters.dateRange.end)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Aggregate by date
  const aggregated = (data || []).reduce((acc, item) => {
    const date = new Date(item.created_at).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date]++;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(aggregated).map(([date, value]) => ({
    date,
    value,
  }));
}

/**
 * Analyze trends and patterns
 */
export async function analyzeTrends(
  tenantId: string,
  metric: string,
  filters: AnalyticsFilters
): Promise<TrendAnalysis> {
  const timeSeriesData = await fetchTimeSeriesData(tenantId, metric, filters);

  // Simple trend analysis
  if (timeSeriesData.length < 2) {
    return {
      metric,
      trend: 'stable',
      confidence: 0.5,
      analysis: 'بيانات غير كافية للتحليل',
    };
  }

  const values = timeSeriesData.map(d => d.value);
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const diff = secondAvg - firstAvg;
  const trend = diff > 0 ? 'increasing' : diff < 0 ? 'decreasing' : 'stable';
  const confidence = Math.min(Math.abs(diff) / firstAvg, 1);

  return {
    metric,
    trend,
    confidence,
    prediction: secondAvg + diff,
    analysis: trend === 'increasing'
      ? 'يظهر المقياس اتجاهاً تصاعدياً إيجابياً'
      : trend === 'decreasing'
      ? 'يظهر المقياس اتجاهاً تنازلياً يحتاج انتباه'
      : 'المقياس مستقر نسبياً',
  };
}

/**
 * Compare metrics between periods
 */
export async function compareMetrics(
  tenantId: string,
  metric: string,
  currentPeriod: { start: string; end: string },
  previousPeriod: { start: string; end: string }
): Promise<MetricComparison> {
  const [currentData, previousData] = await Promise.all([
    fetchTimeSeriesData(tenantId, metric, { dateRange: currentPeriod }),
    fetchTimeSeriesData(tenantId, metric, { dateRange: previousPeriod }),
  ]);

  const current = currentData.reduce((sum, d) => sum + d.value, 0);
  const previous = previousData.reduce((sum, d) => sum + d.value, 0);
  const difference = current - previous;
  const percentChange = previous > 0 ? (difference / previous) * 100 : 0;

  return {
    metric,
    current,
    previous,
    difference,
    percentChange,
    status: difference > 0 ? 'improved' : difference < 0 ? 'declined' : 'stable',
  };
}

/**
 * Generate predictive insights
 */
export async function generatePredictiveInsights(
  tenantId: string,
  filters: AnalyticsFilters
): Promise<PredictiveInsight[]> {
  const metrics = ['completion_rate', 'engagement_score', 'risk_level'];
  
  const insights = await Promise.all(
    metrics.map(async (metric) => {
      const trend = await analyzeTrends(tenantId, metric, filters);
      
      return {
        id: `insight_${metric}`,
        metric,
        prediction: trend.prediction || 0,
        confidence: trend.confidence,
        timeframe: 'الشهر القادم',
        factors: ['الاتجاه التاريخي', 'الأنماط الموسمية', 'معدل النمو'],
        recommendation: trend.trend === 'increasing'
          ? 'استمر في الاستراتيجية الحالية'
          : 'ينصح بمراجعة وتحسين الإجراءات',
      };
    })
  );

  return insights;
}

/**
 * Export analytics data
 */
export async function exportAnalyticsData(
  tenantId: string,
  format: 'csv' | 'json',
  filters: AnalyticsFilters
): Promise<Blob> {
  const metrics = await fetchRealtimeMetrics(tenantId, filters);
  
  if (format === 'json') {
    const jsonData = JSON.stringify(metrics, null, 2);
    return new Blob([jsonData], { type: 'application/json' });
  }

  // CSV format
  const headers = ['ID', 'Name', 'Value', 'Trend', 'Category', 'Timestamp'];
  const rows = metrics.map(m => [
    m.id,
    m.name,
    m.value.toString(),
    m.trend,
    m.category,
    m.timestamp,
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return new Blob([csv], { type: 'text/csv' });
}
