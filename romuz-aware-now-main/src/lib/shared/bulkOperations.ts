/**
 * Bulk Operations Integration Layer
 * Gate-K: Core Infrastructure - D1 Standard
 * 
 * Provides database operations for bulk_operation_logs table
 */

import { supabase } from '@/integrations/supabase/client';

export type BulkOperationLog = {
  id: string;
  tenant_id: string;
  user_id: string;
  module_name: string;
  operation_type: 'delete' | 'update' | 'export' | 'import' | 'archive';
  entity_type: string;
  affected_count: number;
  total_count: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  error_message?: string;
  metadata: any;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
};

/**
 * Create a new bulk operation log entry
 */
export async function createBulkOperationLog(params: {
  module_name: string;
  operation_type: BulkOperationLog['operation_type'];
  entity_type: string;
  total_count: number;
  metadata?: any;
}) {
  const { data, error } = await supabase
    .from('bulk_operation_logs')
    .insert({
      module_name: params.module_name,
      operation_type: params.operation_type,
      entity_type: params.entity_type,
      total_count: params.total_count,
      affected_count: 0,
      metadata: params.metadata || {},
    })
    .select()
    .single();

  if (error) throw error;
  return data as BulkOperationLog;
}

/**
 * Update bulk operation log status and progress
 */
export async function updateBulkOperationLog(
  id: string,
  updates: {
    status?: BulkOperationLog['status'];
    affected_count?: number;
    error_message?: string;
    metadata?: any;
  }
) {
  const updateData: any = { ...updates };
  
  if (updates.status === 'completed' || updates.status === 'failed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('bulk_operation_logs')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as BulkOperationLog;
}

/**
 * List bulk operation logs with filters
 */
export async function listBulkOperationLogs(filters?: {
  module_name?: string;
  operation_type?: string;
  status?: string;
  limit?: number;
}) {
  let query = supabase
    .from('bulk_operation_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.module_name) {
    query = query.eq('module_name', filters.module_name);
  }
  if (filters?.operation_type) {
    query = query.eq('operation_type', filters.operation_type);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as BulkOperationLog[];
}

/**
 * Get single bulk operation log by ID
 */
export async function getBulkOperationLog(id: string) {
  const { data, error } = await supabase
    .from('bulk_operation_logs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as BulkOperationLog;
}

/**
 * Delete old bulk operation logs (cleanup)
 */
export async function deleteBulkOperationLogs(olderThanDays: number = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const { error } = await supabase
    .from('bulk_operation_logs')
    .delete()
    .lt('created_at', cutoffDate.toISOString());

  if (error) throw error;
}
