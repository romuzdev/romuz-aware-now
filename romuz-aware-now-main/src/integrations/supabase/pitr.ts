/**
 * ============================================================================
 * M23 - Backup & Recovery System
 * Integration: Point-in-Time Recovery (PITR)
 * ============================================================================
 */

import { supabase } from './client';
import type { Database } from './types';

export type TransactionLog = Database['public']['Tables']['backup_transaction_logs']['Row'];
export type TransactionLogInsert = Database['public']['Tables']['backup_transaction_logs']['Insert'];

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

export interface BackupChainItem {
  id: string;
  backup_name: string;
  job_type: string;
  is_incremental: boolean;
  parent_backup_id: string | null;
  created_at: string;
  backup_size_bytes: number | null;
  chain_level: number;
}

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
 * Get Transaction Logs
 */
export async function getTransactionLogs(filters?: {
  tableName?: string;
  operation?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<TransactionLog[]> {
  let query = supabase
    .from('backup_transaction_logs')
    .select('*')
    .order('changed_at', { ascending: false });

  if (filters?.tableName) {
    query = query.eq('table_name', filters.tableName);
  }

  if (filters?.operation) {
    query = query.eq('operation', filters.operation);
  }

  if (filters?.startDate) {
    query = query.gte('changed_at', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('changed_at', filters.endDate);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch transaction logs:', error);
    throw new Error(error.message);
  }

  return data as TransactionLog[];
}

/**
 * Get Backup Chain (full backup + incrementals)
 */
export async function getBackupChain(backupId: string): Promise<BackupChainItem[]> {
  const { data, error } = await supabase.rpc('get_backup_chain', {
    p_backup_id: backupId,
  });

  if (error) {
    console.error('Failed to get backup chain:', error);
    throw new Error(error.message);
  }

  return (data || []) as BackupChainItem[];
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
 * Get Transaction Log by ID
 */
export async function getTransactionLogById(id: string): Promise<TransactionLog> {
  const { data, error } = await supabase
    .from('backup_transaction_logs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as TransactionLog;
}

/**
 * Delete Transaction Logs (cleanup old logs)
 */
export async function deleteOldTransactionLogs(beforeDate: string): Promise<number> {
  const { data, error } = await supabase
    .from('backup_transaction_logs')
    .delete()
    .lt('changed_at', beforeDate)
    .select('id');

  if (error) {
    console.error('Failed to delete transaction logs:', error);
    throw new Error(error.message);
  }

  return data?.length || 0;
}

/**
 * Get tables with transaction logs
 */
export async function getTablesWithLogs(): Promise<string[]> {
  const { data, error } = await supabase
    .from('backup_transaction_logs')
    .select('table_name')
    .limit(1000);

  if (error) {
    console.error('Failed to get tables:', error);
    throw new Error(error.message);
  }

  const uniqueTables = Array.from(new Set(data.map(row => row.table_name)));
  return uniqueTables.sort();
}

/**
 * Execute PITR Rollback
 */
export async function executePITRRollback(
  snapshotId: string,
  reason?: string,
  dryRun: boolean = false
): Promise<any> {
  const { data, error } = await supabase.functions.invoke('pitr-rollback', {
    body: { snapshotId, reason, dryRun, confirmRollback: !dryRun }
  });

  if (error) throw new Error(error.message || 'Rollback failed');
  return data;
}

/**
 * Get active PITR snapshots
 */
export async function getActivePITRSnapshots(): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: userTenant } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!userTenant) throw new Error('Tenant not found');

  const { data, error } = await supabase
    .rpc('get_active_pitr_snapshots', { p_tenant_id: userTenant.tenant_id });

  if (error) throw new Error(error.message);
  return data || [];
}
