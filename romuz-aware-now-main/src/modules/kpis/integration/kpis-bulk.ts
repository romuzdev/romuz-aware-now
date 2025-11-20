// Gate-I D1: Bulk Operations Integration Layer
// Supabase integration for bulk KPI operations

import { supabase } from '@/integrations/supabase/client';
import type { BulkOperationResult } from '../types';

/**
 * Bulk activate KPIs
 */
export async function bulkActivateKPIs(
  kpiIds: string[],
  noteAr?: string
) {
  const { data, error } = await supabase.rpc('fn_gate_i_bulk_activate', {
    p_kpi_ids: kpiIds,
    p_note_ar: noteAr || null,
  });

  if (error) {
    console.error('Error bulk activating KPIs:', error);
    throw error;
  }

  return mapBulkOperationResult(data[0]);
}

/**
 * Bulk deactivate KPIs
 */
export async function bulkDeactivateKPIs(
  kpiIds: string[],
  noteAr?: string
) {
  const { data, error } = await supabase.rpc('fn_gate_i_bulk_deactivate', {
    p_kpi_ids: kpiIds,
    p_note_ar: noteAr || null,
  });

  if (error) {
    console.error('Error bulk deactivating KPIs:', error);
    throw error;
  }

  return mapBulkOperationResult(data[0]);
}

/**
 * Bulk delete KPIs
 */
export async function bulkDeleteKPIs(kpiIds: string[]) {
  const { data, error } = await supabase.rpc('fn_gate_i_bulk_delete', {
    p_kpi_ids: kpiIds,
  });

  if (error) {
    console.error('Error bulk deleting KPIs:', error);
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
