// ============================================================================
// Gate-H: Saved Views Integration (D1 Standard)
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import {
  GateHActionView,
  SaveViewInput,
} from "../types";

// ============================================================
// Save or Update View
// ============================================================
export async function saveActionView(input: z.infer<typeof SaveViewInput>) {
  const validated = SaveViewInput.parse(input);

  const { data, error } = await supabase.rpc("fn_gate_h_save_view", {
    p_view_name: validated.viewName,
    p_description_ar: validated.descriptionAr ?? null,
    p_filters: validated.filters,
    p_sort_config: validated.sortConfig ?? null,
    p_is_default: validated.isDefault ?? false,
    p_is_shared: validated.isShared ?? false,
  });

  if (error) {
    console.error("saveActionView error:", error);
    throw new Error(`فشل حفظ العرض: ${error.message}`);
  }

  return GateHActionView.parse(data[0]);
}

// ============================================================
// List Views
// ============================================================
export async function listActionViews(): Promise<z.infer<typeof GateHActionView>[]> {
  const { data, error } = await supabase.rpc("fn_gate_h_list_views");

  if (error) {
    console.error("listActionViews error:", error);
    throw new Error(`فشل جلب العروض المحفوظة: ${error.message}`);
  }

  return z.array(GateHActionView).parse(data);
}

// ============================================================
// Delete View
// ============================================================
export async function deleteActionView(viewId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("fn_gate_h_delete_view", {
    p_view_id: viewId,
  });

  if (error) {
    console.error("deleteActionView error:", error);
    throw new Error(`فشل حذف العرض: ${error.message}`);
  }

  return Boolean(data);
}
