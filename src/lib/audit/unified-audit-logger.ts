/**
 * Unified Audit Logger
 * 
 * Centralized audit logging system for all modules
 * Supports both audit_log and transaction_log tables
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Standard audit action types
 */
export type AuditAction = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'approve'
  | 'reject'
  | 'close'
  | 'cancel'
  | 'complete'
  | 'archive'
  | 'restore';

/**
 * Entity types supported by the audit system
 */
export type EntityType =
  // GRC Module
  | 'policy'
  | 'risk'
  | 'control'
  | 'compliance_requirement'
  | 'compliance_gap'
  | 'audit'
  | 'audit_finding'
  | 'audit_workflow'
  // Governance Module
  | 'committee'
  | 'committee_workflow'
  | 'meeting'
  | 'decision'
  | 'objective'
  // Documents Module
  | 'document'
  | 'document_version'
  | 'workflow_rule'
  // Awareness Module
  | 'campaign'
  | 'policy_assignment'
  // Third-Party Risk
  | 'vendor'
  | 'vendor_assessment'
  | 'contract'
  // Action Plans
  | 'action_plan'
  | 'milestone'
  | 'followup'
  // Generic
  | 'other';

/**
 * Audit log entry parameters
 */
interface AuditLogParams {
  entityType: EntityType;
  entityId: string;
  action: AuditAction;
  payload?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Core audit logging function
 * Writes to audit_log table
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('[Audit] No authenticated user');
      return;
    }

    // Get tenant_id from user_tenants
    const { data: userTenant } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (!userTenant?.tenant_id) {
      console.warn('[Audit] No tenant found for user');
      return;
    }

    const { error } = await supabase
      .from('audit_log')
      .insert({
        tenant_id: userTenant.tenant_id,
        actor: user.id,
        entity_type: params.entityType,
        entity_id: params.entityId,
        action: params.action,
        payload: params.payload || {},
      });

    if (error) {
      console.error('[Audit] Failed to log:', error);
    }
  } catch (err) {
    console.error('[Audit] Exception:', err);
  }
}

/**
 * Get transaction history for a record
 * Reads from transaction_log table
 */
export async function getTransactionHistory(
  tableName: string,
  recordId: string,
  limit: number = 50
) {
  try {
    const { data, error } = await supabase.rpc('get_transaction_history', {
      p_table_name: tableName,
      p_record_id: recordId,
      p_limit: limit
    });

    if (error) {
      console.error('[Transaction] Failed to get history:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[Transaction] Exception:', err);
    return [];
  }
}

/**
 * Get audit log for a specific entity
 */
export async function getAuditLog(
  entityType: EntityType,
  entityId: string,
  limit: number = 50
) {
  try {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Audit] Failed to get log:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[Audit] Exception:', err);
    return [];
  }
}

// ========================================
// Module-Specific Helper Functions
// ========================================

/**
 * GRC Module
 */
export const logPolicyAction = (policyId: string, action: AuditAction, payload?: Record<string, any>) =>
  logAudit({ entityType: 'policy', entityId: policyId, action, payload });

export const logRiskAction = (riskId: string, action: AuditAction, payload?: Record<string, any>) =>
  logAudit({ entityType: 'risk', entityId: riskId, action, payload });

export const logControlAction = (controlId: string, action: AuditAction, payload?: Record<string, any>) =>
  logAudit({ entityType: 'control', entityId: controlId, action, payload });

export const logAuditAction = (auditId: string, action: AuditAction, payload?: Record<string, any>) =>
  logAudit({ entityType: 'audit', entityId: auditId, action, payload });

export const logAuditFindingAction = (findingId: string, action: AuditAction, payload?: Record<string, any>) =>
  logAudit({ entityType: 'audit_finding', entityId: findingId, action, payload });

/**
 * Governance Module
 */
export const logCommitteeAction = (committeeId: string, action: AuditAction, payload?: Record<string, any>) =>
  logAudit({ entityType: 'committee', entityId: committeeId, action, payload });

export const logMeetingAction = (meetingId: string, action: AuditAction, payload?: Record<string, any>) =>
  logAudit({ entityType: 'meeting', entityId: meetingId, action, payload });

export const logDecisionAction = (decisionId: string, action: AuditAction, payload?: Record<string, any>) =>
  logAudit({ entityType: 'decision', entityId: decisionId, action, payload });

export const logObjectiveAction = (objectiveId: string, action: AuditAction, payload?: Record<string, any>) =>
  logAudit({ entityType: 'objective', entityId: objectiveId, action, payload });

/**
 * Documents Module
 */
export const logDocumentAction = (documentId: string, action: AuditAction, payload?: Record<string, any>) =>
  logAudit({ entityType: 'document', entityId: documentId, action, payload });

/**
 * Awareness Module
 */
export const logCampaignAction = (campaignId: string, action: AuditAction, payload?: Record<string, any>) =>
  logAudit({ entityType: 'campaign', entityId: campaignId, action, payload });

/**
 * Third-Party Risk Module
 */
export const logVendorAction = (vendorId: string, action: AuditAction, payload?: Record<string, any>) =>
  logAudit({ entityType: 'vendor', entityId: vendorId, action, payload });

export const logVendorAssessmentAction = (assessmentId: string, action: AuditAction, payload?: Record<string, any>) =>
  logAudit({ entityType: 'vendor_assessment', entityId: assessmentId, action, payload });

export const logContractAction = (contractId: string, action: AuditAction, payload?: Record<string, any>) =>
  logAudit({ entityType: 'contract', entityId: contractId, action, payload });

/**
 * Action Plans Module
 */
export const logActionPlanAction = (actionPlanId: string, action: AuditAction, payload?: Record<string, any>) =>
  logAudit({ entityType: 'action_plan', entityId: actionPlanId, action, payload });

export const logMilestoneAction = (milestoneId: string, action: AuditAction, payload?: Record<string, any>) =>
  logAudit({ entityType: 'milestone', entityId: milestoneId, action, payload });

export const logFollowupAction = (followupId: string, action: AuditAction, payload?: Record<string, any>) =>
  logAudit({ entityType: 'followup', entityId: followupId, action, payload });
