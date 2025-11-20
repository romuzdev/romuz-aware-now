-- ============================================================================
-- M23 - Security Fix Part 3C: RLS Policies (Group 3 - Logs & Schedules)
-- ============================================================================

-- backup_restore_logs policies
CREATE POLICY "tenant_select_restore_logs" ON public.backup_restore_logs
FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant_insert_restore_logs" ON public.backup_restore_logs
FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant_update_restore_logs" ON public.backup_restore_logs
FOR UPDATE
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- backup_schedules policies
CREATE POLICY "tenant_select_schedules" ON public.backup_schedules
FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant_insert_schedules" ON public.backup_schedules
FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant_update_schedules" ON public.backup_schedules
FOR UPDATE
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant_delete_schedules" ON public.backup_schedules
FOR DELETE
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- backup_transaction_logs policies
CREATE POLICY "tenant_select_transaction_logs" ON public.backup_transaction_logs
FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant_insert_transaction_logs" ON public.backup_transaction_logs
FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));
