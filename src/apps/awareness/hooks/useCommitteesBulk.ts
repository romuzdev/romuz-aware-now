/**
 * Committees Bulk Operations Hook
 * Gate-K: D4 Upgrade - D1 Standard
 * 
 * Provides bulk operations for committees (delete, archive, update status)
 */

import { useBulkOperations } from '@/core/hooks/utils/useBulkOperations';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Bulk delete committees
 */
async function bulkDeleteCommittees(committeeIds: string[]) {
  const { error } = await supabase
    .from('committees')
    .delete()
    .in('id', committeeIds);

  if (error) throw error;
  
  return committeeIds.map(id => ({ id }));
}

/**
 * Bulk update committee status
 */
async function bulkUpdateStatus(committeeIds: string[], status: string) {
  const { data, error } = await supabase
    .from('committees')
    .update({ status })
    .in('id', committeeIds)
    .select('id');

  if (error) throw error;
  
  return data || [];
}

/**
 * Bulk archive committees (set status to 'dissolved')
 */
async function bulkArchiveCommittees(committeeIds: string[]) {
  return bulkUpdateStatus(committeeIds, 'dissolved');
}

/**
 * Hook for bulk operations on committees
 * 
 * Features:
 * - Bulk delete with confirmation
 * - Bulk archive (set to dissolved)
 * - Bulk status update
 * - Progress tracking
 * - Auto-refresh after operations
 */
export function useCommitteesBulk() {
  const queryClient = useQueryClient();
  const bulkOps = useBulkOperations('committees');

  /**
   * Delete multiple committees
   */
  const deleteMultiple = async (committeeIds: string[]) => {
    const result = await bulkOps.execute(
      {
        operation_type: 'delete',
        entity_type: 'committee',
        entity_ids: committeeIds,
        metadata: { count: committeeIds.length },
      },
      bulkDeleteCommittees
    );

    // Refresh committees list
    queryClient.invalidateQueries({ queryKey: ['committees'] });

    return result;
  };

  /**
   * Archive multiple committees
   */
  const archiveMultiple = async (committeeIds: string[]) => {
    const result = await bulkOps.execute(
      {
        operation_type: 'archive',
        entity_type: 'committee',
        entity_ids: committeeIds,
        metadata: { count: committeeIds.length, status: 'dissolved' },
      },
      bulkArchiveCommittees
    );

    // Refresh committees list
    queryClient.invalidateQueries({ queryKey: ['committees'] });

    return result;
  };

  /**
   * Update status for multiple committees
   */
  const updateStatusMultiple = async (committeeIds: string[], status: string) => {
    const result = await bulkOps.execute(
      {
        operation_type: 'update',
        entity_type: 'committee',
        entity_ids: committeeIds,
        metadata: { count: committeeIds.length, field: 'status', value: status },
      },
      (ids) => bulkUpdateStatus(ids, status)
    );

    // Refresh committees list
    queryClient.invalidateQueries({ queryKey: ['committees'] });

    return result;
  };

  return {
    deleteMultiple,
    archiveMultiple,
    updateStatusMultiple,
    isExecuting: bulkOps.isExecuting,
    progress: bulkOps.progress,
    history: bulkOps.history,
  };
}
