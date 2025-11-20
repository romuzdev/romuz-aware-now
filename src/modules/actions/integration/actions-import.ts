// ============================================================================
// Gate-H: Import/Export Integration (D1 Standard)
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import {
  ImportActionsInput,
  ImportResult,
  ImportHistoryRow,
} from "../types";

// ============================================================
// Import Actions
// ============================================================
export async function importActions(
  input: z.infer<typeof ImportActionsInput>
): Promise<z.infer<typeof ImportResult>> {
  const validated = ImportActionsInput.parse(input);

  const { data, error } = await supabase.rpc("fn_gate_h_import_actions", {
    p_filename: validated.filename,
    p_format: validated.format,
    p_actions: validated.actions,
  });

  if (error) {
    console.error("importActions error:", error);
    throw new Error(`فشل استيراد الإجراءات: ${error.message}`);
  }

  return ImportResult.parse(data[0]);
}

// ============================================================
// Get Import History
// ============================================================
export async function getImportHistory(
  limit: number = 20
): Promise<z.infer<typeof ImportHistoryRow>[]> {
  const { data, error } = await supabase.rpc("fn_gate_h_get_import_history", {
    p_limit: limit,
  });

  if (error) {
    console.error("getImportHistory error:", error);
    throw new Error(`فشل جلب سجل الاستيراد: ${error.message}`);
  }

  return z.array(ImportHistoryRow).parse(data);
}
