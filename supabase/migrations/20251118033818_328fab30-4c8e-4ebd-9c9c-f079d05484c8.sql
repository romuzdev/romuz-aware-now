-- ============================================================================
-- M14 - Unified KPI Dashboard - Database Layer
-- ============================================================================

-- Tables
CREATE TABLE IF NOT EXISTS public.kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  snapshot_date DATE NOT NULL,
  module TEXT NOT NULL CHECK (module IN ('risk', 'compliance', 'campaign', 'audit', 'objective', 'training')),
  kpi_key TEXT NOT NULL,
  kpi_name TEXT NOT NULL,
  current_value NUMERIC,
  target_value NUMERIC,
  status TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_kpi_snapshots_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_tenant ON public.kpi_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_date ON public.kpi_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_module ON public.kpi_snapshots(module);
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_lookup ON public.kpi_snapshots(tenant_id, module, kpi_key, snapshot_date);

ALTER TABLE public.kpi_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view snapshots" ON public.kpi_snapshots FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admins insert snapshots" ON public.kpi_snapshots FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND auth.uid() IS NOT NULL);
CREATE POLICY "Admins update snapshots" ON public.kpi_snapshots FOR UPDATE USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE TABLE IF NOT EXISTS public.kpi_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  module TEXT NOT NULL,
  kpi_key TEXT NOT NULL,
  kpi_name TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('threshold_breach', 'target_missed', 'trend_negative', 'data_stale')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  current_value NUMERIC,
  threshold_value NUMERIC,
  message TEXT NOT NULL,
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_kpi_alerts_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_kpi_alerts_tenant ON public.kpi_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kpi_alerts_severity ON public.kpi_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_kpi_alerts_unack ON public.kpi_alerts(tenant_id, is_acknowledged) WHERE is_acknowledged = false;
CREATE INDEX IF NOT EXISTS idx_kpi_alerts_created ON public.kpi_alerts(created_at DESC);

ALTER TABLE public.kpi_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view alerts" ON public.kpi_alerts FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admins manage alerts" ON public.kpi_alerts FOR ALL USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Unified KPI View
CREATE OR REPLACE VIEW public.vw_unified_kpis AS
SELECT r.tenant_id, 'risk' as module, 'risk_' || r.risk_code as kpi_key, r.risk_title as kpi_name,
  r.id as entity_id, r.risk_title as entity_name, r.residual_risk_score as current_value, 25 as target_value,
  r.risk_status as status, r.updated_at as last_updated,
  jsonb_build_object('description', r.risk_description, 'category', r.risk_category, 'owner', r.risk_owner_id) as metadata
FROM public.grc_risks r WHERE r.is_active = true
UNION ALL
SELECT cg.tenant_id, 'compliance' as module, 'gap_' || cg.id::text as kpi_key, cg.gap_title as kpi_name,
  cg.id as entity_id, cr.requirement_title as entity_name,
  CASE WHEN cg.gap_status = 'closed' THEN 100 WHEN cg.gap_status = 'in_progress' THEN 50 ELSE 0 END as current_value,
  100 as target_value, cg.gap_status as status, cg.updated_at as last_updated,
  jsonb_build_object('requirement_id', cg.requirement_id, 'gap_type', cg.gap_type, 'severity', cg.severity) as metadata
FROM public.grc_compliance_gaps cg JOIN public.grc_compliance_requirements cr ON cr.id = cg.requirement_id
UNION ALL
SELECT ac.tenant_id, 'campaign' as module, 'campaign_' || ac.id::text as kpi_key, ac.name as kpi_name,
  ac.id as entity_id, ac.name as entity_name,
  COALESCE((SELECT AVG(CASE WHEN cp.status = 'completed' THEN 100 ELSE 0 END)::numeric FROM public.campaign_participants cp WHERE cp.campaign_id = ac.id), 0) as current_value,
  100 as target_value, ac.status::text as status, ac.updated_at as last_updated,
  jsonb_build_object('owner', ac.owner_name, 'start_date', ac.start_date, 'end_date', ac.end_date) as metadata
FROM public.awareness_campaigns ac WHERE ac.archived_at IS NULL
UNION ALL
SELECT a.tenant_id, 'audit' as module, 'audit_' || a.audit_code as kpi_key, a.audit_title as kpi_name,
  a.id as entity_id, a.audit_title as entity_name,
  CASE WHEN a.audit_status = 'completed' THEN 100 WHEN a.audit_status = 'in_progress' THEN 50 WHEN a.audit_status = 'planned' THEN 25 ELSE 0 END::numeric as current_value,
  100 as target_value, a.audit_status as status, a.updated_at as last_updated,
  jsonb_build_object('audit_type', a.audit_type, 'scope', a.audit_scope) as metadata
FROM public.grc_audits a
UNION ALL
SELECT k.tenant_id, 'objective' as module, 'kpi_' || k.code as kpi_key, k.title as kpi_name,
  k.id as entity_id, o.title as entity_name,
  COALESCE((SELECT kr.actual_value FROM public.kpi_readings kr WHERE kr.kpi_id = k.id ORDER BY kr.collected_at DESC LIMIT 1), 0) as current_value,
  COALESCE((SELECT kt.target_value FROM public.kpi_targets kt WHERE kt.kpi_id = k.id ORDER BY kt.period DESC LIMIT 1), 100) as target_value,
  o.status as status, k.updated_at as last_updated,
  jsonb_build_object('objective_id', k.objective_id, 'unit', k.unit, 'direction', k.direction) as metadata
FROM public.kpis k JOIN public.objectives o ON o.id = k.objective_id;

-- Executive Summary View
CREATE OR REPLACE VIEW public.vw_kpi_executive_summary AS
WITH module_stats AS (
  SELECT tenant_id, module, COUNT(*) as total_kpis, AVG(current_value) as avg_value, AVG(target_value) as avg_target,
    COUNT(*) FILTER (WHERE current_value >= target_value) as on_target_count,
    COUNT(*) FILTER (WHERE current_value < target_value * 0.8) as critical_count, MAX(last_updated) as last_update
  FROM public.vw_unified_kpis GROUP BY tenant_id, module
)
SELECT tenant_id, module, total_kpis, ROUND(avg_value, 2) as avg_performance, ROUND(avg_target, 2) as avg_target,
  ROUND((on_target_count::numeric / NULLIF(total_kpis, 0)) * 100, 2) as achievement_rate, critical_count, last_update
FROM module_stats;

-- Functions
CREATE OR REPLACE FUNCTION public.capture_kpi_snapshot(p_tenant_id UUID, p_snapshot_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INTEGER := 0;
BEGIN
  INSERT INTO public.kpi_snapshots (tenant_id, snapshot_date, module, kpi_key, kpi_name, current_value, target_value, status, metadata)
  SELECT tenant_id, p_snapshot_date, module, kpi_key, kpi_name, current_value, target_value, status, metadata
  FROM public.vw_unified_kpis WHERE tenant_id = p_tenant_id ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;$$;

CREATE OR REPLACE FUNCTION public.detect_kpi_alerts(p_tenant_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INTEGER := 0; v_record RECORD;
BEGIN
  DELETE FROM public.kpi_alerts WHERE tenant_id = p_tenant_id AND is_acknowledged = false AND created_at < NOW() - INTERVAL '7 days';
  FOR v_record IN SELECT * FROM public.vw_unified_kpis WHERE tenant_id = p_tenant_id AND current_value < target_value * 0.7 LOOP
    INSERT INTO public.kpi_alerts (tenant_id, module, kpi_key, kpi_name, alert_type, severity, current_value, threshold_value, message)
    VALUES (v_record.tenant_id, v_record.module, v_record.kpi_key, v_record.kpi_name, 'threshold_breach',
      CASE WHEN v_record.current_value < v_record.target_value * 0.5 THEN 'critical' WHEN v_record.current_value < v_record.target_value * 0.7 THEN 'high' ELSE 'medium' END,
      v_record.current_value, v_record.target_value,
      format('المؤشر %s أقل من المستهدف', v_record.kpi_name)) ON CONFLICT DO NOTHING;
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;$$;

GRANT SELECT ON public.vw_unified_kpis TO authenticated;
GRANT SELECT ON public.vw_kpi_executive_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.capture_kpi_snapshot TO authenticated;
GRANT EXECUTE ON FUNCTION public.detect_kpi_alerts TO authenticated;