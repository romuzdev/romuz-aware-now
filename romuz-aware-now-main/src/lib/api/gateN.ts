/**
 * Gate-N API Wrapper
 * TypeScript integration layer for Gate-N Edge Functions
 * 
 * Module: Admin Console & Control Center
 * Project: Cyber Zone GRC – Romuz Awareness App
 */

import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  jobs?: T;
  run?: T;
  message?: string;
  error_code?: string;
}

export interface SystemJob {
  id: string;
  tenant_id: string;
  job_key: string;
  job_type: string;
  schedule_cron: string;
  is_enabled: boolean;
  config: Record<string, any> | null;
  last_run_at: string | null;
  last_run_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobRun {
  id: string;
  tenant_id: string;
  job_id: string;
  status: string;
  trigger_source: string;
  triggered_by_user_id: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  result: Record<string, any> | null;
  error_message: string | null;
  meta: Record<string, any> | null;
}

export interface AdminSettings {
  id?: string;
  tenant_id?: string;
  sla_config: Record<string, any>;
  feature_flags: Record<string, any>;
  limits: Record<string, any>;
  notification_channels: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface StatusSnapshot {
  jobs: {
    total: number;
    enabled: number;
    runs_last_24h: {
      succeeded: number;
      failed: number;
      running: number;
    };
  };
  admin_settings: {
    updated_at: string | null;
  };
  kpi_summary?: {
    campaigns_active?: number;
    last_kpi_snapshot_at?: string;
    score_avg?: number;
  };
  reports_summary?: {
    last_report_generated_at?: string;
    reports_last_7d?: number;
  };
}

export interface CronSyncResponse {
  success: boolean;
  message?: string;
  synced_jobs?: {
    job_key: string;
    cron_name: string;
    schedule: string;
  }[];
  error_code?: string;
}

export interface JobDependency {
  id: string;
  tenant_id: string;
  parent_job_id: string;
  dependent_job_id: string;
  dependency_type: 'required' | 'optional' | 'conditional';
  wait_for_success: boolean;
  retry_on_parent_failure: boolean;
  max_wait_minutes: number;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  parent_job?: {
    id: string;
    job_key: string;
    job_type: string;
  };
  dependent_job?: {
    id: string;
    job_key: string;
    job_type: string;
  };
}

export interface DependencyCheckResult {
  can_run: boolean;
  blocking_jobs: any[];
  message: string;
}

export interface DependencyResponse {
  success: boolean;
  data?: any;
  dependencies?: JobDependency[];
  tree?: any[];
  message?: string;
  error_code?: string;
}

// ============================================================================
// D1 – Gate-N Health Check Types
// ============================================================================

export type HealthCheckStatus = 'pass' | 'warn' | 'fail';
export type HealthCheckSeverity = 'low' | 'medium' | 'high';

export interface HealthCheckItem {
  code: string;
  label: string;
  status: HealthCheckStatus;
  severity: HealthCheckSeverity;
  latencyMs: number;
  message?: string;
  errorCode?: string;
  details?: any;
}

export interface HealthCheckResult {
  success: boolean;
  startedAt: string;
  finishedAt: string;
  checks: HealthCheckItem[];
}

// ============================================================================
// Helper: Call Edge Function
// ============================================================================

async function callEdgeFunction<T = any>(
  functionName: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
  } = {}
): Promise<ApiResponse<T>> {
  try {
    // supabase.functions.invoke() automatically includes auth token from session
    // Do NOT manually add Authorization header as it causes conflicts
    const { data, error } = await supabase.functions.invoke(functionName, {
      method: options.method || 'GET',
      body: options.body,
    });

    if (error) {
      console.error(`Edge function ${functionName} error:`, error);
      return {
        success: false,
        message: error.message || 'Edge function call failed',
        error_code: 'EDGE_FUNCTION_ERROR',
      };
    }

    return data as ApiResponse<T>;
  } catch (err: any) {
    console.error(`Unexpected error calling ${functionName}:`, err);
    return {
      success: false,
      message: err.message || 'Network error',
      error_code: 'NETWORK_ERROR',
    };
  }
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get Gate-N system status snapshot
 * Returns job statistics, recent runs, and admin settings info
 */
export async function getGateNStatus(): Promise<ApiResponse<StatusSnapshot>> {
  return callEdgeFunction<StatusSnapshot>('gate-n-status');
}

/**
 * Get list of all system jobs (global + tenant-specific)
 * Returns array of SystemJob objects
 */
export async function getGateNJobs(): Promise<ApiResponse<SystemJob[]>> {
  const response = await callEdgeFunction<SystemJob[]>('gate-n-jobs');
  
  // Handle both response formats (jobs array in data or jobs field)
  if (response.success && response.jobs) {
    return {
      ...response,
      data: response.jobs as SystemJob[],
    };
  }
  
  return response;
}

/**
 * Trigger a manual job run
 * @param job_key - The job key to trigger (e.g., "refresh_kpis")
 */
export async function triggerGateNJob(job_key: string): Promise<ApiResponse<JobRun>> {
  if (!job_key || typeof job_key !== 'string') {
    return {
      success: false,
      message: 'Invalid job_key: must be a non-empty string',
      error_code: 'INVALID_INPUT',
    };
  }

  const response = await callEdgeFunction<JobRun>('gate-n-trigger', {
    method: 'POST',
    body: { job_key },
  });

  // Handle both response formats (run in data or run field)
  if (response.success && response.run) {
    return {
      ...response,
      data: response.run as JobRun,
    };
  }

  return response;
}

// Settings functions removed - migrated to Gate-P Tenant Configuration

/**
 * Create a new system job
 * @param payload - Job creation data
 */
export async function createGateNJob(payload: {
  job_key: string;
  display_name: string;
  description?: string;
  gate_code: string;
  job_type: string;
  schedule_cron?: string;
  is_enabled?: boolean;
  config?: Record<string, any>;
}): Promise<ApiResponse<SystemJob>> {
  return callEdgeFunction<SystemJob>('gate-n-job-create', {
    method: 'POST',
    body: payload,
  });
}

/**
 * Update an existing system job
 * @param payload - Job update data including job_id
 */
export async function updateGateNJob(payload: {
  job_id: string;
  display_name?: string;
  description?: string;
  job_type?: string;
  schedule_cron?: string;
  is_enabled?: boolean;
  config?: Record<string, any>;
}): Promise<ApiResponse<SystemJob>> {
  return callEdgeFunction<SystemJob>('gate-n-job-update', {
    method: 'PUT',
    body: payload,
  });
}

/**
 * Delete a system job
 * @param job_id - The ID of the job to delete
 */
export async function deleteGateNJob(job_id: string): Promise<ApiResponse<void>> {
  return callEdgeFunction<void>('gate-n-job-delete', {
    method: 'DELETE',
    body: { job_id },
  });
}

/**
 * Sync all enabled jobs with pg_cron
 */
export const syncAllCronJobs = async (): Promise<ApiResponse<CronSyncResponse>> => {
  return callEdgeFunction('gate-n-cron-sync', {
    method: 'POST',
    body: { action: 'sync_all' },
  });
};

/**
 * Create or update a cron job for a specific system job
 */
export const syncCronJob = async (payload: {
  action: 'create' | 'update' | 'delete';
  job_id?: string;
  job_key: string;
  schedule_cron?: string;
}): Promise<ApiResponse<CronSyncResponse>> => {
  return callEdgeFunction('gate-n-cron-sync', {
    method: 'POST',
    body: payload,
  });
};

/**
 * List all active cron jobs
 */
export const listCronJobs = async (): Promise<ApiResponse<CronSyncResponse>> => {
  return callEdgeFunction('gate-n-cron-sync', {
    method: 'POST',
    body: { action: 'list' },
  });
};

// ============================================================================
// Job Dependencies API Functions
// ============================================================================

/**
 * List job dependencies
 */
export const listJobDependencies = async (job_id?: string): Promise<ApiResponse<DependencyResponse>> => {
  return callEdgeFunction('gate-n-dependencies', {
    method: 'POST',
    body: { action: 'list', job_id },
  });
};

/**
 * Create a new job dependency
 */
export const createJobDependency = async (payload: {
  parent_job_id: string;
  dependent_job_id: string;
  dependency_type?: 'required' | 'optional' | 'conditional';
  wait_for_success?: boolean;
  retry_on_parent_failure?: boolean;
  max_wait_minutes?: number;
  is_active?: boolean;
  metadata?: Record<string, any>;
}): Promise<ApiResponse<DependencyResponse>> => {
  return callEdgeFunction('gate-n-dependencies', {
    method: 'POST',
    body: { action: 'create', ...payload },
  });
};

/**
 * Update a job dependency
 */
export const updateJobDependency = async (payload: {
  dependency_id: string;
  dependency_type?: 'required' | 'optional' | 'conditional';
  wait_for_success?: boolean;
  retry_on_parent_failure?: boolean;
  max_wait_minutes?: number;
  is_active?: boolean;
  metadata?: Record<string, any>;
}): Promise<ApiResponse<DependencyResponse>> => {
  return callEdgeFunction('gate-n-dependencies', {
    method: 'POST',
    body: { action: 'update', ...payload },
  });
};

/**
 * Delete a job dependency
 */
export const deleteJobDependency = async (dependency_id: string): Promise<ApiResponse<DependencyResponse>> => {
  return callEdgeFunction('gate-n-dependencies', {
    method: 'POST',
    body: { action: 'delete', dependency_id },
  });
};

/**
 * Check if a job can run (dependencies satisfied)
 */
export const checkJobDependencies = async (job_id: string): Promise<ApiResponse<DependencyResponse>> => {
  return callEdgeFunction('gate-n-dependencies', {
    method: 'POST',
    body: { action: 'check', job_id },
  });
};

/**
 * Get dependency tree for visualization
 */
export const getJobDependencyTree = async (job_id?: string): Promise<ApiResponse<DependencyResponse>> => {
  return callEdgeFunction('gate-n-dependencies', {
    method: 'POST',
    body: { action: 'tree', job_id },
  });
};

// ============================================================================
// D1 – Gate-N Health Check API
// ============================================================================

/**
 * Run Gate-N health checks
 * Returns diagnostic information about Gate-N components (RPCs, RBAC, Edge Functions)
 */
export async function getGateNHealthCheck(): Promise<ApiResponse<HealthCheckResult>> {
  return callEdgeFunction<HealthCheckResult>('gate-n-health-check', {
    method: 'GET',
  });
}

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * React Query hook for Gate-N status
 * Auto-refetches every 30 seconds
 */
export function useGateNStatus() {
  return useQuery({
    queryKey: ['gate-n', 'status'],
    queryFn: getGateNStatus,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 20000, // Consider stale after 20 seconds
  });
}

/**
 * React Query hook for system jobs list
 * Refetches every 60 seconds
 */
export function useGateNJobs() {
  return useQuery({
    queryKey: ['gate-n', 'jobs'],
    queryFn: getGateNJobs,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 45000, // Consider stale after 45 seconds
  });
}

/**
 * React Query mutation for triggering a job
 * Automatically invalidates jobs and status queries on success
 */
export function useTriggerGateNJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: triggerGateNJob,
    onSuccess: () => {
      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['gate-n', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['gate-n', 'jobs'] });
    },
  });
}

// Settings hooks removed - migrated to Gate-P Tenant Configuration
// Use useTenantSettings and useUpdateTenantSettings from '@/integrations/supabase/gate-p' instead

/**
 * React Query mutation for creating a job
 * Automatically invalidates jobs query on success
 */
export function useCreateGateNJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGateNJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gate-n', 'jobs'] });
      queryClient.invalidateQueries({ queryKey: ['gate-n', 'status'] });
    },
  });
}

/**
 * React Query mutation for updating a job
 * Automatically invalidates jobs query on success
 */
export function useUpdateGateNJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGateNJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gate-n', 'jobs'] });
      queryClient.invalidateQueries({ queryKey: ['gate-n', 'status'] });
    },
  });
}

/**
 * React Query mutation for deleting a job
 * Automatically invalidates jobs query on success
 */
export function useDeleteGateNJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGateNJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gate-n', 'jobs'] });
      queryClient.invalidateQueries({ queryKey: ['gate-n', 'status'] });
    },
  });
}

/**
 * Hook: Sync all cron jobs
 */
export const useSyncAllCronJobs = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: syncAllCronJobs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gate-n', 'jobs'] });
      queryClient.invalidateQueries({ queryKey: ['gate-n', 'status'] });
    },
  });
};

/**
 * Hook: Sync individual cron job
 */
export const useSyncCronJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: syncCronJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gate-n', 'jobs'] });
    },
  });
};

/**
 * Hook: List cron jobs
 */
export const useListCronJobs = () => {
  return useQuery({
    queryKey: ['gate-n', 'jobs', 'cron'],
    queryFn: listCronJobs,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

// ============================================================================
// Job Dependencies Hooks
// ============================================================================

/**
 * Hook: List job dependencies
 */
export const useJobDependencies = (job_id?: string) => {
  return useQuery({
    queryKey: ['gate-n', 'dependencies', job_id || 'all'],
    queryFn: () => listJobDependencies(job_id),
    refetchInterval: 60000, // Refetch every minute
  });
};

/**
 * Hook: Create job dependency
 */
export const useCreateJobDependency = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createJobDependency,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gate-n', 'dependencies'] });
      queryClient.invalidateQueries({ queryKey: ['gate-n', 'jobs'] });
    },
  });
};

/**
 * Hook: Update job dependency
 */
export const useUpdateJobDependency = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateJobDependency,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gate-n', 'dependencies'] });
    },
  });
};

/**
 * Hook: Delete job dependency
 */
export const useDeleteJobDependency = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteJobDependency,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gate-n', 'dependencies'] });
      queryClient.invalidateQueries({ queryKey: ['gate-n', 'jobs'] });
    },
  });
};

/**
 * Hook: Check job dependencies
 */
export const useCheckJobDependencies = (job_id?: string) => {
  return useQuery({
    queryKey: ['gate-n', 'dependencies', 'check', job_id],
    queryFn: () => checkJobDependencies(job_id!),
    enabled: !!job_id,
  });
};

/**
 * Hook: Get dependency tree
 */
export const useJobDependencyTree = (job_id?: string) => {
  return useQuery({
    queryKey: ['gate-n', 'dependencies', 'tree', job_id || 'all'],
    queryFn: () => getJobDependencyTree(job_id),
    refetchInterval: 60000,
  });
};

// ============================================================================
// D1 – Gate-N Health Check React Query Hook
// ============================================================================

/**
 * React Query hook to run Gate-N health checks
 * Use refetch() to manually trigger a new health check
 */
export const useGateNHealthCheck = () => {
  return useQuery({
    queryKey: ['gate-n', 'health-check'],
    queryFn: getGateNHealthCheck,
    staleTime: 60_000, // 1 minute
    refetchOnWindowFocus: false,
    enabled: false, // Manual trigger only
  });
};
