-- Update fn_gate_n_get_status_snapshot to include KPI and Reports summaries
-- This extends the status snapshot with Gate-F and Gate-K integration data

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
  
  -- Get KPI summary (Gate-K integration)
  -- Count active campaigns
  SELECT COUNT(*) INTO v_campaigns_active
  FROM public.awareness_campaigns
  WHERE tenant_id = v_tenant_id
    AND status = 'active'
    AND start_date <= CURRENT_DATE
    AND (end_date IS NULL OR end_date >= CURRENT_DATE);
  
  -- Get last KPI snapshot timestamp (from kpi_catalog or similar)
  SELECT MAX(updated_at) INTO v_last_kpi_snapshot
  FROM public.kpi_catalog
  WHERE tenant_id = v_tenant_id;
  
  -- Calculate average score (example: from awareness_impact_scores or quiz results)
  SELECT AVG(score) INTO v_score_avg
  FROM public.awareness_impact_scores
  WHERE tenant_id = v_tenant_id
    AND score_date >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Build KPI summary object
  v_kpi_summary := jsonb_build_object(
    'campaigns_active', COALESCE(v_campaigns_active, 0),
    'last_kpi_snapshot_at', v_last_kpi_snapshot,
    'score_avg', ROUND(COALESCE(v_score_avg, 0), 1)
  );
  
  -- Get Reports summary (Gate-F integration)
  -- Last report generated (could be from a reports table if exists)
  -- For now, using a placeholder or checking system_job_runs for report generation jobs
  SELECT MAX(finished_at) INTO v_last_report_generated
  FROM public.system_job_runs sjr
  JOIN public.system_jobs sj ON sjr.job_id = sj.id
  WHERE sjr.tenant_id = v_tenant_id
    AND sj.job_key LIKE '%report%'
    AND sjr.status = 'succeeded';
  
  -- Count reports in last 7 days
  SELECT COUNT(*) INTO v_reports_last_7d
  FROM public.system_job_runs sjr
  JOIN public.system_jobs sj ON sjr.job_id = sj.id
  WHERE sjr.tenant_id = v_tenant_id
    AND sj.job_key LIKE '%report%'
    AND sjr.status = 'succeeded'
    AND sjr.finished_at >= now() - INTERVAL '7 days';
  
  -- Build Reports summary object
  v_reports_summary := jsonb_build_object(
    'last_report_generated_at', v_last_report_generated,
    'reports_last_7d', COALESCE(v_reports_last_7d, 0)
  );
  
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