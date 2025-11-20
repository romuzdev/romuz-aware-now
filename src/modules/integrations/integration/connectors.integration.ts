/**
 * Integration Connectors Data Layer
 * Gate-M15: CRUD operations for integration connectors
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  IntegrationConnector,
  CreateConnectorInput,
  UpdateConnectorInput,
} from '../types';

/**
 * Fetch all connectors for the current tenant
 */
export async function fetchConnectors(tenantId: string): Promise<IntegrationConnector[]> {
  const { data, error } = await supabase
    .from('integration_connectors')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ fetchConnectors error:', error);
    throw new Error(error.message);
  }

  return data as IntegrationConnector[];
}

/**
 * Fetch connectors by type
 */
export async function fetchConnectorsByType(
  tenantId: string,
  type: string
): Promise<IntegrationConnector[]> {
  const { data, error } = await supabase
    .from('integration_connectors')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('type', type)
    .order('created_at', { ascending: false});

  if (error) {
    console.error('❌ fetchConnectorsByType error:', error);
    throw new Error(error.message);
  }

  return data as IntegrationConnector[];
}

/**
 * Fetch single connector by ID
 */
export async function fetchConnectorById(
  tenantId: string,
  connectorId: string
): Promise<IntegrationConnector | null> {
  const { data, error } = await supabase
    .from('integration_connectors')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', connectorId)
    .maybeSingle();

  if (error) {
    console.error('❌ fetchConnectorById error:', error);
    throw new Error(error.message);
  }

  return data as IntegrationConnector | null;
}

/**
 * Create a new connector
 */
export async function createConnector(
  tenantId: string,
  input: CreateConnectorInput
): Promise<IntegrationConnector> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('المستخدم غير مصرح');

  const { data, error } = await supabase
    .from('integration_connectors')
    .insert({
      tenant_id: tenantId,
      name: input.name,
      description: input.description || null,
      type: input.type,
      config: input.config,
      sync_frequency_minutes: input.sync_frequency_minutes || 60,
      status: 'inactive',
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ createConnector error:', error);
    throw new Error(error.message);
  }

  return data as IntegrationConnector;
}

/**
 * Update an existing connector
 */
export async function updateConnector(
  tenantId: string,
  connectorId: string,
  input: UpdateConnectorInput
): Promise<IntegrationConnector> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('المستخدم غير مصرح');

  const { data, error } = await supabase
    .from('integration_connectors')
    .update({
      ...input,
      updated_by: user.id,
    })
    .eq('tenant_id', tenantId)
    .eq('id', connectorId)
    .select()
    .single();

  if (error) {
    console.error('❌ updateConnector error:', error);
    throw new Error(error.message);
  }

  return data as IntegrationConnector;
}

/**
 * Delete a connector
 */
export async function deleteConnector(
  tenantId: string,
  connectorId: string
): Promise<void> {
  const { error } = await supabase
    .from('integration_connectors')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('id', connectorId);

  if (error) {
    console.error('❌ deleteConnector error:', error);
    throw new Error(error.message);
  }
}

/**
 * Activate a connector
 */
export async function activateConnector(
  tenantId: string,
  connectorId: string
): Promise<IntegrationConnector> {
  return updateConnector(tenantId, connectorId, { status: 'active' });
}

/**
 * Deactivate a connector
 */
export async function deactivateConnector(
  tenantId: string,
  connectorId: string
): Promise<IntegrationConnector> {
  return updateConnector(tenantId, connectorId, { status: 'inactive' });
}

/**
 * Update last sync timestamp
 */
export async function updateLastSync(
  tenantId: string,
  connectorId: string
): Promise<void> {
  const { error } = await supabase
    .from('integration_connectors')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('tenant_id', tenantId)
    .eq('id', connectorId);

  if (error) {
    console.error('❌ updateLastSync error:', error);
    throw new Error(error.message);
  }
}
