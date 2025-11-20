-- ============================================================================
-- M23 - Security Fix Part 4: Revoke Anon Access & Add Performance Indexes
-- ============================================================================

-- REVOKE Anonymous Access (Critical Security Fix)
REVOKE ALL ON public.backup_disaster_recovery_plans FROM anon;
REVOKE ALL ON public.backup_health_monitoring FROM anon;
REVOKE ALL ON public.backup_jobs FROM anon;
REVOKE ALL ON public.backup_recovery_tests FROM anon;
REVOKE ALL ON public.backup_restore_logs FROM anon;
REVOKE ALL ON public.backup_schedules FROM anon;
REVOKE ALL ON public.backup_transaction_logs FROM anon;

-- Grant to authenticated users only (RLS enforces tenant isolation)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.backup_disaster_recovery_plans TO authenticated;
GRANT SELECT, INSERT ON public.backup_health_monitoring TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.backup_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.backup_recovery_tests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.backup_restore_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.backup_schedules TO authenticated;
GRANT SELECT, INSERT ON public.backup_transaction_logs TO authenticated;

-- Add Performance Indexes (RLS Policy Optimization)
CREATE INDEX IF NOT EXISTS idx_backup_dr_plans_tenant ON public.backup_disaster_recovery_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_backup_health_tenant ON public.backup_health_monitoring(tenant_id);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_tenant ON public.backup_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_backup_recovery_tests_tenant ON public.backup_recovery_tests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_backup_restore_logs_tenant ON public.backup_restore_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_backup_schedules_tenant ON public.backup_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_backup_transaction_logs_tenant ON public.backup_transaction_logs(tenant_id);

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_backup_jobs_tenant_status ON public.backup_jobs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_tenant_created ON public.backup_jobs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_schedules_tenant_enabled ON public.backup_schedules(tenant_id, is_enabled);
