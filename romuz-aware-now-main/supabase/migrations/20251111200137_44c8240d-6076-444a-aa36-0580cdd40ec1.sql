-- ============================================================================
-- Gate-N: Fix system_job_runs SELECT Policy - Part 2.2 Correction
-- Restrict SELECT to tenant_admin only as per requirements
-- ============================================================================

-- Drop the incorrect SELECT policy that allows all users
DROP POLICY IF EXISTS "system_job_runs_select_policy" ON public.system_job_runs;

-- CREATE: Corrected SELECT policy - only tenant_admin can view job runs
CREATE POLICY "system_job_runs_select_policy"
  ON public.system_job_runs
  FOR SELECT
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND has_role(auth.uid(), 'tenant_admin')
  );

-- Update comment to reflect correct access control
COMMENT ON POLICY "system_job_runs_select_policy" ON public.system_job_runs IS 
  'Gate-N: Only tenant admins can view job execution history for their tenant';