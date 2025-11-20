/**
 * M18: Incident Response System - Audit Logger
 * Unified audit trail for incident operations
 */

import { supabase } from '@/integrations/supabase/client';

export interface IncidentAuditEntry {
  entityType: 'incident' | 'incident_timeline' | 'response_plan';
  entityId: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'acknowledge' | 'assign' | 'close';
  payload?: Record<string, any>;
}

/**
 * Log an incident audit action
 */
export async function logIncidentAudit(entry: IncidentAuditEntry): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('[IncidentAudit] No authenticated user, skipping audit log');
      return;
    }

    const { data: userTenant } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (!userTenant?.tenant_id) {
      console.warn('[IncidentAudit] No tenant found for user, skipping audit log');
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
      console.error('[IncidentAudit] Failed to log audit entry:', error);
    }
  } catch (error) {
    console.error('[IncidentAudit] Unexpected error:', error);
  }
}

// Convenience helpers
export const logIncidentAction = (
  incidentId: string,
  action: 'create' | 'read' | 'update' | 'delete' | 'acknowledge' | 'assign' | 'close',
  payload?: Record<string, any>
) => logIncidentAudit({ entityType: 'incident', entityId: incidentId, action, payload });

export const logResponsePlanAction = (
  planId: string,
  action: 'create' | 'read' | 'update' | 'delete',
  payload?: Record<string, any>
) => logIncidentAudit({ entityType: 'response_plan', entityId: planId, action, payload });
