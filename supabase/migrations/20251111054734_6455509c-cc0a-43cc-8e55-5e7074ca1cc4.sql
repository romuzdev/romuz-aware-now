-- Part 4.D: Secure RPCs for RCA & Recommendations Access
-- Migration: Create secure RPC functions for querying RCA top contributors and generated recommendations

-- ============================================================
-- 1) Get RCA Top Contributors (Ranked) for a KPI/Month
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_rca_top_contributors(
  p_kpi_key TEXT,
  p_month DATE,
  p_trend_window kpi_trend_window DEFAULT NULL,
  p_dim_key TEXT DEFAULT NULL,
  p_top_n INTEGER DEFAULT 5
)
RETURNS TABLE (
  tenant_id UUID,
  kpi_key TEXT,
  month DATE,
  trend_window kpi_trend_window,
  dim_key TEXT,
  dim_value TEXT,
  delta_pct NUMERIC,
  contribution_score NUMERIC,
  share_ratio NUMERIC,
  variance_from_overall_pct NUMERIC,
  contributor_rnk INTEGER,
  rnk INTEGER
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE 
  v_tenant_id UUID;
BEGIN
  -- Get current user's tenant
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Return filtered results from mv_rca_monthly_top_contributors
  RETURN QUERY
  SELECT 
    mv.tenant_id,
    mv.kpi_key,
    mv.month,
    mv.trend_window,
    mv.dim_key,
    mv.dim_value,
    mv.delta_pct,
    mv.contribution_score,
    mv.share_ratio,
    mv.variance_from_overall_pct,
    mv.contributor_rnk,
    mv.contributor_rnk AS rnk  -- Alias for API compatibility
  FROM public.mv_rca_monthly_top_contributors mv
  WHERE mv.tenant_id = v_tenant_id
    AND mv.kpi_key = p_kpi_key
    AND mv.month = p_month
    AND (p_trend_window IS NULL OR mv.trend_window = p_trend_window)
    AND (p_dim_key IS NULL OR mv.dim_key = p_dim_key)
    AND mv.contributor_rnk <= p_top_n
  ORDER BY mv.dim_key, mv.contributor_rnk;
END;
$$;

COMMENT ON FUNCTION public.get_rca_top_contributors IS 
'Secure RPC to retrieve top contributing dimensions for a KPI/month with tenant isolation. Returns up to p_top_n contributors per dimension.';

-- ============================================================
-- 2) Get Generated Recommendations
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_recommendations(
  p_month DATE DEFAULT NULL,
  p_kpi_key TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  tenant_id UUID,
  kpi_key TEXT,
  month DATE,
  trend_window kpi_trend_window,
  dim_key TEXT,
  dim_value TEXT,
  flag TEXT,
  title_ar TEXT,
  body_ar TEXT,
  action_type_code TEXT,
  impact_level TEXT,
  effort_estimate TEXT,
  source_ref JSONB,
  status TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE 
  v_tenant_id UUID;
BEGIN
  -- Get current user's tenant
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Return filtered results from reco_generated
  RETURN QUERY
  SELECT 
    rg.id,
    rg.tenant_id,
    rg.kpi_key,
    rg.month,
    rg.trend_window,
    rg.dim_key,
    rg.dim_value,
    rg.flag,
    rg.title_ar,
    rg.body_ar,
    rg.action_type_code,
    rg.impact_level,
    rg.effort_estimate,
    rg.source_ref,
    rg.status,
    rg.reviewed_by,
    rg.reviewed_at,
    rg.notes,
    rg.created_at,
    rg.updated_at
  FROM public.reco_generated rg
  WHERE rg.tenant_id = v_tenant_id
    AND (p_month IS NULL OR rg.month = p_month)
    AND (p_kpi_key IS NULL OR rg.kpi_key = p_kpi_key)
    AND (p_status IS NULL OR rg.status = p_status)
  ORDER BY rg.month DESC, rg.kpi_key, rg.trend_window;
END;
$$;

COMMENT ON FUNCTION public.get_recommendations IS 
'Secure RPC to retrieve generated recommendations with tenant isolation. Supports optional filters by month, KPI, and status.';