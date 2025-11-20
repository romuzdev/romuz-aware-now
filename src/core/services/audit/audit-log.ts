/**
 * Audit Log Service
 * 
 * Provides utilities for logging actions to audit_log table
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Log an audit entry
 */
export async function logAuditAction(params: {
  entityType: string;
  entityId: string;
  action: string;
  payload?: Record<string, any>;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.warn('No authenticated user for audit log');
    return;
  }

  // Get tenant_id from user_tenants
  const { data: userTenant } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!userTenant?.tenant_id) {
    console.warn('No tenant found for user in audit log');
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
    console.error('Failed to log audit entry:', error);
  }
}

/**
 * Log committee actions
 */
export const logCommitteeAction = (
  committeeId: string,
  action: 'create' | 'update' | 'delete' | 'read',
  payload?: Record<string, any>
) =>
  logAuditAction({
    entityType: 'committee',
    entityId: committeeId,
    action,
    payload,
  });

/**
 * Log meeting actions
 */
export const logMeetingAction = (
  meetingId: string,
  action: 'create' | 'update' | 'delete' | 'close' | 'cancel',
  payload?: Record<string, any>
) =>
  logAuditAction({
    entityType: 'meeting',
    entityId: meetingId,
    action,
    payload,
  });

/**
 * Log decision actions
 */
export const logDecisionAction = (
  decisionId: string,
  action: 'create' | 'update' | 'delete',
  payload?: Record<string, any>
) =>
  logAuditAction({
    entityType: 'decision',
    entityId: decisionId,
    action,
    payload,
  });

/**
 * Log followup actions
 */
export const logFollowupAction = (
  followupId: string,
  action: 'create' | 'update' | 'delete' | 'complete',
  payload?: Record<string, any>
) =>
  logAuditAction({
    entityType: 'followup',
    entityId: followupId,
    action,
    payload,
  });
