-- Gate-K: Fix Materialized View Security (Using Function)
-- Fix WARN: Materialized View in API

-- Revoke direct access to materialized view from all roles
REVOKE ALL ON public.mv_kpi_trends_monthly FROM PUBLIC;
REVOKE ALL ON public.mv_kpi_trends_monthly FROM anon;
REVOKE ALL ON public.mv_kpi_trends_monthly FROM authenticated;

-- Grant access only to service_role for refresh operations
GRANT SELECT ON public.mv_kpi_trends_monthly TO service_role;

-- Create SECURITY DEFINER function for safe access with tenant filtering
CREATE OR REPLACE FUNCTION public.get_kpi_trends_monthly(
  p_kpi_key TEXT DEFAULT NULL,
  p_trend_window public.kpi_trend_window DEFAULT NULL,
  p_from_month DATE DEFAULT NULL,
  p_to_month DATE DEFAULT NULL
)
RETURNS TABLE (
  tenant_id UUID,
  kpi_key TEXT,
  month DATE,
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
  -- Get current user's tenant
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User not associated with any tenant';
  END IF;
  
  -- Return filtered results
  RETURN QUERY
  SELECT 
    mv.tenant_id,
    mv.kpi_key,
    mv.month,
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
  FROM public.mv_kpi_trends_monthly mv
  WHERE mv.tenant_id = v_tenant_id
    AND (p_kpi_key IS NULL OR mv.kpi_key = p_kpi_key)
    AND (p_trend_window IS NULL OR mv.trend_window = p_trend_window)
    AND (p_from_month IS NULL OR mv.month >= p_from_month)
    AND (p_to_month IS NULL OR mv.month <= p_to_month)
  ORDER BY mv.month DESC, mv.kpi_key;
END;
$$;

-- Comment on function
COMMENT ON FUNCTION public.get_kpi_trends_monthly IS 'Gate-K: Secure access to monthly KPI trends with automatic tenant filtering';
