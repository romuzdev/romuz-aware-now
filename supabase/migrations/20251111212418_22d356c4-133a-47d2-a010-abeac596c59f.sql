-- Fix fn_gate_n_get_status_snapshot to handle missing Gate-K/Gate-F tables gracefully
-- Make KPI and Reports summary optional if tables don't exist yet

CREATE OR REPLACE FUNCTION public.fn_gate_n_get_status_snapshot()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant_id UUID;
  v_result JSONB;
  v_jobs_total INTEGER;
  v_jobs_enabled INTEGER;
  v_runs_succeeded INTEGER;
  v_runs_failed INTEGER;
  v_runs_running INTEGER;
  v_admin_settings_updated_at TIMESTAMPTZ;
  v_kpi_summary JSONB;
  v_reports_summary JSONB;
  v_campaigns_active INTEGER;
  v_last_kpi_snapshot TIMESTAMPTZ;
  v_score_avg NUMERIC;
  v_last_report_generated TIMESTAMPTZ;
  v_reports_last_7d INTEGER;
  v_table_exists BOOLEAN;
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
  
  -- Initialize KPI summary (will be populated if tables exist)
  v_kpi_summary := jsonb_build_object(
    'campaigns_active', 0,
    'last_kpi_snapshot_at', NULL,
    'score_avg', NULL
  );
  
  -- Try to get KPI data if awareness_campaigns table exists
  BEGIN
    SELECT COUNT(*) INTO v_campaigns_active
    FROM public.awareness_campaigns
    WHERE tenant_id = v_tenant_id
      AND status = 'active'
      AND start_date <= CURRENT_DATE
      AND (end_date IS NULL OR end_date >= CURRENT_DATE);
    
    v_kpi_summary := jsonb_build_object(
      'campaigns_active', COALESCE(v_campaigns_active, 0),
      'last_kpi_snapshot_at', NULL,
      'score_avg', NULL
    );
  EXCEPTION
    WHEN undefined_table THEN
      -- Table doesn't exist yet, keep defaults
      NULL;
  END;
  
  -- Try to get last KPI snapshot if kpi_catalog exists
  BEGIN
    SELECT MAX(updated_at) INTO v_last_kpi_snapshot
    FROM public.kpi_catalog
    WHERE tenant_id = v_tenant_id;
    
    v_kpi_summary := v_kpi_summary || jsonb_build_object(
      'last_kpi_snapshot_at', v_last_kpi_snapshot
    );
  EXCEPTION
    WHEN undefined_table THEN
      NULL;
  END;
  
  -- Initialize Reports summary
  v_reports_summary := jsonb_build_object(
    'last_report_generated_at', NULL,
    'reports_last_7d', 0
  );
  
  -- Get Reports summary from system_job_runs (report-related jobs)
  BEGIN
    SELECT MAX(finished_at) INTO v_last_report_generated
    FROM public.system_job_runs sjr
    JOIN public.system_jobs sj ON sjr.job_id = sj.id
    WHERE sjr.tenant_id = v_tenant_id
      AND sj.job_key LIKE '%report%'
      AND sjr.status = 'succeeded';
    
    SELECT COUNT(*) INTO v_reports_last_7d
    FROM public.system_job_runs sjr
    JOIN public.system_jobs sj ON sjr.job_id = sj.id
    WHERE sjr.tenant_id = v_tenant_id
      AND sj.job_key LIKE '%report%'
      AND sjr.status = 'succeeded'
      AND sjr.finished_at >= now() - INTERVAL '7 days';
    
    v_reports_summary := jsonb_build_object(
      'last_report_generated_at', v_last_report_generated,
      'reports_last_7d', COALESCE(v_reports_last_7d, 0)
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Keep defaults if query fails
      NULL;
  END;
  
  -- Build final JSON result
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
    ),
    'kpi_summary', v_kpi_summary,
    'reports_summary', v_reports_summary
  );
  
  RETURN v_result;
END;
$function$;