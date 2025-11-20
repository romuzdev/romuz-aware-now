/**
 * Advanced Analytics Types
 * Week 4 - Phase 3
 */

export interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  trend: 'up' | 'down' | 'stable';
  changePercent?: number;
  category: string;
  timestamp: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  category?: string;
}

export interface TrendAnalysis {
  metric: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  prediction?: number;
  analysis: string;
}

export interface AnalyticsDashboardConfig {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  filters: AnalyticsFilters;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'heatmap';
  title: string;
  config: Record<string, any>;
  position: { x: number; y: number; w: number; h: number };
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  gap: number;
}

export interface AnalyticsFilters {
  dateRange: DateRange;
  campaigns?: string[];
  departments?: string[];
  metrics?: string[];
}

export interface DateRange {
  start: string;
  end: string;
  preset?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

export interface MetricComparison {
  metric: string;
  current: number;
  previous: number;
  difference: number;
  percentChange: number;
  status: 'improved' | 'declined' | 'stable';
}

export interface PredictiveInsight {
  id: string;
  metric: string;
  prediction: number;
  confidence: number;
  timeframe: string;
  factors: string[];
  recommendation: string;
}

export interface AnalyticsExport {
  format: 'csv' | 'json' | 'excel' | 'pdf';
  data: any[];
  fileName: string;
  timestamp: string;
}
