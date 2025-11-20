-- ================================================================
-- M14 - KPI Dashboard: Security Enhancement - Part 2 (Fixed)
-- Audit Triggers, RLS Policies & Performance Indexes
-- ================================================================

-- ================================================================
-- Part 1: Audit Triggers
-- ================================================================

DROP TRIGGER IF EXISTS kpi_snapshots_audit_trigger ON kpi_snapshots;
CREATE TRIGGER kpi_snapshots_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON kpi_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

DROP TRIGGER IF EXISTS kpi_alerts_audit_trigger ON kpi_alerts;
CREATE TRIGGER kpi_alerts_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON kpi_alerts
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- ================================================================
-- Part 2: RLS for kpi_snapshots
-- ================================================================

ALTER TABLE kpi_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kpi_snapshots_tenant_isolation" ON kpi_snapshots;
DROP POLICY IF EXISTS "kpi_snapshots_select_policy" ON kpi_snapshots;
DROP POLICY IF EXISTS "kpi_snapshots_insert_policy" ON kpi_snapshots;
DROP POLICY IF EXISTS "kpi_snapshots_update_policy" ON kpi_snapshots;
DROP POLICY IF EXISTS "kpi_snapshots_delete_policy" ON kpi_snapshots;

CREATE POLICY "kpi_snapshots_select_policy" ON kpi_snapshots
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('super_admin', 'platform_support')
    OR tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

CREATE POLICY "kpi_snapshots_insert_policy" ON kpi_snapshots
  FOR INSERT
  WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND auth.jwt() ->> 'role' IN ('tenant_admin', 'manager', 'super_admin')
  );

CREATE POLICY "kpi_snapshots_update_policy" ON kpi_snapshots
  FOR UPDATE
  USING (false);

CREATE POLICY "kpi_snapshots_delete_policy" ON kpi_snapshots
  FOR DELETE
  USING (auth.jwt() ->> 'role' IN ('super_admin', 'platform_support'));

-- ================================================================
-- Part 3: RLS for kpi_alerts
-- ================================================================

ALTER TABLE kpi_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kpi_alerts_tenant_isolation" ON kpi_alerts;
DROP POLICY IF EXISTS "kpi_alerts_select_policy" ON kpi_alerts;
DROP POLICY IF EXISTS "kpi_alerts_insert_policy" ON kpi_alerts;
DROP POLICY IF EXISTS "kpi_alerts_update_policy" ON kpi_alerts;
DROP POLICY IF EXISTS "kpi_alerts_delete_policy" ON kpi_alerts;

CREATE POLICY "kpi_alerts_select_policy" ON kpi_alerts
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('super_admin', 'platform_support')
    OR tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

CREATE POLICY "kpi_alerts_insert_policy" ON kpi_alerts
  FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "kpi_alerts_update_policy" ON kpi_alerts
  FOR UPDATE
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND auth.jwt() ->> 'role' IN ('tenant_admin', 'manager', 'super_admin')
  );

CREATE POLICY "kpi_alerts_delete_policy" ON kpi_alerts
  FOR DELETE
  USING (auth.jwt() ->> 'role' IN ('super_admin', 'platform_support'));

-- ================================================================
-- Part 4: Performance Indexes
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_tenant_module 
  ON kpi_snapshots(tenant_id, module);

CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_snapshot_date 
  ON kpi_snapshots(snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_kpi_key 
  ON kpi_snapshots(kpi_key);

CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_created_at 
  ON kpi_snapshots(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_kpi_alerts_tenant_module 
  ON kpi_alerts(tenant_id, module);

CREATE INDEX IF NOT EXISTS idx_kpi_alerts_severity_status 
  ON kpi_alerts(severity, is_acknowledged);

CREATE INDEX IF NOT EXISTS idx_kpi_alerts_created_at 
  ON kpi_alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_kpi_alerts_kpi_key 
  ON kpi_alerts(kpi_key);

-- ================================================================
-- Part 5: Comments
-- ================================================================

COMMENT ON TABLE kpi_snapshots IS 'KPI snapshots - Critical for analytics and trending';
COMMENT ON TABLE kpi_alerts IS 'KPI alerts - Critical for monitoring and alerting';