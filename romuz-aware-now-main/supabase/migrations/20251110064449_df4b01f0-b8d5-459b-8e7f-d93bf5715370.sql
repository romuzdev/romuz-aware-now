-- Fix Security Issues: Hide materialized views from API
-- Users should access data through secure functions only

-- Revoke direct access to materialized views from API
REVOKE ALL ON public.mv_report_kpis_daily FROM anon, authenticated;
REVOKE ALL ON public.vw_report_kpis_ctd FROM anon, authenticated;

-- Create secure accessor functions with tenant isolation
CREATE OR REPLACE FUNCTION public.get_report_kpis_daily(
  p_campaign_id UUID DEFAULT NULL,
  p_from_date DATE DEFAULT NULL,
  p_to_date DATE DEFAULT NULL
)
RETURNS TABLE (
  tenant_id UUID,
  campaign_id UUID,
  campaign_name TEXT,
  owner_name TEXT,
  date DATE,
  deliveries BIGINT,
  opens BIGINT,
  clicks BIGINT,
  bounces BIGINT,
  reminders BIGINT,
  open_rate FLOAT,
  ctr FLOAT,
  completed_count BIGINT,
  activated_count BIGINT,
  completion_rate FLOAT,
  activation_rate FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  v_tenant_id := get_user_tenant_id(auth.uid());
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User not associated with any tenant';
  END IF;

  RETURN QUERY
  SELECT 
    mv.tenant_id,
    mv.campaign_id,
    mv.campaign_name,
    mv.owner_name,
    mv.date,
    mv.deliveries,
    mv.opens,
    mv.clicks,
    mv.bounces,
    mv.reminders,
    mv.open_rate,
    mv.ctr,
    mv.completed_count,
    mv.activated_count,
    mv.completion_rate,
    mv.activation_rate
  FROM public.mv_report_kpis_daily mv
  WHERE mv.tenant_id = v_tenant_id
    AND (p_campaign_id IS NULL OR mv.campaign_id = p_campaign_id)
    AND (p_from_date IS NULL OR mv.date >= p_from_date)
    AND (p_to_date IS NULL OR mv.date <= p_to_date)
  ORDER BY mv.date DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_report_kpis_ctd(
  p_campaign_id UUID DEFAULT NULL
)
RETURNS TABLE (
  tenant_id UUID,
  campaign_id UUID,
  last_date DATE,
  total_deliveries BIGINT,
  total_opens BIGINT,
  total_clicks BIGINT,
  total_bounces BIGINT,
  total_reminders BIGINT,
  total_completed BIGINT,
  total_activated BIGINT,
  avg_open_rate FLOAT,
  avg_ctr FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  v_tenant_id := get_user_tenant_id(auth.uid());
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User not associated with any tenant';
  END IF;

  RETURN QUERY
  SELECT 
    vw.tenant_id,
    vw.campaign_id,
    vw.last_date,
    vw.total_deliveries,
    vw.total_opens,
    vw.total_clicks,
    vw.total_bounces,
    vw.total_reminders,
    vw.total_completed,
    vw.total_activated,
    vw.avg_open_rate,
    vw.avg_ctr
  FROM public.vw_report_kpis_ctd vw
  WHERE vw.tenant_id = v_tenant_id
    AND (p_campaign_id IS NULL OR vw.campaign_id = p_campaign_id);
END;
$$;

-- Grant execute permissions on secure functions
GRANT EXECUTE ON FUNCTION public.get_report_kpis_daily TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_report_kpis_ctd TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.get_report_kpis_daily IS 'Gate-F: Secure accessor for daily KPI reports with tenant isolation';
COMMENT ON FUNCTION public.get_report_kpis_ctd IS 'Gate-F: Secure accessor for CTD KPI reports with tenant isolation';