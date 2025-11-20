/**
 * Bulk Operations Service
 * Gate-K: Core Infrastructure - D1 Standard
 * 
 * Business logic for bulk operations across modules
 */

import {
  createBulkOperationLog,
  updateBulkOperationLog,
  listBulkOperationLogs,
  getBulkOperationLog,
  type BulkOperationLog,
} from '@/lib/shared';

export type BulkOperationOptions = {
  module_name: string;
  operation_type: 'delete' | 'update' | 'export' | 'import' | 'archive';
  entity_type: string;
  entity_ids: string[];
  metadata?: any;
};

/**
 * Execute a bulk operation with logging and error handling
 */
export async function executeBulkOperation<T>(
  options: BulkOperationOptions,
  operationFn: (entityIds: string[]) => Promise<T[]>
): Promise<{
  log: BulkOperationLog;
  results: T[];
  errors: any[];
}> {
  // Create log entry
  const log = await createBulkOperationLog({
    module_name: options.module_name,
    operation_type: options.operation_type,
    entity_type: options.entity_type,
    total_count: options.entity_ids.length,
    metadata: options.metadata,
  });

  try {
    // Update status to in_progress
    await updateBulkOperationLog(log.id, { status: 'in_progress' });

    // Execute the operation
    const results = await operationFn(options.entity_ids);

    // Update log with success
    await updateBulkOperationLog(log.id, {
      status: 'completed',
      affected_count: results.length,
    });

    return {
      log,
      results,
      errors: [],
    };
  } catch (error: any) {
    // Update log with failure
    await updateBulkOperationLog(log.id, {
      status: 'failed',
      error_message: error.message || 'Unknown error',
    });

    throw error;
  }
}

/**
 * Execute bulk operation with batch processing
 * Useful for large datasets
 */
export async function executeBulkOperationInBatches<T>(
  options: BulkOperationOptions,
  operationFn: (entityIds: string[]) => Promise<T[]>,
  batchSize: number = 50
): Promise<{
  log: BulkOperationLog;
  results: T[];
  errors: any[];
}> {
  // Create log entry
  const log = await createBulkOperationLog({
    module_name: options.module_name,
    operation_type: options.operation_type,
    entity_type: options.entity_type,
    total_count: options.entity_ids.length,
    metadata: options.metadata,
  });

  const allResults: T[] = [];
  const allErrors: any[] = [];
  let processedCount = 0;

  try {
    // Update status to in_progress
    await updateBulkOperationLog(log.id, { status: 'in_progress' });

    // Process in batches
    for (let i = 0; i < options.entity_ids.length; i += batchSize) {
      const batch = options.entity_ids.slice(i, i + batchSize);

      try {
        const batchResults = await operationFn(batch);
        allResults.push(...batchResults);
        processedCount += batch.length;

        // Update progress
        await updateBulkOperationLog(log.id, {
          affected_count: processedCount,
        });
      } catch (error: any) {
        allErrors.push({
          batch: i / batchSize,
          error: error.message,
          entityIds: batch,
        });
      }
    }

    // Update final status
    const finalStatus = allErrors.length > 0 ? 'completed' : 'completed';
    await updateBulkOperationLog(log.id, {
      status: finalStatus,
      affected_count: allResults.length,
      metadata: {
        ...options.metadata,
        errors: allErrors,
      },
    });

    return {
      log,
      results: allResults,
      errors: allErrors,
    };
  } catch (error: any) {
    // Update log with failure
    await updateBulkOperationLog(log.id, {
      status: 'failed',
      error_message: error.message || 'Unknown error',
    });

    throw error;
  }
}

/**
 * Get bulk operation history
 */
export async function getBulkOperationHistory(filters?: {
  module_name?: string;
  operation_type?: string;
  limit?: number;
}) {
  return listBulkOperationLogs(filters);
}

/**
 * Get bulk operation details
 */
export async function getBulkOperationDetails(logId: string) {
  return getBulkOperationLog(logId);
}
