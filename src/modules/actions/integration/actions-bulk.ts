// ============================================================================
// Gate-H: Bulk Operations Integration (D1 Standard)
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import {
  BulkOperationResult,
  BulkUpdateStatusInput,
  BulkAssignInput,
  BulkDeleteInput,
} from "../types";

// ============================================================
// Bulk Update Status
// ============================================================
export async function bulkUpdateActionStatus(
  input: z.infer<typeof BulkUpdateStatusInput>
) {
  const validated = BulkUpdateStatusInput.parse(input);

  const { data, error } = await supabase.rpc("fn_gate_h_bulk_update_status", {
    p_action_ids: validated.actionIds,
    p_new_status: validated.newStatus,
    p_note_ar: validated.noteAr ?? null,
  });

  if (error) {
    console.error("bulkUpdateActionStatus error:", error);
    throw new Error(`فشل التحديث الجماعي للحالة: ${error.message}`);
  }

  return BulkOperationResult.parse(data[0]);
}

// ============================================================
// Bulk Assign
// ============================================================
export async function bulkAssignActions(
  input: z.infer<typeof BulkAssignInput>
) {
  const validated = BulkAssignInput.parse(input);

  const { data, error } = await supabase.rpc("fn_gate_h_bulk_assign", {
    p_action_ids: validated.actionIds,
    p_assignee_user_id: validated.assigneeUserId,
    p_note_ar: validated.noteAr ?? null,
  });

  if (error) {
    console.error("bulkAssignActions error:", error);
    throw new Error(`فشل التعيين الجماعي: ${error.message}`);
  }

  return BulkOperationResult.parse(data[0]);
}

// ============================================================
// Bulk Delete
// ============================================================
export async function bulkDeleteActions(
  input: z.infer<typeof BulkDeleteInput>
) {
  const validated = BulkDeleteInput.parse(input);

  const { data, error } = await supabase.rpc("fn_gate_h_bulk_delete", {
    p_action_ids: validated.actionIds,
  });

  if (error) {
    console.error("bulkDeleteActions error:", error);
    throw new Error(`فشل الحذف الجماعي: ${error.message}`);
  }

  return BulkOperationResult.parse(data[0]);
}
