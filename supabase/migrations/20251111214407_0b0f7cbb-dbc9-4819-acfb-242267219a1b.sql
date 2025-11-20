-- Fix fn_gate_n_list_system_jobs to accept tenant_id parameter
-- This resolves TENANT_REQUIRED error when called from Edge Functions

CREATE OR REPLACE FUNCTION public.fn_gate_n_list_system_jobs(p_tenant_id UUID DEFAULT NULL)
 RETURNS TABLE(
   id uuid,
   tenant_id uuid,
   job_key text,
   job_type text,
   schedule_cron text,
   is_enabled boolean,
   config jsonb,
   last_run_at timestamp with time zone,
   last_run_status text,
   created_at timestamp with time zone,
   updated_at timestamp with time zone
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Use provided tenant_id or get from current auth context
  v_tenant_id := COALESCE(p_tenant_id, get_user_tenant_id(auth.uid()));
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Return global jobs + tenant-specific jobs
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
$function$;