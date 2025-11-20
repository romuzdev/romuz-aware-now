-- Gate-K Part 3.A: Trend Views (Fixed with Unique Indexes)

-- ============================================================
-- 1) WEEKLY TRENDS MATERIALIZED VIEW
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_kpi_trends_weekly AS
SELECT
  tenant_id,
  kpi_key,
  date_trunc('week', ts)::date AS week_start,
  trend_window,
  COUNT(*) AS sample_count,
  AVG(value) AS avg_value,
  STDDEV_POP(value) AS stddev_value,
  MIN(value) AS min_value,
  MAX(value) AS max_value,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value) AS p50_value,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) AS p95_value,
  NULL::NUMERIC AS delta_pct,
  0::BIGINT AS anomaly_count
FROM public.kpi_series
GROUP BY tenant_id, kpi_key, date_trunc('week', ts), trend_window;

-- UNIQUE index for CONCURRENTLY refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_kpi_trends_weekly_unique
  ON public.mv_kpi_trends_weekly (tenant_id, kpi_key, week_start, trend_window);

-- Additional index for time queries
CREATE INDEX IF NOT EXISTS idx_mv_kpi_trends_weekly_time
  ON public.mv_kpi_trends_weekly (tenant_id, week_start DESC);

COMMENT ON MATERIALIZED VIEW public.mv_kpi_trends_weekly IS 
  'Gate-K: Weekly KPI aggregations with statistics (ISO week)';

-- ============================================================
-- 2) QUARTERLY TRENDS MATERIALIZED VIEW
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_kpi_trends_quarterly AS
SELECT
  tenant_id,
  kpi_key,
  date_trunc('quarter', ts)::date AS quarter_start,
  trend_window,
  COUNT(*) AS sample_count,
  AVG(value) AS avg_value,
  STDDEV_POP(value) AS stddev_value,
  MIN(value) AS min_value,
  MAX(value) AS max_value,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value) AS p50_value,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) AS p95_value,
  NULL::NUMERIC AS delta_pct,
  0::BIGINT AS anomaly_count
FROM public.kpi_series
GROUP BY tenant_id, kpi_key, date_trunc('quarter', ts), trend_window;

-- UNIQUE index for CONCURRENTLY refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_kpi_trends_quarterly_unique
  ON public.mv_kpi_trends_quarterly (tenant_id, kpi_key, quarter_start, trend_window);

-- Additional index for time queries
CREATE INDEX IF NOT EXISTS idx_mv_kpi_trends_quarterly_time
  ON public.mv_kpi_trends_quarterly (tenant_id, quarter_start DESC);

COMMENT ON MATERIALIZED VIEW public.mv_kpi_trends_quarterly IS 
  'Gate-K: Quarterly KPI aggregations with statistics';

-- ============================================================
-- 3) SECURITY DEFINER FUNCTIONS
-- ============================================================

-- Function for WEEKLY trends
CREATE OR REPLACE FUNCTION public.get_kpi_trends_weekly(
  p_kpi_key TEXT DEFAULT NULL,
  p_trend_window public.kpi_trend_window DEFAULT NULL,
  p_from_week DATE DEFAULT NULL,
  p_to_week DATE DEFAULT NULL
)
RETURNS TABLE (
  tenant_id UUID,
  kpi_key TEXT,
  week_start DATE,
  trend_window public.kpi_trend_window,
  sample_count BIGINT,
  avg_value NUMERIC,
  stddev_value NUMERIC,
  min_value NUMERIC,
  max_value NUMERIC,
  p50_value NUMERIC,
  p95_value NUMERIC,
  delta_pct NUMERIC,
  anomaly_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User not associated with any tenant';
  END IF;
  
  RETURN QUERY
  SELECT 
    mv.tenant_id,
    mv.kpi_key,
    mv.week_start,
    mv.trend_window,
    mv.sample_count,
    mv.avg_value,
    mv.stddev_value,
    mv.min_value,
    mv.max_value,
    mv.p50_value,
    mv.p95_value,
    mv.delta_pct,
    mv.anomaly_count
  FROM public.mv_kpi_trends_weekly mv
  WHERE mv.tenant_id = v_tenant_id
    AND (p_kpi_key IS NULL OR mv.kpi_key = p_kpi_key)
    AND (p_trend_window IS NULL OR mv.trend_window = p_trend_window)
    AND (p_from_week IS NULL OR mv.week_start >= p_from_week)
    AND (p_to_week IS NULL OR mv.week_start <= p_to_week)
  ORDER BY mv.week_start DESC, mv.kpi_key;
END;
$$;

COMMENT ON FUNCTION public.get_kpi_trends_weekly IS 
  'Gate-K: Secure access to weekly KPI trends with automatic tenant filtering';

-- Function for QUARTERLY trends
CREATE OR REPLACE FUNCTION public.get_kpi_trends_quarterly(
  p_kpi_key TEXT DEFAULT NULL,
  p_trend_window public.kpi_trend_window DEFAULT NULL,
  p_from_quarter DATE DEFAULT NULL,
  p_to_quarter DATE DEFAULT NULL
)
RETURNS TABLE (
  tenant_id UUID,
  kpi_key TEXT,
  quarter_start DATE,
  trend_window public.kpi_trend_window,
  sample_count BIGINT,
  avg_value NUMERIC,
  stddev_value NUMERIC,
  min_value NUMERIC,
  max_value NUMERIC,
  p50_value NUMERIC,
  p95_value NUMERIC,
  delta_pct NUMERIC,
  anomaly_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User not associated with any tenant';
  END IF;
  
  RETURN QUERY
  SELECT 
    mv.tenant_id,
    mv.kpi_key,
    mv.quarter_start,
    mv.trend_window,
    mv.sample_count,
    mv.avg_value,
    mv.stddev_value,
    mv.min_value,
    mv.max_value,
    mv.p50_value,
    mv.p95_value,
    mv.delta_pct,
    mv.anomaly_count
  FROM public.mv_kpi_trends_quarterly mv
  WHERE mv.tenant_id = v_tenant_id
    AND (p_kpi_key IS NULL OR mv.kpi_key = p_kpi_key)
    AND (p_trend_window IS NULL OR mv.trend_window = p_trend_window)
    AND (p_from_quarter IS NULL OR mv.quarter_start >= p_from_quarter)
    AND (p_to_quarter IS NULL OR mv.quarter_start <= p_to_quarter)
  ORDER BY mv.quarter_start DESC, mv.kpi_key;
END;
$$;

COMMENT ON FUNCTION public.get_kpi_trends_quarterly IS 
  'Gate-K: Secure access to quarterly KPI trends with automatic tenant filtering';

-- ============================================================
-- 4) UPDATE REFRESH FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.refresh_gate_k_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Refresh all Gate-K materialized views concurrently
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_trends_weekly;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_trends_monthly;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_trends_quarterly;
END;
$$;

COMMENT ON FUNCTION public.refresh_gate_k_views IS 
  'Gate-K: Refresh all trend materialized views (weekly, monthly, quarterly)';

-- ============================================================
-- 5) REVOKE DIRECT ACCESS (security)
-- ============================================================
REVOKE ALL ON public.mv_kpi_trends_weekly FROM PUBLIC;
REVOKE ALL ON public.mv_kpi_trends_weekly FROM anon;
REVOKE ALL ON public.mv_kpi_trends_weekly FROM authenticated;
GRANT SELECT ON public.mv_kpi_trends_weekly TO service_role;

REVOKE ALL ON public.mv_kpi_trends_quarterly FROM PUBLIC;
REVOKE ALL ON public.mv_kpi_trends_quarterly FROM anon;
REVOKE ALL ON public.mv_kpi_trends_quarterly FROM authenticated;
GRANT SELECT ON public.mv_kpi_trends_quarterly TO service_role;

-- ============================================================
-- 6) POPULATE VIEWS
-- ============================================================
REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_trends_weekly;
REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_trends_quarterly;