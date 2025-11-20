// ============================================================================
// Gate-K Integration Layer: Saved Job Views
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
import type { JobView, JobFilters, JobSortConfig } from "../types";

/**
 * Save or update a job view
 */
export async function saveJobView(
  viewName: string,
  descriptionAr: string | null,
  filters: JobFilters,
  sortConfig: JobSortConfig,
  isDefault: boolean,
  isShared: boolean
): Promise<JobView> {
  const { data, error } = await supabase.rpc("fn_gate_k_save_view", {
    p_view_name: viewName,
    p_description_ar: descriptionAr,
    p_filters: filters as any,
    p_sort_config: sortConfig as any,
    p_is_default: isDefault,
    p_is_shared: isShared,
  });

  if (error) {
    console.error("❌ Failed to save job view:", error);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("No data returned from fn_gate_k_save_view");
  }

  return data[0] as JobView;
}

/**
 * List all saved job views (own + shared)
 */
export async function listJobViews(): Promise<JobView[]> {
  const { data, error } = await supabase.rpc("fn_gate_k_list_views");

  if (error) {
    console.error("❌ Failed to list job views:", error);
    throw new Error(error.message);
  }

  return (data || []) as JobView[];
}

/**
 * Delete a saved job view
 */
export async function deleteJobView(viewId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("fn_gate_k_delete_view", {
    p_view_id: viewId,
  });

  if (error) {
    console.error("❌ Failed to delete job view:", error);
    throw new Error(error.message);
  }

  return data === true;
}
