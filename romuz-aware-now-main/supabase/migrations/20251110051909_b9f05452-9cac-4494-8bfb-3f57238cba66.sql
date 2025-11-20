-- ============================================================================
-- Gate-E Part 1: Security Fix - Hide Materialized View from API
-- ============================================================================
-- Purpose: Prevent direct API access to mv_campaign_kpis_daily
-- Solution: Revoke public access and grant only to authenticated role
-- ============================================================================

-- Revoke all public access to materialized view
REVOKE ALL ON public.mv_campaign_kpis_daily FROM anon;
REVOKE ALL ON public.mv_campaign_kpis_daily FROM authenticated;
REVOKE ALL ON public.mv_campaign_kpis_daily FROM service_role;

-- Grant select only to postgres (internal use)
GRANT SELECT ON public.mv_campaign_kpis_daily TO postgres;

-- Users will access data through vw_campaign_kpis_ctd view which has proper security
COMMENT ON MATERIALIZED VIEW public.mv_campaign_kpis_daily IS 
'INTERNAL: Daily KPI aggregates. Not exposed via API. Access via vw_campaign_kpis_ctd instead.';