// ============================================================================
// Gate-E: Bulk Alert Operations Integration (D1 Standard)
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import {
  BulkAlertOperationResult,
  BulkToggleRulesInput,
  BulkUpdateSeverityInput,
  BulkDeleteRulesInput,
} from "../types";

// ============================================================
// Bulk Toggle Alert Rules (Activate/Deactivate)
// ============================================================
export async function bulkToggleAlertRules(
  input: z.infer<typeof BulkToggleRulesInput>
) {
  const validated = BulkToggleRulesInput.parse(input);

  const { data, error } = await supabase.rpc("fn_gate_e_bulk_toggle_rules", {
    p_rule_ids: validated.policyIds,
    p_is_active: validated.enable,
    p_note_ar: null,
  });

  if (error) {
    console.error("bulkToggleAlertRules error:", error);
    throw new Error(`فشل التحديث الجماعي للقواعد: ${error.message}`);
  }

  return BulkAlertOperationResult.parse(data[0]);
}

// ============================================================
// Bulk Update Severity
// ============================================================
export async function bulkUpdateAlertSeverity(
  input: z.infer<typeof BulkUpdateSeverityInput>
) {
  const validated = BulkUpdateSeverityInput.parse(input);

  const { data, error } = await supabase.rpc("fn_gate_e_bulk_update_severity", {
    p_rule_ids: validated.policyIds,
    p_severity: validated.severity,
    p_note_ar: null,
  });

  if (error) {
    console.error("bulkUpdateAlertSeverity error:", error);
    throw new Error(`فشل التحديث الجماعي للشدة: ${error.message}`);
  }

  return BulkAlertOperationResult.parse(data[0]);
}

// ============================================================
// Bulk Delete Alert Rules
// ============================================================
export async function bulkDeleteAlertRules(
  input: z.infer<typeof BulkDeleteRulesInput>
) {
  const validated = BulkDeleteRulesInput.parse(input);

  const { data, error } = await supabase.rpc("fn_gate_e_bulk_delete_rules", {
    p_rule_ids: validated.policyIds,
  });

  if (error) {
    console.error("bulkDeleteAlertRules error:", error);
    throw new Error(`فشل الحذف الجماعي: ${error.message}`);
  }

  return BulkAlertOperationResult.parse(data[0]);
}
