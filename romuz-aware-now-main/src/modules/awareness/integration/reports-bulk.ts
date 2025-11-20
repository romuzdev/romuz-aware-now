// ============================================================================
// Gate-L Integration Layer: Bulk Operations
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
import type { 
  ReportBulkOperationResult, 
  ReportBulkOperation,
  ReportScheduleConfig 
} from "@/modules/analytics";

/**
 * Bulk generate reports
 */
export async function bulkGenerateReports(
  reportIds: string[]
): Promise<ReportBulkOperationResult> {
  const { data, error } = await supabase.rpc("fn_gate_l_bulk_generate", {
    p_report_ids: reportIds,
  });

  if (error) {
    console.error("❌ Failed to bulk generate reports:", error);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("No data returned from fn_gate_l_bulk_generate");
  }

  return data[0] as ReportBulkOperationResult;
}

/**
 * Bulk schedule reports
 */
export async function bulkScheduleReports(
  reportIds: string[],
  scheduleConfig: ReportScheduleConfig
): Promise<ReportBulkOperationResult> {
  const { data, error } = await supabase.rpc("fn_gate_l_bulk_schedule", {
    p_report_ids: reportIds,
    p_schedule_config: scheduleConfig as any,
  });

  if (error) {
    console.error("❌ Failed to bulk schedule reports:", error);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("No data returned from fn_gate_l_bulk_schedule");
  }

  return data[0] as ReportBulkOperationResult;
}

/**
 * Bulk delete reports
 */
export async function bulkDeleteReports(
  reportIds: string[]
): Promise<ReportBulkOperationResult> {
  const { data, error } = await supabase.rpc("fn_gate_l_bulk_delete", {
    p_report_ids: reportIds,
  });

  if (error) {
    console.error("❌ Failed to bulk delete reports:", error);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("No data returned from fn_gate_l_bulk_delete");
  }

  return data[0] as ReportBulkOperationResult;
}

/**
 * Get bulk operations history
 */
export async function getBulkOperationsHistory(
  limit: number = 20
): Promise<ReportBulkOperation[]> {
  const { data, error } = await supabase.rpc("fn_gate_l_get_bulk_operations", {
    p_limit: limit,
  });

  if (error) {
    console.error("❌ Failed to get bulk operations history:", error);
    throw new Error(error.message);
  }

  return (data || []) as ReportBulkOperation[];
}
