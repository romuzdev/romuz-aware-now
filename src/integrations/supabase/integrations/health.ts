/**
 * M15 - Integration Health Monitoring
 * Health check and monitoring for integration connectors
 */

import { supabase } from '../client';

export interface IntegrationHealthLog {
  id: string;
  connector_id: string;
  tenant_id: string;
  health_status: 'healthy' | 'degraded' | 'down';
  response_time_ms?: number;
  error_message?: string;
  error_details?: Record<string, any>;
  request_payload?: Record<string, any>;
  response_payload?: Record<string, any>;
  checked_at: string;
}

export interface IntegrationSyncJob {
  id: string;
  connector_id: string;
  tenant_id: string;
  job_type: 'full_sync' | 'incremental_sync' | 'one_time' | 'scheduled';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'retrying';
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  records_synced: number;
  records_failed: number;
  error_message?: string;
  error_details?: Record<string, any>;
  retry_count: number;
  next_retry_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Get health logs for a connector
 */
export async function getConnectorHealthLogs(
  connectorId: string,
  limit: number = 50
): Promise<IntegrationHealthLog[]> {
  const { data, error } = await supabase
    .from('integration_health_logs')
    .select('*')
    .eq('connector_id', connectorId)
    .order('checked_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Get latest health status for all connectors
 */
export async function getAllConnectorsHealth(): Promise<Record<string, IntegrationHealthLog>> {
  const { data: connectors } = await supabase
    .from('integration_connectors')
    .select('id, health_status, last_health_check, error_count, success_count');

  if (!connectors) return {};

  const healthMap: Record<string, any> = {};
  
  for (const connector of connectors) {
    healthMap[connector.id] = {
      health_status: connector.health_status,
      last_health_check: connector.last_health_check,
      error_count: connector.error_count,
      success_count: connector.success_count,
    };
  }

  return healthMap;
}

/**
 * Record health check result
 */
export async function recordHealthCheck(
  connectorId: string,
  status: 'healthy' | 'degraded' | 'down',
  responseTimeMs?: number,
  errorMessage?: string,
  errorDetails?: Record<string, any>
): Promise<void> {
  const { data: tenantData } = await supabase
    .from('integration_connectors')
    .select('tenant_id')
    .eq('id', connectorId)
    .single();

  if (!tenantData) throw new Error('Connector not found');

  // Insert health log
  const { error } = await supabase
    .from('integration_health_logs')
    .insert({
      connector_id: connectorId,
      tenant_id: tenantData.tenant_id,
      health_status: status,
      response_time_ms: responseTimeMs,
      error_message: errorMessage,
      error_details: errorDetails,
      checked_at: new Date().toISOString(),
    });

  if (error) throw error;

  // Update connector health status using the helper function
  await supabase.rpc('update_integration_health', {
    p_connector_id: connectorId,
    p_health_status: status,
    p_response_time_ms: responseTimeMs,
    p_error_message: errorMessage,
  });
}

/**
 * Get sync jobs for a connector
 */
export async function getConnectorSyncJobs(
  connectorId: string,
  status?: string
): Promise<IntegrationSyncJob[]> {
  let query = supabase
    .from('integration_sync_jobs')
    .select('*')
    .eq('connector_id', connectorId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Create sync job
 */
export async function createSyncJob(
  connectorId: string,
  jobType: 'full_sync' | 'incremental_sync' | 'one_time' | 'scheduled',
  scheduledAt?: string,
  metadata?: Record<string, any>
): Promise<IntegrationSyncJob> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: tenantData } = await supabase
    .from('integration_connectors')
    .select('tenant_id')
    .eq('id', connectorId)
    .single();

  if (!tenantData) throw new Error('Connector not found');

  const { data, error } = await supabase
    .from('integration_sync_jobs')
    .insert({
      connector_id: connectorId,
      tenant_id: tenantData.tenant_id,
      job_type: jobType,
      status: 'pending',
      scheduled_at: scheduledAt,
      metadata: metadata,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update sync job status
 */
export async function updateSyncJobStatus(
  jobId: string,
  status: string,
  recordsSynced?: number,
  recordsFailed?: number,
  errorMessage?: string
): Promise<void> {
  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'running') {
    updates.started_at = new Date().toISOString();
  }

  if (status === 'completed' || status === 'failed') {
    updates.completed_at = new Date().toISOString();
  }

  if (recordsSynced !== undefined) {
    updates.records_synced = recordsSynced;
  }

  if (recordsFailed !== undefined) {
    updates.records_failed = recordsFailed;
  }

  if (errorMessage) {
    updates.error_message = errorMessage;
  }

  const { error } = await supabase
    .from('integration_sync_jobs')
    .update(updates)
    .eq('id', jobId);

  if (error) throw error;
}

/**
 * Retry failed sync jobs
 */
export async function retryFailedJobs(): Promise<any[]> {
  const { data, error } = await supabase.rpc('retry_failed_sync_jobs');

  if (error) throw error;
  return data || [];
}

/**
 * Get integration health statistics
 */
export async function getHealthStatistics(): Promise<{
  total: number;
  healthy: number;
  degraded: number;
  down: number;
  unknown: number;
}> {
  const { data: connectors } = await supabase
    .from('integration_connectors')
    .select('health_status');

  if (!connectors) {
    return { total: 0, healthy: 0, degraded: 0, down: 0, unknown: 0 };
  }

  const stats = {
    total: connectors.length,
    healthy: connectors.filter(c => c.health_status === 'healthy').length,
    degraded: connectors.filter(c => c.health_status === 'degraded').length,
    down: connectors.filter(c => c.health_status === 'down').length,
    unknown: connectors.filter(c => c.health_status === 'unknown').length,
  };

  return stats;
}
