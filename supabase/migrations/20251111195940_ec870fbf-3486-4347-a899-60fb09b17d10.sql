-- ============================================================================
-- Gate-N: Fix RLS Policies - Part 2.2
-- Correct RLS policies to use proper helper functions matching project patterns
-- ============================================================================

-- Drop existing incorrect policies for admin_settings
DROP POLICY IF EXISTS "Tenant admins can view their tenant settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Tenant admins can insert their tenant settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Tenant admins can update their tenant settings" ON public.admin_settings;

-- Drop existing incorrect policies for system_jobs
DROP POLICY IF EXISTS "Users can view jobs for their tenant or global jobs" ON public.system_jobs;
DROP POLICY IF EXISTS "Tenant admins can insert jobs for their tenant" ON public.system_jobs;
DROP POLICY IF EXISTS "Tenant admins can update jobs for their tenant" ON public.system_jobs;
DROP POLICY IF EXISTS "Tenant admins can delete jobs for their tenant" ON public.system_jobs;

-- Drop existing incorrect policies for system_job_runs
DROP POLICY IF EXISTS "Users can view job runs for their tenant" ON public.system_job_runs;
DROP POLICY IF EXISTS "System can insert job runs" ON public.system_job_runs;
DROP POLICY IF EXISTS "System can update job runs for their tenant" ON public.system_job_runs;

-- ============================================================================
-- 1) admin_settings - Corrected RLS Policies
-- ============================================================================

-- SELECT: Tenant admins can view their own tenant settings
CREATE POLICY "admin_settings_select_policy"
  ON public.admin_settings
  FOR SELECT
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND has_role(auth.uid(), 'tenant_admin')
  );

-- INSERT: Tenant admins can create settings for their tenant
CREATE POLICY "admin_settings_insert_policy"
  ON public.admin_settings
  FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    AND has_role(auth.uid(), 'tenant_admin')
    AND auth.uid() IS NOT NULL
  );

-- UPDATE: Tenant admins can update settings for their tenant
CREATE POLICY "admin_settings_update_policy"
  ON public.admin_settings
  FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND has_role(auth.uid(), 'tenant_admin')
  )
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    AND has_role(auth.uid(), 'tenant_admin')
  );

-- DELETE: Tenant admins can delete settings for their tenant
CREATE POLICY "admin_settings_delete_policy"
  ON public.admin_settings
  FOR DELETE
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND has_role(auth.uid(), 'tenant_admin')
  );

-- ============================================================================
-- 2) system_jobs - Corrected RLS Policies
-- ============================================================================

-- SELECT: Users can view global jobs (tenant_id IS NULL) or jobs for their tenant
CREATE POLICY "system_jobs_select_policy"
  ON public.system_jobs
  FOR SELECT
  USING (
    tenant_id IS NULL 
    OR tenant_id = get_user_tenant_id(auth.uid())
  );

-- INSERT: Only tenant admins can create jobs for their tenant
CREATE POLICY "system_jobs_insert_policy"
  ON public.system_jobs
  FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    AND has_role(auth.uid(), 'tenant_admin')
    AND auth.uid() IS NOT NULL
  );

-- UPDATE: Only tenant admins can update jobs for their tenant
CREATE POLICY "system_jobs_update_policy"
  ON public.system_jobs
  FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND has_role(auth.uid(), 'tenant_admin')
  )
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    AND has_role(auth.uid(), 'tenant_admin')
  );

-- DELETE: Only tenant admins can delete jobs for their tenant
CREATE POLICY "system_jobs_delete_policy"
  ON public.system_jobs
  FOR DELETE
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND has_role(auth.uid(), 'tenant_admin')
  );

-- ============================================================================
-- 3) system_job_runs - Corrected RLS Policies
-- ============================================================================

-- SELECT: All authenticated users can view job runs for their tenant
-- (tenant_admin, manager, viewer - all need visibility into system health)
CREATE POLICY "system_job_runs_select_policy"
  ON public.system_job_runs
  FOR SELECT
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
  );

-- INSERT: System/service can insert job runs, or tenant admins for manual triggers
-- This allows both automated jobs and manual user-triggered runs
CREATE POLICY "system_job_runs_insert_policy"
  ON public.system_job_runs
  FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    AND auth.uid() IS NOT NULL
    AND (
      -- Manual trigger by tenant admin
      (trigger_source = 'manual' AND has_role(auth.uid(), 'tenant_admin'))
      -- System/API triggers (authenticated service calls)
      OR trigger_source IN ('system', 'api')
    )
  );

-- UPDATE: System can update job run status/results
-- Only allow updating for the same tenant, maintain audit trail
CREATE POLICY "system_job_runs_update_policy"
  ON public.system_job_runs
  FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
  )
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
  );

-- No DELETE policy - job run history is immutable for audit purposes

-- ============================================================================
-- 4) Add comments for documentation
-- ============================================================================

COMMENT ON POLICY "admin_settings_select_policy" ON public.admin_settings IS 
  'Gate-N: Tenant admins can view their tenant admin configuration';

COMMENT ON POLICY "system_jobs_select_policy" ON public.system_jobs IS 
  'Gate-N: Users can view global job templates and jobs for their tenant';

COMMENT ON POLICY "system_job_runs_select_policy" ON public.system_job_runs IS 
  'Gate-N: All tenant users can view job execution history for monitoring and troubleshooting';