-- ============================================================================
-- Gate-E Part 1: Complete - Add is_test Support (Fixed)
-- ============================================================================

-- Add is_test to awareness_campaigns
ALTER TABLE public.awareness_campaigns 
ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_awareness_campaigns_is_test 
ON public.awareness_campaigns (tenant_id, is_test) WHERE is_test = false;

-- Add is_test to campaign_participants
ALTER TABLE public.campaign_participants 
ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_campaign_participants_is_test 
ON public.campaign_participants (tenant_id, campaign_id, is_test) WHERE is_test = false;

-- Drop dependent view first, then MV
DROP VIEW IF EXISTS public.vw_campaign_kpis_ctd CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.mv_campaign_kpis_daily CASCADE;

-- Recreate MV with is_test filter
CREATE MATERIALIZED VIEW public.mv_campaign_kpis_daily AS
WITH daily_participants AS (
  SELECT 
    cp.tenant_id,
    cp.campaign_id,
    to_riyadh_date(cp.created_at) as date_r,
    COUNT(DISTINCT cp.id) FILTER (WHERE cp.deleted_at IS NULL) as invited_count,
    COUNT(DISTINCT cp.id) FILTER (WHERE cp.status IN ('in_progress', 'completed') AND cp.deleted_at IS NULL) as opened_count,
    COUNT(DISTINCT cp.id) FILTER (WHERE cp.status = 'completed' AND cp.deleted_at IS NULL) as completed_count
  FROM public.campaign_participants cp
  INNER JOIN public.awareness_campaigns c ON c.id = cp.campaign_id
  WHERE cp.is_test = false AND c.is_test = false
  GROUP BY cp.tenant_id, cp.campaign_id, date_r
)
SELECT 
  dp.tenant_id,
  dp.campaign_id,
  dp.date_r,
  dp.invited_count,
  dp.opened_count,
  0 as clicked_count,
  dp.opened_count as activated_count,
  dp.completed_count,
  0 as reminded_count,
  0 as bounced_count,
  CASE WHEN dp.invited_count > 0 THEN ROUND((dp.opened_count::numeric / dp.invited_count * 100), 2) ELSE 0 END as kpi_open_rate,
  CASE WHEN dp.invited_count > 0 THEN ROUND((0::numeric / dp.invited_count * 100), 2) ELSE 0 END as kpi_click_rate,
  CASE WHEN dp.invited_count > 0 THEN ROUND((dp.opened_count::numeric / dp.invited_count * 100), 2) ELSE 0 END as kpi_activation_rate,
  CASE WHEN dp.invited_count > 0 THEN ROUND((dp.completed_count::numeric / dp.invited_count * 100), 2) ELSE 0 END as kpi_completion_rate,
  now() as refreshed_at
FROM daily_participants dp;

CREATE UNIQUE INDEX idx_mv_campaign_kpis_daily_unique ON public.mv_campaign_kpis_daily (tenant_id, campaign_id, date_r);
CREATE INDEX idx_mv_campaign_kpis_daily_tenant_campaign ON public.mv_campaign_kpis_daily (tenant_id, campaign_id);
CREATE INDEX idx_mv_campaign_kpis_daily_date ON public.mv_campaign_kpis_daily (date_r DESC);

-- Recreate CTD view
CREATE VIEW public.vw_campaign_kpis_ctd AS
SELECT 
  tenant_id, campaign_id,
  SUM(invited_count) as invited_count,
  SUM(opened_count) as opened_count,
  SUM(clicked_count) as clicked_count,
  SUM(activated_count) as activated_count,
  SUM(completed_count) as completed_count,
  SUM(reminded_count) as reminded_count,
  SUM(bounced_count) as bounced_count,
  CASE WHEN SUM(invited_count) > 0 THEN ROUND((SUM(opened_count)::numeric / SUM(invited_count) * 100), 2) ELSE 0 END as kpi_open_rate,
  CASE WHEN SUM(invited_count) > 0 THEN ROUND((SUM(clicked_count)::numeric / SUM(invited_count) * 100), 2) ELSE 0 END as kpi_click_rate,
  CASE WHEN SUM(invited_count) > 0 THEN ROUND((SUM(activated_count)::numeric / SUM(invited_count) * 100), 2) ELSE 0 END as kpi_activation_rate,
  CASE WHEN SUM(invited_count) > 0 THEN ROUND((SUM(completed_count)::numeric / SUM(invited_count) * 100), 2) ELSE 0 END as kpi_completion_rate,
  MAX(date_r) as last_activity_date,
  MIN(date_r) as first_activity_date
FROM public.mv_campaign_kpis_daily
GROUP BY tenant_id, campaign_id;

-- Secure MV
REVOKE ALL ON public.mv_campaign_kpis_daily FROM anon, authenticated, service_role;
GRANT SELECT ON public.mv_campaign_kpis_daily TO postgres;