/**
 * Attachment Service Layer
 * 
 * Business logic layer for attachment management operations.
 * Provides a clean interface between UI components and the database/storage layer.
 * 
 * Features:
 * - Automatic tenant/user context handling via RLS
 * - Audit logging for all operations
 * - Descriptive error handling for RBAC/RLS denials
 * - Storage operations abstraction
 * 
 * @module services/attachmentService
 */

import { supabase } from '@/integrations/supabase/client';
import {
  createAttachmentWithUpload,
  deleteAttachment as deleteAttachmentWithStorage,
} from '@/modules/documents/integration/attachments';

/**
 * List all attachments for the current tenant with optional filters
 * 
 * @param filters - Filtering and pagination options
 * @returns Promise resolving to array of attachments with total count
 * @throws Error if user is not authenticated or lacks permissions
 */
export async function listAttachments(filters: {
  linked_module?: string;
  linked_entity_id?: string;
  document_id?: string;
  is_private?: boolean;
  limit?: number;
  offset?: number;
} = {}) {
  const {
    linked_module,
    linked_entity_id,
    document_id,
    is_private,
    limit = 50,
    offset = 0,
  } = filters;

  // Build query with RLS enforcement
  let query = supabase
    .from('attachments')
    .select('*', { count: 'exact' })
    .order('uploaded_at', { ascending: false });

  // Apply filters
  if (linked_module) {
    query = query.eq('linked_module', linked_module);
  }
  if (linked_entity_id) {
    query = query.eq('linked_entity_id', linked_entity_id);
  }
  if (document_id) {
    query = query.eq('document_id', document_id);
  }
  if (typeof is_private === 'boolean') {
    query = query.eq('is_private', is_private);
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[attachmentService.listAttachments] Error:', error);
    
    if (error.message.includes('row-level security') || error.message.includes('permission denied')) {
      throw new Error('Access denied: Insufficient permissions to view attachments. Requires viewer role or higher.');
    }
    
    throw new Error(`Failed to fetch attachments: ${error.message}`);
  }

  return {
    attachments: data || [],
    total: count || 0,
  };
}

/**
 * Get attachment details by ID
 * 
 * @param attachmentId - UUID of the attachment
 * @returns Promise resolving to attachment metadata
 * @throws Error if attachment not found or access denied
 */
export async function getAttachmentById(attachmentId: string) {
  if (!attachmentId) {
    throw new Error('Attachment ID is required');
  }

  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('id', attachmentId)
    .maybeSingle();

  if (error) {
    console.error('[attachmentService.getAttachmentById] Error:', error);
    
    if (error.message.includes('row-level security') || error.message.includes('permission denied')) {
      throw new Error('Access denied: You do not have permission to view this attachment.');
    }
    
    throw new Error(`Failed to fetch attachment: ${error.message}`);
  }

  if (!data) {
    throw new Error('Attachment not found or you do not have access to it');
  }

  return data;
}

/**
 * Upload a new attachment
 * 
 * @param data - Attachment upload data
 * @returns Promise resolving to created attachment record
 * @throws Error if validation fails, storage upload fails, or user lacks permissions
 */
export async function uploadAttachment(data: {
  file: File;
  linked_module?: string;
  linked_entity_id?: string;
  document_id?: string;
  is_private?: boolean;
  notes?: string;
}) {
  const {
    file,
    linked_module,
    linked_entity_id,
    document_id,
    is_private = false,
    notes,
  } = data;

  // Validate required fields
  if (!file) {
    throw new Error('File is required');
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Upload attachment using integration helper
  try {
    const attachmentData = await createAttachmentWithUpload({
      file,
      filename: file.name,
      mimeType: file.type,
      linkedModule: linked_module || null,
      linkedEntityId: linked_entity_id || null,
      documentId: document_id || null,
      isPrivate: is_private,
      notes: notes || null,
    });

    // Log audit event
    try {
      const { data: tenantId } = await supabase
        .rpc('get_user_tenant_id', { _user_id: user.id });

      if (tenantId) {
        await supabase.from('audit_log').insert({
          tenant_id: tenantId,
          entity_type: 'attachment',
          entity_id: attachmentData.id,
          action: 'attachment.created',
          actor: user.id,
          payload: {
            filename: file.name,
            mime_type: file.type,
            file_size_bytes: file.size,
            is_private,
            linked_module,
            linked_entity_id,
            document_id,
          },
        });
      }
    } catch (auditErr) {
      console.error('[attachmentService.uploadAttachment] Audit logging failed:', auditErr);
    }

    return attachmentData;
  } catch (err) {
    console.error('[attachmentService.uploadAttachment] Error:', err);
    
    if (err instanceof Error) {
      if (err.message.includes('row-level security') || err.message.includes('permission denied')) {
        throw new Error('Access denied: Insufficient permissions to upload attachments. Requires compliance_manager or standard_user role.');
      }
      
      if (err.message.includes('storage')) {
        throw new Error('Failed to upload file to storage. Please check file size and try again.');
      }
    }
    
    throw err instanceof Error ? err : new Error('Failed to upload attachment');
  }
}

/**
 * Delete an attachment by ID
 * 
 * Removes both the database record and the storage file
 * 
 * @param attachmentId - ID of the attachment to delete
 * @returns Promise resolving to deletion confirmation
 * @throws Error if attachment not found or user lacks permissions
 */
export async function deleteAttachment(attachmentId: string) {
  if (!attachmentId) {
    throw new Error('Attachment ID is required');
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Fetch attachment to verify access and get metadata for audit log
  const { data: attachment, error: fetchError } = await supabase
    .from('attachments')
    .select('id, filename, storage_path, linked_module, linked_entity_id')
    .eq('id', attachmentId)
    .maybeSingle();

  if (fetchError || !attachment) {
    console.error('[attachmentService.deleteAttachment] Attachment not found:', fetchError);
    throw new Error('Attachment not found or you do not have access to it');
  }

  // Delete using integration helper (removes storage + DB)
  try {
    await deleteAttachmentWithStorage(attachmentId);

    // Log audit event
    try {
      const { data: tenantId } = await supabase
        .rpc('get_user_tenant_id', { _user_id: user.id });

      if (tenantId) {
        await supabase.from('audit_log').insert({
          tenant_id: tenantId,
          entity_type: 'attachment',
          entity_id: attachmentId,
          action: 'attachment.deleted',
          actor: user.id,
          payload: {
            filename: attachment.filename,
            storage_path: attachment.storage_path,
            linked_module: attachment.linked_module,
            linked_entity_id: attachment.linked_entity_id,
          },
        });
      }
    } catch (auditErr) {
      console.error('[attachmentService.deleteAttachment] Audit logging failed:', auditErr);
    }

    return {
      attachmentId,
      filename: attachment.filename,
    };
  } catch (err) {
    console.error('[attachmentService.deleteAttachment] Error:', err);
    
    if (err instanceof Error) {
      if (err.message.includes('row-level security') || err.message.includes('permission denied')) {
        throw new Error('Access denied: Insufficient permissions to delete attachments. Requires compliance_manager role.');
      }
      
      if (err.message.includes('storage')) {
        throw new Error('Failed to delete file from storage. The database record may still exist.');
      }
    }
    
    throw err instanceof Error ? err : new Error('Failed to delete attachment');
  }
}
