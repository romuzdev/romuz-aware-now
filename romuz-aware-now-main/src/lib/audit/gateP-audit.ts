/**
 * Gate-P Audit Logging
 * Tracks all password-protected operations in Gate-P
 */

import { supabase } from '@/integrations/supabase/client';

export type GatePAction = 
  | 'tenant_suspend'
  | 'tenant_reactivate'
  | 'tenant_deprovision'
  | 'settings_update'
  | 'job_create'
  | 'job_update'
  | 'job_delete'
  | 'job_trigger'
  | 'job_toggle_status'
  | 'health_check_trigger';

export interface AuditLogEntry {
  entity_type: string;
  entity_id: string;
  action: GatePAction;
  payload?: Record<string, any>;
}

/**
 * Log a Gate-P password-protected operation
 */
export async function logGatePOperation(entry: AuditLogEntry): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user for audit log');
      return;
    }

    // Get user's tenant_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      console.error('No tenant_id found for user');
      return;
    }

    const { error } = await supabase
      .from('audit_log')
      .insert({
        tenant_id: profile.tenant_id,
        actor: user.id,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id,
        action: entry.action,
        payload: {
          ...entry.payload,
          protected_operation: true,
          timestamp: new Date().toISOString(),
        },
      });

    if (error) {
      console.error('Failed to log audit entry:', error);
    }
  } catch (err) {
    console.error('Error logging Gate-P operation:', err);
  }
}

/**
 * Log tenant lifecycle action
 */
export async function logTenantAction(
  tenantId: string,
  tenantName: string,
  action: 'tenant_suspend' | 'tenant_reactivate' | 'tenant_deprovision'
): Promise<void> {
  await logGatePOperation({
    entity_type: 'tenant',
    entity_id: tenantId,
    action,
    payload: {
      tenant_name: tenantName,
      operation_type: 'lifecycle_management',
    },
  });
}

/**
 * Log settings update action
 */
export async function logSettingsUpdate(
  tenantId: string,
  changes: Record<string, any>
): Promise<void> {
  await logGatePOperation({
    entity_type: 'admin_settings',
    entity_id: tenantId,
    action: 'settings_update',
    payload: {
      changes,
      operation_type: 'configuration_update',
    },
  });
}

/**
 * Log job management action
 */
export async function logJobAction(
  jobId: string,
  jobKey: string,
  action: 'job_create' | 'job_update' | 'job_delete' | 'job_trigger' | 'job_toggle_status',
  details?: Record<string, any>
): Promise<void> {
  await logGatePOperation({
    entity_type: 'system_job',
    entity_id: jobId,
    action,
    payload: {
      job_key: jobKey,
      ...details,
      operation_type: 'job_management',
    },
  });
}

/**
 * Log health check trigger
 */
export async function logHealthCheckTrigger(
  details?: Record<string, any>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No authenticated user for audit log');
    return;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  await logGatePOperation({
    entity_type: 'tenant_health',
    entity_id: profile?.tenant_id || user.id,
    action: 'health_check_trigger',
    payload: {
      ...details,
      operation_type: 'health_monitoring',
    },
  });
}
