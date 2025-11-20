// ============================================================================
// Analytics Module - Gate-K Types
// KPI Monitoring & Trend Analysis
// ============================================================================

import { z } from "zod";

// Trend Window Enum
export const TrendWindow = z.enum(["none", "W12", "M6", "Q4"]);
export type TrendWindow = z.infer<typeof TrendWindow>;

// KPI Trend Types
export const KpiTrendWeekly = z.object({
  tenant_id: z.string().uuid(),
  kpi_key: z.string(),
  week_start: z.string(),
  trend_window: TrendWindow,
  sample_count: z.number().nullable(),
  avg_value: z.number().nullable(),
  stddev_value: z.number().nullable(),
  min_value: z.number().nullable(),
  max_value: z.number().nullable(),
  p50_value: z.number().nullable(),
  p95_value: z.number().nullable(),
  delta_pct: z.number().nullable(),
  anomaly_count: z.number().nullable(),
});
export type KpiTrendWeekly = z.infer<typeof KpiTrendWeekly>;

export const KpiTrendMonthly = z.object({
  tenant_id: z.string().uuid(),
  kpi_key: z.string(),
  month: z.string(),
  trend_window: TrendWindow,
  sample_count: z.number().nullable(),
  avg_value: z.number().nullable(),
  stddev_value: z.number().nullable(),
  min_value: z.number().nullable(),
  max_value: z.number().nullable(),
  p50_value: z.number().nullable(),
  p95_value: z.number().nullable(),
  delta_pct: z.number().nullable(),
  anomaly_count: z.number().nullable(),
});
export type KpiTrendMonthly = z.infer<typeof KpiTrendMonthly>;

export const KpiTrendQuarterly = z.object({
  tenant_id: z.string().uuid(),
  kpi_key: z.string(),
  quarter_start: z.string(),
  trend_window: TrendWindow,
  sample_count: z.number().nullable(),
  avg_value: z.number().nullable(),
  stddev_value: z.number().nullable(),
  min_value: z.number().nullable(),
  max_value: z.number().nullable(),
  p50_value: z.number().nullable(),
  p95_value: z.number().nullable(),
  delta_pct: z.number().nullable(),
  anomaly_count: z.number().nullable(),
});
export type KpiTrendQuarterly = z.infer<typeof KpiTrendQuarterly>;

// Monthly Flag Type
export const MonthlyFlag = z.object({
  tenant_id: z.string().uuid(),
  kpi_key: z.string(),
  month: z.string(),
  trend_window: TrendWindow,
  avg_value: z.number().nullable(),
  prev_avg: z.number().nullable(),
  delta_pct: z.number().nullable(),
  sample_count: z.number().nullable(),
  zscore: z.number().nullable(),
  mu: z.number().nullable(),
  sigma: z.number().nullable(),
  min_sample: z.number().nullable(),
  warn_delta: z.number().nullable(),
  alert_delta: z.number().nullable(),
  zscore_alert: z.number().nullable(),
  control_lower: z.number().nullable(),
  control_upper: z.number().nullable(),
  flag: z.string(), // ok|warn|alert|no_ref
});
export type MonthlyFlag = z.infer<typeof MonthlyFlag>;

// RCA Top Contributors Type
export const RcaTopContributor = z.object({
  tenant_id: z.string().uuid(),
  kpi_key: z.string(),
  month: z.string(),
  trend_window: TrendWindow,
  dim_key: z.string(),
  dim_value: z.string(),
  delta_pct: z.number().nullable(),
  contribution_score: z.number().nullable(),
  share_ratio: z.number().nullable(),
  variance_from_overall_pct: z.number().nullable(),
  contributor_rnk: z.number(),
  rnk: z.number(),
});
export type RcaTopContributor = z.infer<typeof RcaTopContributor>;

// Recommendation Type
export const Recommendation = z.object({
  id: z.number(),
  tenant_id: z.string().uuid(),
  kpi_key: z.string(),
  month: z.string(),
  trend_window: TrendWindow,
  dim_key: z.string(),
  dim_value: z.string(),
  flag: z.string(),
  title_ar: z.string(),
  body_ar: z.string(),
  action_type_code: z.string(),
  impact_level: z.string(),
  effort_estimate: z.string(),
  source_ref: z.any(),
  status: z.string(),
  reviewed_by: z.string().uuid().nullable(),
  reviewed_at: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Recommendation = z.infer<typeof Recommendation>;

// Quarterly Insights Type
export const QuarterlyInsight = z.object({
  id: z.number(),
  tenant_id: z.string().uuid(),
  kpi_key: z.string(),
  quarter: z.string(),
  year: z.number(),
  trend_window: TrendWindow,
  insight_type: z.string(),
  summary_ar: z.string(),
  details_ar: z.string().nullable(),
  priority_score: z.number().nullable(),
  source_ref: z.any(),
  kpis_summary: z.record(z.string(), z.any()).optional(),
  top_initiatives: z.array(z.any()).optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type QuarterlyInsight = z.infer<typeof QuarterlyInsight>;

// Generate Insights Response Type
export const GenerateInsightsResponse = z.object({
  success: z.boolean(),
  insights_generated: z.number(),
  message: z.string().nullable(),
  created: z.boolean().optional(),
  quarter: z.number().optional(),
  year: z.number().optional(),
  kpis_count: z.number().optional(),
  initiatives_count: z.number().optional(),
});
export type GenerateInsightsResponse = z.infer<typeof GenerateInsightsResponse>;

// Generate Recommendations Response Type
export const GenerateRecommendationsResponse = z.object({
  success: z.boolean(),
  recommendations_generated: z.number(),
  message: z.string().nullable(),
});
export type GenerateRecommendationsResponse = z.infer<typeof GenerateRecommendationsResponse>;
