/**
 * Document Versions Integration
 * M10: Smart Documents Enhancement - Version Control
 */

import { supabase } from '@/integrations/supabase/client';
import type { DocumentVersion } from '../types';

// Re-export existing types
export type { DocumentVersion };

export interface CreateVersionInput {
  document_id: string;
  storage_path: string;
  mime_type: string;
  file_size_bytes: number;
  checksum?: string;
  change_summary?: string;
  is_major?: boolean;
  source_version_id?: string;
}

/**
 * Get all versions for a document
 * Uses existing implementation from document-storage
 */
export async function getVersions(documentId: string): Promise<DocumentVersion[]> {
  const { data, error } = await supabase
    .from('document_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Export with both names for compatibility
export const getDocumentVersions = getVersions;

/**
 * Get a specific version by ID
 */
export async function getVersionById(versionId: string): Promise<DocumentVersion | null> {
  const { data, error } = await supabase
    .from('document_versions')
    .select('*')
    .eq('id', versionId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Get the latest version of a document
 */
export async function getLatestVersion(documentId: string): Promise<DocumentVersion | null> {
  const { data, error } = await supabase
    .from('document_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Create a new version
 */
export async function createVersion(input: CreateVersionInput): Promise<DocumentVersion> {
  const { data, error } = await supabase
    .from('document_versions')
    .insert({
      document_id: input.document_id,
      storage_path: input.storage_path,
      mime_type: input.mime_type,
      file_size_bytes: input.file_size_bytes,
      checksum: input.checksum || null,
      change_summary: input.change_summary,
      is_major: input.is_major ?? false,
      source_version_id: input.source_version_id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get version comparison data
 */
export async function compareVersions(
  version1Id: string,
  version2Id: string
): Promise<{ version1: DocumentVersion; version2: DocumentVersion }> {
  const [v1, v2] = await Promise.all([
    getVersionById(version1Id),
    getVersionById(version2Id),
  ]);

  if (!v1 || !v2) {
    throw new Error('One or both versions not found');
  }

  return { version1: v1, version2: v2 };
}

/**
 * Restore a specific version (create new version based on old one)
 */
export async function restoreVersion(versionId: string): Promise<DocumentVersion> {
  const oldVersion = await getVersionById(versionId);
  if (!oldVersion) {
    throw new Error('Version not found');
  }

  return await createVersion({
    document_id: oldVersion.document_id,
    storage_path: oldVersion.storage_path,
    mime_type: oldVersion.mime_type,
    file_size_bytes: oldVersion.file_size_bytes,
    checksum: oldVersion.checksum || undefined,
    change_summary: `Restored from version ${oldVersion.version_number}`,
    is_major: true,
    source_version_id: versionId,
  });
}

/**
 * Delete a version (only for compliance managers)
 */
export async function deleteVersion(versionId: string): Promise<void> {
  const { error } = await supabase
    .from('document_versions')
    .delete()
    .eq('id', versionId);

  if (error) throw error;
}

/**
 * Get version statistics for a document
 */
export async function getVersionStatistics(documentId: string) {
  const versions = await getVersions(documentId);
  
  return {
    total_versions: versions.length,
    major_versions: versions.filter(v => v.is_major).length,
    minor_versions: versions.filter(v => !v.is_major).length,
    latest_version: versions[0]?.version_number || 0,
    total_size_bytes: versions.reduce((sum, v) => sum + v.file_size_bytes, 0),
    first_version_date: versions[versions.length - 1]?.uploaded_at,
    last_version_date: versions[0]?.uploaded_at,
  };
}
