-- Part 3.D: Refresh & Ops Infrastructure
-- ========================================

-- 1) Create refresh_log table to track MV refresh timestamps
CREATE TABLE IF NOT EXISTS public.refresh_log (
  id BIGSERIAL PRIMARY KEY,
  view_name TEXT NOT NULL,
  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_ms INTEGER,
  status TEXT DEFAULT 'success',
  error_message TEXT
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_refresh_log_view_name 
  ON public.refresh_log(view_name, refreshed_at DESC);

-- Enable RLS
ALTER TABLE public.refresh_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only service_role and admins can view logs
CREATE POLICY refresh_log_select_policy ON public.refresh_log
  FOR SELECT
  USING (
    auth.role() = 'service_role' 
    OR app_has_role('tenant_admin') 
    OR app_has_role('platform_admin')
  );

-- Only system can insert logs
CREATE POLICY refresh_log_insert_policy ON public.refresh_log
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- 2) Create log_refresh() helper function
CREATE OR REPLACE FUNCTION public.log_refresh(
  p_view_name TEXT,
  p_duration_ms INTEGER DEFAULT NULL,
  p_status TEXT DEFAULT 'success',
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.refresh_log (view_name, duration_ms, status, error_message)
  VALUES (p_view_name, p_duration_ms, p_status, p_error_message);
END;
$$ LANGUAGE plpgsql;

-- 3) Update refresh_gate_k_views() to include logging
CREATE OR REPLACE FUNCTION public.refresh_gate_k_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start TIMESTAMPTZ;
  v_duration INTEGER;
BEGIN
  -- Refresh mv_kpi_trends_weekly
  v_start := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_trends_weekly;
  v_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER;
  PERFORM log_refresh('mv_kpi_trends_weekly', v_duration);
  
  -- Refresh mv_kpi_trends_monthly
  v_start := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_trends_monthly;
  v_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER;
  PERFORM log_refresh('mv_kpi_trends_monthly', v_duration);
  
  -- Refresh mv_kpi_trends_quarterly
  v_start := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_trends_quarterly;
  v_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER;
  PERFORM log_refresh('mv_kpi_trends_quarterly', v_duration);
  
  -- Refresh mv_kpi_monthly_delta
  v_start := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_monthly_delta;
  v_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER;
  PERFORM log_refresh('mv_kpi_monthly_delta', v_duration);
  
  -- Refresh mv_kpi_monthly_anomalies
  v_start := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_monthly_anomalies;
  v_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER;
  PERFORM log_refresh('mv_kpi_monthly_anomalies', v_duration);
  
  -- Refresh mv_kpi_monthly_flags
  v_start := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_monthly_flags;
  v_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER;
  PERFORM log_refresh('mv_kpi_monthly_flags', v_duration);
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error
    PERFORM log_refresh('refresh_gate_k_views', NULL, 'error', SQLERRM);
    RAISE;
END;
$$;

-- 4) Create helper function to get last refresh status
CREATE OR REPLACE FUNCTION public.get_last_refresh_status()
RETURNS TABLE (
  view_name TEXT,
  last_refreshed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  status TEXT
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (rl.view_name)
    rl.view_name,
    rl.refreshed_at,
    rl.duration_ms,
    rl.status
  FROM public.refresh_log rl
  ORDER BY rl.view_name, rl.refreshed_at DESC;
END;
$$ LANGUAGE plpgsql;