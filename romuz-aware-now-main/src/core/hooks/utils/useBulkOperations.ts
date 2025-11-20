/**
 * Bulk Operations Hook
 * Gate-K: Core Infrastructure - D1 Standard
 * 
 * React hook for bulk operations with real-time progress tracking
 */

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  executeBulkOperation,
  executeBulkOperationInBatches,
  getBulkOperationHistory,
  type BulkOperationOptions,
} from '@/core/services/bulkOperationsService';
import { useQuery } from '@tanstack/react-query';

export function useBulkOperations(module_name: string) {
  const { toast } = useToast();
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    percentage: number;
  } | null>(null);

  // Fetch operation history
  const { data: history, refetch: refetchHistory } = useQuery({
    queryKey: ['bulk-operations-history', module_name],
    queryFn: () => getBulkOperationHistory({ module_name, limit: 50 }),
  });

  /**
   * Execute bulk operation
   */
  const execute = async <T,>(
    options: Omit<BulkOperationOptions, 'module_name'>,
    operationFn: (entityIds: string[]) => Promise<T[]>
  ) => {
    setIsExecuting(true);
    setProgress({
      current: 0,
      total: options.entity_ids.length,
      percentage: 0,
    });

    try {
      const result = await executeBulkOperation(
        { ...options, module_name },
        operationFn
      );

      setProgress({
        current: result.results.length,
        total: options.entity_ids.length,
        percentage: 100,
      });

      toast({
        title: 'عملية جماعية ناجحة',
        description: `تم تنفيذ العملية على ${result.results.length} من ${options.entity_ids.length} عنصر`,
      });

      refetchHistory();

      return result;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'فشلت العملية الجماعية',
        description: error.message,
      });
      throw error;
    } finally {
      setIsExecuting(false);
      setTimeout(() => setProgress(null), 2000);
    }
  };

  /**
   * Execute bulk operation in batches
   */
  const executeInBatches = async <T,>(
    options: Omit<BulkOperationOptions, 'module_name'>,
    operationFn: (entityIds: string[]) => Promise<T[]>,
    batchSize: number = 50
  ) => {
    setIsExecuting(true);
    setProgress({
      current: 0,
      total: options.entity_ids.length,
      percentage: 0,
    });

    try {
      const result = await executeBulkOperationInBatches(
        { ...options, module_name },
        async (entityIds) => {
          const batchResult = await operationFn(entityIds);
          
          // Update progress
          setProgress(prev => {
            if (!prev) return null;
            const newCurrent = prev.current + entityIds.length;
            return {
              current: newCurrent,
              total: prev.total,
              percentage: Math.round((newCurrent / prev.total) * 100),
            };
          });

          return batchResult;
        },
        batchSize
      );

      toast({
        title: 'عملية جماعية ناجحة',
        description: `تم تنفيذ العملية على ${result.results.length} من ${options.entity_ids.length} عنصر`,
      });

      refetchHistory();

      return result;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'فشلت العملية الجماعية',
        description: error.message,
      });
      throw error;
    } finally {
      setIsExecuting(false);
      setTimeout(() => setProgress(null), 2000);
    }
  };

  return {
    execute,
    executeInBatches,
    isExecuting,
    progress,
    history: history || [],
    refetchHistory,
  };
}
