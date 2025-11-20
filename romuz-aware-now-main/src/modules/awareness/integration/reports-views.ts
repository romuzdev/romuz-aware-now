// ============================================================================
// Gate-L Integration Layer: Saved Report Views
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
import type { ReportView, ReportFilters, ReportSortConfig } from "@/modules/analytics";

/**
 * Save or update a report view
 */
export async function saveReportView(
  viewName: string,
  descriptionAr: string | null,
  filters: ReportFilters,
  sortConfig: ReportSortConfig,
  isDefault: boolean,
  isShared: boolean
): Promise<ReportView> {
  const { data, error } = await supabase.rpc("fn_gate_l_save_view", {
    p_view_name: viewName,
    p_description_ar: descriptionAr,
    p_filters: filters as any,
    p_sort_config: sortConfig as any,
    p_is_default: isDefault,
    p_is_shared: isShared,
  });

  if (error) {
    console.error("❌ Failed to save report view:", error);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("No data returned from fn_gate_l_save_view");
  }

  return data[0] as ReportView;
}

/**
 * List all saved report views (own + shared)
 */
export async function listReportViews(): Promise<ReportView[]> {
  const { data, error } = await supabase.rpc("fn_gate_l_list_views");

  if (error) {
    console.error("❌ Failed to list report views:", error);
    throw new Error(error.message);
  }

  return (data || []) as ReportView[];
}

/**
 * Delete a saved report view
 */
export async function deleteReportView(viewId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("fn_gate_l_delete_view", {
    p_view_id: viewId,
  });

  if (error) {
    console.error("❌ Failed to delete report view:", error);
    throw new Error(error.message);
  }

  return data === true;
}
