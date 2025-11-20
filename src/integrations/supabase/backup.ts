/**
 * ============================================================================
 * M23 - Backup & Recovery System
 * Integration Layer
 * Purpose: واجهة تكامل للنسخ الاحتياطي والاستعادة
 * ============================================================================
 */

import { supabase } from './client';
import { Database } from './types';

// Types
export type BackupJob = Database['public']['Tables']['backup_jobs']['Row'];
export type BackupSchedule = Database['public']['Tables']['backup_schedules']['Row'];
export type BackupRestoreLog = Database['public']['Tables']['backup_restore_logs']['Row'];

export type BackupJobInsert = Database['public']['Tables']['backup_jobs']['Insert'];
export type BackupScheduleInsert = Database['public']['Tables']['backup_schedules']['Insert'];

export type JobType = 'full' | 'incremental' | 'snapshot';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type RestoreType = 'full' | 'partial' | 'point_in_time';

// PITR Types
export interface PITRRequest {
  targetTimestamp: string;
  baseBackupId?: string;
  dryRun?: boolean;
  tables?: string[];
  confirmRestore: boolean;
}

export interface PITRStats {
  totalOperations: number;
  insertCount: number;
  updateCount: number;
  deleteCount: number;
  affectedTables: string[];
}

export interface PITRResult {
  success: boolean;
  restoreLogId?: string;
  previewChanges?: Record<string, any[]>;
  stats?: PITRStats;
  error?: string;
}

// ============================================================================
// Backup Jobs Management
// ============================================================================

/**
 * Create a new backup job
 */
export async function createBackupJob(
  jobType: JobType,
  backupName?: string,
  description?: string,
  tables?: string[]
) {
  const { data, error } = await supabase.functions.invoke('backup-database', {
    body: {
      jobType,
      backupName,
      description,
      tables,
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Get all backup jobs for current tenant
 */
export async function getBackupJobs(filters?: {
  status?: JobStatus;
  jobType?: JobType;
  limit?: number;
}) {
  let query = supabase
    .from('backup_jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.jobType) {
    query = query.eq('job_type', filters.jobType);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  return data as BackupJob[];
}

/**
 * Get backup job by ID
 */
export async function getBackupJobById(id: string) {
  const { data, error } = await supabase
    .from('backup_jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as BackupJob;
}

/**
 * Delete backup job and associated file
 */
export async function deleteBackupJob(id: string) {
  // First get the job to find storage path
  const job = await getBackupJobById(id);
  
  // Delete from storage if exists
  if (job.storage_path) {
    const { error: storageError } = await supabase.storage
      .from('backups')
      .remove([job.storage_path]);
    
    if (storageError) {
      console.error('Error deleting backup file:', storageError);
    }
  }

  // Delete job record
  const { error } = await supabase
    .from('backup_jobs')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Download backup file
 */
export async function downloadBackupFile(storagePath: string) {
  const { data, error } = await supabase.storage
    .from('backups')
    .download(storagePath);

  if (error) throw error;
  return data;
}

/**
 * Get backup statistics
 */
export async function getBackupStatistics(tenantId: string) {
  const { data, error } = await supabase
    .rpc('get_backup_statistics', { p_tenant_id: tenantId });

  if (error) throw error;
  return data[0];
}

// ============================================================================
// Backup Schedules Management
// ============================================================================

/**
 * Create backup schedule
 */
export async function createBackupSchedule(schedule: {
  scheduleName: string;
  jobType: JobType;
  cronExpression: string;
  description?: string;
  retentionDays?: number;
  maxBackupsCount?: number;
  notifyOnFailure?: boolean;
  notificationEmails?: string[];
}) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('User not authenticated');

  // Resolve current tenant id (required by RLS)
  const { data: tenantRec, error: tenantErr } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .limit(1)
    .maybeSingle();

  if (tenantErr) throw tenantErr;
  if (!tenantRec?.tenant_id) throw new Error('Tenant context not found');

  const { data, error } = await supabase
    .from('backup_schedules')
    .insert({
      schedule_name: schedule.scheduleName,
      job_type: schedule.jobType,
      cron_expression: schedule.cronExpression,
      description: schedule.description,
      retention_days: schedule.retentionDays || 30,
      max_backups_count: schedule.maxBackupsCount || 10,
      notify_on_failure: schedule.notifyOnFailure ?? true,
      notification_emails: schedule.notificationEmails || [],
      created_by: userData.user.id,
      tenant_id: tenantRec.tenant_id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as BackupSchedule;
}

/**
 * Get all backup schedules
 */
export async function getBackupSchedules() {
  const { data, error } = await supabase
    .from('backup_schedules')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as BackupSchedule[];
}

/**
 * Update backup schedule
 */
export async function updateBackupSchedule(
  id: string,
  updates: Partial<BackupScheduleInsert>
) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('backup_schedules')
    .update({
      ...updates,
      updated_by: userData.user.id,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as BackupSchedule;
}

/**
 * Toggle schedule enabled/disabled
 */
export async function toggleBackupSchedule(id: string, isEnabled: boolean) {
  return updateBackupSchedule(id, { is_enabled: isEnabled });
}

/**
 * Delete backup schedule
 */
export async function deleteBackupSchedule(id: string) {
  const { error } = await supabase
    .from('backup_schedules')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================================
// Restore Operations
// ============================================================================

/**
 * Restore from backup
 */
export async function restoreFromBackup(
  backupJobId: string,
  restoreType: RestoreType = 'full',
  tables?: string[]
) {
  const { data, error } = await supabase.functions.invoke('restore-database', {
    body: {
      backupJobId,
      restoreType,
      tables,
      confirmRestore: true,
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Get restore logs
 */
export async function getRestoreLogs(limit?: number) {
  let query = supabase
    .from('backup_restore_logs')
    .select('*, backup_jobs(backup_name, job_type)')
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  return data;
}

/**
 * Get restore log by ID
 */
export async function getRestoreLogById(id: string) {
  const { data, error } = await supabase
    .from('backup_restore_logs')
    .select('*, backup_jobs(backup_name, job_type, backup_size_bytes)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format duration in seconds
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

// ============================================================================
// PITR Functions
// ============================================================================

/**
 * Execute Point-in-Time Recovery
 */
export async function executePITR(request: PITRRequest): Promise<PITRResult> {
  const { data, error } = await supabase.functions.invoke('pitr-restore', {
    body: request,
  });

  if (error) {
    throw new Error(error.message || 'Failed to execute PITR');
  }

  return data as PITRResult;
}

/**
 * Get PITR Preview (dry run)
 */
export async function getPITRPreview(
  targetTimestamp: string,
  baseBackupId?: string,
  tables?: string[]
): Promise<PITRResult> {
  return executePITR({
    targetTimestamp,
    baseBackupId,
    tables,
    dryRun: true,
    confirmRestore: false,
  });
}

/**
 * Get PITR Statistics
 */
export async function getPITRStats(
  targetTimestamp: string,
  baseBackupTimestamp?: string
): Promise<PITRStats> {
  // Get tenant ID from current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: userTenant } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!userTenant) throw new Error('Tenant not found');

  const { data, error } = await supabase.rpc('calculate_pitr_stats', {
    p_tenant_id: userTenant.tenant_id,
    p_target_timestamp: targetTimestamp,
    p_base_backup_timestamp: baseBackupTimestamp || null,
  });

  if (error) {
    console.error('Failed to calculate PITR stats:', error);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    return {
      totalOperations: 0,
      insertCount: 0,
      updateCount: 0,
      deleteCount: 0,
      affectedTables: [],
    };
  }

  const stats = data[0];
  return {
    totalOperations: stats.total_operations || 0,
    insertCount: stats.insert_count || 0,
    updateCount: stats.update_count || 0,
    deleteCount: stats.delete_count || 0,
    affectedTables: stats.affected_tables || [],
  };
}

/**
 * Validate cron expression (basic validation)
 */
export function validateCronExpression(expression: string): boolean {
  const parts = expression.trim().split(/\s+/);
  return parts.length === 5; // Basic check: should have 5 parts
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    completed: 'success',
    running: 'warning',
    pending: 'info',
    failed: 'destructive',
    cancelled: 'secondary',
  };
  return colors[status] || 'default';
}
