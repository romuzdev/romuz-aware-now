// ============================================================================
// Gate-E: Import/Export Alert Rules Integration (D1 Standard)
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import {
  ImportAlertRulesInput,
  ImportAlertResult,
  AlertImportHistory,
} from "../types";

// ============================================================
// Import Alert Rules
// ============================================================
export async function importAlertRules(
  input: z.infer<typeof ImportAlertRulesInput>
): Promise<z.infer<typeof ImportAlertResult>> {
  const validated = ImportAlertRulesInput.parse(input);

  const { data, error } = await supabase.rpc("fn_gate_e_import_rules", {
    p_filename: validated.filename,
    p_format: validated.format,
    p_rules: validated.rules,
  });

  if (error) {
    console.error("importAlertRules error:", error);
    throw new Error(`فشل استيراد القواعد: ${error.message}`);
  }

  return ImportAlertResult.parse(data[0]);
}

// ============================================================
// Get Import History
// ============================================================
export async function getAlertImportHistory(
  limit: number = 20
): Promise<z.infer<typeof AlertImportHistory>[]> {
  const { data, error } = await supabase.rpc("fn_gate_e_get_import_history", {
    p_limit: limit,
  });

  if (error) {
    console.error("getAlertImportHistory error:", error);
    throw new Error(`فشل جلب سجل الاستيراد: ${error.message}`);
  }

  return z.array(AlertImportHistory).parse(data);
}
