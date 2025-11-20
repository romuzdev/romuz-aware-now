// ============================================================================
// Gate-L Integration Layer: Import/Export
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
import type { ReportImportHistory } from "@/modules/analytics";

/**
 * Get import history
 */
export async function getImportHistory(
  limit: number = 20
): Promise<ReportImportHistory[]> {
  const { data, error } = await supabase.rpc("fn_gate_l_get_import_history", {
    p_limit: limit,
  });

  if (error) {
    console.error("❌ Failed to get import history:", error);
    throw new Error(error.message);
  }

  return (data || []) as ReportImportHistory[];
}
