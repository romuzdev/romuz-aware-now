-- ============================================================================
-- M23 - Security Fix Part 3B: RLS Policies (Group 2 - Jobs & Tests)
-- ============================================================================

-- backup_jobs policies
CREATE POLICY "tenant_select_jobs" ON public.backup_jobs
FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant_insert_jobs" ON public.backup_jobs
FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant_update_jobs" ON public.backup_jobs
FOR UPDATE
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant_delete_jobs" ON public.backup_jobs
FOR DELETE
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- backup_recovery_tests policies
CREATE POLICY "tenant_select_recovery_tests" ON public.backup_recovery_tests
FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant_insert_recovery_tests" ON public.backup_recovery_tests
FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant_update_recovery_tests" ON public.backup_recovery_tests
FOR UPDATE
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant_delete_recovery_tests" ON public.backup_recovery_tests
FOR DELETE
USING (tenant_id = public.get_user_tenant_id(auth.uid()));
