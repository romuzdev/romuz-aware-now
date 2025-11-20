-- ============================================================================
-- M23 - Backup & Recovery System
-- Fix: إضافة Triggers للـ updated_at (مفقودة)
-- ============================================================================

-- إنشاء أو استبدال الـ Trigger Function (إذا لم تكن موجودة)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- حذف الـ Triggers القديمة إذا كانت موجودة
DROP TRIGGER IF EXISTS backup_jobs_updated_at ON public.backup_jobs;
DROP TRIGGER IF EXISTS backup_schedules_updated_at ON public.backup_schedules;

-- إنشاء Trigger لـ backup_jobs
CREATE TRIGGER backup_jobs_updated_at
  BEFORE UPDATE ON public.backup_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- إنشاء Trigger لـ backup_schedules
CREATE TRIGGER backup_schedules_updated_at
  BEFORE UPDATE ON public.backup_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- تعليقات
COMMENT ON FUNCTION public.handle_updated_at IS 'M23: تحديث تلقائي لحقل updated_at عند التعديل';
COMMENT ON TRIGGER backup_jobs_updated_at ON public.backup_jobs IS 'M23: تحديث updated_at تلقائياً';
COMMENT ON TRIGGER backup_schedules_updated_at ON public.backup_schedules IS 'M23: تحديث updated_at تلقائياً';
