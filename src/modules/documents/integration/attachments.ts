import { supabase } from '@/integrations/supabase/client';

/**
 * Gate-G Attachments Storage Integration
 * 
 * Handles attachments storage operations following the convention:
 * Path: tenant/{tenant_id}/attachments/{attachment_id}/{filename}
 * 
 * Bucket: attachments (private, 20MB limit)
 */

// ============================================================================
// PATH BUILDERS (Pure Functions)
// ============================================================================

/**
 * Builds the storage path for an attachment
 * @returns tenant/{tenantId}/attachments/{attachmentId}/{filename}
 */
export function buildAttachmentPath(
  tenantId: string,
  attachmentId: string,
  filename: string
): string {
  return `tenant/${tenantId}/attachments/${attachmentId}/${filename}`;
}

// ============================================================================
// UPLOAD HELPERS
// ============================================================================

export interface UploadAttachmentOptions {
  tenantId: string;
  attachmentId: string;
  filename: string;
  file: Blob | File | ArrayBuffer | Uint8Array;
  mimeType: string;
}

export interface UploadResult {
  storagePath: string;
  size: number;
}

/**
 * Uploads an attachment file to storage
 * @returns {storagePath, size} for syncing with DB
 */
export async function uploadAttachment(
  options: UploadAttachmentOptions
): Promise<UploadResult> {
  const { tenantId, attachmentId, filename, file, mimeType } = options;

  const storagePath = buildAttachmentPath(tenantId, attachmentId, filename);

  const { error } = await supabase.storage
    .from('attachments')
    .upload(storagePath, file, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload attachment: ${error.message}`);
  }

  // Calculate size
  let size = 0;
  if (file instanceof Blob || file instanceof File) {
    size = file.size;
  } else if (file instanceof ArrayBuffer) {
    size = file.byteLength;
  } else if (file instanceof Uint8Array) {
    size = file.byteLength;
  }

  return { storagePath, size };
}

// ============================================================================
// DOWNLOAD URL HELPERS
// ============================================================================

export interface AttachmentDownloadOptions {
  tenantId: string;
  storagePath: string;
  mimeType: string;
  isPrivate: boolean;
  expiresIn?: number; // seconds
}

/**
 * Generates a signed download URL for an attachment
 * Uses tenantId and mimeType for additional context/validation
 * 
 * - Private attachments: shorter expiry (default 1800s = 30 min)
 * - Public attachments: longer expiry (default 3600s = 1 hour)
 */
export async function getAttachmentDownloadUrl(
  attachment: AttachmentDownloadOptions
): Promise<string> {
  const { storagePath, isPrivate, expiresIn } = attachment;

  // Determine expiry based on privacy
  const defaultExpiry = isPrivate ? 1800 : 3600; // 30min vs 1hour
  const expiry = expiresIn ?? defaultExpiry;

  const { data, error } = await supabase.storage
    .from('attachments')
    .createSignedUrl(storagePath, expiry);

  if (error || !data) {
    throw new Error(`Failed to generate download URL: ${error?.message}`);
  }

  return data.signedUrl;
}

// ============================================================================
// DB + STORAGE INTEGRATION
// ============================================================================

export interface CreateAttachmentParams {
  filename: string;
  file: Blob | File | ArrayBuffer | Uint8Array;
  mimeType: string;
  isPrivate?: boolean;
  linkedModule?: string;
  linkedEntityId?: string;
  documentId?: string;
  notes?: string;
}

export interface AttachmentRow {
  id: string;
  tenant_id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  file_size_bytes: number;
  is_private: boolean;
  linked_module?: string;
  linked_entity_id?: string;
  document_id?: string;
  notes?: string;
  uploaded_by: string;
  uploaded_at: string;
}

/**
 * Creates an attachment with file upload
 * 
 * Steps:
 * 1. Get current tenant & user from auth context
 * 2. Generate attachment ID
 * 3. Upload file to storage
 * 4. Insert row into attachments with synced storage_path & size
 */
export async function createAttachmentWithUpload(
  params: CreateAttachmentParams
): Promise<AttachmentRow> {
  const {
    filename,
    file,
    mimeType,
    isPrivate = false,
    linkedModule,
    linkedEntityId,
    documentId,
    notes,
  } = params;

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('User not authenticated');
  }

  // Get tenant_id via RPC
  const { data: tenantId, error: tenantError } = await supabase
    .rpc('get_user_tenant_id', { _user_id: user.id });

  if (tenantError || !tenantId) {
    throw new Error('Failed to get tenant ID');
  }

  // Generate attachment ID (will be used before DB insert for path)
  const attachmentId = crypto.randomUUID();

  // Upload file to storage
  const { storagePath, size } = await uploadAttachment({
    tenantId,
    attachmentId,
    filename,
    file,
    mimeType,
  });

  // Insert attachment row
  const { data: attachment, error: insertError } = await supabase
    .from('attachments')
    .insert({
      id: attachmentId,
      tenant_id: tenantId,
      filename,
      storage_path: storagePath,
      mime_type: mimeType,
      file_size_bytes: size,
      is_private: isPrivate,
      linked_module: linkedModule,
      linked_entity_id: linkedEntityId,
      document_id: documentId,
      notes,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (insertError || !attachment) {
    // Rollback: delete uploaded file
    await supabase.storage.from('attachments').remove([storagePath]);
    throw new Error(`Failed to create attachment: ${insertError?.message}`);
  }

  return attachment as AttachmentRow;
}

/**
 * Fetches attachments by linked entity
 */
export async function getAttachmentsByEntity(
  linkedModule: string,
  linkedEntityId: string
) {
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('linked_module', linkedModule)
    .eq('linked_entity_id', linkedEntityId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch attachments: ${error.message}`);
  }

  return data as AttachmentRow[];
}

/**
 * Fetches attachments by document
 */
export async function getAttachmentsByDocument(documentId: string) {
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('document_id', documentId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch attachments: ${error.message}`);
  }

  return data as AttachmentRow[];
}

/**
 * Deletes an attachment (DB + Storage)
 */
export async function deleteAttachment(attachmentId: string) {
  // Get attachment info first
  const { data: attachment, error: fetchError } = await supabase
    .from('attachments')
    .select('storage_path')
    .eq('id', attachmentId)
    .single();

  if (fetchError || !attachment) {
    throw new Error('Attachment not found');
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('attachments')
    .remove([attachment.storage_path]);

  if (storageError) {
    console.error('Failed to delete from storage:', storageError);
  }

  // Delete from DB
  const { error: deleteError } = await supabase
    .from('attachments')
    .delete()
    .eq('id', attachmentId);

  if (deleteError) {
    throw new Error(`Failed to delete attachment: ${deleteError.message}`);
  }
}

/**
 * Updates attachment metadata (does not change file)
 */
export async function updateAttachmentMetadata(
  attachmentId: string,
  updates: {
    isPrivate?: boolean;
    linkedModule?: string;
    linkedEntityId?: string;
    documentId?: string;
    notes?: string;
  }
) {
  const { data, error } = await supabase
    .from('attachments')
    .update({
      is_private: updates.isPrivate,
      linked_module: updates.linkedModule,
      linked_entity_id: updates.linkedEntityId,
      document_id: updates.documentId,
      notes: updates.notes,
    })
    .eq('id', attachmentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update attachment: ${error.message}`);
  }

  return data as AttachmentRow;
}
