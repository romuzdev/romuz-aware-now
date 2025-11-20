// ============================================================================
// Gate-E: Feature Flags & Job Runs Integration
// ============================================================================

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// Feature Flags
// ============================================================================

export interface FeatureFlag {
  id: string;
  tenant_id: string | null;
  flag_key: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  metadata: Record<string, any>;
}

export async function fetchFeatureFlags(tenantId: string): Promise<FeatureFlag[]> {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching feature flags:', error);
    throw error;
  }

  return data || [];
}

export async function checkFeatureFlag(
  tenantId: string,
  flagKey: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('is_enabled')
    .eq('tenant_id', tenantId)
    .eq('flag_key', flagKey)
    .single();

  if (error) {
    console.error(`Error checking feature flag ${flagKey}:`, error);
    return false;
  }

  return data?.is_enabled ?? false;
}

export async function toggleFeatureFlag(
  flagId: string,
  enabled: boolean
): Promise<FeatureFlag> {
  const { data, error } = await supabase
    .from('feature_flags')
    .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
    .eq('id', flagId)
    .select()
    .single();

  if (error) {
    console.error('Error toggling feature flag:', error);
    throw error;
  }

  return data;
}

// ============================================================================
// Job Runs (for monitoring & alerting)
// ============================================================================

export interface JobRun {
  id: string;
  tenant_id: string;
  job_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  error_message?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export async function fetchJobRuns(
  tenantId: string,
  limit: number = 50
): Promise<JobRun[]> {
  const { data, error } = await supabase
    .from('job_runs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching job runs:', error);
    throw error;
  }

  return data || [];
}

export async function createJobRun(
  tenantId: string,
  jobType: string,
  metadata?: Record<string, any>
): Promise<JobRun> {
  const { data, error } = await supabase
    .from('job_runs')
    .insert({
      tenant_id: tenantId,
      job_type: jobType,
      status: 'pending',
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating job run:', error);
    throw error;
  }

  return data;
}

export async function updateJobRun(
  jobId: string,
  updates: {
    status?: JobRun['status'];
    completed_at?: string;
    error_message?: string;
    metadata?: Record<string, any>;
  }
): Promise<JobRun> {
  const { data, error } = await supabase
    .from('job_runs')
    .update(updates)
    .eq('id', jobId)
    .select()
    .single();

  if (error) {
    console.error('Error updating job run:', error);
    throw error;
  }

  return data;
}

// ============================================================================
// Gate-E Smoke Tests
// ============================================================================

export interface SmokeTestResult {
  success: boolean;
  flag?: {
    enabled_tenants: number;
    tenants: string[];
  };
  channel?: {
    id: string;
    type: string;
    config: Record<string, any>;
  };
  seed?: {
    tenant_id: string;
    campaigns_created: number;
    date_range: string;
  };
  policy?: {
    count: number;
    enabled: number;
  };
  tests?: {
    job_run_id: string;
    alert_generated: boolean;
    alert_count: number;
    kpi_view_accessible: boolean;
    kpi_records: number;
  };
  errors?: string[];
}

export async function runGateECloseoutTests(): Promise<SmokeTestResult> {
  const response = await supabase.functions.invoke('gate-e-closeout', {
    method: 'POST',
  });

  if (response.error) {
    console.error('Gate-E Closeout Tests failed:', response.error);
    throw response.error;
  }

  return response.data;
}
