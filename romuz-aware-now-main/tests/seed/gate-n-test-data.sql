-- ============================================================
-- Gate-N Test Data Seed Script
-- ============================================================
-- Purpose: Create test data for Gate-N testing (tenant, users, jobs, settings)
-- Usage: Run this script in Supabase SQL Editor or via psql
-- ============================================================

-- Clean up existing test data (optional - uncomment if needed)
-- DELETE FROM public.system_job_runs WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
-- DELETE FROM public.system_jobs WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
-- DELETE FROM public.admin_settings WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
-- DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%test@gate-n%');

-- ============================================================
-- 1. Create Test Tenant (if tenants table exists)
-- ============================================================
-- Note: Adjust this section based on your actual tenants table structure
-- If you don't have a tenants table, skip this section

-- INSERT INTO public.tenants (id, name, slug, created_at)
-- VALUES (
--   '00000000-0000-0000-0000-000000000001',
--   'Test Tenant - Gate-N',
--   'test-gate-n',
--   now()
-- )
-- ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Create Test Users
-- ============================================================
-- Note: These are UUID placeholders. In real scenario, users should be created via auth.users
-- For testing, we'll assume these user IDs exist or will be created manually

-- Test Admin User ID (replace with actual UUID from your test user)
-- User: admin-test@gate-n.local
-- Password: Test@123456 (set this via Supabase Auth UI)
DO $$
DECLARE
  v_admin_user_id UUID := 'bc32716f-3b0d-413d-9315-0c1b0b468f8f'; -- Replace with your test admin user ID
  v_tenant_id UUID := '00000000-0000-0000-0000-000000000000'; -- Replace with your test tenant ID
BEGIN
  -- ============================================================
  -- 3. Assign Role: admin
  -- ============================================================
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_admin_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- ============================================================
  -- 4. Create Admin Settings
  -- ============================================================
  INSERT INTO public.admin_settings (
    tenant_id,
    sla_config,
    feature_flags,
    limits,
    notification_channels,
    created_at,
    updated_at
  )
  VALUES (
    v_tenant_id,
    jsonb_build_object(
      'reminder_sla_hours', 48,
      'report_sla_days', 7,
      'escalation_sla_hours', 72
    ),
    jsonb_build_object(
      'enable_reports', true,
      'enable_kpis', true,
      'enable_alerts', true,
      'enable_ai_suggestions', false
    ),
    jsonb_build_object(
      'max_users', 100,
      'max_campaigns', 50,
      'max_concurrent_jobs', 5
    ),
    jsonb_build_object(
      'email', true,
      'sms', false,
      'slack', false,
      'webhook', false
    ),
    now(),
    now()
  )
  ON CONFLICT (tenant_id) 
  DO UPDATE SET
    sla_config = EXCLUDED.sla_config,
    feature_flags = EXCLUDED.feature_flags,
    limits = EXCLUDED.limits,
    notification_channels = EXCLUDED.notification_channels,
    updated_at = now();

  -- ============================================================
  -- 5. Create System Jobs
  -- ============================================================
  -- Job 1: Refresh KPIs (Cron Job)
  INSERT INTO public.system_jobs (
    tenant_id,
    job_key,
    job_type,
    gate_code,
    schedule_cron,
    is_enabled,
    description,
    metadata,
    created_at,
    updated_at
  )
  VALUES (
    v_tenant_id,
    'refresh_kpis',
    'cron',
    'gate_k',
    '0 0 * * *', -- Daily at midnight
    true,
    'Refresh KPI calculations for all org units',
    jsonb_build_object(
      'priority', 'high',
      'timeout_minutes', 30,
      'retry_count', 3
    ),
    now(),
    now()
  )
  ON CONFLICT (tenant_id, job_key) 
  DO UPDATE SET
    is_enabled = EXCLUDED.is_enabled,
    updated_at = now();

  -- Job 2: Generate Reports (Cron Job)
  INSERT INTO public.system_jobs (
    tenant_id,
    job_key,
    job_type,
    gate_code,
    schedule_cron,
    is_enabled,
    description,
    metadata,
    created_at,
    updated_at
  )
  VALUES (
    v_tenant_id,
    'generate_reports',
    'cron',
    'gate_f',
    '0 2 * * *', -- Daily at 2 AM
    true,
    'Generate scheduled reports for campaigns and awareness metrics',
    jsonb_build_object(
      'priority', 'medium',
      'timeout_minutes', 60,
      'retry_count', 2
    ),
    now(),
    now()
  )
  ON CONFLICT (tenant_id, job_key) 
  DO UPDATE SET
    is_enabled = EXCLUDED.is_enabled,
    updated_at = now();

  -- Job 3: Send Reminders (Cron Job)
  INSERT INTO public.system_jobs (
    tenant_id,
    job_key,
    job_type,
    gate_code,
    schedule_cron,
    is_enabled,
    description,
    metadata,
    created_at,
    updated_at
  )
  VALUES (
    v_tenant_id,
    'send_reminders',
    'cron',
    'gate_e',
    '0 9 * * *', -- Daily at 9 AM
    true,
    'Send reminder emails to participants with pending campaigns',
    jsonb_build_object(
      'priority', 'medium',
      'timeout_minutes', 15,
      'retry_count', 1
    ),
    now(),
    now()
  )
  ON CONFLICT (tenant_id, job_key) 
  DO UPDATE SET
    is_enabled = EXCLUDED.is_enabled,
    updated_at = now();

  -- Job 4: Validate Impact Scores (Manual Job)
  INSERT INTO public.system_jobs (
    tenant_id,
    job_key,
    job_type,
    gate_code,
    schedule_cron,
    is_enabled,
    description,
    metadata,
    created_at,
    updated_at
  )
  VALUES (
    v_tenant_id,
    'validate_impact_scores',
    'manual',
    'gate_j',
    NULL,
    true,
    'Run validation checks on awareness impact scores',
    jsonb_build_object(
      'priority', 'low',
      'timeout_minutes', 45,
      'retry_count', 2
    ),
    now(),
    now()
  )
  ON CONFLICT (tenant_id, job_key) 
  DO UPDATE SET
    is_enabled = EXCLUDED.is_enabled,
    updated_at = now();

  -- Job 5: Archive Old Campaigns (Cron Job)
  INSERT INTO public.system_jobs (
    tenant_id,
    job_key,
    job_type,
    gate_code,
    schedule_cron,
    is_enabled,
    description,
    metadata,
    created_at,
    updated_at
  )
  VALUES (
    v_tenant_id,
    'archive_old_campaigns',
    'cron',
    'gate_c',
    '0 3 1 * *', -- Monthly on 1st at 3 AM
    true,
    'Archive campaigns completed more than 90 days ago',
    jsonb_build_object(
      'priority', 'low',
      'timeout_minutes', 20,
      'retention_days', 90
    ),
    now(),
    now()
  )
  ON CONFLICT (tenant_id, job_key) 
  DO UPDATE SET
    is_enabled = EXCLUDED.is_enabled,
    updated_at = now();

  -- Job 6: Disabled Job (for testing)
  INSERT INTO public.system_jobs (
    tenant_id,
    job_key,
    job_type,
    gate_code,
    schedule_cron,
    is_enabled,
    description,
    metadata,
    created_at,
    updated_at
  )
  VALUES (
    v_tenant_id,
    'test_disabled_job',
    'manual',
    'gate_n',
    NULL,
    false,
    'Test job in disabled state',
    jsonb_build_object(
      'priority', 'low',
      'is_test', true
    ),
    now(),
    now()
  )
  ON CONFLICT (tenant_id, job_key) 
  DO UPDATE SET
    is_enabled = EXCLUDED.is_enabled,
    updated_at = now();

  -- ============================================================
  -- 6. Create Sample Job Runs (for testing history)
  -- ============================================================
  -- Successful run
  INSERT INTO public.system_job_runs (
    tenant_id,
    job_id,
    status,
    started_at,
    finished_at,
    duration_ms,
    trigger_type,
    triggered_by,
    result_summary,
    created_at
  )
  SELECT
    v_tenant_id,
    sj.id,
    'succeeded',
    now() - INTERVAL '2 hours',
    now() - INTERVAL '1 hour 55 minutes',
    300000, -- 5 minutes
    'scheduled',
    v_admin_user_id,
    jsonb_build_object(
      'records_processed', 150,
      'errors', 0,
      'warnings', 2
    ),
    now() - INTERVAL '2 hours'
  FROM public.system_jobs sj
  WHERE sj.tenant_id = v_tenant_id 
    AND sj.job_key = 'refresh_kpis'
  LIMIT 1;

  -- Failed run
  INSERT INTO public.system_job_runs (
    tenant_id,
    job_id,
    status,
    started_at,
    finished_at,
    duration_ms,
    trigger_type,
    triggered_by,
    error_code,
    error_message,
    created_at
  )
  SELECT
    v_tenant_id,
    sj.id,
    'failed',
    now() - INTERVAL '5 hours',
    now() - INTERVAL '4 hours 58 minutes',
    120000, -- 2 minutes
    'manual',
    v_admin_user_id,
    'DB_CONNECTION_ERROR',
    'Failed to connect to database: timeout after 30s',
    now() - INTERVAL '5 hours'
  FROM public.system_jobs sj
  WHERE sj.tenant_id = v_tenant_id 
    AND sj.job_key = 'generate_reports'
  LIMIT 1;

  -- Running job
  INSERT INTO public.system_job_runs (
    tenant_id,
    job_id,
    status,
    started_at,
    trigger_type,
    triggered_by,
    created_at
  )
  SELECT
    v_tenant_id,
    sj.id,
    'running',
    now() - INTERVAL '10 minutes',
    'scheduled',
    v_admin_user_id,
    now() - INTERVAL '10 minutes'
  FROM public.system_jobs sj
  WHERE sj.tenant_id = v_tenant_id 
    AND sj.job_key = 'send_reminders'
  LIMIT 1;

  RAISE NOTICE '✅ Gate-N test data seeded successfully!';
  RAISE NOTICE 'Tenant ID: %', v_tenant_id;
  RAISE NOTICE 'Admin User ID: %', v_admin_user_id;
END $$;

-- ============================================================
-- 7. Verification Queries
-- ============================================================
-- Uncomment these to verify the seeded data

-- SELECT 'Admin Settings' as type, COUNT(*) as count FROM public.admin_settings WHERE tenant_id = '00000000-0000-0000-0000-000000000000';
-- SELECT 'System Jobs' as type, COUNT(*) as count FROM public.system_jobs WHERE tenant_id = '00000000-0000-0000-0000-000000000000';
-- SELECT 'Job Runs' as type, COUNT(*) as count FROM public.system_job_runs WHERE tenant_id = '00000000-0000-0000-0000-000000000000';
-- SELECT 'User Roles' as type, COUNT(*) as count FROM public.user_roles WHERE user_id = 'bc32716f-3b0d-413d-9315-0c1b0b468f8f';

-- ============================================================
-- 8. Cleanup Script (use when needed)
-- ============================================================
/*
DO $$
DECLARE
  v_tenant_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  DELETE FROM public.system_job_runs WHERE tenant_id = v_tenant_id;
  DELETE FROM public.system_jobs WHERE tenant_id = v_tenant_id;
  DELETE FROM public.admin_settings WHERE tenant_id = v_tenant_id;
  RAISE NOTICE '🧹 Test data cleaned up successfully!';
END $$;
*/
