/**
 * useDocumentById Hook
 * 
 * React Query hook for fetching complete document details
 * including versions and attachments
 */

import { useQuery } from '@tanstack/react-query';
import { getDocumentById } from '@/core/services';

export function useDocumentById(documentId: string | undefined) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['document', documentId],
    queryFn: async () => {
      if (!documentId || documentId === ':id') {
        throw new Error('Invalid document ID');
      }
      return await getDocumentById(documentId);
    },
    enabled: !!documentId && documentId !== ':id',
    staleTime: 30_000, // Cache for 30 seconds
    retry: false, // Don't retry on invalid ID
  });

  return {
    document: data || null,
    loading: isLoading,
    error: error?.message || null,
    refetch,
  };
}
