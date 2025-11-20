-- ============================================================================
-- Gate-E: Observability & Alerts v2 - Part 1: Database Layer
-- ============================================================================
-- Purpose: Create KPI views, alert system tables, helper functions, indexes, and RLS
-- Author: Romuz Awareness Team
-- Date: 2025-01-10
-- Note: Seed data will be inserted separately after tables are created
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Helper Function: to_riyadh_date
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.to_riyadh_date(ts timestamptz)
RETURNS date
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (ts AT TIME ZONE 'Asia/Riyadh')::date;
$$;

COMMENT ON FUNCTION public.to_riyadh_date(timestamptz) IS 
'Converts UTC timestamp to Asia/Riyadh date. Used for daily KPI aggregations.';

-- ----------------------------------------------------------------------------
-- 2. Materialized View: mv_campaign_kpis_daily
-- ----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_campaign_kpis_daily AS
WITH daily_participants AS (
  SELECT 
    cp.tenant_id,
    cp.campaign_id,
    to_riyadh_date(cp.created_at) as date_r,
    COUNT(DISTINCT cp.id) FILTER (WHERE cp.deleted_at IS NULL) as invited_count,
    COUNT(DISTINCT cp.id) FILTER (WHERE cp.status IN ('in_progress', 'completed') AND cp.deleted_at IS NULL) as opened_count,
    COUNT(DISTINCT cp.id) FILTER (WHERE cp.status = 'completed' AND cp.deleted_at IS NULL) as completed_count
  FROM public.campaign_participants cp
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
  CASE 
    WHEN dp.invited_count > 0 THEN ROUND((dp.opened_count::numeric / dp.invited_count * 100), 2)
    ELSE 0 
  END as kpi_open_rate,
  CASE 
    WHEN dp.invited_count > 0 THEN ROUND((0::numeric / dp.invited_count * 100), 2)
    ELSE 0 
  END as kpi_click_rate,
  CASE 
    WHEN dp.invited_count > 0 THEN ROUND((dp.opened_count::numeric / dp.invited_count * 100), 2)
    ELSE 0 
  END as kpi_activation_rate,
  CASE 
    WHEN dp.invited_count > 0 THEN ROUND((dp.completed_count::numeric / dp.invited_count * 100), 2)
    ELSE 0 
  END as kpi_completion_rate,
  now() as refreshed_at
FROM daily_participants dp;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_campaign_kpis_daily_unique 
ON public.mv_campaign_kpis_daily (tenant_id, campaign_id, date_r);

CREATE INDEX IF NOT EXISTS idx_mv_campaign_kpis_daily_tenant_campaign 
ON public.mv_campaign_kpis_daily (tenant_id, campaign_id);

CREATE INDEX IF NOT EXISTS idx_mv_campaign_kpis_daily_date 
ON public.mv_campaign_kpis_daily (date_r DESC);

COMMENT ON MATERIALIZED VIEW public.mv_campaign_kpis_daily IS 
'Daily KPI aggregates per tenant/campaign. Denominator = invited_count. Refresh: hourly + 01:10 Riyadh.';

-- ----------------------------------------------------------------------------
-- 3. View: vw_campaign_kpis_ctd
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_campaign_kpis_ctd AS
SELECT 
  tenant_id,
  campaign_id,
  SUM(invited_count) as invited_count,
  SUM(opened_count) as opened_count,
  SUM(clicked_count) as clicked_count,
  SUM(activated_count) as activated_count,
  SUM(completed_count) as completed_count,
  SUM(reminded_count) as reminded_count,
  SUM(bounced_count) as bounced_count,
  CASE 
    WHEN SUM(invited_count) > 0 THEN ROUND((SUM(opened_count)::numeric / SUM(invited_count) * 100), 2)
    ELSE 0 
  END as kpi_open_rate,
  CASE 
    WHEN SUM(invited_count) > 0 THEN ROUND((SUM(clicked_count)::numeric / SUM(invited_count) * 100), 2)
    ELSE 0 
  END as kpi_click_rate,
  CASE 
    WHEN SUM(invited_count) > 0 THEN ROUND((SUM(activated_count)::numeric / SUM(invited_count) * 100), 2)
    ELSE 0 
  END as kpi_activation_rate,
  CASE 
    WHEN SUM(invited_count) > 0 THEN ROUND((SUM(completed_count)::numeric / SUM(invited_count) * 100), 2)
    ELSE 0 
  END as kpi_completion_rate,
  MAX(date_r) as last_activity_date,
  MIN(date_r) as first_activity_date
FROM public.mv_campaign_kpis_daily
GROUP BY tenant_id, campaign_id;

COMMENT ON VIEW public.vw_campaign_kpis_ctd IS 
'Cumulative-to-date KPIs per tenant/campaign. Aggregates from mv_campaign_kpis_daily.';

-- ----------------------------------------------------------------------------
-- 4. Table: alert_channels
-- ----------------------------------------------------------------------------
CREATE TABLE public.alert_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('email', 'webhook', 'slack')),
  name text NOT NULL,
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  CONSTRAINT alert_channels_tenant_name_unique UNIQUE (tenant_id, name)
);

CREATE INDEX idx_alert_channels_tenant ON public.alert_channels (tenant_id) WHERE is_active = true;

COMMENT ON TABLE public.alert_channels IS 
'Alert delivery channels. tenant_id = NULL for platform-level defaults.';

ALTER TABLE public.alert_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view channels in their tenant"
ON public.alert_channels FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()) OR tenant_id IS NULL);

CREATE POLICY "Users can create channels in their tenant"
ON public.alert_channels FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update channels in their tenant"
ON public.alert_channels FOR UPDATE
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete channels in their tenant"
ON public.alert_channels FOR DELETE
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE TRIGGER update_alert_channels_updated_at
BEFORE UPDATE ON public.alert_channels
FOR EACH ROW
EXECUTE FUNCTION public.update_awareness_campaigns_updated_at();

-- ----------------------------------------------------------------------------
-- 5. Table: alert_templates
-- ----------------------------------------------------------------------------
CREATE TABLE public.alert_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  locale text NOT NULL DEFAULT 'ar' CHECK (locale IN ('ar', 'en')),
  subject_tpl text NOT NULL,
  body_tpl text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  CONSTRAINT alert_templates_tenant_code_locale_unique UNIQUE (tenant_id, code, locale)
);

CREATE INDEX idx_alert_templates_tenant_code ON public.alert_templates (tenant_id, code);

COMMENT ON TABLE public.alert_templates IS 
'Alert message templates. Supports {{tenant_name}}, {{campaign_name}}, {{metric}}, etc.';

ALTER TABLE public.alert_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view templates in their tenant"
ON public.alert_templates FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()) OR tenant_id IS NULL);

CREATE POLICY "Users can create templates in their tenant"
ON public.alert_templates FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update templates in their tenant"
ON public.alert_templates FOR UPDATE
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete templates in their tenant"
ON public.alert_templates FOR DELETE
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE TRIGGER update_alert_templates_updated_at
BEFORE UPDATE ON public.alert_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_awareness_campaigns_updated_at();

-- ----------------------------------------------------------------------------
-- 6. Table: alert_policies
-- ----------------------------------------------------------------------------
CREATE TABLE public.alert_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  scope text NOT NULL CHECK (scope IN ('campaign', 'tenant', 'platform')),
  metric text NOT NULL CHECK (metric IN ('open_rate', 'click_rate', 'activation_rate', 'completion_rate', 'bounce_rate')),
  time_window text NOT NULL CHECK (time_window IN ('daily', 'ctd')),
  operator text NOT NULL CHECK (operator IN ('<', '<=', '>=', '>', 'delta_pct', 'mom', 'wow')),
  threshold_value numeric NOT NULL,
  lookback_days int DEFAULT 7 CHECK (lookback_days > 0),
  is_enabled boolean NOT NULL DEFAULT true,
  severity text NOT NULL CHECK (severity IN ('info', 'warn', 'critical')),
  notify_cooldown_minutes int NOT NULL DEFAULT 60 CHECK (notify_cooldown_minutes >= 5),
  template_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  last_triggered_at timestamptz,
  CONSTRAINT alert_policies_tenant_name_unique UNIQUE (tenant_id, name)
);

CREATE INDEX idx_alert_policies_tenant_enabled ON public.alert_policies (tenant_id) WHERE is_enabled = true;
CREATE INDEX idx_alert_policies_last_triggered ON public.alert_policies (last_triggered_at DESC NULLS LAST);

COMMENT ON TABLE public.alert_policies IS 
'Alert detection rules. time_window: daily or ctd. Operators: <, <=, >=, >, delta_pct, mom, wow.';

ALTER TABLE public.alert_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view policies in their tenant"
ON public.alert_policies FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create policies in their tenant"
ON public.alert_policies FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update policies in their tenant"
ON public.alert_policies FOR UPDATE
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete policies in their tenant"
ON public.alert_policies FOR DELETE
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE TRIGGER update_alert_policies_updated_at
BEFORE UPDATE ON public.alert_policies
FOR EACH ROW
EXECUTE FUNCTION public.update_awareness_campaigns_updated_at();

-- ----------------------------------------------------------------------------
-- 7. Table: alert_policy_targets
-- ----------------------------------------------------------------------------
CREATE TABLE public.alert_policy_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL REFERENCES public.alert_policies(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.awareness_campaigns(id) ON DELETE CASCADE,
  tag text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT alert_policy_targets_policy_campaign_unique UNIQUE (policy_id, campaign_id)
);

CREATE INDEX idx_alert_policy_targets_policy ON public.alert_policy_targets (policy_id);
CREATE INDEX idx_alert_policy_targets_campaign ON public.alert_policy_targets (campaign_id);

COMMENT ON TABLE public.alert_policy_targets IS 
'Links policies to campaigns or tags. Null campaign_id means all campaigns.';

ALTER TABLE public.alert_policy_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view targets in their tenant"
ON public.alert_policy_targets FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create targets in their tenant"
ON public.alert_policy_targets FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete targets in their tenant"
ON public.alert_policy_targets FOR DELETE
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- ----------------------------------------------------------------------------
-- 8. Table: alert_policy_channels
-- ----------------------------------------------------------------------------
CREATE TABLE public.alert_policy_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL REFERENCES public.alert_policies(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES public.alert_channels(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subject_prefix text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT alert_policy_channels_unique UNIQUE (policy_id, channel_id)
);

CREATE INDEX idx_alert_policy_channels_policy ON public.alert_policy_channels (policy_id);

COMMENT ON TABLE public.alert_policy_channels IS 
'Links policies to channels with optional overrides (e.g., subject prefix).';

ALTER TABLE public.alert_policy_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view policy channels in their tenant"
ON public.alert_policy_channels FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create policy channels in their tenant"
ON public.alert_policy_channels FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete policy channels in their tenant"
ON public.alert_policy_channels FOR DELETE
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- ----------------------------------------------------------------------------
-- 9. Table: alert_events
-- ----------------------------------------------------------------------------
CREATE TABLE public.alert_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL REFERENCES public.alert_policies(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  target_ref uuid,
  metric_value numeric NOT NULL,
  baseline_value numeric,
  delta_pct numeric,
  severity text NOT NULL CHECK (severity IN ('info', 'warn', 'critical')),
  dedupe_key text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dispatched', 'failed')),
  dispatched_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT alert_events_dedupe_unique UNIQUE (dedupe_key)
);

CREATE INDEX idx_alert_events_policy ON public.alert_events (policy_id);
CREATE INDEX idx_alert_events_tenant_status ON public.alert_events (tenant_id, status);
CREATE INDEX idx_alert_events_created_at ON public.alert_events (created_at DESC);

COMMENT ON TABLE public.alert_events IS 
'Alert event queue. dedupe_key prevents spam (policy_id + target_ref + severity + date).';

ALTER TABLE public.alert_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events in their tenant"
ON public.alert_events FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "System can insert events"
ON public.alert_events FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System can update events"
ON public.alert_events FOR UPDATE
USING (tenant_id = get_user_tenant_id(auth.uid()));