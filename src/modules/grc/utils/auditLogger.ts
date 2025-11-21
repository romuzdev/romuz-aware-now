/**
 * GRC Audit Logger Utility
 * 🟡 Medium Priority: Audit log integration for critical operations
 * Provides helper functions for logging GRC audit-related actions
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Entity types for audit logging
 */
export const AUDIT_ENTITY_TYPES = {
  WORKFLOW: 'audit_workflow',
  FINDING: 'audit_finding',
  STAGE: 'audit_workflow_stage',
  AUDIT: 'grc_audit',
} as const;

/**
 * Action types for audit logging
 */
export const AUDIT_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  REJECT: 'reject',
  ASSIGN: 'assign',
  COMPLETE: 'complete',
  START: 'start',
  CANCEL: 'cancel',
} as const;

/**
 * Log an audit action to the audit_log table
 * 
 * @param entityType - Type of entity being logged (workflow, finding, etc.)
 * @param entityId - ID of the entity
 * @param action - Action performed (create, update, delete, etc.)
 * @param payload - Additional data to log
 * @returns Promise that resolves when log is written
 * 
 * @example
 * await logAuditAction('audit_workflow', workflowId, 'create', { workflow_type: 'planning' });
 */
export async function logAuditAction(
  entityType: string,
  entityId: string,
  action: string,
  payload?: Record<string, any>
): Promise<void> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;

    if (!userId) {
      console.warn('Cannot log audit action: No authenticated user');
      return;
    }

    // Get tenant_id from user_tenants
    const { data: tenantData } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (!tenantData?.tenant_id) {
      console.warn('Cannot log audit action: No tenant found for user');
      return;
    }

    // Insert audit log entry
    const { error } = await supabase.from('audit_log').insert({
      entity_type: entityType,
      entity_id: entityId,
      action: action,
      actor: userId,
      payload: payload || {},
      tenant_id: tenantData.tenant_id,
    });

    if (error) {
      console.error('Failed to log audit action:', error);
    }
  } catch (err) {
    console.error('Error in logAuditAction:', err);
  }
}

/**
 * Log workflow creation
 */
export async function logWorkflowCreated(
  workflowId: string,
  auditId: string,
  workflowType: string
): Promise<void> {
  await logAuditAction(
    AUDIT_ENTITY_TYPES.WORKFLOW,
    workflowId,
    AUDIT_ACTIONS.CREATE,
    { audit_id: auditId, workflow_type: workflowType }
  );
}

/**
 * Log workflow update
 */
export async function logWorkflowUpdated(
  workflowId: string,
  updates: Record<string, any>
): Promise<void> {
  await logAuditAction(
    AUDIT_ENTITY_TYPES.WORKFLOW,
    workflowId,
    AUDIT_ACTIONS.UPDATE,
    { updates }
  );
}

/**
 * Log workflow assignment
 */
export async function logWorkflowAssigned(
  workflowId: string,
  assignedTo: string
): Promise<void> {
  await logAuditAction(
    AUDIT_ENTITY_TYPES.WORKFLOW,
    workflowId,
    AUDIT_ACTIONS.ASSIGN,
    { assigned_to: assignedTo }
  );
}

/**
 * Log workflow completion
 */
export async function logWorkflowCompleted(
  workflowId: string,
  notes?: string
): Promise<void> {
  await logAuditAction(
    AUDIT_ENTITY_TYPES.WORKFLOW,
    workflowId,
    AUDIT_ACTIONS.COMPLETE,
    { notes }
  );
}

/**
 * Log workflow stage update
 */
export async function logStageUpdated(
  stageId: string,
  workflowId: string,
  status: string
): Promise<void> {
  await logAuditAction(
    AUDIT_ENTITY_TYPES.STAGE,
    stageId,
    AUDIT_ACTIONS.UPDATE,
    { workflow_id: workflowId, status }
  );
}

/**
 * Log finding creation
 */
export async function logFindingCreated(
  findingId: string,
  auditId: string,
  severity: string
): Promise<void> {
  await logAuditAction(
    AUDIT_ENTITY_TYPES.FINDING,
    findingId,
    AUDIT_ACTIONS.CREATE,
    { audit_id: auditId, severity }
  );
}

/**
 * Log finding update
 */
export async function logFindingUpdated(
  findingId: string,
  updates: Record<string, any>
): Promise<void> {
  await logAuditAction(
    AUDIT_ENTITY_TYPES.FINDING,
    findingId,
    AUDIT_ACTIONS.UPDATE,
    { updates }
  );
}

/**
 * Log finding resolution
 */
export async function logFindingResolved(
  findingId: string,
  resolutionNotes?: string
): Promise<void> {
  await logAuditAction(
    AUDIT_ENTITY_TYPES.FINDING,
    findingId,
    AUDIT_ACTIONS.COMPLETE,
    { resolution_notes: resolutionNotes }
  );
}
