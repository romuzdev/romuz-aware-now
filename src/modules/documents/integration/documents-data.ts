/**
 * Documents Data Integration Layer
 * Gate-D3: Documents Module - D1 Standard
 * 
 * Handles CRUD operations for documents table (metadata only)
 * File storage operations are in documents.ts
 */

import { supabase } from '@/integrations/supabase/client';
import type { Document, DocumentStatus, DocumentType } from '@/modules/documents';

/**
 * Fetch all documents for the current tenant
 * @param appCode - Optional: filter by app_code (admin, awareness, compliance, risks, audits, committees)
 */
export async function fetchDocumentsForTenant(
  tenantId: string,
  appCode?: string | null
): Promise<Document[]> {
  let query = supabase
    .from('documents')
    .select('*')
    .eq('tenant_id', tenantId);

  // Filter by app_code if provided
  if (appCode !== undefined) {
    if (appCode === null) {
      query = query.is('app_code', null);
    } else {
      query = query.eq('app_code', appCode);
    }
  }

  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) {
    console.error('❌ Supabase fetchDocumentsForTenant error:', error.message);
    throw new Error(error.message);
  }

  return (data as Document[]) || [];
}

/**
 * Fetch documents by app code
 */
export async function fetchDocumentsByApp(
  tenantId: string,
  appCode: string
): Promise<Document[]> {
  return fetchDocumentsForTenant(tenantId, appCode);
}

/**
 * Fetch single document by its ID
 */
export async function fetchDocumentById(
  tenantId: string,
  documentId: string
): Promise<Document | null> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', documentId)
    .single();

  if (error) {
    console.error('❌ Supabase fetchDocumentById error:', error.message);
    return null;
  }

  return data as Document;
}

/**
 * Create a new document (metadata only)
 */
export async function createDocument(
  tenantId: string,
  documentData: {
    title: string;
    description?: string | null;
    doc_type: DocumentType;
    status?: DocumentStatus;
    linked_module?: string | null;
    linked_entity_id?: string | null;
    app_code?: string | null;
  }
): Promise<Document> {
  const user = (await supabase.auth.getUser()).data.user;
  
  const { data, error } = await supabase
    .from('documents')
    .insert({
      tenant_id: tenantId,
      created_by: user?.id || '',
      ...documentData,
      status: documentData.status || 'draft',
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase createDocument error:', error.message);
    throw new Error(error.message);
  }

  // Log creation in audit
  try {
    await supabase.from('audit_log').insert({
      tenant_id: tenantId,
      entity_type: 'document',
      entity_id: data.id,
      action: 'create',
      actor: user?.id || null,
      payload: { title: documentData.title, doc_type: documentData.doc_type },
    });
  } catch (err: any) {
    console.warn('⚠️ Failed to log document creation:', err.message);
  }

  return data as Document;
}

/**
 * Update an existing document
 */
export async function updateDocument(
  tenantId: string,
  documentId: string,
  documentData: Partial<{
    title: string;
    description: string | null;
    doc_type: DocumentType;
    status: DocumentStatus;
    linked_module: string | null;
    linked_entity_id: string | null;
  }>
): Promise<Document> {
  const user = (await supabase.auth.getUser()).data.user;
  
  const { data, error } = await supabase
    .from('documents')
    .update({
      ...documentData,
      updated_by: user?.id || null,
    })
    .eq('tenant_id', tenantId)
    .eq('id', documentId)
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase updateDocument error:', error.message);
    throw new Error(error.message);
  }

  // Log update in audit
  try {
    await supabase.from('audit_log').insert({
      tenant_id: tenantId,
      entity_type: 'document',
      entity_id: documentId,
      action: 'update',
      actor: user?.id || null,
      payload: { changes: documentData },
    });
  } catch (err: any) {
    console.warn('⚠️ Failed to log document update:', err.message);
  }

  return data as Document;
}

/**
 * Delete a document
 */
export async function deleteDocument(
  tenantId: string,
  documentId: string
): Promise<void> {
  // Get document details before deletion for audit log
  const document = await fetchDocumentById(tenantId, documentId);
  
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('id', documentId);

  if (error) {
    console.error('❌ Supabase deleteDocument error:', error.message);
    throw new Error(error.message);
  }

  // Log deletion in audit
  try {
    const user = (await supabase.auth.getUser()).data.user;
    await supabase.from('audit_log').insert({
      tenant_id: tenantId,
      entity_type: 'document',
      entity_id: documentId,
      action: 'delete',
      actor: user?.id || null,
      payload: { 
        deleted_title: document?.title,
        deleted_type: document?.doc_type 
      },
    });
  } catch (err: any) {
    console.warn('⚠️ Failed to log document deletion:', err.message);
  }
}

/**
 * Bulk update document status
 */
export async function bulkUpdateDocumentStatus(
  tenantId: string,
  documentIds: string[],
  newStatus: DocumentStatus
): Promise<void> {
  if (documentIds.length === 0) {
    throw new Error('لا توجد مستندات محددة');
  }

  const { error } = await supabase
    .from('documents')
    .update({ status: newStatus })
    .eq('tenant_id', tenantId)
    .in('id', documentIds);

  if (error) {
    console.error('❌ Supabase bulkUpdateDocumentStatus error:', error.message);
    throw new Error(error.message);
  }

  // Log bulk update in audit
  try {
    const user = (await supabase.auth.getUser()).data.user;
    const auditEntries = documentIds.map((docId) => ({
      tenant_id: tenantId,
      entity_type: 'document',
      entity_id: docId,
      action: 'update',
      actor: user?.id || null,
      payload: { 
        bulk_action: true,
        new_status: newStatus,
        total_updated: documentIds.length 
      },
    }));

    await supabase.from('audit_log').insert(auditEntries);
  } catch (err: any) {
    console.warn('⚠️ Failed to log bulk document update:', err.message);
  }
}

/**
 * Log a read action for a given document
 */
export async function logDocumentReadAction(documentId: string, tenantId: string) {
  try {
    const { error } = await supabase.from('audit_log').insert({
      tenant_id: tenantId,
      entity_type: 'document',
      entity_id: documentId,
      action: 'read',
      actor: (await supabase.auth.getUser()).data.user?.id || null,
      payload: { source: 'admin-ui' },
    });

    if (error) throw error;
    console.info(`✅ Audit logged: document ${documentId} read by tenant ${tenantId}`);
  } catch (err: any) {
    console.warn('⚠️ Failed to log document read action:', err.message);
  }
}
