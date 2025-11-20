-- ============================================================================
-- M23 - Security Fix Part 3A: RLS Policies (Group 1 - DR Plans & Health)
-- ============================================================================

-- backup_disaster_recovery_plans policies
CREATE POLICY "tenant_select_dr_plans" ON public.backup_disaster_recovery_plans
FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant_insert_dr_plans" ON public.backup_disaster_recovery_plans
FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant_update_dr_plans" ON public.backup_disaster_recovery_plans
FOR UPDATE
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant_delete_dr_plans" ON public.backup_disaster_recovery_plans
FOR DELETE
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- backup_health_monitoring policies
CREATE POLICY "tenant_select_health" ON public.backup_health_monitoring
FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "tenant_insert_health" ON public.backup_health_monitoring
FOR INSERT
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));
