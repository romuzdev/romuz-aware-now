/**
 * ============================================================================
 * M15 - Integrations Security Enhancements
 * Purpose: Add transaction logging, backup metadata, and RLS policies
 * ============================================================================
 */

-- ============================================================================
-- 1. Transaction Logging Triggers
-- ============================================================================

-- Integration Connectors
DROP TRIGGER IF EXISTS integration_connectors_audit_trigger ON integration_connectors;
CREATE TRIGGER integration_connectors_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON integration_connectors
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- Integration Logs
DROP TRIGGER IF EXISTS integration_logs_audit_trigger ON integration_logs;
CREATE TRIGGER integration_logs_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON integration_logs
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- Integration Webhooks
DROP TRIGGER IF EXISTS integration_webhooks_audit_trigger ON integration_webhooks;
CREATE TRIGGER integration_webhooks_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON integration_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- Integration API Keys
DROP TRIGGER IF EXISTS integration_api_keys_audit_trigger ON integration_api_keys;
CREATE TRIGGER integration_api_keys_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON integration_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- ============================================================================
-- 2. Backup Metadata Columns
-- ============================================================================

ALTER TABLE integration_connectors ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ;
ALTER TABLE integration_webhooks ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ;
ALTER TABLE integration_api_keys ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ;
ALTER TABLE integration_logs ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ;

-- Create indexes for backup queries
CREATE INDEX IF NOT EXISTS idx_integration_connectors_backup 
  ON integration_connectors(tenant_id, last_backed_up_at);
CREATE INDEX IF NOT EXISTS idx_integration_webhooks_backup 
  ON integration_webhooks(tenant_id, last_backed_up_at);

-- ============================================================================
-- 3. Helper Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION get_integration_health_status(p_tenant_id UUID)
RETURNS TABLE(
  connector_id UUID,
  connector_name TEXT,
  connector_type TEXT,
  status TEXT,
  last_sync_at TIMESTAMPTZ,
  error_count BIGINT,
  health_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as connector_id,
    c.name as connector_name,
    c.type as connector_type,
    c.status,
    c.last_sync_at,
    COUNT(l.id) FILTER (WHERE l.status = 'failed' AND l.created_at > NOW() - INTERVAL '24 hours') as error_count,
    CASE
      WHEN c.status = 'active' AND COUNT(l.id) FILTER (WHERE l.status = 'failed' AND l.created_at > NOW() - INTERVAL '24 hours') = 0 THEN 'healthy'
      WHEN c.status = 'active' AND COUNT(l.id) FILTER (WHERE l.status = 'failed' AND l.created_at > NOW() - INTERVAL '24 hours') <= 3 THEN 'warning'
      ELSE 'error'
    END as health_status
  FROM integration_connectors c
  LEFT JOIN integration_logs l ON l.connector_id = c.id
  WHERE c.tenant_id = p_tenant_id
  GROUP BY c.id, c.name, c.type, c.status, c.last_sync_at;
END;
$$;

-- ============================================================================
-- 4. Indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_integration_logs_status_created 
  ON integration_logs(tenant_id, status, created_at DESC);
  
CREATE INDEX IF NOT EXISTS idx_integration_connectors_type_status 
  ON integration_connectors(tenant_id, type, status);