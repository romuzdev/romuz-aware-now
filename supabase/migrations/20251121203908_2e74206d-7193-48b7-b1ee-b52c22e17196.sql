-- ============================================
-- M14 & M15 Enhancements - Database Schema (Fixed)
-- Week 5-6: Custom Dashboards + Integration Health
-- ============================================

-- ============================================
-- Part 1: M14 - Custom Dashboards Schema
-- ============================================

-- Custom Dashboards Table
CREATE TABLE IF NOT EXISTS custom_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  layout JSONB NOT NULL DEFAULT '[]'::jsonb,
  widgets JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,
  shared_with_roles TEXT[] DEFAULT '{}',
  refresh_interval INT DEFAULT 300,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_backed_up_at TIMESTAMPTZ
);

-- Dashboard Widgets Library
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL CHECK (widget_type IN (
    'kpi_card', 'chart_line', 'chart_bar', 'chart_pie', 
    'chart_area', 'table', 'metric_grid', 'alert_list',
    'trend_indicator', 'progress_bar', 'heat_map', 'custom'
  )),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  data_source TEXT NOT NULL,
  query_config JSONB,
  refresh_interval INT DEFAULT 300,
  icon TEXT,
  category TEXT,
  is_system BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_backed_up_at TIMESTAMPTZ
);

-- Dashboard Widget Data Cache
CREATE TABLE IF NOT EXISTS dashboard_widget_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID NOT NULL REFERENCES dashboard_widgets(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cached_data JSONB NOT NULL,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(widget_id, tenant_id)
);

-- ============================================
-- Part 2: M15 - Integration Health Enhancement
-- ============================================

-- Add columns to integration_connectors one by one (safely)
DO $$ 
BEGIN
  -- health_status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'integration_connectors' AND column_name = 'health_status') THEN
    ALTER TABLE integration_connectors ADD COLUMN health_status TEXT DEFAULT 'unknown';
    ALTER TABLE integration_connectors ADD CONSTRAINT integration_connectors_health_status_check 
      CHECK (health_status IN ('healthy', 'degraded', 'down', 'unknown'));
  END IF;
  
  -- last_health_check
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'integration_connectors' AND column_name = 'last_health_check') THEN
    ALTER TABLE integration_connectors ADD COLUMN last_health_check TIMESTAMPTZ;
  END IF;
  
  -- error_count
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'integration_connectors' AND column_name = 'error_count') THEN
    ALTER TABLE integration_connectors ADD COLUMN error_count INT DEFAULT 0;
  END IF;
  
  -- success_count
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'integration_connectors' AND column_name = 'success_count') THEN
    ALTER TABLE integration_connectors ADD COLUMN success_count INT DEFAULT 0;
  END IF;
  
  -- rate_limit_remaining
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'integration_connectors' AND column_name = 'rate_limit_remaining') THEN
    ALTER TABLE integration_connectors ADD COLUMN rate_limit_remaining INT;
  END IF;
  
  -- rate_limit_reset_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'integration_connectors' AND column_name = 'rate_limit_reset_at') THEN
    ALTER TABLE integration_connectors ADD COLUMN rate_limit_reset_at TIMESTAMPTZ;
  END IF;
  
  -- average_response_time_ms
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'integration_connectors' AND column_name = 'average_response_time_ms') THEN
    ALTER TABLE integration_connectors ADD COLUMN average_response_time_ms INT;
  END IF;
  
  -- last_error_message
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'integration_connectors' AND column_name = 'last_error_message') THEN
    ALTER TABLE integration_connectors ADD COLUMN last_error_message TEXT;
  END IF;
  
  -- last_error_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'integration_connectors' AND column_name = 'last_error_at') THEN
    ALTER TABLE integration_connectors ADD COLUMN last_error_at TIMESTAMPTZ;
  END IF;
  
  -- auto_retry_enabled
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'integration_connectors' AND column_name = 'auto_retry_enabled') THEN
    ALTER TABLE integration_connectors ADD COLUMN auto_retry_enabled BOOLEAN DEFAULT true;
  END IF;
  
  -- retry_count
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'integration_connectors' AND column_name = 'retry_count') THEN
    ALTER TABLE integration_connectors ADD COLUMN retry_count INT DEFAULT 0;
  END IF;
  
  -- max_retries
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'integration_connectors' AND column_name = 'max_retries') THEN
    ALTER TABLE integration_connectors ADD COLUMN max_retries INT DEFAULT 3;
  END IF;
END $$;

-- Integration Health Logs
CREATE TABLE IF NOT EXISTS integration_health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id UUID NOT NULL REFERENCES integration_connectors(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  health_status TEXT NOT NULL CHECK (health_status IN ('healthy', 'degraded', 'down')),
  response_time_ms INT,
  error_message TEXT,
  error_details JSONB,
  request_payload JSONB,
  response_payload JSONB,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_backed_up_at TIMESTAMPTZ
);

-- Integration Sync Jobs
CREATE TABLE IF NOT EXISTS integration_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id UUID NOT NULL REFERENCES integration_connectors(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN (
    'full_sync', 'incremental_sync', 'one_time', 'scheduled'
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'running', 'completed', 'failed', 'cancelled', 'retrying'
  )),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  records_synced INT DEFAULT 0,
  records_failed INT DEFAULT 0,
  error_message TEXT,
  error_details JSONB,
  retry_count INT DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_backed_up_at TIMESTAMPTZ
);

-- Integration Rate Limits
CREATE TABLE IF NOT EXISTS integration_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id UUID NOT NULL REFERENCES integration_connectors(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  limit_total INT NOT NULL,
  limit_remaining INT NOT NULL,
  limit_reset_at TIMESTAMPTZ NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(connector_id, endpoint)
);

-- ============================================
-- Part 3: Indexes
-- ============================================

-- Custom Dashboards
CREATE INDEX IF NOT EXISTS idx_custom_dashboards_tenant ON custom_dashboards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_custom_dashboards_user ON custom_dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_dashboards_shared ON custom_dashboards(tenant_id, is_shared) WHERE is_shared = true;
CREATE INDEX IF NOT EXISTS idx_custom_dashboards_backup ON custom_dashboards(tenant_id, last_backed_up_at);

-- Dashboard Widgets
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_tenant ON dashboard_widgets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_type ON dashboard_widgets(widget_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_source ON dashboard_widgets(data_source);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_system ON dashboard_widgets(is_system);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_backup ON dashboard_widgets(tenant_id, last_backed_up_at);

-- Widget Cache
CREATE INDEX IF NOT EXISTS idx_widget_cache_tenant ON dashboard_widget_cache(tenant_id);
CREATE INDEX IF NOT EXISTS idx_widget_cache_expires ON dashboard_widget_cache(expires_at);

-- Integration Health Logs
CREATE INDEX IF NOT EXISTS idx_integration_health_connector ON integration_health_logs(connector_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_health_tenant ON integration_health_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_integration_health_status ON integration_health_logs(health_status, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_health_backup ON integration_health_logs(tenant_id, last_backed_up_at);

-- Integration Sync Jobs
CREATE INDEX IF NOT EXISTS idx_sync_jobs_connector ON integration_sync_jobs(connector_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_tenant ON integration_sync_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON integration_sync_jobs(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_retry ON integration_sync_jobs(next_retry_at) WHERE status = 'failed' AND retry_count < 3;
CREATE INDEX IF NOT EXISTS idx_sync_jobs_backup ON integration_sync_jobs(tenant_id, last_backed_up_at);

-- Rate Limits
CREATE INDEX IF NOT EXISTS idx_rate_limits_connector ON integration_rate_limits(connector_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON integration_rate_limits(limit_reset_at);

-- ============================================
-- Part 4: RLS Policies
-- ============================================

-- Custom Dashboards RLS
ALTER TABLE custom_dashboards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "custom_dashboards_tenant_isolation_select" ON custom_dashboards;
CREATE POLICY "custom_dashboards_tenant_isolation_select"
  ON custom_dashboards FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "custom_dashboards_tenant_isolation_insert" ON custom_dashboards;
CREATE POLICY "custom_dashboards_tenant_isolation_insert"
  ON custom_dashboards FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()) AND user_id = auth.uid());

DROP POLICY IF EXISTS "custom_dashboards_tenant_isolation_update" ON custom_dashboards;
CREATE POLICY "custom_dashboards_tenant_isolation_update"
  ON custom_dashboards FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()) AND user_id = auth.uid());

DROP POLICY IF EXISTS "custom_dashboards_tenant_isolation_delete" ON custom_dashboards;
CREATE POLICY "custom_dashboards_tenant_isolation_delete"
  ON custom_dashboards FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()) AND user_id = auth.uid());

-- Dashboard Widgets RLS
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dashboard_widgets_tenant_isolation_select" ON dashboard_widgets;
CREATE POLICY "dashboard_widgets_tenant_isolation_select"
  ON dashboard_widgets FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "dashboard_widgets_tenant_isolation_insert" ON dashboard_widgets;
CREATE POLICY "dashboard_widgets_tenant_isolation_insert"
  ON dashboard_widgets FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "dashboard_widgets_tenant_isolation_update" ON dashboard_widgets;
CREATE POLICY "dashboard_widgets_tenant_isolation_update"
  ON dashboard_widgets FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "dashboard_widgets_tenant_isolation_delete" ON dashboard_widgets;
CREATE POLICY "dashboard_widgets_tenant_isolation_delete"
  ON dashboard_widgets FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()));

-- Widget Cache RLS
ALTER TABLE dashboard_widget_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "widget_cache_tenant_isolation_select" ON dashboard_widget_cache;
CREATE POLICY "widget_cache_tenant_isolation_select"
  ON dashboard_widget_cache FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "widget_cache_service_manage" ON dashboard_widget_cache;
CREATE POLICY "widget_cache_service_manage"
  ON dashboard_widget_cache FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Integration Health Logs RLS
ALTER TABLE integration_health_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "integration_health_tenant_isolation_select" ON integration_health_logs;
CREATE POLICY "integration_health_tenant_isolation_select"
  ON integration_health_logs FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "integration_health_service_insert" ON integration_health_logs;
CREATE POLICY "integration_health_service_insert"
  ON integration_health_logs FOR INSERT TO service_role
  WITH CHECK (true);

-- Integration Sync Jobs RLS
ALTER TABLE integration_sync_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sync_jobs_tenant_isolation_select" ON integration_sync_jobs;
CREATE POLICY "sync_jobs_tenant_isolation_select"
  ON integration_sync_jobs FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "sync_jobs_tenant_isolation_insert" ON integration_sync_jobs;
CREATE POLICY "sync_jobs_tenant_isolation_insert"
  ON integration_sync_jobs FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "sync_jobs_tenant_isolation_update" ON integration_sync_jobs;
CREATE POLICY "sync_jobs_tenant_isolation_update"
  ON integration_sync_jobs FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()));

-- Integration Rate Limits RLS
ALTER TABLE integration_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rate_limits_tenant_isolation_select" ON integration_rate_limits;
CREATE POLICY "rate_limits_tenant_isolation_select"
  ON integration_rate_limits FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "rate_limits_service_manage" ON integration_rate_limits;
CREATE POLICY "rate_limits_service_manage"
  ON integration_rate_limits FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================
-- Part 5: Audit Triggers
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_table_changes') THEN
    -- Custom Dashboards
    DROP TRIGGER IF EXISTS custom_dashboards_audit_trigger ON custom_dashboards;
    CREATE TRIGGER custom_dashboards_audit_trigger
      AFTER INSERT OR UPDATE OR DELETE ON custom_dashboards
      FOR EACH ROW EXECUTE FUNCTION log_table_changes();
    
    -- Dashboard Widgets
    DROP TRIGGER IF EXISTS dashboard_widgets_audit_trigger ON dashboard_widgets;
    CREATE TRIGGER dashboard_widgets_audit_trigger
      AFTER INSERT OR UPDATE OR DELETE ON dashboard_widgets
      FOR EACH ROW EXECUTE FUNCTION log_table_changes();
    
    -- Integration Health Logs
    DROP TRIGGER IF EXISTS integration_health_logs_audit_trigger ON integration_health_logs;
    CREATE TRIGGER integration_health_logs_audit_trigger
      AFTER INSERT OR UPDATE OR DELETE ON integration_health_logs
      FOR EACH ROW EXECUTE FUNCTION log_table_changes();
    
    -- Integration Sync Jobs
    DROP TRIGGER IF EXISTS integration_sync_jobs_audit_trigger ON integration_sync_jobs;
    CREATE TRIGGER integration_sync_jobs_audit_trigger
      AFTER INSERT OR UPDATE OR DELETE ON integration_sync_jobs
      FOR EACH ROW EXECUTE FUNCTION log_table_changes();
  END IF;
END $$;

-- ============================================
-- Part 6: Helper Functions
-- ============================================

-- Clean expired widget cache
CREATE OR REPLACE FUNCTION clean_expired_widget_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM dashboard_widget_cache WHERE expires_at < now();
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

-- Update integration health
CREATE OR REPLACE FUNCTION update_integration_health(
  p_connector_id UUID,
  p_health_status TEXT,
  p_response_time_ms INT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE integration_connectors
  SET 
    health_status = p_health_status,
    last_health_check = now(),
    average_response_time_ms = COALESCE(p_response_time_ms, average_response_time_ms),
    last_error_message = COALESCE(p_error_message, last_error_message),
    last_error_at = CASE WHEN p_error_message IS NOT NULL THEN now() ELSE last_error_at END,
    error_count = CASE WHEN p_health_status IN ('degraded', 'down') THEN error_count + 1 ELSE error_count END,
    success_count = CASE WHEN p_health_status = 'healthy' THEN success_count + 1 ELSE success_count END,
    updated_at = now()
  WHERE id = p_connector_id;
END;
$$;

-- Retry failed sync jobs
CREATE OR REPLACE FUNCTION retry_failed_sync_jobs()
RETURNS TABLE (job_id UUID, connector_id UUID, retry_count INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE integration_sync_jobs
  SET 
    status = 'retrying',
    retry_count = integration_sync_jobs.retry_count + 1,
    next_retry_at = now() + (integration_sync_jobs.retry_count + 1) * INTERVAL '5 minutes',
    updated_at = now()
  WHERE status = 'failed'
    AND integration_sync_jobs.retry_count < 3
    AND next_retry_at <= now()
  RETURNING id, integration_sync_jobs.connector_id, integration_sync_jobs.retry_count;
END;
$$;