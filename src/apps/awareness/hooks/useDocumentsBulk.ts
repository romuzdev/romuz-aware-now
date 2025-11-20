/**
 * Documents Bulk Operations Hook
 * Gate-D3: Documents Module - D1 Standard
 * 
 * React hook for bulk operations on documents (delete, update status, archive)
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useBulkOperations } from '@/core/hooks/utils/useBulkOperations';
import { 
  bulkUpdateDocumentStatus, 
  deleteDocument 
} from '@/modules/documents/integration/documents-data';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import type { DocumentStatus } from '@/modules/documents';

export function useDocumentsBulk() {
  const { toast } = useToast();
  const { tenantId } = useAppContext();
  const bulkOps = useBulkOperations('documents');
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /**
   * Toggle selection for a single document
   */
  const toggleSelection = useCallback((documentId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  }, []);

  /**
   * Toggle select all on current page
   */
  const toggleSelectAll = useCallback((documentIds: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = documentIds.every((id) => prev.has(id));
      if (allSelected) {
        // Deselect all from current page
        const newSet = new Set(prev);
        documentIds.forEach((id) => newSet.delete(id));
        return newSet;
      } else {
        // Select all from current page
        return new Set([...prev, ...documentIds]);
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
   * Bulk update document status
   */
  const bulkUpdateStatus = useCallback(async (newStatus: DocumentStatus) => {
    if (!tenantId || selectedIds.size === 0) return;

    setIsExecuting(true);
    try {
      await bulkOps.execute(
        {
          operation_type: 'update',
          entity_type: 'document',
          entity_ids: Array.from(selectedIds),
        },
        async (ids) => {
          await bulkUpdateDocumentStatus(tenantId, ids, newStatus);
          return ids.map((id) => ({ id, status: newStatus }));
        }
      );

      toast({
        title: 'تم تحديث الحالة بنجاح',
        description: `تم تحديث ${selectedIds.size} مستند`,
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
   * Bulk delete documents
   */
  const bulkDelete = useCallback(async () => {
    if (!tenantId || selectedIds.size === 0) return;

    setIsExecuting(true);
    try {
      await bulkOps.executeInBatches(
        {
          operation_type: 'delete',
          entity_type: 'document',
          entity_ids: Array.from(selectedIds),
        },
        async (ids) => {
          await Promise.all(
            ids.map((id) => deleteDocument(tenantId, id))
          );
          return ids;
        },
        20 // Batch size
      );

      toast({
        title: 'تم الحذف بنجاح',
        description: `تم حذف ${selectedIds.size} مستند`,
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
   * Bulk archive documents (set status to archived)
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
