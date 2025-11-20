/**
 * Document & Attachment Download URL Helpers
 * 
 * Generates signed URLs for secure downloading of documents and attachments
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Get signed download URL for a document version
 * 
 * @param storagePath - Storage path from document_versions.storage_path
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Promise resolving to signed download URL
 */
export async function getDocumentVersionDownloadUrl(
  storagePath: string,
  expiresIn: number = 3600
): Promise<string> {
  if (!storagePath) {
    throw new Error('Storage path is required');
  }

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data) {
    console.error('[getDocumentVersionDownloadUrl] Error:', error);
    throw new Error('Failed to generate download URL');
  }

  return data.signedUrl;
}

/**
 * Get signed download URL for an attachment
 * 
 * @param storagePath - Storage path from attachments.storage_path
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Promise resolving to signed download URL
 */
export async function getAttachmentDownloadUrl(
  storagePath: string,
  expiresIn: number = 3600
): Promise<string> {
  if (!storagePath) {
    throw new Error('Storage path is required');
  }

  const { data, error } = await supabase.storage
    .from('attachments')
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data) {
    console.error('[getAttachmentDownloadUrl] Error:', error);
    throw new Error('Failed to generate download URL');
  }

  return data.signedUrl;
}

/**
 * Trigger browser download for a file
 * 
 * @param url - Download URL
 * @param filename - Suggested filename for download
 */
export function triggerDownload(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
