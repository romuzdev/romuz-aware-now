/**
 * Policies Bulk Operations Hook
 * Gate-D2: Policies Module - D1 Standard
 * 
 * React hook for bulk operations on policies (delete, update status, archive)
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useBulkOperations } from '@/core/hooks/utils/useBulkOperations';
import { 
  bulkUpdatePolicyStatus, 
  deletePolicy 
} from '@/modules/policies/integration';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import type { PolicyStatus } from '@/modules/policies';

export function usePoliciesBulk() {
  const { toast } = useToast();
  const { tenantId } = useAppContext();
  const bulkOps = useBulkOperations('policies');
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /**
   * Toggle selection for a single policy
   */
  const toggleSelection = useCallback((policyId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(policyId)) {
        newSet.delete(policyId);
      } else {
        newSet.add(policyId);
      }
      return newSet;
    });
  }, []);

  /**
   * Toggle select all on current page
   */
  const toggleSelectAll = useCallback((policyIds: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = policyIds.every((id) => prev.has(id));
      if (allSelected) {
        // Deselect all from current page
        const newSet = new Set(prev);
        policyIds.forEach((id) => newSet.delete(id));
        return newSet;
      } else {
        // Select all from current page
        return new Set([...prev, ...policyIds]);
      }
    });
  }, []);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  /**
   * Bulk update policy status
   */
  const bulkUpdateStatus = useCallback(async (newStatus: PolicyStatus) => {
    if (!tenantId || selectedIds.size === 0) return;

    setIsExecuting(true);
    try {
      await bulkOps.execute(
        {
          operation_type: 'update',
          entity_type: 'policy',
          entity_ids: Array.from(selectedIds),
        },
        async (ids) => {
          await bulkUpdatePolicyStatus(tenantId, ids, newStatus);
          return ids.map((id) => ({ id, status: newStatus }));
        }
      );

      toast({
        title: 'تم تحديث الحالة بنجاح',
        description: `تم تحديث ${selectedIds.size} سياسة`,
      });

      clearSelection();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'فشل تحديث الحالة',
        description: error.message,
      });
    } finally {
      setIsExecuting(false);
    }
  }, [tenantId, selectedIds, bulkOps, toast, clearSelection]);

  /**
   * Bulk delete policies
   */
  const bulkDelete = useCallback(async () => {
    if (!tenantId || selectedIds.size === 0) return;

    setIsExecuting(true);
    try {
      await bulkOps.executeInBatches(
        {
          operation_type: 'delete',
          entity_type: 'policy',
          entity_ids: Array.from(selectedIds),
        },
        async (ids) => {
          await Promise.all(
            ids.map((id) => deletePolicy(tenantId, id))
          );
          return ids;
        },
        20 // Batch size
      );

      toast({
        title: 'تم الحذف بنجاح',
        description: `تم حذف ${selectedIds.size} سياسة`,
      });

      clearSelection();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'فشل الحذف',
        description: error.message,
      });
    } finally {
      setIsExecuting(false);
    }
  }, [tenantId, selectedIds, bulkOps, toast, clearSelection]);

  /**
   * Bulk archive policies (set status to archived)
   */
  const bulkArchive = useCallback(async () => {
    return bulkUpdateStatus('archived');
  }, [bulkUpdateStatus]);

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    isExecuting,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    bulkUpdateStatus,
    bulkDelete,
    bulkArchive,
    history: bulkOps.history,
    progress: bulkOps.progress,
  };
}
