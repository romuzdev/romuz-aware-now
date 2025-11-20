/**
 * Integration Logs Data Layer
 * Gate-M15: Operations for integration logging
 */

import { supabase } from '@/integrations/supabase/client';
import type { IntegrationLog, CreateLogInput } from '../types';

/**
 * Fetch logs for a specific connector
 */
export async function fetchConnectorLogs(
  tenantId: string,
  connectorId: string,
  limit: number = 100
): Promise<IntegrationLog[]> {
  const { data, error } = await supabase
    .from('integration_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('connector_id', connectorId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('❌ fetchConnectorLogs error:', error);
    throw new Error(error.message);
  }

  return data as IntegrationLog[];
}

/**
 * Fetch all logs for tenant
 */
export async function fetchTenantLogs(
  tenantId: string,
  limit: number = 100
): Promise<IntegrationLog[]> {
  const { data, error } = await supabase
    .from('integration_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('❌ fetchTenantLogs error:', error);
    throw new Error(error.message);
  }

  return data as IntegrationLog[];
}

/**
 * Fetch logs by status
 */
export async function fetchLogsByStatus(
  tenantId: string,
  status: string,
  limit: number = 100
): Promise<IntegrationLog[]> {
  const { data, error } = await supabase
    .from('integration_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('❌ fetchLogsByStatus error:', error);
    throw new Error(error.message);
  }

  return data as IntegrationLog[];
}

/**
 * Create a new log entry
 */
export async function createLog(
  tenantId: string,
  input: CreateLogInput
): Promise<IntegrationLog> {
  const { data, error } = await supabase
    .from('integration_logs')
    .insert({
      tenant_id: tenantId,
      connector_id: input.connector_id || null,
      event_type: input.event_type,
      event_category: input.event_category || null,
      payload: input.payload || null,
      response: input.response || null,
      status: input.status || 'pending',
      error_message: input.error_message || null,
      error_code: input.error_code || null,
      duration_ms: input.duration_ms || null,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ createLog error:', error);
    throw new Error(error.message);
  }

  return data as IntegrationLog;
}

/**
 * Get log statistics
 */
export async function getLogStatistics(
  tenantId: string,
  connectorId?: string
): Promise<{
  total: number;
  success: number;
  failed: number;
  pending: number;
}> {
  let query = supabase
    .from('integration_logs')
    .select('status')
    .eq('tenant_id', tenantId);

  if (connectorId) {
    query = query.eq('connector_id', connectorId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ getLogStatistics error:', error);
    throw new Error(error.message);
  }

  const stats = {
    total: data.length,
    success: data.filter(l => l.status === 'success').length,
    failed: data.filter(l => l.status === 'failed').length,
    pending: data.filter(l => l.status === 'pending').length,
  };

  return stats;
}

/**
 * Delete old logs (older than specified days)
 */
export async function deleteOldLogs(
  tenantId: string,
  daysOld: number = 90
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const { data, error } = await supabase
    .from('integration_logs')
    .delete()
    .eq('tenant_id', tenantId)
    .lt('created_at', cutoffDate.toISOString())
    .select('id');

  if (error) {
    console.error('❌ deleteOldLogs error:', error);
    throw new Error(error.message);
  }

  return data?.length || 0;
}
