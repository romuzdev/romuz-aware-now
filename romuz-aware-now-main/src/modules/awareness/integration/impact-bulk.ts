// Gate-J D1: Bulk Operations Integration Layer
// Supabase integration for bulk impact score operations

import { supabase } from '@/integrations/supabase/client';
import type { BulkOperationResult } from '../types';

/**
 * Bulk recompute impact scores
 */
export async function bulkRecomputeImpactScores(
  scoreIds: string[],
  noteAr?: string
) {
  const { data, error } = await supabase.rpc('fn_gate_j_bulk_recompute', {
    p_score_ids: scoreIds,
    p_note_ar: noteAr || null,
  });

  if (error) {
    console.error('Error bulk recomputing impact scores:', error);
    throw error;
  }

  return mapBulkOperationResult(data[0]);
}

/**
 * Bulk delete impact scores
 */
export async function bulkDeleteImpactScores(scoreIds: string[]) {
  const { data, error } = await supabase.rpc('fn_gate_j_bulk_delete', {
    p_score_ids: scoreIds,
  });

  if (error) {
    console.error('Error bulk deleting impact scores:', error);
    throw error;
  }

  return mapBulkOperationResult(data[0]);
}

/**
 * Map raw database result to BulkOperationResult type
 */
function mapBulkOperationResult(raw: any): BulkOperationResult {
  return {
    operationId: raw.operation_id,
    affectedCount: raw.affected_count,
    status: raw.status,
    errors: raw.errors || undefined,
  };
}
