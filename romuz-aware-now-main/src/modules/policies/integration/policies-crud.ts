import { supabase } from "@/integrations/supabase/client";
import type { Policy } from "@/modules/policies";

/**
 * Fetch all policies for the current tenant.
 * @param tenantId - UUID of the tenant
 */
export async function fetchPoliciesForTenant(tenantId: string): Promise<Policy[]> {
  const { data, error } = await supabase
    .from("policies")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("❌ Supabase fetchPoliciesForTenant error:", error.message);
    throw new Error(error.message);
  }

  return (data as Policy[]) || [];
}

/**
 * Fetch single policy by its ID (read-only).
 * @param tenantId - UUID of the tenant
 * @param policyId - UUID or string of the policy
 */
export async function fetchPolicyById(tenantId: string, policyId: string): Promise<Policy | null> {
  const { data, error } = await supabase
    .from("policies")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", policyId)
    .single();

  if (error) {
    console.error("❌ Supabase fetchPolicyById error:", error.message);
    return null;
  }

  return data as Policy;
}

/**
 * TODO D2-Part5:
 * - Apply Row-Level Security (RLS) checks for tenant context.
 * - Add role-based filtering (viewer/editor).
 * - Integrate with Audit Log for access tracking.
 */

/**
 * Log a read action for a given policy.
 * Stores a simple event in the audit_log table.
 */
export async function logPolicyReadAction(policyId: string, tenantId: string) {
  try {
    const { error } = await supabase.from("audit_log").insert({
      tenant_id: tenantId,
      entity_type: "policy",
      entity_id: policyId,
      action: "read",
      actor: (await supabase.auth.getUser()).data.user?.id || null,
      payload: { source: "admin-ui" },
    });

    if (error) throw error;
    console.info(`✅ Audit logged: policy ${policyId} read by tenant ${tenantId}`);
  } catch (err: any) {
    console.warn("⚠️ Failed to log policy read action:", err.message);
  }
}

/**
 * Create a new policy.
 * @param tenantId - UUID of the tenant
 * @param policyData - Policy form data
 */
export async function createPolicy(
  tenantId: string,
  policyData: {
    code: string;
    title: string;
    owner?: string | null;
    status: string;
    category?: string | null;
    last_review_date?: string | null;
    next_review_date?: string | null;
  }
): Promise<Policy> {
  const { data, error } = await supabase
    .from("policies")
    .insert({
      tenant_id: tenantId,
      ...policyData,
    })
    .select()
    .single();

  if (error) {
    console.error("❌ Supabase createPolicy error:", error.message);
    throw new Error(error.message);
  }

  // Log creation in audit
  try {
    await supabase.from("audit_log").insert({
      tenant_id: tenantId,
      entity_type: "policy",
      entity_id: data.id,
      action: "create",
      actor: (await supabase.auth.getUser()).data.user?.id || null,
      payload: { code: policyData.code, title: policyData.title },
    });
  } catch (err: any) {
    console.warn("⚠️ Failed to log policy creation:", err.message);
  }

  return data as Policy;
}

/**
 * Update an existing policy.
 * @param tenantId - UUID of the tenant
 * @param policyId - UUID of the policy to update
 * @param policyData - Partial policy data to update
 */
export async function updatePolicy(
  tenantId: string,
  policyId: string,
  policyData: Partial<{
    code: string;
    title: string;
    owner: string | null;
    status: string;
    category: string | null;
    last_review_date: string | null;
    next_review_date: string | null;
  }>
): Promise<Policy> {
  const { data, error } = await supabase
    .from("policies")
    .update(policyData)
    .eq("tenant_id", tenantId)
    .eq("id", policyId)
    .select()
    .single();

  if (error) {
    console.error("❌ Supabase updatePolicy error:", error.message);
    throw new Error(error.message);
  }

  // Log update in audit
  try {
    await supabase.from("audit_log").insert({
      tenant_id: tenantId,
      entity_type: "policy",
      entity_id: policyId,
      action: "update",
      actor: (await supabase.auth.getUser()).data.user?.id || null,
      payload: { changes: policyData },
    });
  } catch (err: any) {
    console.warn("⚠️ Failed to log policy update:", err.message);
  }

  return data as Policy;
}

/**
 * Delete a policy.
 * @param tenantId - UUID of the tenant
 * @param policyId - UUID of the policy to delete
 */
export async function deletePolicy(
  tenantId: string,
  policyId: string
): Promise<void> {
  // Get policy details before deletion for audit log
  const policy = await fetchPolicyById(tenantId, policyId);
  
  const { error } = await supabase
    .from("policies")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", policyId);

  if (error) {
    console.error("❌ Supabase deletePolicy error:", error.message);
    throw new Error(error.message);
  }

  // Log deletion in audit
  try {
    await supabase.from("audit_log").insert({
      tenant_id: tenantId,
      entity_type: "policy",
      entity_id: policyId,
      action: "delete",
      actor: (await supabase.auth.getUser()).data.user?.id || null,
      payload: { 
        deleted_code: policy?.code,
        deleted_title: policy?.title 
      },
    });
  } catch (err: any) {
    console.warn("⚠️ Failed to log policy deletion:", err.message);
  }
}

/**
 * Bulk update policy status for multiple policies.
 * @param tenantId - UUID of the tenant
 * @param policyIds - Array of policy IDs to update
 * @param newStatus - New status to apply
 */
export async function bulkUpdatePolicyStatus(
  tenantId: string,
  policyIds: string[],
  newStatus: string
): Promise<void> {
  if (policyIds.length === 0) {
    throw new Error("لا توجد سياسات محددة");
  }

  const { error } = await supabase
    .from("policies")
    .update({ status: newStatus })
    .eq("tenant_id", tenantId)
    .in("id", policyIds);

  if (error) {
    console.error("❌ Supabase bulkUpdatePolicyStatus error:", error.message);
    throw new Error(error.message);
  }

  // Log bulk update in audit
  try {
    const user = (await supabase.auth.getUser()).data.user;
    const auditEntries = policyIds.map((policyId) => ({
      tenant_id: tenantId,
      entity_type: "policy",
      entity_id: policyId,
      action: "update",
      actor: user?.id || null,
      payload: { 
        bulk_action: true,
        new_status: newStatus,
        total_updated: policyIds.length 
      },
    }));

    await supabase.from("audit_log").insert(auditEntries);
  } catch (err: any) {
    console.warn("⚠️ Failed to log bulk policy update:", err.message);
  }
}
