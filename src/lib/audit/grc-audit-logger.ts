/**
 * GRC Audit Logger
 * Unified audit trail for GRC Audit Module (M12)
 * 
 * Provides consistent audit logging for all audit-related operations
 */

import { supabase } from '@/integrations/supabase/client';

export interface GRCAuditLogEntry {
  entityType: 'grc_audit' | 'audit_workflow' | 'audit_finding' | 'audit_stage';
  entityId: string;
  action: 
    | 'create' 
    | 'read' 
    | 'update' 
    | 'delete' 
    | 'workflow_start'
    | 'workflow_complete'
    | 'stage_start'
    | 'stage_complete'
    | 'finding_add'
    | 'finding_resolve'
    | 'finding_verify'
    | 'report_generate'
    | 'export';
  payload?: Record<string, any>;
}

/**
 * Log an audit action to the audit_log table
 */
export async function logGRCAuditAction(entry: GRCAuditLogEntry): Promise<void> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('[GRC Audit] No authenticated user, skipping audit log');
      return;
    }

    // Get tenant_id from user_tenants
    const { data: userTenant } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (!userTenant?.tenant_id) {
      console.warn('[GRC Audit] No tenant found for user, skipping audit log');
      return;
    }

    // Insert audit log entry
    const { error } = await supabase
      .from('audit_log')
      .insert({
        tenant_id: userTenant.tenant_id,
        actor: user.id,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        action: entry.action,
        payload: entry.payload || {},
      });

    if (error) {
      console.error('[GRC Audit] Failed to log audit entry:', error);
    }
  } catch (error) {
    console.error('[GRC Audit] Unexpected error:', error);
  }
}

/**
 * Module-specific audit helpers for GRC Audits
 */

// Audit CRUD operations
export const logAuditCreate = (
  auditId: string,
  payload?: Record<string, any>
) => logGRCAuditAction({ 
  entityType: 'grc_audit', 
  entityId: auditId, 
  action: 'create', 
  payload 
});

export const logAuditRead = (
  auditId: string,
  payload?: Record<string, any>
) => logGRCAuditAction({ 
  entityType: 'grc_audit', 
  entityId: auditId, 
  action: 'read', 
  payload 
});

export const logAuditUpdate = (
  auditId: string,
  payload?: Record<string, any>
) => logGRCAuditAction({ 
  entityType: 'grc_audit', 
  entityId: auditId, 
  action: 'update', 
  payload 
});

export const logAuditDelete = (
  auditId: string,
  payload?: Record<string, any>
) => logGRCAuditAction({ 
  entityType: 'grc_audit', 
  entityId: auditId, 
  action: 'delete', 
  payload 
});

// Workflow operations
export const logWorkflowStart = (
  workflowId: string,
  payload?: Record<string, any>
) => logGRCAuditAction({ 
  entityType: 'audit_workflow', 
  entityId: workflowId, 
  action: 'workflow_start', 
  payload 
});

export const logWorkflowComplete = (
  workflowId: string,
  payload?: Record<string, any>
) => logGRCAuditAction({ 
  entityType: 'audit_workflow', 
  entityId: workflowId, 
  action: 'workflow_complete', 
  payload 
});

export const logStageStart = (
  stageId: string,
  payload?: Record<string, any>
) => logGRCAuditAction({ 
  entityType: 'audit_stage', 
  entityId: stageId, 
  action: 'stage_start', 
  payload 
});

export const logStageComplete = (
  stageId: string,
  payload?: Record<string, any>
) => logGRCAuditAction({ 
  entityType: 'audit_stage', 
  entityId: stageId, 
  action: 'stage_complete', 
  payload 
});

// Finding operations
export const logFindingAdd = (
  findingId: string,
  payload?: Record<string, any>
) => logGRCAuditAction({ 
  entityType: 'audit_finding', 
  entityId: findingId, 
  action: 'finding_add', 
  payload 
});

export const logFindingResolve = (
  findingId: string,
  payload?: Record<string, any>
) => logGRCAuditAction({ 
  entityType: 'audit_finding', 
  entityId: findingId, 
  action: 'finding_resolve', 
  payload 
});

export const logFindingVerify = (
  findingId: string,
  payload?: Record<string, any>
) => logGRCAuditAction({ 
  entityType: 'audit_finding', 
  entityId: findingId, 
  action: 'finding_verify', 
  payload 
});

// Report & Export operations
export const logReportGenerate = (
  auditId: string,
  payload?: Record<string, any>
) => logGRCAuditAction({ 
  entityType: 'grc_audit', 
  entityId: auditId, 
  action: 'report_generate', 
  payload 
});

export const logAuditExport = (
  auditId: string,
  payload?: Record<string, any>
) => logGRCAuditAction({ 
  entityType: 'grc_audit', 
  entityId: auditId, 
  action: 'export', 
  payload 
});
