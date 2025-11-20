// ============================================================================
// Gate-K Integration Layer: Bulk Operations
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
import type { 
  AdminBulkOperationResult, 
  AdminBulkOperation 
} from "../types";

/**
 * Bulk enable/disable jobs
 */
export async function bulkToggleJobs(
  jobIds: string[],
  isEnabled: boolean
): Promise<AdminBulkOperationResult> {
  const { data, error } = await supabase.rpc("fn_gate_k_bulk_toggle_jobs", {
    p_job_ids: jobIds,
    p_is_enabled: isEnabled,
  });

  if (error) {
    console.error("❌ Failed to bulk toggle jobs:", error);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("No data returned from fn_gate_k_bulk_toggle_jobs");
  }

  return data[0] as AdminBulkOperationResult;
}

/**
 * Bulk trigger jobs
 */
export async function bulkTriggerJobs(
  jobIds: string[]
): Promise<AdminBulkOperationResult> {
  const { data, error } = await supabase.rpc("fn_gate_k_bulk_trigger_jobs", {
    p_job_ids: jobIds,
  });

  if (error) {
    console.error("❌ Failed to bulk trigger jobs:", error);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("No data returned from fn_gate_k_bulk_trigger_jobs");
  }

  return data[0] as AdminBulkOperationResult;
}

/**
 * Bulk delete job runs
 */
export async function bulkDeleteJobRuns(
  runIds: string[]
): Promise<AdminBulkOperationResult> {
  const { data, error } = await supabase.rpc("fn_gate_k_bulk_delete_runs", {
    p_run_ids: runIds,
  });

  if (error) {
    console.error("❌ Failed to bulk delete job runs:", error);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("No data returned from fn_gate_k_bulk_delete_runs");
  }

  return data[0] as AdminBulkOperationResult;
}

/**
 * Get bulk operations history
 */
export async function getBulkOperationsHistory(
  limit: number = 20
): Promise<AdminBulkOperation[]> {
  const { data, error } = await supabase.rpc("fn_gate_k_get_bulk_operations", {
    p_limit: limit,
  });

  if (error) {
    console.error("❌ Failed to get bulk operations history:", error);
    throw new Error(error.message);
  }

  return (data || []) as AdminBulkOperation[];
}
