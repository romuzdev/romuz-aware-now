// ============================================================================
// Gate-F Integration Layer: Import/Export
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
import type { 
  PolicyImportResult, 
  PolicyImportHistory,
  PolicyImportData 
} from "@/modules/policies";

/**
 * Import policies from parsed data
 */
export async function importPolicies(
  filename: string,
  format: 'csv' | 'json',
  policies: PolicyImportData[]
): Promise<PolicyImportResult> {
  const { data, error } = await supabase.rpc("fn_gate_f_import_policies", {
    p_filename: filename,
    p_format: format,
    p_policies: policies as any,
  });

  if (error) {
    console.error("❌ Failed to import policies:", error);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("No data returned from fn_gate_f_import_policies");
  }

  return data[0] as PolicyImportResult;
}

/**
 * Get import history
 */
export async function getImportHistory(
  limit: number = 20
): Promise<PolicyImportHistory[]> {
  const { data, error } = await supabase.rpc("fn_gate_f_get_import_history", {
    p_limit: limit,
  });

  if (error) {
    console.error("❌ Failed to get import history:", error);
    throw new Error(error.message);
  }

  return (data || []) as PolicyImportHistory[];
}
