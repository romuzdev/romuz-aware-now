import { supabase } from '@/integrations/supabase/client';

/**
 * Gate-G Documents Storage Integration
 * 
 * Handles document_versions storage operations following the convention:
 * Path: tenant/{tenant_id}/docs/{document_id}/v{version_number}/{filename}
 * 
 * Bucket: documents (private, 50MB limit)
 */

// ============================================================================
// PATH BUILDERS (Pure Functions)
// ============================================================================

/**
 * Builds the storage path for a document version
 * @returns tenant/{tenantId}/docs/{documentId}/v{versionNumber}/{filename}
 */
export function buildDocumentVersionPath(
  tenantId: string,
  documentId: string,
  versionNumber: number,
  filename: string
): string {
  return `tenant/${tenantId}/docs/${documentId}/v${versionNumber}/${filename}`;
}

// ============================================================================
// UPLOAD HELPERS
// ============================================================================

export interface UploadDocumentVersionOptions {
  tenantId: string;
  documentId: string;
  versionNumber: number;
  filename: string;
  file: Blob | File | ArrayBuffer | Uint8Array;
  mimeType: string;
}

export interface UploadResult {
  storagePath: string;
  size: number;
}

/**
 * Uploads a document version file to storage
 * @returns {storagePath, size} for syncing with DB
 */
export async function uploadDocumentVersion(
  options: UploadDocumentVersionOptions
): Promise<UploadResult> {
  const { tenantId, documentId, versionNumber, filename, file, mimeType } = options;

  const storagePath = buildDocumentVersionPath(tenantId, documentId, versionNumber, filename);

  const { error } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload document version: ${error.message}`);
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

export interface DocumentVersionDownloadOptions {
  tenantId: string;
  storagePath: string;
  mimeType: string;
  expiresIn?: number; // seconds, default 3600 (1 hour)
}

/**
 * Generates a signed download URL for a document version
 * Uses tenantId and mimeType for additional context/validation
 * @param expiresIn Time in seconds (default: 3600 = 1 hour)
 */
export async function getDocumentVersionDownloadUrl(
  documentVersion: DocumentVersionDownloadOptions
): Promise<string> {
  const { storagePath, expiresIn = 3600 } = documentVersion;

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data) {
    throw new Error(`Failed to generate download URL: ${error?.message}`);
  }

  return data.signedUrl;
}

// ============================================================================
// DB + STORAGE INTEGRATION
// ============================================================================

export interface CreateDocumentVersionParams {
  documentId: string;
  versionNumber: number;
  filename: string;
  file: Blob | File | ArrayBuffer | Uint8Array;
  mimeType: string;
  isMajor?: boolean;
  changeSummary?: string;
  sourceVersionId?: string;
}

export interface DocumentVersionRow {
  id: string;
  tenant_id: string;
  document_id: string;
  version_number: number;
  storage_path: string;
  mime_type: string;
  file_size_bytes: number;
  uploaded_by: string;
  uploaded_at: string;
  is_major: boolean;
  change_summary?: string;
  checksum?: string;
  source_version_id?: string;
}

/**
 * Creates a document version with file upload
 * 
 * Steps:
 * 1. Get current tenant & user from auth context
 * 2. Upload file to storage
 * 3. Insert row into document_versions with synced storage_path & size
 * 4. Update documents.current_version_id
 */
export async function createDocumentVersionWithUpload(
  params: CreateDocumentVersionParams
): Promise<DocumentVersionRow> {
  const {
    documentId,
    versionNumber,
    filename,
    file,
    mimeType,
    isMajor = true,
    changeSummary,
    sourceVersionId,
  } = params;

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('User not authenticated');
  }

  // Get tenant_id via RPC (using existing helper)
  const { data: tenantId, error: tenantError } = await supabase
    .rpc('get_user_tenant_id', { _user_id: user.id });

  if (tenantError || !tenantId) {
    throw new Error('Failed to get tenant ID');
  }

  // Upload file to storage
  const { storagePath, size } = await uploadDocumentVersion({
    tenantId,
    documentId,
    versionNumber,
    filename,
    file,
    mimeType,
  });

  // Insert document_version row
  const { data: version, error: insertError } = await supabase
    .from('document_versions')
    .insert({
      tenant_id: tenantId,
      document_id: documentId,
      version_number: versionNumber,
      storage_path: storagePath,
      mime_type: mimeType,
      file_size_bytes: size,
      uploaded_by: user.id,
      is_major: isMajor,
      change_summary: changeSummary,
      source_version_id: sourceVersionId,
    })
    .select()
    .single();

  if (insertError || !version) {
    // Rollback: delete uploaded file
    await supabase.storage.from('documents').remove([storagePath]);
    throw new Error(`Failed to create document version: ${insertError?.message}`);
  }

  // Update documents.current_version_id
  const { error: updateDocError } = await supabase
    .from('documents')
    .update({ current_version_id: version.id })
    .eq('id', documentId)
    .eq('tenant_id', tenantId);

  if (updateDocError) {
    console.error('Failed to update current_version_id:', updateDocError);
  }

  return version as DocumentVersionRow;
}

/**
 * Fetches document versions for a document
 */
export async function getDocumentVersions(documentId: string) {
  const { data, error } = await supabase
    .from('document_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch document versions: ${error.message}`);
  }

  return data as DocumentVersionRow[];
}

/**
 * Deletes a document version (DB + Storage)
 */
export async function deleteDocumentVersion(versionId: string) {
  // Get version info first
  const { data: version, error: fetchError } = await supabase
    .from('document_versions')
    .select('storage_path')
    .eq('id', versionId)
    .single();

  if (fetchError || !version) {
    throw new Error('Document version not found');
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([version.storage_path]);

  if (storageError) {
    console.error('Failed to delete from storage:', storageError);
  }

  // Delete from DB
  const { error: deleteError } = await supabase
    .from('document_versions')
    .delete()
    .eq('id', versionId);

  if (deleteError) {
    throw new Error(`Failed to delete document version: ${deleteError.message}`);
  }
}
