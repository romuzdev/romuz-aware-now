/**
 * Document Versions React Query Hooks
 * M10: Smart Documents Enhancement
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getDocumentVersions,
  getVersionById,
  getLatestVersion,
  createVersion,
  compareVersions,
  restoreVersion,
  deleteVersion,
  getVersionStatistics,
  type CreateVersionInput,
} from '../integration/versions.integration';

/**
 * Get all versions for a document
 */
export function useDocumentVersions(documentId: string | undefined) {
  return useQuery({
    queryKey: ['document-versions', documentId],
    queryFn: () => getDocumentVersions(documentId!),
    enabled: !!documentId,
  });
}

/**
 * Get a specific version by ID
 */
export function useVersionById(versionId: string | undefined) {
  return useQuery({
    queryKey: ['document-version', versionId],
    queryFn: () => getVersionById(versionId!),
    enabled: !!versionId,
  });
}

/**
 * Get the latest version of a document
 */
export function useLatestVersion(documentId: string | undefined) {
  return useQuery({
    queryKey: ['document-latest-version', documentId],
    queryFn: () => getLatestVersion(documentId!),
    enabled: !!documentId,
  });
}

/**
 * Create a new version
 */
export function useCreateVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateVersionInput) => createVersion(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['document-versions', data.document_id] });
      queryClient.invalidateQueries({ queryKey: ['document-latest-version', data.document_id] });
      queryClient.invalidateQueries({ queryKey: ['document-version-stats', data.document_id] });
      toast.success('تم إنشاء إصدار جديد بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل إنشاء الإصدار: ${error.message}`);
    },
  });
}

/**
 * Compare two versions
 */
export function useCompareVersions(version1Id?: string, version2Id?: string) {
  return useQuery({
    queryKey: ['compare-versions', version1Id, version2Id],
    queryFn: () => compareVersions(version1Id!, version2Id!),
    enabled: !!version1Id && !!version2Id,
  });
}

/**
 * Restore a version
 */
export function useRestoreVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (versionId: string) => restoreVersion(versionId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['document-versions', data.document_id] });
      queryClient.invalidateQueries({ queryKey: ['document-latest-version', data.document_id] });
      toast.success('تم استعادة الإصدار بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشلت استعادة الإصدار: ${error.message}`);
    },
  });
}

/**
 * Delete a version
 */
export function useDeleteVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (versionId: string) => deleteVersion(versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-versions'] });
      toast.success('تم حذف الإصدار بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل حذف الإصدار: ${error.message}`);
    },
  });
}

/**
 * Get version statistics
 */
export function useVersionStatistics(documentId: string | undefined) {
  return useQuery({
    queryKey: ['document-version-stats', documentId],
    queryFn: () => getVersionStatistics(documentId!),
    enabled: !!documentId,
  });
}
