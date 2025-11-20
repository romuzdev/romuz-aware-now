/**
 * Document Service Layer
 * 
 * Business logic layer for document management operations.
 * Provides a clean interface between UI components and the database/storage layer.
 * 
 * Features:
 * - Automatic tenant/user context handling via RLS
 * - Audit logging for all operations
 * - Descriptive error handling for RBAC/RLS denials
 * - Storage operations abstraction
 * 
 * @module services/documentService
 */

import { supabase } from '@/integrations/supabase/client';
import {
  createDocumentVersionWithUpload,
  deleteDocumentVersion,
  getDocumentVersions,
} from '@/modules/documents/integration/document-storage';

/**
 * List all documents for the current tenant with optional filters
 * 
 * @param options - Filtering and pagination options
 * @returns Promise resolving to array of documents with total count
 * @throws Error if user is not authenticated or lacks permissions
 */
export async function listDocuments(options: {
  limit?: number;
  offset?: number;
  search?: string;
  doc_type?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
} = {}) {
  const {
    limit = 50,
    offset = 0,
    search,
    doc_type,
    status,
    date_from,
    date_to,
  } = options;

  // Build query with RLS enforcement
  let query = supabase
    .from('documents')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  // Apply filters
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }
  if (doc_type) {
    query = query.eq('doc_type', doc_type);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (date_from) {
    query = query.gte('created_at', date_from);
  }
  if (date_to) {
    // Add one day to include the entire end date
    const endDate = new Date(date_to);
    endDate.setDate(endDate.getDate() + 1);
    query = query.lt('created_at', endDate.toISOString().split('T')[0]);
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[documentService.listDocuments] Error:', error);
    
    if (error.message.includes('row-level security') || error.message.includes('permission denied')) {
      throw new Error('Access denied: Insufficient permissions to view documents. Requires viewer role or higher.');
    }
    
    throw new Error(`Failed to fetch documents: ${error.message}`);
  }

  return {
    documents: data || [],
    total: count || 0,
  };
}

/**
 * Get complete document details by ID
 * 
 * Fetches document with current version, all versions, and attachments
 * 
 * @param documentId - UUID of the document
 * @returns Promise resolving to complete document details
 * @throws Error if document not found or access denied
 */
export async function getDocumentById(documentId: string) {
  if (!documentId) {
    throw new Error('Document ID is required');
  }

  // Fetch main document
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .maybeSingle();

  if (docError) {
    console.error('[documentService.getDocumentById] Error:', docError);
    
    if (docError.message.includes('row-level security') || docError.message.includes('permission denied')) {
      throw new Error('Access denied: You do not have permission to view this document.');
    }
    
    throw new Error(`Failed to fetch document: ${docError.message}`);
  }

  if (!document) {
    throw new Error('Document not found or you do not have access to it');
  }

  // Fetch current version if exists
  let currentVersion = null;
  if (document.current_version_id) {
    const { data: versionData } = await supabase
      .from('document_versions')
      .select('*')
      .eq('id', document.current_version_id)
      .maybeSingle();
    
    currentVersion = versionData;
  }

  // Fetch all versions
  const versions = await getDocumentVersions(documentId);

  // Fetch attachments
  const { data: attachments } = await supabase
    .from('attachments')
    .select('*')
    .eq('document_id', documentId)
    .order('uploaded_at', { ascending: false });

  return {
    ...document,
    current_version: currentVersion,
    versions: versions || [],
    attachments: attachments || [],
  };
}

/**
 * Create a new document
 * 
 * @param data - Document creation data
 * @returns Promise resolving to created document
 * @throws Error if validation fails or user lacks permissions
 */
export async function createDocument(data: {
  title: string;
  description?: string;
  doc_type?: 'policy' | 'procedure' | 'guideline' | 'form' | 'report' | 'other';
  status?: 'draft' | 'review' | 'approved' | 'archived';
  linked_module?: string;
  linked_entity_id?: string;
  app_code?: string | null;
}) {
  const { title, description, doc_type, status, linked_module, linked_entity_id, app_code } = data;

  // Validate required fields
  if (!title || title.trim().length === 0) {
    throw new Error('Document title is required');
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Insert document
  const { data: document, error } = await supabase
    .from('documents')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      doc_type: doc_type || 'other',
      status: status || 'draft',
      linked_module: linked_module || null,
      linked_entity_id: linked_entity_id || null,
      app_code: app_code || null,
    })
    .select()
    .single();

  if (error) {
    console.error('[documentService.createDocument] Error:', error);
    
    if (error.message.includes('row-level security') || error.message.includes('permission denied')) {
      throw new Error('Access denied: Insufficient permissions to create documents. Requires compliance_manager or standard_user role.');
    }
    
    throw new Error(`Failed to create document: ${error.message}`);
  }

  // Log audit event
  try {
    const { data: tenantId } = await supabase
      .rpc('get_user_tenant_id', { _user_id: user.id });

    if (tenantId) {
      await supabase.from('audit_log').insert({
        tenant_id: tenantId,
        entity_type: 'document',
        entity_id: document.id,
        action: 'document.created',
        actor: user.id,
        payload: {
          title: document.title,
          doc_type: document.doc_type,
          status: document.status,
        },
      });
    }
  } catch (auditErr) {
    console.error('[documentService.createDocument] Audit logging failed:', auditErr);
  }

  return document;
}

/**
 * Upload a new version for an existing document
 * 
 * @param documentId - ID of the parent document
 * @param versionNumber - Version number (e.g., 1, 2, 3)
 * @param file - File to upload
 * @param mimeType - MIME type of the file
 * @param options - Additional version metadata
 * @returns Promise resolving to created version record
 * @throws Error if document not found, validation fails, or storage upload fails
 */
export async function uploadDocumentVersion(
  documentId: string,
  versionNumber: number,
  file: File,
  mimeType: string,
  options: {
    isMajor?: boolean;
    changeSummary?: string;
    sourceVersionId?: string;
  } = {}
) {
  if (!documentId) {
    throw new Error('Document ID is required');
  }

  if (!file) {
    throw new Error('File is required');
  }

  if (!mimeType) {
    throw new Error('MIME type is required');
  }

  if (!versionNumber || versionNumber < 1) {
    throw new Error('Valid version number is required');
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Verify document exists and user has access
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('id, tenant_id, title')
    .eq('id', documentId)
    .maybeSingle();

  if (docError || !document) {
    console.error('[documentService.uploadDocumentVersion] Document not found:', docError);
    throw new Error('Document not found or you do not have access to it');
  }

  // Upload version using integration helper
  try {
    const versionData = await createDocumentVersionWithUpload({
      documentId,
      file,
      filename: file.name,
      mimeType,
      versionNumber,
      isMajor: options.isMajor,
      changeSummary: options.changeSummary,
      sourceVersionId: options.sourceVersionId,
    });

    // Log audit event
    try {
      const { data: tenantId } = await supabase
        .rpc('get_user_tenant_id', { _user_id: user.id });

      if (tenantId) {
        await supabase.from('audit_log').insert({
          tenant_id: tenantId,
          entity_type: 'document_version',
          entity_id: versionData.id,
          action: 'document_version.uploaded',
          actor: user.id,
          payload: {
            document_id: documentId,
            document_title: document.title,
            version_number: versionNumber,
            filename: file.name,
            file_size_bytes: file.size,
            is_major: options.isMajor || true,
          },
        });
      }
    } catch (auditErr) {
      console.error('[documentService.uploadDocumentVersion] Audit logging failed:', auditErr);
    }

    return versionData;
  } catch (err) {
    console.error('[documentService.uploadDocumentVersion] Error:', err);
    
    if (err instanceof Error) {
      if (err.message.includes('row-level security') || err.message.includes('permission denied')) {
        throw new Error('Access denied: Insufficient permissions to upload document versions. Requires compliance_manager or standard_user role.');
      }
      
      if (err.message.includes('storage')) {
        throw new Error('Failed to upload file to storage. Please check file size and try again.');
      }
    }
    
    throw err instanceof Error ? err : new Error('Failed to upload document version');
  }
}

/**
 * Delete a document by ID
 * 
 * @param documentId - ID of the document to delete
 * @param cascade - If true, also delete all versions and attachments (default: false)
 * @returns Promise resolving to deletion confirmation
 * @throws Error if document not found or user lacks permissions
 */
export async function deleteDocument(documentId: string, cascade: boolean = false) {
  if (!documentId) {
    throw new Error('Document ID is required');
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Verify document exists and user has access
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('id, title')
    .eq('id', documentId)
    .maybeSingle();

  if (docError || !document) {
    console.error('[documentService.deleteDocument] Document not found:', docError);
    throw new Error('Document not found or you do not have access to it');
  }

  let deletedVersionsCount = 0;
  let deletedAttachmentsCount = 0;

  // Cascade delete if requested
  if (cascade) {
    // Delete all versions
    const { data: versions } = await supabase
      .from('document_versions')
      .select('id')
      .eq('document_id', documentId);

    if (versions && versions.length > 0) {
      for (const version of versions) {
        try {
          await deleteDocumentVersion(version.id);
          deletedVersionsCount++;
        } catch (err) {
          console.error('[documentService.deleteDocument] Error deleting version:', err);
        }
      }
    }

    // Delete all attachments
    const { data: attachments } = await supabase
      .from('attachments')
      .select('id, storage_path')
      .eq('document_id', documentId);

    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        try {
          // Delete from storage
          await supabase.storage
            .from('attachments')
            .remove([attachment.storage_path]);

          // Delete from database
          await supabase
            .from('attachments')
            .delete()
            .eq('id', attachment.id);

          deletedAttachmentsCount++;
        } catch (err) {
          console.error('[documentService.deleteDocument] Error deleting attachment:', err);
        }
      }
    }
  }

  // Delete the document
  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (deleteError) {
    console.error('[documentService.deleteDocument] Error:', deleteError);
    
    if (deleteError.message.includes('row-level security') || deleteError.message.includes('permission denied')) {
      throw new Error('Access denied: Insufficient permissions to delete documents. Requires compliance_manager role.');
    }
    
    throw new Error(`Failed to delete document: ${deleteError.message}`);
  }

  // Log audit event
  try {
    const { data: tenantId } = await supabase
      .rpc('get_user_tenant_id', { _user_id: user.id });

    if (tenantId) {
      await supabase.from('audit_log').insert({
        tenant_id: tenantId,
        entity_type: 'document',
        entity_id: documentId,
        action: 'document.deleted',
        actor: user.id,
        payload: {
          title: document.title,
          cascade,
          deleted_versions: deletedVersionsCount,
          deleted_attachments: deletedAttachmentsCount,
        },
      });
    }
  } catch (auditErr) {
    console.error('[documentService.deleteDocument] Audit logging failed:', auditErr);
  }

  return {
    documentId,
    deletedVersionsCount,
    deletedAttachmentsCount,
  };
}
