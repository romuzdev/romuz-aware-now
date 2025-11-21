-- ============================================================================
-- M18.5 - SecOps Integration: Database Schema
-- Part 1: Core Tables with RLS, Triggers, and Backup Metadata
-- ============================================================================

-- ============================================================================
-- 1. Security Events Table (SIEM)
-- ============================================================================
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  event_timestamp TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
  source_system TEXT, -- 'firewall', 'ids', 'endpoint', 'application', etc.
  source_ip INET,
  destination_ip INET,
  user_id TEXT,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_log TEXT,
  normalized_fields JSONB,
  correlation_id UUID,
  is_processed BOOLEAN DEFAULT false,
  threat_indicator_matched UUID, -- References threat_indicators (M20)
  incident_id UUID, -- References security_incidents (M18)
  last_backed_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_events_tenant ON security_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(tenant_id, severity, is_processed);
CREATE INDEX IF NOT EXISTS idx_security_events_correlation ON security_events(correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_security_events_source ON security_events(tenant_id, source_system);
CREATE INDEX IF NOT EXISTS idx_security_events_backup ON security_events(tenant_id, last_backed_up_at) WHERE last_backed_up_at IS NOT NULL;

-- Comments
COMMENT ON TABLE security_events IS 'M18.5 - Security events from SIEM and other sources';
COMMENT ON COLUMN security_events.last_backed_up_at IS 'Timestamp of the last successful backup for this record';

-- Enable RLS
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "security_events_tenant_isolation_select"
ON security_events FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "security_events_tenant_isolation_insert"
ON security_events FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "security_events_tenant_isolation_update"
ON security_events FOR UPDATE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "security_events_tenant_isolation_delete"
ON security_events FOR DELETE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

-- Transaction Logging Trigger
CREATE TRIGGER security_events_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON security_events
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- Updated_at Trigger
CREATE TRIGGER security_events_updated_at_trigger
  BEFORE UPDATE ON security_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 2. SOAR Playbooks Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS soar_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  playbook_name_ar TEXT NOT NULL,
  playbook_name_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  trigger_conditions JSONB NOT NULL DEFAULT '{}'::jsonb, -- { event_type, severity, patterns }
  automation_steps JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ action, parameters, on_success, on_failure }]
  approval_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  execution_count INT DEFAULT 0,
  success_count INT DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  last_backed_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_soar_playbooks_tenant ON soar_playbooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_soar_playbooks_active ON soar_playbooks(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_soar_playbooks_backup ON soar_playbooks(tenant_id, last_backed_up_at) WHERE last_backed_up_at IS NOT NULL;

-- Comments
COMMENT ON TABLE soar_playbooks IS 'M18.5 - SOAR automation playbooks for incident response';
COMMENT ON COLUMN soar_playbooks.last_backed_up_at IS 'Timestamp of the last successful backup for this record';

-- Enable RLS
ALTER TABLE soar_playbooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "soar_playbooks_tenant_isolation_select"
ON soar_playbooks FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "soar_playbooks_tenant_isolation_insert"
ON soar_playbooks FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "soar_playbooks_tenant_isolation_update"
ON soar_playbooks FOR UPDATE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "soar_playbooks_tenant_isolation_delete"
ON soar_playbooks FOR DELETE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

-- Transaction Logging Trigger
CREATE TRIGGER soar_playbooks_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON soar_playbooks
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- Updated_at Trigger
CREATE TRIGGER soar_playbooks_updated_at_trigger
  BEFORE UPDATE ON soar_playbooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 3. SOAR Executions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS soar_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  playbook_id UUID NOT NULL REFERENCES soar_playbooks(id) ON DELETE RESTRICT,
  trigger_event_id UUID REFERENCES security_events(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  execution_log JSONB DEFAULT '[]'::jsonb,
  actions_taken TEXT[] DEFAULT ARRAY[]::TEXT[],
  result JSONB,
  error_message TEXT,
  executed_by UUID,
  last_backed_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_soar_executions_tenant ON soar_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_soar_executions_playbook ON soar_executions(playbook_id, status);
CREATE INDEX IF NOT EXISTS idx_soar_executions_status ON soar_executions(tenant_id, status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_soar_executions_event ON soar_executions(trigger_event_id) WHERE trigger_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_soar_executions_backup ON soar_executions(tenant_id, last_backed_up_at) WHERE last_backed_up_at IS NOT NULL;

-- Comments
COMMENT ON TABLE soar_executions IS 'M18.5 - SOAR playbook execution logs and results';
COMMENT ON COLUMN soar_executions.last_backed_up_at IS 'Timestamp of the last successful backup for this record';

-- Enable RLS
ALTER TABLE soar_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "soar_executions_tenant_isolation_select"
ON soar_executions FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "soar_executions_tenant_isolation_insert"
ON soar_executions FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "soar_executions_tenant_isolation_update"
ON soar_executions FOR UPDATE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "soar_executions_tenant_isolation_delete"
ON soar_executions FOR DELETE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

-- Transaction Logging Trigger
CREATE TRIGGER soar_executions_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON soar_executions
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- ============================================================================
-- 4. SecOps Connectors Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS secops_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  connector_type TEXT NOT NULL CHECK (connector_type IN (
    'firewall', 'dlp', 'mdm', 'endpoint_protection', 
    'siem', 'ids_ips', 'email_security', 'web_proxy',
    'cloud_security', 'network_monitoring', 'vulnerability_scanner'
  )),
  vendor TEXT NOT NULL,
  version TEXT,
  connection_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  auth_config JSONB, -- Encrypted credentials
  sync_enabled BOOLEAN DEFAULT true,
  sync_interval_minutes INT DEFAULT 60,
  sync_status TEXT DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'success', 'error')),
  last_sync_at TIMESTAMPTZ,
  last_sync_result JSONB,
  next_sync_at TIMESTAMPTZ,
  error_count INT DEFAULT 0,
  last_error TEXT,
  is_active BOOLEAN DEFAULT true,
  last_backed_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_secops_connectors_tenant ON secops_connectors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_secops_connectors_type ON secops_connectors(tenant_id, connector_type);
CREATE INDEX IF NOT EXISTS idx_secops_connectors_active ON secops_connectors(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_secops_connectors_sync ON secops_connectors(sync_enabled, next_sync_at) WHERE sync_enabled = true;
CREATE INDEX IF NOT EXISTS idx_secops_connectors_backup ON secops_connectors(tenant_id, last_backed_up_at) WHERE last_backed_up_at IS NOT NULL;

-- Comments
COMMENT ON TABLE secops_connectors IS 'M18.5 - External security solution connectors';
COMMENT ON COLUMN secops_connectors.last_backed_up_at IS 'Timestamp of the last successful backup for this record';

-- Enable RLS
ALTER TABLE secops_connectors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "secops_connectors_tenant_isolation_select"
ON secops_connectors FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "secops_connectors_tenant_isolation_insert"
ON secops_connectors FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "secops_connectors_tenant_isolation_update"
ON secops_connectors FOR UPDATE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "secops_connectors_tenant_isolation_delete"
ON secops_connectors FOR DELETE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

-- Transaction Logging Trigger
CREATE TRIGGER secops_connectors_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON secops_connectors
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- Updated_at Trigger
CREATE TRIGGER secops_connectors_updated_at_trigger
  BEFORE UPDATE ON secops_connectors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 5. Connector Sync Logs Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS secops_connector_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  connector_id UUID NOT NULL REFERENCES secops_connectors(id) ON DELETE CASCADE,
  sync_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sync_completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('started', 'success', 'error')),
  records_processed INT DEFAULT 0,
  records_imported INT DEFAULT 0,
  records_failed INT DEFAULT 0,
  error_message TEXT,
  sync_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_connector_sync_logs_tenant ON secops_connector_sync_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_connector_sync_logs_connector ON secops_connector_sync_logs(connector_id, sync_started_at DESC);
CREATE INDEX IF NOT EXISTS idx_connector_sync_logs_status ON secops_connector_sync_logs(tenant_id, status);

-- Comments
COMMENT ON TABLE secops_connector_sync_logs IS 'M18.5 - Connector synchronization logs';

-- Enable RLS
ALTER TABLE secops_connector_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "connector_sync_logs_tenant_isolation_select"
ON secops_connector_sync_logs FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "connector_sync_logs_tenant_isolation_insert"
ON secops_connector_sync_logs FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- 6. Event Correlation Rules Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS event_correlation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  rule_name_ar TEXT NOT NULL,
  rule_name_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  event_patterns JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ event_type, conditions, time_window }]
  correlation_logic TEXT NOT NULL, -- 'all', 'any', 'sequence', 'threshold'
  time_window_minutes INT DEFAULT 60,
  threshold_count INT DEFAULT 1,
  severity_override TEXT CHECK (severity_override IN ('info', 'low', 'medium', 'high', 'critical')),
  auto_create_incident BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  match_count INT DEFAULT 0,
  last_matched_at TIMESTAMPTZ,
  last_backed_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_correlation_rules_tenant ON event_correlation_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_correlation_rules_active ON event_correlation_rules(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_correlation_rules_backup ON event_correlation_rules(tenant_id, last_backed_up_at) WHERE last_backed_up_at IS NOT NULL;

-- Comments
COMMENT ON TABLE event_correlation_rules IS 'M18.5 - Rules for correlating related security events';
COMMENT ON COLUMN event_correlation_rules.last_backed_up_at IS 'Timestamp of the last successful backup for this record';

-- Enable RLS
ALTER TABLE event_correlation_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "correlation_rules_tenant_isolation_select"
ON event_correlation_rules FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "correlation_rules_tenant_isolation_insert"
ON event_correlation_rules FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "correlation_rules_tenant_isolation_update"
ON event_correlation_rules FOR UPDATE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "correlation_rules_tenant_isolation_delete"
ON event_correlation_rules FOR DELETE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

-- Transaction Logging Trigger
CREATE TRIGGER correlation_rules_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON event_correlation_rules
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- Updated_at Trigger
CREATE TRIGGER correlation_rules_updated_at_trigger
  BEFORE UPDATE ON event_correlation_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 7. Utility Function: Update Backup Metadata
-- ============================================================================
CREATE OR REPLACE FUNCTION update_secops_backup_metadata(
  p_table_name TEXT,
  p_tenant_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count INTEGER;
  v_query TEXT;
BEGIN
  -- Build dynamic query
  v_query := format(
    'UPDATE %I SET last_backed_up_at = NOW() WHERE tenant_id = $1',
    p_table_name
  );
  
  -- Execute and get count
  EXECUTE v_query USING p_tenant_id;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN v_updated_count;
END;
$$;

COMMENT ON FUNCTION update_secops_backup_metadata IS 'M18.5 - Update backup metadata after successful backup';

-- ============================================================================
-- 8. Statistics View for SecOps Dashboard
-- ============================================================================
CREATE OR REPLACE VIEW vw_secops_statistics AS
SELECT 
  se.tenant_id,
  COUNT(DISTINCT se.id) FILTER (WHERE se.created_at >= NOW() - INTERVAL '24 hours') as events_last_24h,
  COUNT(DISTINCT se.id) FILTER (WHERE se.severity = 'critical' AND se.created_at >= NOW() - INTERVAL '24 hours') as critical_events_24h,
  COUNT(DISTINCT se.id) FILTER (WHERE se.is_processed = false) as unprocessed_events,
  COUNT(DISTINCT se.correlation_id) FILTER (WHERE se.correlation_id IS NOT NULL) as correlated_event_groups,
  COUNT(DISTINCT sp.id) FILTER (WHERE sp.is_active = true) as active_playbooks,
  COUNT(DISTINCT sex.id) FILTER (WHERE sex.status = 'running') as running_executions,
  COUNT(DISTINCT sex.id) FILTER (WHERE sex.status = 'completed' AND sex.started_at >= NOW() - INTERVAL '24 hours') as completed_executions_24h,
  COUNT(DISTINCT sc.id) FILTER (WHERE sc.is_active = true) as active_connectors,
  COUNT(DISTINCT sc.id) FILTER (WHERE sc.sync_status = 'error') as connectors_with_errors
FROM security_events se
LEFT JOIN soar_playbooks sp ON sp.tenant_id = se.tenant_id
LEFT JOIN soar_executions sex ON sex.tenant_id = se.tenant_id
LEFT JOIN secops_connectors sc ON sc.tenant_id = se.tenant_id
GROUP BY se.tenant_id;

COMMENT ON VIEW vw_secops_statistics IS 'M18.5 - Real-time statistics for SecOps dashboard';