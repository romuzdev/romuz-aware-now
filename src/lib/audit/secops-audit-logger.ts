/**
 * SecOps Audit Logger
 * M18.5 - Unified audit trail for SecOps operations
 */

import { supabase } from '@/integrations/supabase/client';

export interface SecOpsAuditEntry {
  entityType: 'security_event' | 'soar_playbook' | 'soar_execution' | 'secops_connector' | 'correlation_rule';
  entityId: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute' | 'sync' | 'activate' | 'deactivate';
  payload?: Record<string, any>;
}

/**
 * Log an audit action for SecOps operations
 */
export async function logSecOpsAudit(entry: SecOpsAuditEntry): Promise<void> {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn('[SecOps Audit] No authenticated user, skipping audit log');
      return;
    }

    // Get tenant_id from user_tenants
    const { data: userTenant } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (!userTenant?.tenant_id) {
      console.warn('[SecOps Audit] No tenant found for user, skipping audit log');
      return;
    }

    // Insert audit log entry
    const { error } = await supabase.from('audit_log').insert({
      tenant_id: userTenant.tenant_id,
      actor: user.id,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      action: entry.action,
      payload: entry.payload || {},
    });

    if (error) {
      console.error('[SecOps Audit] Failed to log audit entry:', error);
    }
  } catch (error) {
    console.error('[SecOps Audit] Unexpected error:', error);
  }
}

/**
 * Security Event Actions
 */
export const logSecurityEventAction = (
  eventId: string,
  action: 'create' | 'read' | 'update' | 'delete',
  payload?: Record<string, any>
) =>
  logSecOpsAudit({
    entityType: 'security_event',
    entityId: eventId,
    action,
    payload,
  });

/**
 * SOAR Playbook Actions
 */
export const logPlaybookAction = (
  playbookId: string,
  action: 'create' | 'read' | 'update' | 'delete' | 'activate' | 'deactivate',
  payload?: Record<string, any>
) =>
  logSecOpsAudit({
    entityType: 'soar_playbook',
    entityId: playbookId,
    action,
    payload,
  });

/**
 * SOAR Execution Actions
 */
export const logExecutionAction = (
  executionId: string,
  action: 'create' | 'execute' | 'update',
  payload?: Record<string, any>
) =>
  logSecOpsAudit({
    entityType: 'soar_execution',
    entityId: executionId,
    action,
    payload,
  });

/**
 * Connector Actions
 */
export const logConnectorAction = (
  connectorId: string,
  action: 'create' | 'read' | 'update' | 'delete' | 'sync' | 'activate' | 'deactivate',
  payload?: Record<string, any>
) =>
  logSecOpsAudit({
    entityType: 'secops_connector',
    entityId: connectorId,
    action,
    payload,
  });

/**
 * Correlation Rule Actions
 */
export const logCorrelationRuleAction = (
  ruleId: string,
  action: 'create' | 'read' | 'update' | 'delete' | 'activate' | 'deactivate',
  payload?: Record<string, any>
) =>
  logSecOpsAudit({
    entityType: 'correlation_rule',
    entityId: ruleId,
    action,
    payload,
  });
