-- ============================================================================
-- Gate-N: Admin Console & Control Center - Part 2.1
-- Database Tables & Enums for Admin Configuration and Job Management
-- ============================================================================

-- 1) Create enums for job status and trigger source
-- ============================================================================

-- Job status enum (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE job_status AS ENUM (
      'queued',
      'running',
      'succeeded',
      'failed',
      'cancelled'
    );
  END IF;
END $$;

-- Job trigger source enum (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_trigger_source') THEN
    CREATE TYPE job_trigger_source AS ENUM (
      'system',
      'manual',
      'api'
    );
  END IF;
END $$;

-- 2) Create admin_settings table
-- ============================================================================
-- Purpose: Per-tenant admin configuration for Gate-N
-- Stores: SLA config, feature flags, limits, notification channels

CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Configuration fields (JSONB for flexibility)
  sla_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  feature_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  notification_channels JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT admin_settings_tenant_id_unique UNIQUE (tenant_id)
);

-- Create index on tenant_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_admin_settings_tenant_id 
  ON public.admin_settings(tenant_id);

-- Add comment for documentation
COMMENT ON TABLE public.admin_settings IS 
  'Gate-N: Per-tenant admin configuration including SLA thresholds, feature flags, limits, and notification preferences';

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_settings
CREATE POLICY "Tenant admins can view their tenant settings"
  ON public.admin_settings
  FOR SELECT
  USING (tenant_id = app_current_tenant_id());

CREATE POLICY "Tenant admins can insert their tenant settings"
  ON public.admin_settings
  FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant_id() 
    AND app_has_role('tenant_admin'::text)
  );

CREATE POLICY "Tenant admins can update their tenant settings"
  ON public.admin_settings
  FOR UPDATE
  USING (
    tenant_id = app_current_tenant_id() 
    AND app_has_role('tenant_admin'::text)
  )
  WITH CHECK (
    tenant_id = app_current_tenant_id() 
    AND app_has_role('tenant_admin'::text)
  );

-- Trigger for updated_at
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Create system_jobs table
-- ============================================================================
-- Purpose: Catalog of job types that Gate-N can display and control

CREATE TABLE IF NOT EXISTS public.system_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NULL,  -- NULL = global job template, otherwise tenant-specific
  
  -- Job identification
  job_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  gate_code TEXT NOT NULL,
  
  -- Scheduling
  default_cron TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT system_jobs_tenant_job_key_unique UNIQUE (tenant_id, job_key)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_system_jobs_tenant_id 
  ON public.system_jobs(tenant_id);

CREATE INDEX IF NOT EXISTS idx_system_jobs_job_key 
  ON public.system_jobs(job_key);

CREATE INDEX IF NOT EXISTS idx_system_jobs_gate_code 
  ON public.system_jobs(gate_code);

CREATE INDEX IF NOT EXISTS idx_system_jobs_is_enabled 
  ON public.system_jobs(is_enabled) WHERE is_enabled = true;

-- Add comment
COMMENT ON TABLE public.system_jobs IS 
  'Gate-N: Catalog of system jobs (reminders, reports, KPI refresh, etc.) that can be monitored and controlled';

-- Enable RLS
ALTER TABLE public.system_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_jobs
CREATE POLICY "Users can view jobs for their tenant or global jobs"
  ON public.system_jobs
  FOR SELECT
  USING (
    tenant_id IS NULL 
    OR tenant_id = app_current_tenant_id()
  );

CREATE POLICY "Tenant admins can insert jobs for their tenant"
  ON public.system_jobs
  FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant_id() 
    AND app_has_role('tenant_admin'::text)
  );

CREATE POLICY "Tenant admins can update jobs for their tenant"
  ON public.system_jobs
  FOR UPDATE
  USING (
    tenant_id = app_current_tenant_id() 
    AND app_has_role('tenant_admin'::text)
  )
  WITH CHECK (
    tenant_id = app_current_tenant_id() 
    AND app_has_role('tenant_admin'::text)
  );

CREATE POLICY "Tenant admins can delete jobs for their tenant"
  ON public.system_jobs
  FOR DELETE
  USING (
    tenant_id = app_current_tenant_id() 
    AND app_has_role('tenant_admin'::text)
  );

-- Trigger for updated_at
CREATE TRIGGER update_system_jobs_updated_at
  BEFORE UPDATE ON public.system_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Create system_job_runs table
-- ============================================================================
-- Purpose: History of job executions (manual or automatic)

CREATE TABLE IF NOT EXISTS public.system_job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  job_id UUID NOT NULL REFERENCES public.system_jobs(id) ON DELETE CASCADE,
  
  -- Execution details
  status job_status NOT NULL DEFAULT 'queued',
  trigger_source job_trigger_source NOT NULL DEFAULT 'system',
  triggered_by_user_id UUID NULL,
  
  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ NULL,
  
  -- Error tracking
  error_message TEXT NULL,
  
  -- Additional metadata
  meta JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_system_job_runs_tenant_job 
  ON public.system_job_runs(tenant_id, job_id);

CREATE INDEX IF NOT EXISTS idx_system_job_runs_status 
  ON public.system_job_runs(status);

CREATE INDEX IF NOT EXISTS idx_system_job_runs_started_at 
  ON public.system_job_runs(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_job_runs_trigger_source 
  ON public.system_job_runs(trigger_source);

CREATE INDEX IF NOT EXISTS idx_system_job_runs_triggered_by 
  ON public.system_job_runs(triggered_by_user_id) 
  WHERE triggered_by_user_id IS NOT NULL;

-- Add comment
COMMENT ON TABLE public.system_job_runs IS 
  'Gate-N: History of system job executions with status, timing, and error tracking';

-- Enable RLS
ALTER TABLE public.system_job_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_job_runs
CREATE POLICY "Users can view job runs for their tenant"
  ON public.system_job_runs
  FOR SELECT
  USING (tenant_id = app_current_tenant_id());

CREATE POLICY "System can insert job runs"
  ON public.system_job_runs
  FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant_id() 
    AND (
      triggered_by_user_id = app_current_user_id() 
      OR triggered_by_user_id IS NULL
    )
  );

CREATE POLICY "System can update job runs for their tenant"
  ON public.system_job_runs
  FOR UPDATE
  USING (tenant_id = app_current_tenant_id())
  WITH CHECK (tenant_id = app_current_tenant_id());

-- No DELETE policy - job run history should be immutable for audit purposes

-- 5) Seed default admin settings for existing tenants (optional)
-- ============================================================================
-- Insert default admin_settings for any tenant that doesn't have one yet

INSERT INTO public.admin_settings (tenant_id, sla_config, feature_flags, limits, notification_channels)
SELECT 
  t.id,
  jsonb_build_object(
    'reminder_sla_hours', 48,
    'report_sla_days', 3,
    'action_sla_days_urgent', 7,
    'action_sla_days_high', 14,
    'action_sla_days_medium', 30,
    'action_sla_days_low', 60
  ),
  jsonb_build_object(
    'enable_gate_k', true,
    'enable_gate_f', true,
    'enable_gate_h', true,
    'enable_advanced_alerts', true,
    'enable_ai_recommendations', false
  ),
  jsonb_build_object(
    'max_users', 500,
    'max_active_campaigns', 10,
    'max_storage_mb', 1000
  ),
  jsonb_build_object(
    'email', true,
    'slack', false,
    'webhook', false
  )
FROM (
  SELECT DISTINCT tenant_id AS id FROM public.user_tenants
) AS t
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_settings WHERE tenant_id = t.id
)
ON CONFLICT (tenant_id) DO NOTHING;

-- 6) Seed common system jobs (global templates)
-- ============================================================================
-- Insert common job templates that all tenants can use

INSERT INTO public.system_jobs (tenant_id, job_key, display_name, description, gate_code, default_cron, is_enabled)
VALUES
  -- Gate-K: KPI & Analytics Jobs
  (NULL, 'gate_k_refresh_all_views', 'Refresh All KPI Views', 'Refreshes all Gate-K materialized views (trends, deltas, anomalies, RCA)', 'Gate-K', '0 2 * * *', true),
  (NULL, 'gate_k_generate_recommendations', 'Generate KPI Recommendations', 'Analyzes KPI trends and generates actionable recommendations', 'Gate-K', '0 3 * * *', true),
  (NULL, 'gate_k_quarterly_insights', 'Generate Quarterly Insights', 'Creates quarterly insights report with top initiatives', 'Gate-K', '0 4 1 */3 *', true),
  
  -- Gate-F: Reports Jobs
  (NULL, 'gate_f_refresh_report_views', 'Refresh Report Views', 'Refreshes daily and CTD report materialized views', 'Gate-F', '0 1 * * *', true),
  (NULL, 'gate_f_export_monthly_reports', 'Export Monthly Reports', 'Generates and exports monthly campaign reports', 'Gate-F', '0 5 1 * *', true),
  
  -- Gate-D: Campaigns Jobs
  (NULL, 'gate_d_send_reminders', 'Send Campaign Reminders', 'Sends reminder emails to participants with pending tasks', 'Gate-D', '0 9 * * *', true),
  (NULL, 'gate_d_refresh_awareness_views', 'Refresh Awareness Views', 'Refreshes campaign KPIs and feedback insights views', 'Gate-D', '0 */6 * * *', true),
  
  -- Gate-H: Action Plans Jobs
  (NULL, 'gate_h_update_sla_status', 'Update Action SLA Status', 'Updates overdue status for all action items based on SLA', 'Gate-H', '0 0 * * *', true),
  (NULL, 'gate_h_escalate_overdue', 'Escalate Overdue Actions', 'Sends escalation notifications for overdue action items', 'Gate-H', '0 10 * * *', true),
  
  -- Gate-E: Observability Jobs
  (NULL, 'gate_e_process_alert_policies', 'Process Alert Policies', 'Evaluates alert policies and triggers notifications', 'Gate-E', '*/15 * * * *', true),
  (NULL, 'gate_e_cleanup_old_events', 'Cleanup Old Alert Events', 'Archives alert events older than retention period', 'Gate-E', '0 3 * * 0', true)
ON CONFLICT (tenant_id, job_key) DO NOTHING;