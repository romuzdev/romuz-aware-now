/**
 * Test Data Seeding Helper for Gate-N
 * Provides TypeScript functions to seed test data programmatically
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Test configuration
export const TEST_CONFIG = {
  TENANT_ID: '00000000-0000-0000-0000-000000000000',
  ADMIN_USER_ID: 'bc32716f-3b0d-413d-9315-0c1b0b468f8f',
  TEST_EMAIL: 'admin-test@gate-n.local',
};

/**
 * Create a Supabase client for testing
 * Uses environment variables from .env.test or process.env
 */
export function createTestSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.E2E_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.E2E_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase credentials. Set E2E_SUPABASE_URL and E2E_SUPABASE_ANON_KEY in environment.'
    );
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Seed admin settings for test tenant
 */
export async function seedAdminSettings(supabase: SupabaseClient, tenantId: string = TEST_CONFIG.TENANT_ID) {
  const { error } = await supabase
    .from('admin_settings')
    .upsert({
      tenant_id: tenantId,
      sla_config: {
        reminder_sla_hours: 48,
        report_sla_days: 7,
        escalation_sla_hours: 72,
      },
      feature_flags: {
        enable_reports: true,
        enable_kpis: true,
        enable_alerts: true,
        enable_ai_suggestions: false,
      },
      limits: {
        max_users: 100,
        max_campaigns: 50,
        max_concurrent_jobs: 5,
      },
      notification_channels: {
        email: true,
        sms: false,
        slack: false,
        webhook: false,
      },
    }, { onConflict: 'tenant_id' });

  if (error) throw error;
  console.log('✅ Admin settings seeded');
}

/**
 * Seed system jobs for test tenant
 */
export async function seedSystemJobs(supabase: SupabaseClient, tenantId: string = TEST_CONFIG.TENANT_ID) {
  const jobs = [
    {
      tenant_id: tenantId,
      job_key: 'refresh_kpis',
      job_type: 'cron',
      gate_code: 'gate_k',
      schedule_cron: '0 0 * * *',
      is_enabled: true,
      description: 'Refresh KPI calculations for all org units',
      metadata: {
        priority: 'high',
        timeout_minutes: 30,
        retry_count: 3,
      },
    },
    {
      tenant_id: tenantId,
      job_key: 'generate_reports',
      job_type: 'cron',
      gate_code: 'gate_f',
      schedule_cron: '0 2 * * *',
      is_enabled: true,
      description: 'Generate scheduled reports for campaigns and awareness metrics',
      metadata: {
        priority: 'medium',
        timeout_minutes: 60,
        retry_count: 2,
      },
    },
    {
      tenant_id: tenantId,
      job_key: 'send_reminders',
      job_type: 'cron',
      gate_code: 'gate_e',
      schedule_cron: '0 9 * * *',
      is_enabled: true,
      description: 'Send reminder emails to participants with pending campaigns',
      metadata: {
        priority: 'medium',
        timeout_minutes: 15,
        retry_count: 1,
      },
    },
    {
      tenant_id: tenantId,
      job_key: 'validate_impact_scores',
      job_type: 'manual',
      gate_code: 'gate_j',
      schedule_cron: null,
      is_enabled: true,
      description: 'Run validation checks on awareness impact scores',
      metadata: {
        priority: 'low',
        timeout_minutes: 45,
        retry_count: 2,
      },
    },
    {
      tenant_id: tenantId,
      job_key: 'test_disabled_job',
      job_type: 'manual',
      gate_code: 'gate_n',
      schedule_cron: null,
      is_enabled: false,
      description: 'Test job in disabled state',
      metadata: {
        priority: 'low',
        is_test: true,
      },
    },
  ];

  for (const job of jobs) {
    const { error } = await supabase
      .from('system_jobs')
      .upsert(job, { onConflict: 'tenant_id,job_key' });

    if (error) throw error;
  }

  console.log(`✅ ${jobs.length} system jobs seeded`);
}

/**
 * Seed user role (admin)
 */
export async function seedUserRole(
  supabase: SupabaseClient,
  userId: string = TEST_CONFIG.ADMIN_USER_ID,
  role: string = 'admin'
) {
  const { error } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role }, { onConflict: 'user_id,role' });

  if (error) throw error;
  console.log(`✅ User role '${role}' assigned to ${userId}`);
}

/**
 * Seed sample job runs (for testing history/status)
 */
export async function seedJobRuns(supabase: SupabaseClient, tenantId: string = TEST_CONFIG.TENANT_ID) {
  // First, get job IDs
  const { data: jobs, error: jobsError } = await supabase
    .from('system_jobs')
    .select('id, job_key')
    .eq('tenant_id', tenantId);

  if (jobsError) throw jobsError;
  if (!jobs || jobs.length === 0) {
    console.warn('⚠️ No jobs found to create job runs');
    return;
  }

  const kpiJob = jobs.find(j => j.job_key === 'refresh_kpis');
  const reportJob = jobs.find(j => j.job_key === 'generate_reports');
  const reminderJob = jobs.find(j => j.job_key === 'send_reminders');

  const runs = [];

  // Succeeded run
  if (kpiJob) {
    runs.push({
      tenant_id: tenantId,
      job_id: kpiJob.id,
      status: 'succeeded',
      started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      finished_at: new Date(Date.now() - 1.92 * 60 * 60 * 1000).toISOString(),
      duration_ms: 300000,
      trigger_type: 'scheduled',
      triggered_by: TEST_CONFIG.ADMIN_USER_ID,
      result_summary: {
        records_processed: 150,
        errors: 0,
        warnings: 2,
      },
    });
  }

  // Failed run
  if (reportJob) {
    runs.push({
      tenant_id: tenantId,
      job_id: reportJob.id,
      status: 'failed',
      started_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      finished_at: new Date(Date.now() - 4.97 * 60 * 60 * 1000).toISOString(),
      duration_ms: 120000,
      trigger_type: 'manual',
      triggered_by: TEST_CONFIG.ADMIN_USER_ID,
      error_code: 'DB_CONNECTION_ERROR',
      error_message: 'Failed to connect to database: timeout after 30s',
    });
  }

  // Running job
  if (reminderJob) {
    runs.push({
      tenant_id: tenantId,
      job_id: reminderJob.id,
      status: 'running',
      started_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      trigger_type: 'scheduled',
      triggered_by: TEST_CONFIG.ADMIN_USER_ID,
    });
  }

  for (const run of runs) {
    const { error } = await supabase.from('system_job_runs').insert(run);
    if (error) {
      console.warn('⚠️ Failed to insert job run:', error.message);
    }
  }

  console.log(`✅ ${runs.length} job runs seeded`);
}

/**
 * Clean up all test data
 */
export async function cleanupTestData(supabase: SupabaseClient, tenantId: string = TEST_CONFIG.TENANT_ID) {
  // Delete in correct order (respecting foreign keys)
  await supabase.from('system_job_runs').delete().eq('tenant_id', tenantId);
  await supabase.from('system_jobs').delete().eq('tenant_id', tenantId);
  await supabase.from('admin_settings').delete().eq('tenant_id', tenantId);
  
  console.log('🧹 Test data cleaned up');
}

/**
 * Seed all Gate-N test data
 */
export async function seedAllGateNData(supabase: SupabaseClient, tenantId: string = TEST_CONFIG.TENANT_ID) {
  console.log('🌱 Seeding Gate-N test data...');
  
  try {
    await seedUserRole(supabase);
    await seedAdminSettings(supabase, tenantId);
    await seedSystemJobs(supabase, tenantId);
    await seedJobRuns(supabase, tenantId);
    
    console.log('✅ All Gate-N test data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  }
}

/**
 * Verify test data exists
 */
export async function verifyTestData(supabase: SupabaseClient, tenantId: string = TEST_CONFIG.TENANT_ID) {
  const results = {
    admin_settings: 0,
    system_jobs: 0,
    system_job_runs: 0,
    user_roles: 0,
  };

  const { count: settingsCount } = await supabase
    .from('admin_settings')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);
  results.admin_settings = settingsCount || 0;

  const { count: jobsCount } = await supabase
    .from('system_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);
  results.system_jobs = jobsCount || 0;

  const { count: runsCount } = await supabase
    .from('system_job_runs')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);
  results.system_job_runs = runsCount || 0;

  const { count: rolesCount } = await supabase
    .from('user_roles')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', TEST_CONFIG.ADMIN_USER_ID);
  results.user_roles = rolesCount || 0;

  console.log('📊 Test data verification:', results);
  return results;
}
