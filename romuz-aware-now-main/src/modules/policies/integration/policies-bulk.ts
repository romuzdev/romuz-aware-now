// ============================================================================
// Gate-F Integration Layer: Bulk Operations
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
import type { 
  PolicyBulkOperationResult, 
  PolicyBulkOperation,
  PolicyStatus 
} from "@/modules/policies";

/**
 * Bulk update policy status using RPC function (advanced)
 * Returns detailed operation result
 */
export async function bulkUpdatePolicyStatusRPC(
  policyIds: string[],
  newStatus: PolicyStatus
): Promise<PolicyBulkOperationResult> {
  const { data, error } = await supabase.rpc("fn_gate_f_bulk_update_status", {
    p_policy_ids: policyIds,
    p_new_status: newStatus,
  });

  if (error) {
    console.error("❌ Failed to bulk update policy status:", error);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("No data returned from fn_gate_f_bulk_update_status");
  }

  return data[0] as PolicyBulkOperationResult;
}

/**
 * Bulk delete policies
 */
export async function bulkDeletePolicies(
  policyIds: string[]
): Promise<PolicyBulkOperationResult> {
  const { data, error } = await supabase.rpc("fn_gate_f_bulk_delete", {
    p_policy_ids: policyIds,
  });

  if (error) {
    console.error("❌ Failed to bulk delete policies:", error);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("No data returned from fn_gate_f_bulk_delete");
  }

  return data[0] as PolicyBulkOperationResult;
}

/**
 * Get bulk operations history
 */
export async function getBulkOperationsHistory(
  limit: number = 20
): Promise<PolicyBulkOperation[]> {
  const { data, error } = await supabase.rpc("fn_gate_f_get_bulk_operations", {
    p_limit: limit,
  });

  if (error) {
    console.error("❌ Failed to get bulk operations history:", error);
    throw new Error(error.message);
  }

  return (data || []) as PolicyBulkOperation[];
}
