-- Add missing columns to system_jobs table to match RPC function expectations

-- Add job_type column (type of job: 'scheduled', 'manual', 'event-driven')
ALTER TABLE public.system_jobs
ADD COLUMN IF NOT EXISTS job_type TEXT DEFAULT 'scheduled';

-- Rename default_cron to schedule_cron for consistency
ALTER TABLE public.system_jobs
RENAME COLUMN default_cron TO schedule_cron;

-- Add config column for job-specific configuration
ALTER TABLE public.system_jobs
ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;

-- Add last_run_at column to track when job last ran
ALTER TABLE public.system_jobs
ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ;

-- Add last_run_status column to track last execution result
ALTER TABLE public.system_jobs
ADD COLUMN IF NOT EXISTS last_run_status TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.system_jobs.job_type IS 'Type of job: scheduled, manual, event-driven';
COMMENT ON COLUMN public.system_jobs.schedule_cron IS 'Cron expression for scheduled jobs';
COMMENT ON COLUMN public.system_jobs.config IS 'Job-specific configuration as JSON';
COMMENT ON COLUMN public.system_jobs.last_run_at IS 'Timestamp of last job execution';
COMMENT ON COLUMN public.system_jobs.last_run_status IS 'Status of last execution: succeeded, failed, running';

-- Update existing rows to have proper job_type based on gate_code
UPDATE public.system_jobs
SET job_type = CASE
  WHEN gate_code = 'Gate-N' THEN 'scheduled'
  ELSE 'scheduled'
END
WHERE job_type IS NULL;