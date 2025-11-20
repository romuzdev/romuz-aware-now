// Gate-I D1: Import/Export Integration Layer
// Supabase integration for importing/exporting KPIs

import { supabase } from '@/integrations/supabase/client';
import type { 
  KPIImportHistory,
  ImportKPIsParams 
} from '../types';

/**
 * Import KPIs from file
 */
export async function importKPIs(params: ImportKPIsParams) {
  const { data, error } = await supabase.rpc('fn_gate_i_import_kpis', {
    p_filename: params.filename,
    p_format: params.format,
    p_kpis: params.kpis as any,
  });

  if (error) {
    console.error('Error importing KPIs:', error);
    throw error;
  }

  return {
    importId: data[0].import_id,
    totalRows: data[0].total_rows,
    successCount: data[0].success_count,
    errorCount: data[0].error_count,
    errors: data[0].errors || undefined,
    status: data[0].status,
  };
}

/**
 * Get import history for current user
 */
export async function getImportHistory(limit: number = 20) {
  const { data, error } = await supabase.rpc('fn_gate_i_get_import_history', {
    p_limit: limit,
  });

  if (error) {
    console.error('Error fetching import history:', error);
    throw error;
  }

  return data.map(mapImportHistory);
}

/**
 * Map raw database result to KPIImportHistory type
 */
function mapImportHistory(raw: any): KPIImportHistory {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    userId: raw.user_id,
    filename: raw.filename,
    format: raw.format,
    totalRows: raw.total_rows,
    successCount: raw.success_count,
    errorCount: raw.error_count,
    errors: raw.errors || undefined,
    status: raw.status,
    createdAt: raw.created_at,
  };
}
