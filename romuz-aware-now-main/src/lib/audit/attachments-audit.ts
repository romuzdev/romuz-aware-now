/**
 * Attachments Audit Logging Utilities
 * 
 * Provides standalone functions for logging attachment operations
 * to the audit_log table for compliance and tracking purposes.
 * 
 * @module lib/audit/attachments-audit
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Log attachment creation to audit log
 * 
 * @param attachmentId - ID of the created attachment
 * @param payload - Additional metadata about the attachment
 */
export async function logAttachmentCreated(
  attachmentId: string,
  payload: {
    filename: string;
    mime_type: string;
    file_size_bytes: number;
    is_private: boolean;
    linked_module?: string | null;
    linked_entity_id?: string | null;
    document_id?: string | null;
  }
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('[logAttachmentCreated] No authenticated user, skipping audit log');
      return;
    }

    // Get tenant_id via RPC
    const { data: tenantId } = await supabase
      .rpc('get_user_tenant_id', { _user_id: user.id });

    if (!tenantId) {
      console.warn('[logAttachmentCreated] No tenant ID found, skipping audit log');
      return;
    }

    await supabase.from('audit_log').insert({
      tenant_id: tenantId,
      entity_type: 'attachment',
      entity_id: attachmentId,
      action: 'attachment.created',
      actor: user.id,
      payload: {
        ...payload,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    // Don't fail the operation if audit logging fails
    console.error('[logAttachmentCreated] Audit logging failed:', err);
  }
}

/**
 * Log attachment deletion to audit log
 * 
 * @param attachmentId - ID of the deleted attachment
 * @param payload - Metadata about the deleted attachment
 */
export async function logAttachmentDeleted(
  attachmentId: string,
  payload: {
    filename: string;
    storage_path: string;
    linked_module?: string | null;
    linked_entity_id?: string | null;
  }
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('[logAttachmentDeleted] No authenticated user, skipping audit log');
      return;
    }

    // Get tenant_id via RPC
    const { data: tenantId } = await supabase
      .rpc('get_user_tenant_id', { _user_id: user.id });

    if (!tenantId) {
      console.warn('[logAttachmentDeleted] No tenant ID found, skipping audit log');
      return;
    }

    await supabase.from('audit_log').insert({
      tenant_id: tenantId,
      entity_type: 'attachment',
      entity_id: attachmentId,
      action: 'attachment.deleted',
      actor: user.id,
      payload: {
        ...payload,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    // Don't fail the operation if audit logging fails
    console.error('[logAttachmentDeleted] Audit logging failed:', err);
  }
}
