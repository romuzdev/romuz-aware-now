/**
 * useAttachments Hook
 * 
 * React Query hook for managing attachments data
 */

import { useQuery } from '@tanstack/react-query';
import { listAttachments } from '@/core/services';

interface UseAttachmentsOptions {
  linked_module?: string;
  linked_entity_id?: string;
  document_id?: string;
  is_private?: boolean;
}

export function useAttachments(options: UseAttachmentsOptions = {}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['attachments', options],
    queryFn: async () => {
      // Validate linked_entity_id if provided
      if (options.linked_entity_id && options.linked_entity_id === ':id') {
        throw new Error('Invalid entity ID');
      }
      const result = await listAttachments(options);
      return result;
    },
    enabled: !options.linked_entity_id || options.linked_entity_id !== ':id',
    staleTime: 30_000, // Cache for 30 seconds
    retry: false,
  });

  return {
    attachments: data?.attachments || [],
    total: data?.total || 0,
    loading: isLoading,
    error: error?.message || null,
    refetch,
  };
}
