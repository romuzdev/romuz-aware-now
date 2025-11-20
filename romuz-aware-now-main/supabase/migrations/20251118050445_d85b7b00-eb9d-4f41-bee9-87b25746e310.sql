-- ============================================================================
-- M23 - Backup & Recovery System
-- Migration: Database Schema (Fixed)
-- Version: 1.1
-- Author: AI Assistant
-- Date: 2025-11-18
-- Fix: UUID type casting in RLS policies
-- ============================================================================

-- ============================================================================
-- Table: backup_jobs
-- Purpose: تتبع جميع عمليات النسخ الاحتياطي
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.backup_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- معلومات النسخة
  job_type TEXT NOT NULL CHECK (job_type IN ('full', 'incremental', 'snapshot')),
  backup_name TEXT NOT NULL,
  description TEXT,
  
  -- معلومات الحالة
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  
  -- معلومات التوقيت
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- معلومات الحجم والتخزين
  backup_size_bytes BIGINT DEFAULT 0,
  compressed_size_bytes BIGINT,
  storage_path TEXT,
  storage_bucket TEXT DEFAULT 'backups',
  
  -- معلومات إحصائية
  tables_count INTEGER DEFAULT 0,
  rows_count BIGINT DEFAULT 0,
  files_count INTEGER DEFAULT 0,
  
  -- معلومات الخطأ
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  
  -- معلومات إضافية
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Multi-tenant
  tenant_id UUID NOT NULL,
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Indexes for performance
CREATE INDEX idx_backup_jobs_tenant_id ON public.backup_jobs(tenant_id);
CREATE INDEX idx_backup_jobs_status ON public.backup_jobs(status);
CREATE INDEX idx_backup_jobs_job_type ON public.backup_jobs(job_type);
CREATE INDEX idx_backup_jobs_created_at ON public.backup_jobs(created_at DESC);
CREATE INDEX idx_backup_jobs_tenant_status ON public.backup_jobs(tenant_id, status);

-- ============================================================================
-- Table: backup_schedules
-- Purpose: جدولة النسخ الاحتياطي التلقائي
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.backup_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- معلومات الجدولة
  schedule_name TEXT NOT NULL,
  description TEXT,
  
  -- نوع النسخة
  job_type TEXT NOT NULL CHECK (job_type IN ('full', 'incremental', 'snapshot')),
  
  -- إعدادات Cron
  cron_expression TEXT NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  
  -- حالة الجدولة
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- معلومات آخر تنفيذ
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT,
  next_run_at TIMESTAMPTZ,
  
  -- Retention Policy
  retention_days INTEGER DEFAULT 30,
  max_backups_count INTEGER DEFAULT 10,
  
  -- إعدادات الإشعارات
  notify_on_success BOOLEAN DEFAULT false,
  notify_on_failure BOOLEAN DEFAULT true,
  notification_emails TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- معلومات إضافية
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Multi-tenant
  tenant_id UUID NOT NULL,
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  
  CONSTRAINT unique_schedule_name_per_tenant UNIQUE(tenant_id, schedule_name)
);

-- Indexes
CREATE INDEX idx_backup_schedules_tenant_id ON public.backup_schedules(tenant_id);
CREATE INDEX idx_backup_schedules_is_enabled ON public.backup_schedules(is_enabled);
CREATE INDEX idx_backup_schedules_next_run ON public.backup_schedules(next_run_at) WHERE is_enabled = true;

-- ============================================================================
-- Table: backup_restore_logs
-- Purpose: تتبع عمليات استعادة البيانات
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.backup_restore_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  backup_job_id UUID REFERENCES public.backup_jobs(id) ON DELETE SET NULL,
  
  restore_type TEXT NOT NULL CHECK (restore_type IN ('full', 'partial', 'point_in_time')),
  restore_point TIMESTAMPTZ,
  
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'rolled_back')),
  
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  tables_restored INTEGER DEFAULT 0,
  rows_restored BIGINT DEFAULT 0,
  
  error_message TEXT,
  error_details JSONB,
  
  rollback_executed BOOLEAN DEFAULT false,
  rollback_at TIMESTAMPTZ,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  
  tenant_id UUID NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  initiated_by UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_backup_restore_logs_tenant_id ON public.backup_restore_logs(tenant_id);
CREATE INDEX idx_backup_restore_logs_backup_job_id ON public.backup_restore_logs(backup_job_id);
CREATE INDEX idx_backup_restore_logs_status ON public.backup_restore_logs(status);
CREATE INDEX idx_backup_restore_logs_created_at ON public.backup_restore_logs(created_at DESC);

-- ============================================================================
-- RLS Policies - FIXED with proper UUID casting
-- ============================================================================

ALTER TABLE public.backup_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_restore_logs ENABLE ROW LEVEL SECURITY;

-- backup_jobs policies (FIXED)
CREATE POLICY "backup_jobs_tenant_isolation"
  ON public.backup_jobs
  FOR ALL
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "backup_jobs_select_policy"
  ON public.backup_jobs
  FOR SELECT
  USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
    AND (auth.jwt()->>'role' IN ('super_admin', 'tenant_admin'))
  );

CREATE POLICY "backup_jobs_insert_policy"
  ON public.backup_jobs
  FOR INSERT
  WITH CHECK (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
    AND (auth.jwt()->>'role' IN ('super_admin', 'tenant_admin'))
  );

CREATE POLICY "backup_jobs_update_policy"
  ON public.backup_jobs
  FOR UPDATE
  USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
    AND (auth.jwt()->>'role' IN ('super_admin', 'tenant_admin'))
  );

-- backup_schedules policies (FIXED)
CREATE POLICY "backup_schedules_tenant_isolation"
  ON public.backup_schedules
  FOR ALL
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "backup_schedules_select_policy"
  ON public.backup_schedules
  FOR SELECT
  USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
    AND (auth.jwt()->>'role' IN ('super_admin', 'tenant_admin'))
  );

CREATE POLICY "backup_schedules_manage_policy"
  ON public.backup_schedules
  FOR ALL
  USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
    AND (auth.jwt()->>'role' IN ('super_admin', 'tenant_admin'))
  );

-- backup_restore_logs policies (FIXED)
CREATE POLICY "backup_restore_logs_tenant_isolation"
  ON public.backup_restore_logs
  FOR ALL
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "backup_restore_logs_select_policy"
  ON public.backup_restore_logs
  FOR SELECT
  USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
    AND (auth.jwt()->>'role' IN ('super_admin', 'tenant_admin'))
  );

CREATE POLICY "backup_restore_logs_insert_policy"
  ON public.backup_restore_logs
  FOR INSERT
  WITH CHECK (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
    AND (auth.jwt()->>'role' IN ('super_admin', 'tenant_admin'))
  );

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_backup_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER backup_jobs_updated_at
  BEFORE UPDATE ON public.backup_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_backup_tables_updated_at();

CREATE TRIGGER backup_schedules_updated_at
  BEFORE UPDATE ON public.backup_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_backup_tables_updated_at();

-- ============================================================================
-- Helper Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_backup_statistics(p_tenant_id UUID)
RETURNS TABLE (
  total_backups BIGINT,
  successful_backups BIGINT,
  failed_backups BIGINT,
  total_size_bytes BIGINT,
  avg_duration_seconds NUMERIC,
  last_backup_at TIMESTAMPTZ,
  next_scheduled_backup TIMESTAMPTZ
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_backups,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as successful_backups,
    COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_backups,
    COALESCE(SUM(backup_size_bytes), 0)::BIGINT as total_size_bytes,
    COALESCE(AVG(duration_seconds), 0)::NUMERIC as avg_duration_seconds,
    MAX(completed_at) as last_backup_at,
    (SELECT MIN(next_run_at) FROM public.backup_schedules 
     WHERE tenant_id = p_tenant_id AND is_enabled = true) as next_scheduled_backup
  FROM public.backup_jobs
  WHERE tenant_id = p_tenant_id;
END;
$$;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.backup_jobs IS 'M23: تتبع جميع عمليات النسخ الاحتياطي للنظام';
COMMENT ON TABLE public.backup_schedules IS 'M23: جدولة النسخ الاحتياطي التلقائي';
COMMENT ON TABLE public.backup_restore_logs IS 'M23: سجل عمليات استعادة البيانات';
COMMENT ON COLUMN public.backup_jobs.job_type IS 'نوع النسخة: full | incremental | snapshot';
COMMENT ON COLUMN public.backup_schedules.cron_expression IS 'تعبير Cron للجدولة';
COMMENT ON COLUMN public.backup_schedules.retention_days IS 'عدد أيام الاحتفاظ بالنسخ';