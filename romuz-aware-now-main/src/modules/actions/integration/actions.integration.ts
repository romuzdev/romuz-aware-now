// ============================================================================
// Gate-H: Supabase Integration Layer
// API client for Gate-H Action Plans (RPC wrappers)
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import {
  GateHActionItem,
  GateHActionUpdate,
  CreateActionFromRecommendationInput,
  AddActionUpdateInput,
  UpdateActionStatusInput,
  VerifyAndCloseActionInput,
  ListActionsFilters,
  ActionCreatedResponse,
  GateHExportFilters,
} from "../types";

// ============================================================
// 1) Create Action from Recommendation
// ============================================================
/**
 * Creates a new action item from a Gate-K/J recommendation or manual entry
 * Calls: gate_h.create_from_recommendation()
 */
export async function createActionFromRecommendation(
  input: z.infer<typeof CreateActionFromRecommendationInput>
) {
  const validated = CreateActionFromRecommendationInput.parse(input);

  const { data, error } = await supabase.rpc("gate_h_create_from_recommendation", {
    p_source: validated.source,
    p_source_reco_id: validated.sourceRecoId ?? null,
    p_kpi_key: validated.kpiKey ?? null,
    p_dim_key: validated.dimKey ?? null,
    p_dim_value: validated.dimValue ?? null,
    p_title_ar: validated.titleAr,
    p_desc_ar: validated.descAr ?? null,
    p_priority: validated.priority ?? "medium",
    p_due_date: validated.dueDate ?? null,
    p_sla_days: validated.slaDays ?? null,
    p_assignee_user_id: validated.assigneeUserId ?? null,
    p_effort: validated.effort ?? null,
    p_tags: validated.tags ?? [],
  });

  if (error) {
    console.error("createActionFromRecommendation error:", error);
    throw new Error(`فشل إنشاء الإجراء: ${error.message}`);
  }

  return ActionCreatedResponse.parse(data);
}

// ============================================================
// 2) Add Action Update
// ============================================================
/**
 * Adds a new update (comment, progress, evidence, status change) to an action
 * Calls: gate_h.add_update()
 */
export async function addActionUpdate(
  input: z.infer<typeof AddActionUpdateInput>
) {
  const validated = AddActionUpdateInput.parse(input);

  const { data, error } = await supabase.rpc("gate_h_add_update", {
    p_action_id: validated.actionId,
    p_update_type: validated.updateType,
    p_body_ar: validated.bodyAr ?? null,
    p_evidence_url: validated.evidenceUrl ?? null,
    p_new_status: validated.newStatus ?? null,
    p_progress_pct: validated.progressPct ?? null,
  });

  if (error) {
    console.error("addActionUpdate error:", error);
    throw new Error(`فشل إضافة التحديث: ${error.message}`);
  }

  return z.any().parse(data); // Returns the created update row
}

// ============================================================
// 3) Update Action Status
// ============================================================
/**
 * Updates action status with optional note
 * Calls: gate_h.update_status()
 */
export async function updateActionStatus(
  input: z.infer<typeof UpdateActionStatusInput>
) {
  const validated = UpdateActionStatusInput.parse(input);

  const { data, error } = await supabase.rpc("gate_h_update_status", {
    p_action_id: validated.actionId,
    p_new_status: validated.newStatus,
    p_note_ar: validated.noteAr ?? null,
  });

  if (error) {
    console.error("updateActionStatus error:", error);
    throw new Error(`فشل تحديث الحالة: ${error.message}`);
  }

  return ActionCreatedResponse.parse(data); // Returns updated action row
}

// ============================================================
// 4) Verify and Close Action
// ============================================================
/**
 * Verifies evidence and closes the action
 * Requires at least one evidence update
 * Calls: gate_h.verify_and_close()
 */
export async function verifyAndCloseAction(
  input: z.infer<typeof VerifyAndCloseActionInput>
) {
  const validated = VerifyAndCloseActionInput.parse(input);

  const { data, error } = await supabase.rpc("gate_h_verify_and_close", {
    p_action_id: validated.actionId,
    p_verify_note: validated.noteAr ?? null,
  });

  if (error) {
    console.error("verifyAndCloseAction error:", error);
    throw new Error(`فشل إغلاق الإجراء: ${error.message}`);
  }

  return ActionCreatedResponse.parse(data); // Returns closed action row
}

// ============================================================
// 5) List Actions (with filters)
// ============================================================
/**
 * Lists actions for current tenant with optional filters
 * Calls: gate_h.list_actions()
 */
export async function listActions(
  filters: z.infer<typeof ListActionsFilters> = {}
) {
  const validated = ListActionsFilters.parse(filters);

  const { data, error } = await supabase.rpc("gate_h_list_actions", {
    p_statuses: validated.statuses ?? null,
    p_assignee_user_id: validated.assigneeId ?? null,
    p_priority_list: validated.priorities ?? null,
    p_overdue_only: validated.overdueOnly ?? false,
  });

  if (error) {
    console.error("listActions error:", error);
    throw new Error(`فشل تحميل الإجراءات: ${error.message}`);
  }

  return z.array(GateHActionItem).parse(data ?? []);
}

// ============================================================
// 6) List Updates for Action
// ============================================================
/**
 * Lists all updates for a specific action
 * Calls: gate_h.list_updates()
 */
export async function listUpdates(actionId: string) {
  const { data, error } = await supabase.rpc("gate_h_list_updates", {
    p_action_id: actionId,
  });

  if (error) {
    console.error("listUpdates error:", error);
    throw new Error(`فشل تحميل التحديثات: ${error.message}`);
  }

  return z.array(GateHActionUpdate).parse(data ?? []);
}

// ============================================================
// 7) Seed Demo Actions (Dev/UAT only)
// ============================================================
/**
 * Seeds sample actions for current tenant
 * Dev/UAT helper only - requires tenant_admin or awareness_analyst role
 * Calls: gate_h.seed_demo_actions()
 */
export async function seedDemoActions() {
  const { data, error } = await supabase.rpc("gate_h_seed_demo_actions");

  if (error) {
    console.error("seedDemoActions error:", error);
    throw new Error(`فشل زرع البيانات التجريبية: ${error.message}`);
  }

  return { success: true, message: "تم زرع البيانات التجريبية بنجاح" };
}

// ============================================================
// 8) Check if Demo Data Exists
// ============================================================
/**
 * Checks if demo actions exist for current tenant
 * Calls: gate_h.has_demo_actions()
 */
export async function hasDemoActions(): Promise<boolean> {
  const { data, error } = await supabase.rpc("gate_h_has_demo_actions");

  if (error) {
    console.error("hasDemoActions error:", error);
    return false;
  }

  return data === true;
}

// ============================================================
// 9) Get Action by ID using RPC
// ============================================================
/**
 * Gets a single action by ID (using list RPC with no filters)
 */
export async function getActionById(actionId: string) {
  const { data, error } = await supabase.rpc("gate_h_list_actions", {
    p_statuses: null,
    p_assignee_user_id: null,
    p_priority_list: null,
    p_overdue_only: false,
  });

  if (error) {
    console.error("getActionById error:", error);
    throw new Error(`فشل تحميل الإجراء: ${error.message}`);
  }

  const action = data?.find((a: any) => a.id === actionId);
  if (!action) {
    throw new Error("الإجراء غير موجود");
  }

  return GateHActionItem.parse(action);
}

// ============================================================
// 10) Get Links for Action (Note: Currently no RPC for this)
// ============================================================
/**
 * Gets all links for a specific action
 */
export async function getActionLinks(actionId: string) {
  const { data, error } = await supabase
    .from("gate_h.action_links")
    .select("*")
    .eq("action_id", actionId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getActionLinks error:", error);
    throw new Error(`فشل تحميل الروابط: ${error.message}`);
  }

  return z.array(z.any()).parse(data ?? []);
}

// ============================================================
// 11) Export Actions as JSON
// ============================================================
/**
 * Exports Gate-H actions as JSON with filters
 * Calls: gate_h_export_actions_json()
 * Returns: jsonb array of action objects with all details + stats
 */
export async function exportActionsJSON(
  filters: z.infer<typeof GateHExportFilters> = {}
) {
  const validated = GateHExportFilters.parse(filters);

  const { data, error } = await supabase.rpc("gate_h_export_actions_json", {
    p_from_date: validated.fromDate ?? null,
    p_to_date: validated.toDate ?? null,
    p_statuses: validated.statuses ?? null,
    p_priorities: validated.priorities ?? null,
    p_assignee_id: validated.assigneeId ?? null,
    p_overdue_only: validated.overdueOnly ?? false,
  });

  if (error) {
    console.error("exportActionsJSON error:", error);
    throw new Error(`فشل تصدير JSON: ${error.message}`);
  }

  // Return parsed JSON (already jsonb from DB)
  return data as Record<string, any>[];
}

// ============================================================
// 12) Export Actions as CSV
// ============================================================
/**
 * Exports Gate-H actions as CSV text with filters
 * Calls: gate_h_export_actions_csv()
 * Returns: CSV string with header + data rows
 */
export async function exportActionsCSV(
  filters: z.infer<typeof GateHExportFilters> = {}
) {
  const validated = GateHExportFilters.parse(filters);

  const { data, error } = await supabase.rpc("gate_h_export_actions_csv", {
    p_from_date: validated.fromDate ?? null,
    p_to_date: validated.toDate ?? null,
    p_statuses: validated.statuses ?? null,
    p_priorities: validated.priorities ?? null,
    p_assignee_id: validated.assigneeId ?? null,
    p_overdue_only: validated.overdueOnly ?? false,
  });

  if (error) {
    console.error("exportActionsCSV error:", error);
    throw new Error(`فشل تصدير CSV: ${error.message}`);
  }

  // Return CSV text
  return data as string;
}
