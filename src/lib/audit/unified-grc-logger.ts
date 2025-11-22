/**
 * Unified GRC Audit Logger
 * Phase 2: Integration Layer Enhancement
 * 
 * Provides consistent audit logging for ALL GRC modules:
 * - Risks, Controls, Compliance, Frameworks, Policies, Committees, Meetings, Decisions
 */

import { supabase } from '@/integrations/supabase/client';

export type GRCEntityType = 
  // Audit Module
  | 'grc_audit'
  | 'audit_workflow'
  | 'audit_finding'
  | 'audit_stage'
  // Risk Management
  | 'grc_risk'
  | 'risk_assessment'
  | 'risk_treatment'
  // Control Management
  | 'grc_control'
  | 'control_test'
  // Compliance
  | 'compliance_framework'
  | 'compliance_requirement'
  | 'compliance_gap'
  // Policies
  | 'policy'
  | 'policy_version'
  // Governance
  | 'committee'
  | 'meeting'
  | 'decision'
  // Documents
  | 'document';

export type GRCActionType =
  // CRUD Operations
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  // Workflow Operations
  | 'workflow_start'
  | 'workflow_complete'
  | 'workflow_cancel'
  | 'stage_start'
  | 'stage_complete'
  // Risk Operations
  | 'risk_assess'
  | 'risk_treat'
  | 'risk_monitor'
  | 'risk_close'
  // Control Operations
  | 'control_test'
  | 'control_implement'
  // Compliance Operations
  | 'compliance_assess'
  | 'compliance_gap_identify'
  | 'compliance_remediate'
  // Policy Operations
  | 'policy_approve'
  | 'policy_publish'
  | 'policy_retire'
  // Committee Operations
  | 'meeting_schedule'
  | 'meeting_complete'
  | 'decision_make'
  // Finding Operations
  | 'finding_add'
  | 'finding_resolve'
  | 'finding_verify'
  // Report Operations
  | 'report_generate'
  | 'export'
  // Backup Operations
  | 'backup_create'
  | 'backup_restore';

export interface UnifiedGRCLogEntry {
  entityType: GRCEntityType;
  entityId: string;
  action: GRCActionType;
  payload?: Record<string, any>;
}

/**
 * Core audit logging function
 */
export async function logGRCAction(entry: UnifiedGRCLogEntry): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('[Unified GRC Logger] No authenticated user');
      return;
    }

    const { data: userTenant } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (!userTenant?.tenant_id) {
      console.warn('[Unified GRC Logger] No tenant found');
      return;
    }

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
      console.error('[Unified GRC Logger] Failed:', error);
    }
  } catch (error) {
    console.error('[Unified GRC Logger] Unexpected error:', error);
  }
}

/**
 * ===== RISK MANAGEMENT AUDIT HELPERS =====
 */
export const logRiskCreate = (riskId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'grc_risk', entityId: riskId, action: 'create', payload });

export const logRiskUpdate = (riskId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'grc_risk', entityId: riskId, action: 'update', payload });

export const logRiskDelete = (riskId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'grc_risk', entityId: riskId, action: 'delete', payload });

export const logRiskAssess = (riskId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'grc_risk', entityId: riskId, action: 'risk_assess', payload });

export const logRiskTreat = (riskId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'grc_risk', entityId: riskId, action: 'risk_treat', payload });

export const logRiskClose = (riskId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'grc_risk', entityId: riskId, action: 'risk_close', payload });

/**
 * ===== CONTROL MANAGEMENT AUDIT HELPERS =====
 */
export const logControlCreate = (controlId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'grc_control', entityId: controlId, action: 'create', payload });

export const logControlUpdate = (controlId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'grc_control', entityId: controlId, action: 'update', payload });

export const logControlDelete = (controlId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'grc_control', entityId: controlId, action: 'delete', payload });

export const logControlTest = (controlId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'grc_control', entityId: controlId, action: 'control_test', payload });

export const logControlImplement = (controlId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'grc_control', entityId: controlId, action: 'control_implement', payload });

/**
 * ===== COMPLIANCE AUDIT HELPERS =====
 */
export const logComplianceFrameworkCreate = (frameworkId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'compliance_framework', entityId: frameworkId, action: 'create', payload });

export const logComplianceRequirementCreate = (reqId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'compliance_requirement', entityId: reqId, action: 'create', payload });

export const logComplianceAssess = (reqId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'compliance_requirement', entityId: reqId, action: 'compliance_assess', payload });

export const logComplianceGapIdentify = (gapId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'compliance_gap', entityId: gapId, action: 'compliance_gap_identify', payload });

export const logComplianceRemediate = (gapId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'compliance_gap', entityId: gapId, action: 'compliance_remediate', payload });

/**
 * ===== POLICY MANAGEMENT AUDIT HELPERS =====
 */
export const logPolicyCreate = (policyId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'policy', entityId: policyId, action: 'create', payload });

export const logPolicyUpdate = (policyId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'policy', entityId: policyId, action: 'update', payload });

export const logPolicyDelete = (policyId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'policy', entityId: policyId, action: 'delete', payload });

export const logPolicyApprove = (policyId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'policy', entityId: policyId, action: 'policy_approve', payload });

export const logPolicyPublish = (policyId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'policy', entityId: policyId, action: 'policy_publish', payload });

export const logPolicyRetire = (policyId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'policy', entityId: policyId, action: 'policy_retire', payload });

/**
 * ===== GOVERNANCE (COMMITTEES & MEETINGS) AUDIT HELPERS =====
 */
export const logCommitteeCreate = (committeeId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'committee', entityId: committeeId, action: 'create', payload });

export const logMeetingSchedule = (meetingId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'meeting', entityId: meetingId, action: 'meeting_schedule', payload });

export const logMeetingComplete = (meetingId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'meeting', entityId: meetingId, action: 'meeting_complete', payload });

export const logDecisionMake = (decisionId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'decision', entityId: decisionId, action: 'decision_make', payload });

/**
 * ===== AUDIT MODULE HELPERS (Re-export from grc-audit-logger) =====
 */
export const logAuditCreate = (auditId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'grc_audit', entityId: auditId, action: 'create', payload });

export const logAuditUpdate = (auditId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'grc_audit', entityId: auditId, action: 'update', payload });

export const logWorkflowStart = (workflowId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'audit_workflow', entityId: workflowId, action: 'workflow_start', payload });

export const logWorkflowComplete = (workflowId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'audit_workflow', entityId: workflowId, action: 'workflow_complete', payload });

export const logFindingAdd = (findingId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'audit_finding', entityId: findingId, action: 'finding_add', payload });

export const logFindingResolve = (findingId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'audit_finding', entityId: findingId, action: 'finding_resolve', payload });

/**
 * ===== DOCUMENT AUDIT HELPERS =====
 */
export const logDocumentCreate = (documentId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'document', entityId: documentId, action: 'create', payload });

export const logDocumentUpdate = (documentId: string, payload?: Record<string, any>) =>
  logGRCAction({ entityType: 'document', entityId: documentId, action: 'update', payload });

/**
 * ===== REPORT & EXPORT HELPERS =====
 */
export const logReportGenerate = (entityId: string, entityType: GRCEntityType, payload?: Record<string, any>) =>
  logGRCAction({ entityType, entityId, action: 'report_generate', payload });

export const logExport = (entityId: string, entityType: GRCEntityType, payload?: Record<string, any>) =>
  logGRCAction({ entityType, entityId, action: 'export', payload });

/**
 * ===== BACKUP HELPERS =====
 */
export const logBackupCreate = (entityId: string, entityType: GRCEntityType, payload?: Record<string, any>) =>
  logGRCAction({ entityType, entityId, action: 'backup_create', payload });

export const logBackupRestore = (entityId: string, entityType: GRCEntityType, payload?: Record<string, any>) =>
  logGRCAction({ entityType, entityId, action: 'backup_restore', payload });
