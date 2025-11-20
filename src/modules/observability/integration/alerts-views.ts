// ============================================================================
// Gate-E: Saved Alert Views Integration (D1 Standard)
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import {
  GateEAlertView,
  SaveAlertViewInput,
} from "../types";

// ============================================================
// Save or Update Alert View
// ============================================================
export async function saveAlertView(input: z.infer<typeof SaveAlertViewInput>) {
  const validated = SaveAlertViewInput.parse(input);

  const { data, error } = await supabase.rpc("fn_gate_e_save_alert_view", {
    p_view_name: validated.viewName,
    p_description_ar: validated.descriptionAr ?? null,
    p_filters: validated.filters,
    p_sort_config: validated.sortConfig ?? null,
    p_is_default: validated.isDefault ?? false,
    p_is_shared: validated.isShared ?? false,
  });

  if (error) {
    console.error("saveAlertView error:", error);
    throw new Error(`فشل حفظ العرض: ${error.message}`);
  }

  return GateEAlertView.parse(data[0]);
}

// ============================================================
// List Alert Views
// ============================================================
export async function listAlertViews(): Promise<z.infer<typeof GateEAlertView>[]> {
  const { data, error } = await supabase.rpc("fn_gate_e_list_alert_views");

  if (error) {
    console.error("listAlertViews error:", error);
    throw new Error(`فشل جلب العروض المحفوظة: ${error.message}`);
  }

  return z.array(GateEAlertView).parse(data);
}

// ============================================================
// Delete Alert View
// ============================================================
export async function deleteAlertView(viewId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("fn_gate_e_delete_alert_view", {
    p_view_id: viewId,
  });

  if (error) {
    console.error("deleteAlertView error:", error);
    throw new Error(`فشل حذف العرض: ${error.message}`);
  }

  return Boolean(data);
}
