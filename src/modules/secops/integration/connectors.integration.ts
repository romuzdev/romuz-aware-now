/**
 * SecOps Connectors Integration Layer
 * M18.5 - SecOps Integration
 */

import { supabase } from '@/integrations/supabase/client';
import type { SecOpsConnector, ConnectorFilters, ConnectorSyncLog } from '../types';
import { logConnectorAction } from '@/lib/audit/secops-audit-logger';

/**
 * Fetch SecOps connectors with filters
 */
export async function fetchSecOpsConnectors(
  filters?: ConnectorFilters
): Promise<SecOpsConnector[]> {
  let query = supabase
    .from('secops_connectors')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.connector_type && filters.connector_type.length > 0) {
    query = query.in('connector_type', filters.connector_type);
  }

  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }

  if (filters?.sync_status && filters.sync_status.length > 0) {
    query = query.in('sync_status', filters.sync_status);
  }

  if (filters?.search) {
    query = query.or(
      `name_ar.ilike.%${filters.search}%,name_en.ilike.%${filters.search}%,vendor.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as SecOpsConnector[];
}

/**
 * Fetch a single connector by ID
 */
export async function fetchSecOpsConnectorById(id: string): Promise<SecOpsConnector> {
  const { data, error } = await supabase
    .from('secops_connectors')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;

  // Log read action
  await logConnectorAction(id, 'read');

  return data as SecOpsConnector;
}

/**
 * Create a new connector
 */
export async function createSecOpsConnector(
  connector: Omit<SecOpsConnector, 'id' | 'created_at' | 'updated_at' | 'error_count' | 'sync_status'>
): Promise<SecOpsConnector> {
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('secops_connectors')
    .insert({
      ...connector,
      created_by: user?.id,
      updated_by: user?.id,
    })
    .select()
    .single();

  if (error) throw error;

  // Log create action
  await logConnectorAction(data.id, 'create', {
    name_ar: connector.name_ar,
    connector_type: connector.connector_type,
    vendor: connector.vendor,
  });

  return data as SecOpsConnector;
}

/**
 * Update connector
 */
export async function updateSecOpsConnector(
  id: string,
  updates: Partial<SecOpsConnector>
): Promise<SecOpsConnector> {
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('secops_connectors')
    .update({
      ...updates,
      updated_by: user?.id,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Log update action
  await logConnectorAction(id, 'update', updates);

  return data as SecOpsConnector;
}

/**
 * Delete connector
 */
export async function deleteSecOpsConnector(id: string): Promise<void> {
  const { error } = await supabase.from('secops_connectors').delete().eq('id', id);

  if (error) throw error;

  // Log delete action
  await logConnectorAction(id, 'delete');
}

/**
 * Activate connector
 */
export async function activateConnector(id: string): Promise<void> {
  await updateSecOpsConnector(id, { is_active: true });
  await logConnectorAction(id, 'activate');
}

/**
 * Deactivate connector
 */
export async function deactivateConnector(id: string): Promise<void> {
  await updateSecOpsConnector(id, { is_active: false });
  await logConnectorAction(id, 'deactivate');
}

/**
 * Update connector sync status
 */
export async function updateConnectorSyncStatus(
  id: string,
  status: 'idle' | 'syncing' | 'success' | 'error',
  lastSyncResult?: Record<string, any>,
  errorMessage?: string
): Promise<void> {
  const updates: any = {
    sync_status: status,
    last_sync_at: new Date().toISOString(),
  };

  if (lastSyncResult) {
    updates.last_sync_result = lastSyncResult;
  }

  if (status === 'error') {
    const { data: connector } = await supabase
      .from('secops_connectors')
      .select('error_count')
      .eq('id', id)
      .single();

    if (connector) {
      updates.error_count = connector.error_count + 1;
      updates.last_error = errorMessage;
    }
  } else if (status === 'success') {
    updates.error_count = 0;
    updates.last_error = null;
  }

  // Calculate next sync time
  const { data: connector } = await supabase
    .from('secops_connectors')
    .select('sync_interval_minutes')
    .eq('id', id)
    .single();

  if (connector) {
    const nextSync = new Date();
    nextSync.setMinutes(nextSync.getMinutes() + connector.sync_interval_minutes);
    updates.next_sync_at = nextSync.toISOString();
  }

  await updateSecOpsConnector(id, updates);
}

/**
 * Fetch connector sync logs
 */
export async function fetchConnectorSyncLogs(
  connectorId: string,
  limit: number = 20
): Promise<ConnectorSyncLog[]> {
  const { data, error } = await supabase
    .from('secops_connector_sync_logs')
    .select('*')
    .eq('connector_id', connectorId)
    .order('sync_started_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as ConnectorSyncLog[];
}

/**
 * Get active connectors count
 */
export async function getActiveConnectorsCount(): Promise<number> {
  const { count, error } = await supabase
    .from('secops_connectors')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  if (error) throw error;
  return count || 0;
}

/**
 * Get connectors with errors
 */
export async function getConnectorsWithErrors(): Promise<SecOpsConnector[]> {
  const { data, error } = await supabase
    .from('secops_connectors')
    .select('*')
    .eq('sync_status', 'error')
    .order('last_sync_at', { ascending: false });

  if (error) throw error;
  return data as SecOpsConnector[];
}
