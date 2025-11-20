-- ============================================================================
-- M23 - Security Fix Part 2: Enable RLS on All Backup Tables
-- ============================================================================

ALTER TABLE public.backup_disaster_recovery_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_health_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_recovery_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_restore_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_transaction_logs ENABLE ROW LEVEL SECURITY;
