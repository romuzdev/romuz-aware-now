import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import {
  TrendWindow,
  KpiTrendWeekly,
  KpiTrendMonthly,
  KpiTrendQuarterly,
  MonthlyFlag,
  RcaTopContributor,
  Recommendation,
  QuarterlyInsight,
  GenerateInsightsResponse,
  GenerateRecommendationsResponse,
} from "../types";

// ============================================================
// 1) Weekly Trends
// ============================================================
export async function getKpiTrendsWeekly(params: {
  kpi_key?: string;
  trend_window?: z.infer<typeof TrendWindow>;
  from_week?: string;
  to_week?: string;
}) {
  const { data, error } = await supabase.rpc("get_kpi_trends_weekly", {
    p_kpi_key: params.kpi_key ?? null,
    p_trend_window: params.trend_window ?? null,
    p_from_week: params.from_week ?? null,
    p_to_week: params.to_week ?? null,
  });

  if (error) throw error;
  return z.array(KpiTrendWeekly).parse(data);
}

// ============================================================
// 2) Monthly Trends
// ============================================================
export async function getKpiTrendsMonthly(params: {
  kpi_key?: string;
  trend_window?: z.infer<typeof TrendWindow>;
  from_month?: string;
  to_month?: string;
}) {
  const { data, error } = await supabase.rpc("get_kpi_trends_monthly", {
    p_kpi_key: params.kpi_key ?? null,
    p_trend_window: params.trend_window ?? null,
    p_from_month: params.from_month ?? null,
    p_to_month: params.to_month ?? null,
  });

  if (error) throw error;
  return z.array(KpiTrendMonthly).parse(data);
}

// ============================================================
// 3) Quarterly Trends
// ============================================================
export async function getKpiTrendsQuarterly(params: {
  kpi_key?: string;
  trend_window?: z.infer<typeof TrendWindow>;
  from_quarter?: string;
  to_quarter?: string;
}) {
  const { data, error } = await supabase.rpc("get_kpi_trends_quarterly", {
    p_kpi_key: params.kpi_key ?? null,
    p_trend_window: params.trend_window ?? null,
    p_from_quarter: params.from_quarter ?? null,
    p_to_quarter: params.to_quarter ?? null,
  });

  if (error) throw error;
  return z.array(KpiTrendQuarterly).parse(data);
}

// ============================================================
// 4) Monthly Flags
// ============================================================
export async function getKpiMonthlyFlags(params: {
  kpi_key?: string;
  trend_window?: z.infer<typeof TrendWindow>;
  flag?: string;
  from_month?: string;
  to_month?: string;
}) {
  const { data, error } = await supabase.rpc("get_kpi_monthly_flags", {
    p_kpi_key: params.kpi_key ?? null,
    p_trend_window: params.trend_window ?? null,
    p_flag: params.flag ?? null,
    p_from_month: params.from_month ?? null,
    p_to_month: params.to_month ?? null,
  });

  if (error) throw error;
  return z.array(MonthlyFlag).parse(data);
}

// ============================================================
// 5) RCA Top Contributors
// ============================================================
export async function getRcaTopContributors(params: {
  kpi_key: string;
  month: string;
  trend_window?: z.infer<typeof TrendWindow>;
  dim_key?: string;
  top_n?: number;
}) {
  const { data, error } = await supabase.rpc("get_rca_top_contributors", {
    p_kpi_key: params.kpi_key,
    p_month: params.month,
    p_trend_window: params.trend_window ?? null,
    p_dim_key: params.dim_key ?? null,
    p_top_n: params.top_n ?? 5,
  });

  if (error) throw error;
  return z.array(RcaTopContributor).parse(data);
}

// ============================================================
// 6) Recommendations - List
// ============================================================
export async function getRecommendations(params: {
  month?: string;
  kpi_key?: string;
  status?: string;
}) {
  const { data, error } = await supabase.rpc("get_recommendations", {
    p_month: params.month ?? null,
    p_kpi_key: params.kpi_key ?? null,
    p_status: params.status ?? null,
  });

  if (error) throw error;
  return z.array(Recommendation).parse(data);
}

// ============================================================
// 7) Recommendations - Generate
// ============================================================
export async function generateRecommendations(params: {
  month?: string;
  limit?: number;
}) {
  const { data, error } = await supabase.rpc("generate_recommendations", {
    p_month: params.month ?? null,
    p_limit: params.limit ?? 1000,
  });

  if (error) throw error;
  return GenerateRecommendationsResponse.parse(data);
}

// ============================================================
// 8) Quarterly Insights - Get
// ============================================================
export async function getQuarterlyInsights(params: {
  year?: number;
  quarter?: number;
}) {
  const { data, error } = await supabase.rpc("get_quarterly_insights", {
    p_year: params.year ?? null,
    p_quarter: params.quarter ?? null,
  });

  if (error) throw error;
  return z.array(QuarterlyInsight).parse(data);
}

// ============================================================
// 9) Quarterly Insights - Generate
// ============================================================
export async function generateQuarterlyInsights(params: {
  year: number;
  quarter: number;
  limit?: number;
}) {
  const { data, error } = await supabase.rpc("generate_quarterly_insights", {
    p_year: params.year,
    p_quarter: params.quarter,
    p_limit: params.limit ?? 100,
  });

  if (error) throw error;
  
  // The RPC returns TABLE, so data is an array
  if (!data || data.length === 0) {
    throw new Error("No data returned from generate_quarterly_insights");
  }
  
  return GenerateInsightsResponse.parse(data[0]);
}
