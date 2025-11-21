-- ============================================================================
-- M18: Incident Response System - External Integration Tables (Fixed)
-- ============================================================================

-- Table: incident_integrations (إعدادات التكاملات)
CREATE TABLE IF NOT EXISTS incident_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Integration details
  integration_type TEXT NOT NULL, -- 'siem', 'webhook', 'cloud_provider', 'log_monitor', 'security_tool'
  integration_name TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'splunk', 'qradar', 'aws_guardduty', 'azure_security', 'elk', etc.
  
  -- Configuration
  config_json JSONB NOT NULL DEFAULT '{}', -- API keys, endpoints, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  
  -- Authentication
  auth_type TEXT, -- 'api_key', 'oauth', 'basic_auth', 'token'
  auth_config JSONB DEFAULT '{}',
  
  -- Mapping configuration
  field_mapping JSONB DEFAULT '{}', -- Map external fields to incident fields
  severity_mapping JSONB DEFAULT '{}', -- Map external severity to our severity
  
  -- Statistics
  total_events_received INTEGER DEFAULT 0,
  last_event_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'idle', -- 'idle', 'syncing', 'error'
  last_error TEXT,
  
  -- Metadata
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL,
  
  CONSTRAINT unique_integration_per_tenant UNIQUE(tenant_id, integration_name)
);

-- Table: incident_webhook_logs (سجل Webhooks الواردة)
CREATE TABLE IF NOT EXISTS incident_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES incident_integrations(id) ON DELETE SET NULL,
  
  -- Request details
  webhook_source TEXT NOT NULL, -- 'siem', 'cloud_provider', 'custom'
  source_identifier TEXT, -- IP, domain, or identifier
  http_method TEXT NOT NULL,
  headers JSONB,
  
  -- Payload
  raw_payload JSONB NOT NULL,
  parsed_payload JSONB,
  
  -- Processing
  processing_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processed', 'failed', 'ignored'
  processing_error TEXT,
  processing_duration_ms INTEGER,
  
  -- Result
  incident_id UUID REFERENCES security_incidents(id) ON DELETE SET NULL,
  action_taken TEXT, -- 'created_incident', 'updated_incident', 'ignored', 'error'
  
  -- Timestamps
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  
  -- Retention: Auto-delete after 90 days
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: incident_external_sources (المصادر الخارجية المتصلة)
CREATE TABLE IF NOT EXISTS incident_external_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES incident_integrations(id) ON DELETE CASCADE,
  
  -- Source details
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL, -- 'firewall', 'ids', 'ips', 'edr', 'siem', 'log_aggregator'
  source_identifier TEXT NOT NULL, -- Unique identifier from external system
  
  -- Configuration
  is_monitored BOOLEAN NOT NULL DEFAULT true,
  alert_threshold TEXT DEFAULT 'medium', -- Minimum severity to create incident
  auto_create_incident BOOLEAN NOT NULL DEFAULT true,
  
  -- Filters
  include_filters JSONB DEFAULT '[]', -- Rules to include events
  exclude_filters JSONB DEFAULT '[]', -- Rules to exclude events
  
  -- Statistics
  total_events INTEGER DEFAULT 0,
  total_incidents_created INTEGER DEFAULT 0,
  last_event_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_source_per_integration UNIQUE(integration_id, source_identifier)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX idx_integrations_tenant_type ON incident_integrations(tenant_id, integration_type);
CREATE INDEX idx_integrations_active ON incident_integrations(tenant_id, is_active) WHERE is_active = true;
CREATE INDEX idx_webhook_logs_tenant_status ON incident_webhook_logs(tenant_id, processing_status);
CREATE INDEX idx_webhook_logs_received_at ON incident_webhook_logs(received_at DESC);
CREATE INDEX idx_webhook_logs_integration ON incident_webhook_logs(integration_id);
CREATE INDEX idx_external_sources_tenant ON incident_external_sources(tenant_id, is_monitored);
CREATE INDEX idx_external_sources_integration ON incident_external_sources(integration_id);

-- ============================================================================
-- RLS Policies (Fixed)
-- ============================================================================

-- incident_integrations
ALTER TABLE incident_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_integrations_select" ON incident_integrations
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "tenant_isolation_integrations_insert" ON incident_integrations
  FOR INSERT WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "tenant_isolation_integrations_update" ON incident_integrations
  FOR UPDATE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "tenant_isolation_integrations_delete" ON incident_integrations
  FOR DELETE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- incident_webhook_logs
ALTER TABLE incident_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_webhook_logs_select" ON incident_webhook_logs
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "tenant_isolation_webhook_logs_insert" ON incident_webhook_logs
  FOR INSERT WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- incident_external_sources
ALTER TABLE incident_external_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_external_sources_select" ON incident_external_sources
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "tenant_isolation_external_sources_insert" ON incident_external_sources
  FOR INSERT WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "tenant_isolation_external_sources_update" ON incident_external_sources
  FOR UPDATE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "tenant_isolation_external_sources_delete" ON incident_external_sources
  FOR DELETE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ============================================================================
-- Trigger: Auto-update updated_at
-- ============================================================================

CREATE TRIGGER update_integrations_timestamp
  BEFORE UPDATE ON incident_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_sources_timestamp
  BEFORE UPDATE ON incident_external_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Function: Auto-delete old webhook logs (retention: 90 days)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM incident_webhook_logs
  WHERE created_at < now() - INTERVAL '90 days';
END;
$$;