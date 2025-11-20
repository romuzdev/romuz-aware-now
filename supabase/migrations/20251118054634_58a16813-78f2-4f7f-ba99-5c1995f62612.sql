set search_path = public;

-- ==============================
-- تنظيف وتوحيد سياسات RLS لجداول النسخ الاحتياطي
-- ==============================

-- حذف جميع السياسات القديمة المتضاربة
DROP POLICY IF EXISTS "backup_jobs_select_policy" ON backup_jobs;
DROP POLICY IF EXISTS "backup_jobs_insert_policy" ON backup_jobs;
DROP POLICY IF EXISTS "backup_jobs_update_policy" ON backup_jobs;
DROP POLICY IF EXISTS "backup_jobs_tenant_isolation" ON backup_jobs;

DROP POLICY IF EXISTS "backup_schedules_select_policy" ON backup_schedules;
DROP POLICY IF EXISTS "backup_schedules_manage_policy" ON backup_schedules;
DROP POLICY IF EXISTS "backup_schedules_tenant_isolation" ON backup_schedules;

DROP POLICY IF EXISTS "backup_restore_logs_select_policy" ON backup_restore_logs;
DROP POLICY IF EXISTS "backup_restore_logs_insert_policy" ON backup_restore_logs;
DROP POLICY IF EXISTS "backup_restore_logs_tenant_isolation" ON backup_restore_logs;

-- ==============================
-- backup_jobs policies
-- ==============================

-- SELECT: Users can view their tenant's backups
CREATE POLICY "backup_jobs_users_view"
  ON backup_jobs FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

-- INSERT: Tenant admins can create backups
CREATE POLICY "backup_jobs_admin_create"
  ON backup_jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT ut.tenant_id 
      FROM user_tenants ut
      JOIN user_roles ur ON ut.user_id = ur.user_id
      WHERE ut.user_id = auth.uid()
        AND ur.role IN ('tenant_admin', 'platform_admin')
    )
  );

-- UPDATE: System only (edge functions)
CREATE POLICY "backup_jobs_system_update"
  ON backup_jobs FOR UPDATE
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()));

-- DELETE: Tenant admins can delete backups
CREATE POLICY "backup_jobs_admin_delete"
  ON backup_jobs FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT ut.tenant_id 
      FROM user_tenants ut
      JOIN user_roles ur ON ut.user_id = ur.user_id
      WHERE ut.user_id = auth.uid()
        AND ur.role IN ('tenant_admin', 'platform_admin')
    )
  );

-- ==============================
-- backup_schedules policies
-- ==============================

-- SELECT: Users can view their tenant's schedules
CREATE POLICY "backup_schedules_users_view"
  ON backup_schedules FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

-- INSERT: Tenant admins can create schedules
CREATE POLICY "backup_schedules_admin_create"
  ON backup_schedules FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT ut.tenant_id 
      FROM user_tenants ut
      JOIN user_roles ur ON ut.user_id = ur.user_id
      WHERE ut.user_id = auth.uid()
        AND ur.role IN ('tenant_admin', 'platform_admin')
    )
  );

-- UPDATE: Tenant admins can update schedules
CREATE POLICY "backup_schedules_admin_update"
  ON backup_schedules FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT ut.tenant_id 
      FROM user_tenants ut
      JOIN user_roles ur ON ut.user_id = ur.user_id
      WHERE ut.user_id = auth.uid()
        AND ur.role IN ('tenant_admin', 'platform_admin')
    )
  );

-- DELETE: Tenant admins can delete schedules
CREATE POLICY "backup_schedules_admin_delete"
  ON backup_schedules FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT ut.tenant_id 
      FROM user_tenants ut
      JOIN user_roles ur ON ut.user_id = ur.user_id
      WHERE ut.user_id = auth.uid()
        AND ur.role IN ('tenant_admin', 'platform_admin')
    )
  );

-- ==============================
-- backup_restore_logs policies
-- ==============================

-- SELECT: Users can view their tenant's restore logs
CREATE POLICY "backup_restore_logs_users_view"
  ON backup_restore_logs FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

-- INSERT: System only (edge functions)
CREATE POLICY "backup_restore_logs_system_create"
  ON backup_restore_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

-- UPDATE: System only (edge functions)
CREATE POLICY "backup_restore_logs_system_update"
  ON backup_restore_logs FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );
