/**
 * Unified Audit Trail System
 * Consistent audit logging across all modules
 */

import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  entityType: string;
  entityId: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'approve' | 'reject' | 'archive';
  payload?: Record<string, any>;
}

/**
 * Log an audit action to the audit_log table
 */
export async function logAuditAction(entry: AuditLogEntry): Promise<void> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('[Audit] No authenticated user, skipping audit log');
      return;
    }

    // Get tenant_id from user_tenants
    const { data: userTenant } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (!userTenant?.tenant_id) {
      console.warn('[Audit] No tenant found for user, skipping audit log');
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
      console.error('[Audit] Failed to log audit entry:', error);
    }
  } catch (error) {
    console.error('[Audit] Unexpected error:', error);
  }
}

/**
 * Module-specific audit helpers
 */

// M14 - Dashboards Module
export const logDashboardAction = (
  dashboardId: string,
  action: 'create' | 'read' | 'update' | 'delete',
  payload?: Record<string, any>
) => logAuditAction({ entityType: 'custom_dashboard', entityId: dashboardId, action, payload });

export const logWidgetAction = (
  widgetId: string,
  action: 'create' | 'read' | 'update' | 'delete',
  payload?: Record<string, any>
) => logAuditAction({ entityType: 'dashboard_widget', entityId: widgetId, action, payload });

// M15 - Integrations Module
export const logIntegrationAction = (
  connectorId: string,
  action: 'create' | 'read' | 'update' | 'delete',
  payload?: Record<string, any>
) => logAuditAction({ entityType: 'integration_connector', entityId: connectorId, action, payload });

export const logSyncJobAction = (
  jobId: string,
  action: 'create' | 'read' | 'update' | 'delete',
  payload?: Record<string, any>
) => logAuditAction({ entityType: 'integration_sync_job', entityId: jobId, action, payload });

// Policies Module
export const logPolicyAction = (
  policyId: string,
  action: 'create' | 'read' | 'update' | 'delete' | 'approve',
  payload?: Record<string, any>
) => logAuditAction({ entityType: 'policy', entityId: policyId, action, payload });

// GRC Risks Module
export const logRiskAction = (
  riskId: string,
  action: 'create' | 'read' | 'update' | 'delete',
  payload?: Record<string, any>
) => logAuditAction({ entityType: 'risk', entityId: riskId, action, payload });

// Documents Module
export const logDocumentAction = (
  documentId: string,
  action: 'create' | 'read' | 'update' | 'delete' | 'archive',
  payload?: Record<string, any>
) => logAuditAction({ entityType: 'document', entityId: documentId, action, payload });

// GRC Audits Module
export const logAuditAction_GRC = (
  auditId: string,
  action: 'create' | 'read' | 'update' | 'delete',
  payload?: Record<string, any>
) => logAuditAction({ entityType: 'grc_audit', entityId: auditId, action, payload });

// Committees Module
export const logCommitteeAction = (
  committeeId: string,
  action: 'create' | 'read' | 'update' | 'delete',
  payload?: Record<string, any>
) => logAuditAction({ entityType: 'committee', entityId: committeeId, action, payload });

// Meetings Module
export const logMeetingAction = (
  meetingId: string,
  action: 'create' | 'read' | 'update' | 'delete',
  payload?: Record<string, any>
) => logAuditAction({ entityType: 'meeting', entityId: meetingId, action, payload });

// Objectives Module
export const logObjectiveAction = (
  objectiveId: string,
  action: 'create' | 'read' | 'update' | 'delete',
  payload?: Record<string, any>
) => logAuditAction({ entityType: 'objective', entityId: objectiveId, action, payload });

// M18 - Incident Response Module
export const logIncidentAction = (
  incidentId: string,
  action: 'create' | 'read' | 'update' | 'delete',
  payload?: Record<string, any>
) => logAuditAction({ entityType: 'security_incident', entityId: incidentId, action, payload });

// M19 - Predictive Analytics Module
export const logPredictionAction = (
  predictionId: string,
  action: 'create' | 'read' | 'update' | 'delete',
  payload?: Record<string, any>
) => logAuditAction({ entityType: 'prediction_result', entityId: predictionId, action, payload });
