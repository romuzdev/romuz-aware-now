/**
 * Transaction Log Integration
 * 
 * Provides access to transaction_log table for audit history
 */

import { supabase } from './client';

export interface TransactionLogEntry {
  id: string;
  tenant_id: string;
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  changed_by: string;
  changed_at: string;
  change_summary: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

/**
 * Get transaction history for a specific record
 */
export async function getTransactionHistory(
  tableName: string,
  recordId: string,
  limit: number = 50
): Promise<TransactionLogEntry[]> {
  const { data, error } = await supabase.rpc('get_transaction_history', {
    p_table_name: tableName,
    p_record_id: recordId,
    p_limit: limit
  });

  if (error) throw error;
  return data || [];
}

/**
 * Get all transaction logs for a tenant (with filters)
 */
export async function listTransactionLogs(filters?: {
  tableName?: string;
  operation?: 'INSERT' | 'UPDATE' | 'DELETE';
  changedBy?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  let query = supabase
    .from('transaction_log')
    .select('*')
    .order('changed_at', { ascending: false });

  if (filters?.tableName) {
    query = query.eq('table_name', filters.tableName);
  }
  if (filters?.operation) {
    query = query.eq('operation', filters.operation);
  }
  if (filters?.changedBy) {
    query = query.eq('changed_by', filters.changedBy);
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
  if (error) throw error;
  return data as TransactionLogEntry[];
}

/**
 * Get transaction statistics for a table
 */
export async function getTransactionStats(
  tableName: string,
  startDate?: string,
  endDate?: string
) {
  let query = supabase
    .from('transaction_log')
    .select('operation')
    .eq('table_name', tableName);

  if (startDate) {
    query = query.gte('changed_at', startDate);
  }
  if (endDate) {
    query = query.lte('changed_at', endDate);
  }

  const { data, error } = await query;
  if (error) throw error;

  const stats = {
    total: data?.length || 0,
    inserts: data?.filter(d => d.operation === 'INSERT').length || 0,
    updates: data?.filter(d => d.operation === 'UPDATE').length || 0,
    deletes: data?.filter(d => d.operation === 'DELETE').length || 0,
  };

  return stats;
}

/**
 * Compare two versions of a record
 */
export function compareVersions(
  oldData: Record<string, any> | null,
  newData: Record<string, any> | null
): { field: string; oldValue: any; newValue: any }[] {
  if (!oldData && !newData) return [];
  if (!oldData) return Object.keys(newData!).map(key => ({ field: key, oldValue: null, newValue: newData![key] }));
  if (!newData) return Object.keys(oldData).map(key => ({ field: key, oldValue: oldData[key], newValue: null }));

  const changes: { field: string; oldValue: any; newValue: any }[] = [];
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

  allKeys.forEach(key => {
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      changes.push({
        field: key,
        oldValue: oldData[key],
        newValue: newData[key]
      });
    }
  });

  return changes;
}
