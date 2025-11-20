-- ============================================================================
-- Part 2.3 — Gate-N Core RPCs for Admin Console & Control Center
-- ============================================================================
-- Purpose: Provide RPC functions for Gate-N UI to:
--   1. Get/Update admin_settings
--   2. List system_jobs
--   3. Trigger jobs (create system_job_runs with 'queued' status)
--   4. Get status snapshot
--   5. Get recent job runs
-- 
-- Security: All functions use SECURITY DEFINER with role checks
-- ============================================================================

-- ============================================================================
-- 1) fn_gate_n_get_admin_settings
-- Returns admin_settings for current tenant
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_gate_n_get_admin_settings()
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  sla_config JSONB,
  feature_flags JSONB,
  limits JSONB,
  notification_channels JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get current tenant
  v_tenant_id := get_user_tenant_id(auth.uid());
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Check role (only tenant_admin or system_admin)
  IF NOT (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'system_admin')) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED: Only tenant_admin or system_admin can view admin settings';
  END IF;
  
  -- Return admin_settings for this tenant
  RETURN QUERY
  SELECT 
    a.id,
    a.tenant_id,
    a.sla_config,
    a.feature_flags,
    a.limits,
    a.notification_channels,
    a.created_at,
    a.updated_at,
    a.created_by,
    a.updated_by
  FROM public.admin_settings a
  WHERE a.tenant_id = v_tenant_id;
END;
$$;

COMMENT ON FUNCTION public.fn_gate_n_get_admin_settings IS 
'Gate-N: Returns admin_settings for current tenant (tenant_admin only)';

-- ============================================================================
-- 2) fn_gate_n_upsert_admin_settings
-- Insert or update admin_settings for current tenant
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_gate_n_upsert_admin_settings(
  p_sla_config JSONB,
  p_feature_flags JSONB,
  p_limits JSONB,
  p_notification_channels JSONB
)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  sla_config JSONB,
  feature_flags JSONB,
  limits JSONB,
  notification_channels JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user and tenant
  v_user_id := auth.uid();
  v_tenant_id := get_user_tenant_id(v_user_id);
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Check role (only tenant_admin or system_admin)
  IF NOT (has_role(v_user_id, 'tenant_admin') OR has_role(v_user_id, 'system_admin')) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED: Only tenant_admin or system_admin can modify admin settings';
  END IF;
  
  -- Upsert admin_settings
  RETURN QUERY
  INSERT INTO public.admin_settings (
    tenant_id,
    sla_config,
    feature_flags,
    limits,
    notification_channels,
    created_by,
    updated_by
  )
  VALUES (
    v_tenant_id,
    p_sla_config,
    p_feature_flags,
    p_limits,
    p_notification_channels,
    v_user_id,
    v_user_id
  )
  ON CONFLICT (tenant_id)
  DO UPDATE SET
    sla_config = EXCLUDED.sla_config,
    feature_flags = EXCLUDED.feature_flags,
    limits = EXCLUDED.limits,
    notification_channels = EXCLUDED.notification_channels,
    updated_by = v_user_id,
    updated_at = now()
  RETURNING 
    id,
    tenant_id,
    sla_config,
    feature_flags,
    limits,
    notification_channels,
    created_at,
    updated_at,
    created_by,
    updated_by;
END;
$$;

COMMENT ON FUNCTION public.fn_gate_n_upsert_admin_settings IS 
'Gate-N: Insert or update admin_settings for current tenant (tenant_admin only)';

-- ============================================================================
-- 3) fn_gate_n_list_system_jobs
-- Returns all accessible system_jobs (global + tenant-specific)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_gate_n_list_system_jobs()
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  job_key TEXT,
  job_type TEXT,
  schedule_cron TEXT,
  is_enabled BOOLEAN,
  config JSONB,
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get current tenant
  v_tenant_id := get_user_tenant_id(auth.uid());
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Return global jobs + tenant-specific jobs
  -- (Including disabled jobs - UI can filter if needed)
  RETURN QUERY
  SELECT 
    j.id,
    j.tenant_id,
    j.job_key,
    j.job_type,
    j.schedule_cron,
    j.is_enabled,
    j.config,
    j.last_run_at,
    j.last_run_status,
    j.created_at,
    j.updated_at
  FROM public.system_jobs j
  WHERE j.tenant_id IS NULL  -- Global jobs
     OR j.tenant_id = v_tenant_id  -- Tenant-specific jobs
  ORDER BY j.job_key;
END;
$$;

COMMENT ON FUNCTION public.fn_gate_n_list_system_jobs IS 
'Gate-N: Returns all accessible system_jobs (global + tenant-specific)';

-- ============================================================================
-- 4) fn_gate_n_trigger_job
-- Manually trigger a job by creating a system_job_runs record with 'queued' status
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_gate_n_trigger_job(
  p_job_key TEXT
)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  job_id UUID,
  status TEXT,
  trigger_source TEXT,
  triggered_by_user_id UUID,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  result JSONB,
  error_message TEXT,
  meta JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_job_id UUID;
BEGIN
  -- Get current user and tenant
  v_user_id := auth.uid();
  v_tenant_id := get_user_tenant_id(v_user_id);
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Check role (only tenant_admin or system_admin)
  IF NOT (has_role(v_user_id, 'tenant_admin') OR has_role(v_user_id, 'system_admin')) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED: Only tenant_admin or system_admin can trigger jobs';
  END IF;
  
  -- Find the job (global or tenant-specific)
  SELECT j.id INTO v_job_id
  FROM public.system_jobs j
  WHERE j.job_key = p_job_key
    AND (j.tenant_id IS NULL OR j.tenant_id = v_tenant_id)
    AND j.is_enabled = true
  LIMIT 1;
  
  IF v_job_id IS NULL THEN
    RAISE EXCEPTION 'JOB_NOT_FOUND: Job % not found or disabled', p_job_key;
  END IF;
  
  -- Insert job run with 'queued' status
  RETURN QUERY
  INSERT INTO public.system_job_runs (
    tenant_id,
    job_id,
    status,
    trigger_source,
    triggered_by_user_id,
    started_at
  )
  VALUES (
    v_tenant_id,
    v_job_id,
    'queued',
    'manual',
    v_user_id,
    now()
  )
  RETURNING 
    id,
    tenant_id,
    job_id,
    status,
    trigger_source,
    triggered_by_user_id,
    started_at,
    finished_at,
    duration_ms,
    result,
    error_message,
    meta;
END;
$$;

COMMENT ON FUNCTION public.fn_gate_n_trigger_job IS 
'Gate-N: Manually trigger a job by creating a system_job_runs record with queued status (tenant_admin only)';

-- ============================================================================
-- 5) fn_gate_n_get_status_snapshot
-- Returns a JSONB snapshot of Gate-N system status for current tenant
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_gate_n_get_status_snapshot()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_result JSONB;
  v_jobs_total INTEGER;
  v_jobs_enabled INTEGER;
  v_runs_succeeded INTEGER;
  v_runs_failed INTEGER;
  v_runs_running INTEGER;
  v_admin_settings_updated_at TIMESTAMPTZ;
BEGIN
  -- Get current tenant
  v_tenant_id := get_user_tenant_id(auth.uid());
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Count jobs (global + tenant-specific)
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE is_enabled = true)
  INTO v_jobs_total, v_jobs_enabled
  FROM public.system_jobs
  WHERE tenant_id IS NULL OR tenant_id = v_tenant_id;
  
  -- Count job runs in last 24 hours
  SELECT 
    COUNT(*) FILTER (WHERE status = 'succeeded'),
    COUNT(*) FILTER (WHERE status = 'failed'),
    COUNT(*) FILTER (WHERE status = 'running')
  INTO v_runs_succeeded, v_runs_failed, v_runs_running
  FROM public.system_job_runs
  WHERE tenant_id = v_tenant_id
    AND started_at >= now() - INTERVAL '24 hours';
  
  -- Get admin_settings last update
  SELECT updated_at INTO v_admin_settings_updated_at
  FROM public.admin_settings
  WHERE tenant_id = v_tenant_id;
  
  -- Build JSON result
  v_result := jsonb_build_object(
    'jobs', jsonb_build_object(
      'total', COALESCE(v_jobs_total, 0),
      'enabled', COALESCE(v_jobs_enabled, 0),
      'runs_last_24h', jsonb_build_object(
        'succeeded', COALESCE(v_runs_succeeded, 0),
        'failed', COALESCE(v_runs_failed, 0),
        'running', COALESCE(v_runs_running, 0)
      )
    ),
    'admin_settings', jsonb_build_object(
      'updated_at', v_admin_settings_updated_at
    )
  );
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.fn_gate_n_get_status_snapshot IS 
'Gate-N: Returns JSONB snapshot of system status (jobs, runs, admin_settings) for current tenant';

-- ============================================================================
-- 6) fn_gate_n_get_recent_job_runs (Bonus)
-- Returns recent job runs with job details
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_gate_n_get_recent_job_runs(
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  run_id UUID,
  job_key TEXT,
  job_type TEXT,
  status TEXT,
  trigger_source TEXT,
  triggered_by_user_id UUID,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get current tenant
  v_tenant_id := get_user_tenant_id(auth.uid());
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Check role (only tenant_admin or system_admin)
  IF NOT (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'system_admin')) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED: Only tenant_admin or system_admin can view job runs';
  END IF;
  
  -- Return recent job runs with job details
  RETURN QUERY
  SELECT 
    jr.id AS run_id,
    j.job_key,
    j.job_type,
    jr.status,
    jr.trigger_source,
    jr.triggered_by_user_id,
    jr.started_at,
    jr.finished_at,
    jr.duration_ms,
    jr.error_message
  FROM public.system_job_runs jr
  INNER JOIN public.system_jobs j ON jr.job_id = j.id
  WHERE jr.tenant_id = v_tenant_id
  ORDER BY jr.started_at DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.fn_gate_n_get_recent_job_runs IS 
'Gate-N: Returns recent job runs with job details (tenant_admin only)';

-- ============================================================================
-- End of Part 2.3 Migration
-- ============================================================================