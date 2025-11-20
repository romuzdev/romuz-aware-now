-- Gate-F: Reports & Exports v2
-- Built from existing campaign_participants data

-- 1️⃣ Core Table: report_exports
CREATE TABLE IF NOT EXISTS public.report_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  report_type TEXT NOT NULL,
  file_format TEXT NOT NULL CHECK (file_format IN ('csv', 'json', 'xlsx')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  batch_id TEXT,
  total_rows BIGINT DEFAULT 0,
  source_views JSONB,
  storage_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  refresh_at TIMESTAMPTZ,
  error_message TEXT
);

-- 2️⃣ Materialized View: Daily KPIs from campaign_participants
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_report_kpis_daily AS
SELECT
  cp.tenant_id,
  cp.campaign_id,
  c.name AS campaign_name,
  c.owner_name,
  to_riyadh_date(cp.created_at) AS date,
  COUNT(*) AS deliveries,
  COUNT(*) FILTER (WHERE cp.status IN ('in_progress', 'completed')) AS opens,
  COUNT(*) FILTER (WHERE cp.status = 'completed') AS clicks,
  0::BIGINT AS bounces,
  0::BIGINT AS reminders,
  CASE 
    WHEN COUNT(*) > 0 
    THEN (COUNT(*) FILTER (WHERE cp.status IN ('in_progress', 'completed'))::FLOAT / COUNT(*)) 
    ELSE 0 
  END AS open_rate,
  CASE 
    WHEN COUNT(*) > 0 
    THEN (COUNT(*) FILTER (WHERE cp.status = 'completed')::FLOAT / COUNT(*)) 
    ELSE 0 
  END AS ctr,
  COUNT(*) FILTER (WHERE cp.status = 'completed') AS completed_count,
  COUNT(*) FILTER (WHERE cp.status IN ('in_progress', 'completed')) AS activated_count,
  CASE 
    WHEN COUNT(*) > 0 
    THEN (COUNT(*) FILTER (WHERE cp.status = 'completed')::FLOAT / COUNT(*)) 
    ELSE 0 
  END AS completion_rate,
  CASE 
    WHEN COUNT(*) > 0 
    THEN (COUNT(*) FILTER (WHERE cp.status IN ('in_progress', 'completed'))::FLOAT / COUNT(*)) 
    ELSE 0 
  END AS activation_rate
FROM public.campaign_participants cp
JOIN public.awareness_campaigns c ON c.id = cp.campaign_id
WHERE cp.deleted_at IS NULL
GROUP BY cp.tenant_id, cp.campaign_id, c.name, c.owner_name, to_riyadh_date(cp.created_at);

-- Create unique index for CONCURRENTLY refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_report_daily_unique 
  ON public.mv_report_kpis_daily(tenant_id, campaign_id, date);

-- 3️⃣ Materialized View: Campaign-to-Date Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS public.vw_report_kpis_ctd AS
SELECT
  tenant_id,
  campaign_id,
  MAX(date) AS last_date,
  SUM(deliveries) AS total_deliveries,
  SUM(opens) AS total_opens,
  SUM(clicks) AS total_clicks,
  SUM(bounces) AS total_bounces,
  SUM(reminders) AS total_reminders,
  SUM(completed_count) AS total_completed,
  SUM(activated_count) AS total_activated,
  CASE 
    WHEN SUM(deliveries) > 0 
    THEN (SUM(opens)::FLOAT / SUM(deliveries)) 
    ELSE 0 
  END AS avg_open_rate,
  CASE 
    WHEN SUM(deliveries) > 0 
    THEN (SUM(clicks)::FLOAT / SUM(deliveries)) 
    ELSE 0 
  END AS avg_ctr
FROM public.mv_report_kpis_daily
GROUP BY tenant_id, campaign_id;

-- Create unique index for CONCURRENTLY refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_vw_report_ctd_unique 
  ON public.vw_report_kpis_ctd(tenant_id, campaign_id);

-- 4️⃣ Indexes
CREATE INDEX IF NOT EXISTS idx_report_exports_tenant ON public.report_exports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_exports_status ON public.report_exports(status);
CREATE INDEX IF NOT EXISTS idx_report_exports_user ON public.report_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_report_exports_created ON public.report_exports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mv_report_daily_tenant ON public.mv_report_kpis_daily(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mv_report_daily_campaign ON public.mv_report_kpis_daily(campaign_id);
CREATE INDEX IF NOT EXISTS idx_mv_report_daily_date ON public.mv_report_kpis_daily(date);

-- 5️⃣ RLS Policies
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant exports"
  ON public.report_exports
  FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create exports in their tenant"
  ON public.report_exports
  FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own exports"
  ON public.report_exports
  FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can delete their own exports"
  ON public.report_exports
  FOR DELETE
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND user_id = auth.uid()
  );

-- 6️⃣ Refresh function
CREATE OR REPLACE FUNCTION public.refresh_report_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_report_kpis_daily;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.vw_report_kpis_ctd;
END;
$$;

-- 7️⃣ Comments
COMMENT ON TABLE public.report_exports IS 'Gate-F: Tracks report export requests and status';
COMMENT ON MATERIALIZED VIEW public.mv_report_kpis_daily IS 'Gate-F: Daily KPI metrics aggregated from campaign_participants';
COMMENT ON MATERIALIZED VIEW public.vw_report_kpis_ctd IS 'Gate-F: Campaign-to-date summary from daily KPIs';
COMMENT ON FUNCTION public.refresh_report_views() IS 'Gate-F: Refreshes report materialized views';