// ============================================================================
// Gate-F Integration Layer: Saved Policy Views
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
import type { PolicyView, PolicyFilters, PolicySortConfig } from "@/modules/policies";

/**
 * Save or update a policy view
 */
export async function savePolicyView(
  viewName: string,
  descriptionAr: string | null,
  filters: PolicyFilters,
  sortConfig: PolicySortConfig,
  isDefault: boolean,
  isShared: boolean
): Promise<PolicyView> {
  const { data, error } = await supabase.rpc("fn_gate_f_save_view", {
    p_view_name: viewName,
    p_description_ar: descriptionAr,
    p_filters: filters as any,
    p_sort_config: sortConfig as any,
    p_is_default: isDefault,
    p_is_shared: isShared,
  });

  if (error) {
    console.error("❌ Failed to save policy view:", error);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("No data returned from fn_gate_f_save_view");
  }

  return data[0] as PolicyView;
}

/**
 * List all saved policy views (own + shared)
 */
export async function listPolicyViews(): Promise<PolicyView[]> {
  const { data, error } = await supabase.rpc("fn_gate_f_list_views");

  if (error) {
    console.error("❌ Failed to list policy views:", error);
    throw new Error(error.message);
  }

  return (data || []) as PolicyView[];
}

/**
 * Delete a saved policy view
 */
export async function deletePolicyView(viewId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("fn_gate_f_delete_view", {
    p_view_id: viewId,
  });

  if (error) {
    console.error("❌ Failed to delete policy view:", error);
    throw new Error(error.message);
  }

  return data === true;
}
