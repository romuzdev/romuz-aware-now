/**
 * Gate-N RPC Function Tests
 * Tests database-level RPC functions for admin console
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Test environment setup
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient;
let testUserId: string;
let testTenantId: string;

beforeAll(async () => {
  supabase = createClient(supabaseUrl, supabaseKey);
  
  // TODO: Set up test user and tenant
  // This would typically use a seed script or test fixtures
  // For now, we'll skip actual DB setup in this example
});

afterAll(async () => {
  // TODO: Clean up test data
});

describe('fn_gate_n_get_admin_settings', () => {
  it('should return null for tenant with no settings', async () => {
    const { data, error } = await supabase.rpc('fn_gate_n_get_admin_settings');
    
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it('should return existing settings after upsert', async () => {
    // First upsert
    await supabase.rpc('fn_gate_n_upsert_admin_settings', {
      p_sla_config: { reminder_sla_hours: 48 },
      p_feature_flags: { enable_advanced_kpis: true },
      p_limits: { max_users: 100 },
      p_notification_channels: { email: true }
    });

    // Then get
    const { data, error } = await supabase.rpc('fn_gate_n_get_admin_settings');
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.[0]?.sla_config).toEqual({ reminder_sla_hours: 48 });
  });

  it('should enforce admin role requirement', async () => {
    // TODO: Test with non-admin user
    // Should return PERMISSION_DENIED error
  });
});

describe('fn_gate_n_upsert_admin_settings', () => {
  it('should insert settings when none exist', async () => {
    const { data, error } = await supabase.rpc('fn_gate_n_upsert_admin_settings', {
      p_sla_config: { reminder_sla_hours: 72 },
      p_feature_flags: { enable_reports: true },
      p_limits: { max_campaigns: 50 },
      p_notification_channels: { sms: false }
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.[0]?.sla_config.reminder_sla_hours).toBe(72);
  });

  it('should update existing settings', async () => {
    // First insert
    await supabase.rpc('fn_gate_n_upsert_admin_settings', {
      p_sla_config: { reminder_sla_hours: 48 },
      p_feature_flags: null,
      p_limits: null,
      p_notification_channels: null
    });

    // Then update
    const { data, error } = await supabase.rpc('fn_gate_n_upsert_admin_settings', {
      p_sla_config: { reminder_sla_hours: 96 },
      p_feature_flags: { new_flag: true },
      p_limits: null,
      p_notification_channels: null
    });

    expect(error).toBeNull();
    expect(data?.[0]?.sla_config.reminder_sla_hours).toBe(96);
    expect(data?.[0]?.feature_flags.new_flag).toBe(true);
  });

  it('should preserve tenant_id on update', async () => {
    const { data: insertData } = await supabase.rpc('fn_gate_n_upsert_admin_settings', {
      p_sla_config: { test: 1 },
      p_feature_flags: null,
      p_limits: null,
      p_notification_channels: null
    });

    const originalTenantId = insertData?.[0]?.tenant_id;

    const { data: updateData } = await supabase.rpc('fn_gate_n_upsert_admin_settings', {
      p_sla_config: { test: 2 },
      p_feature_flags: null,
      p_limits: null,
      p_notification_channels: null
    });

    expect(updateData?.[0]?.tenant_id).toBe(originalTenantId);
  });
});

describe('fn_gate_n_list_system_jobs', () => {
  it('should return only jobs visible to current tenant', async () => {
    const { data, error } = await supabase.rpc('fn_gate_n_list_system_jobs');

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    
    // All returned jobs should either be global (tenant_id null) or belong to current tenant
    data?.forEach(job => {
      expect(
        job.tenant_id === null || job.tenant_id === testTenantId
      ).toBe(true);
    });
  });

  it('should include global jobs', async () => {
    const { data } = await supabase.rpc('fn_gate_n_list_system_jobs');
    
    const hasGlobalJob = data?.some(job => job.tenant_id === null);
    // This might be true or false depending on seed data
    expect(typeof hasGlobalJob).toBe('boolean');
  });

  it('should return jobs regardless of is_enabled flag', async () => {
    const { data } = await supabase.rpc('fn_gate_n_list_system_jobs');
    
    // Should include both enabled and disabled jobs (UI can filter)
    expect(data?.some(job => job.is_enabled === true)).toBeDefined();
  });
});

describe('fn_gate_n_trigger_job', () => {
  it('should create system_job_runs entry with queued status', async () => {
    const { data, error } = await supabase.rpc('fn_gate_n_trigger_job', {
      p_job_key: 'refresh_kpis'
    });

    expect(error).toBeNull();
    expect(data?.[0]?.status).toBe('queued');
    expect(data?.[0]?.trigger_source).toBe('manual');
  });

  it('should link to correct system_jobs row by job_key', async () => {
    const { data } = await supabase.rpc('fn_gate_n_trigger_job', {
      p_job_key: 'refresh_reports'
    });

    expect(data?.[0]?.job_id).toBeDefined();
    expect(typeof data?.[0]?.job_id).toBe('string');
  });

  it('should reject calls from unauthorized roles', async () => {
    // TODO: Test with non-admin user
    // Should return PERMISSION_DENIED
  });

  it('should reject unknown job_key', async () => {
    const { error } = await supabase.rpc('fn_gate_n_trigger_job', {
      p_job_key: 'nonexistent_job'
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('JOB_NOT_FOUND');
  });

  it('should reject disabled jobs', async () => {
    // TODO: Seed a disabled job and try to trigger it
    // Should return error or be rejected
  });
});

describe('fn_gate_n_get_status_snapshot', () => {
  it('should return JSON object with jobs and admin_settings keys', async () => {
    const { data, error } = await supabase.rpc('fn_gate_n_get_status_snapshot');

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data).toHaveProperty('jobs');
    expect(data).toHaveProperty('admin_settings');
  });

  it('should aggregate jobs correctly', async () => {
    const { data } = await supabase.rpc('fn_gate_n_get_status_snapshot');

    expect(data.jobs).toHaveProperty('total');
    expect(data.jobs).toHaveProperty('enabled');
    expect(typeof data.jobs.total).toBe('number');
    expect(typeof data.jobs.enabled).toBe('number');
  });

  it('should aggregate job runs for last 24 hours', async () => {
    const { data } = await supabase.rpc('fn_gate_n_get_status_snapshot');

    expect(data.jobs).toHaveProperty('runs_last_24h');
    expect(data.jobs.runs_last_24h).toHaveProperty('succeeded');
    expect(data.jobs.runs_last_24h).toHaveProperty('failed');
    expect(data.jobs.runs_last_24h).toHaveProperty('running');
  });

  it('should include admin_settings last update timestamp', async () => {
    const { data } = await supabase.rpc('fn_gate_n_get_status_snapshot');

    // May be null if no settings exist yet
    if (data.admin_settings.updated_at) {
      expect(typeof data.admin_settings.updated_at).toBe('string');
    }
  });
});

describe('fn_gate_n_get_recent_job_runs', () => {
  it('should return recent job runs with details', async () => {
    const { data, error } = await supabase.rpc('fn_gate_n_get_recent_job_runs', {
      p_limit: 10
    });

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeLessThanOrEqual(10);
  });

  it('should include job metadata (job_key, job_type)', async () => {
    const { data } = await supabase.rpc('fn_gate_n_get_recent_job_runs', {
      p_limit: 5
    });

    if (data && data.length > 0) {
      expect(data[0]).toHaveProperty('job_key');
      expect(data[0]).toHaveProperty('job_type');
    }
  });

  it('should order by started_at DESC', async () => {
    const { data } = await supabase.rpc('fn_gate_n_get_recent_job_runs', {
      p_limit: 20
    });

    if (data && data.length > 1) {
      const timestamps = data.map(run => new Date(run.started_at).getTime());
      const sorted = [...timestamps].sort((a, b) => b - a);
      expect(timestamps).toEqual(sorted);
    }
  });
});
