-- Fix: Add all required fields including gate_code

-- 1. Add unique constraint to system_jobs.job_key if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'system_jobs_job_key_key'
    ) THEN
        ALTER TABLE public.system_jobs 
        ADD CONSTRAINT system_jobs_job_key_key UNIQUE (job_key);
    END IF;
END $$;

-- 2. Insert/update the scheduled transitions job with all required fields
INSERT INTO public.system_jobs (
  tenant_id,
  job_key,
  job_type,
  display_name,
  gate_code,
  schedule_cron,
  is_enabled,
  config
)
VALUES (
  NULL,  -- Global job
  'process_scheduled_transitions',
  'cron',
  'Process Scheduled Transitions',
  'GATE_P',  -- Gate-P system job
  '0 * * * *',  -- Every hour at minute 0
  true,
  jsonb_build_object(
    'description', 'Process pending scheduled tenant transitions',
    'function', 'fn_process_scheduled_transitions'
  )
)
ON CONFLICT (job_key) DO UPDATE
SET schedule_cron = EXCLUDED.schedule_cron,
    is_enabled = EXCLUDED.is_enabled,
    display_name = EXCLUDED.display_name,
    gate_code = EXCLUDED.gate_code,
    config = EXCLUDED.config,
    updated_at = now();