// ============================================================================
// Gate-H: Milestones Integration Layer
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
import type {
  ActionMilestone,
  CreateMilestoneInput,
  UpdateMilestoneInput,
} from "../types/milestones.types";

// ============================================================
// 1) Get Milestones for Action
// ============================================================
export async function getMilestones(
  actionId: string
): Promise<ActionMilestone[]> {
  const { data, error } = await supabase.rpc("fn_gate_h_get_milestones", {
    p_action_id: actionId,
  });

  if (error) {
    console.error("getMilestones error:", error);
    throw new Error(`فشل جلب المعالم: ${error.message}`);
  }

  return data || [];
}

// ============================================================
// 2) Create Milestone
// ============================================================
export async function createMilestone(
  input: CreateMilestoneInput
): Promise<ActionMilestone> {
  const { data, error } = await supabase
    .from("action_plan_milestones")
    .insert({
      action_id: input.actionId,
      title_ar: input.titleAr,
      description_ar: input.descriptionAr || null,
      milestone_type: input.milestoneType,
      planned_date: input.plannedDate,
      sequence_order: input.sequenceOrder,
      deliverables: input.deliverables || [],
      created_by: (await supabase.auth.getUser()).data.user?.id!,
      updated_by: (await supabase.auth.getUser()).data.user?.id!,
    })
    .select()
    .single();

  if (error) {
    console.error("createMilestone error:", error);
    throw new Error(`فشل إنشاء المعلم: ${error.message}`);
  }

  return data;
}

// ============================================================
// 3) Update Milestone
// ============================================================
export async function updateMilestone(
  input: UpdateMilestoneInput
): Promise<ActionMilestone> {
  const updateData: any = {
    updated_by: (await supabase.auth.getUser()).data.user?.id!,
  };

  if (input.titleAr) updateData.title_ar = input.titleAr;
  if (input.descriptionAr !== undefined)
    updateData.description_ar = input.descriptionAr;
  if (input.plannedDate) updateData.planned_date = input.plannedDate;
  if (input.actualDate !== undefined) updateData.actual_date = input.actualDate;
  if (input.status) updateData.status = input.status;
  if (input.completionPct !== undefined)
    updateData.completion_pct = input.completionPct;
  if (input.evidenceUrls) updateData.evidence_urls = input.evidenceUrls;
  if (input.deliverables) updateData.deliverables = input.deliverables;

  const { data, error } = await supabase
    .from("action_plan_milestones")
    .update(updateData)
    .eq("id", input.milestoneId)
    .select()
    .single();

  if (error) {
    console.error("updateMilestone error:", error);
    throw new Error(`فشل تحديث المعلم: ${error.message}`);
  }

  return data;
}

// ============================================================
// 4) Delete Milestone
// ============================================================
export async function deleteMilestone(milestoneId: string): Promise<void> {
  const { error } = await supabase
    .from("action_plan_milestones")
    .delete()
    .eq("id", milestoneId);

  if (error) {
    console.error("deleteMilestone error:", error);
    throw new Error(`فشل حذف المعلم: ${error.message}`);
  }
}

// ============================================================
// 5) Complete Milestone
// ============================================================
export async function completeMilestone(
  milestoneId: string,
  evidenceUrls?: string[]
): Promise<ActionMilestone> {
  const { data, error } = await supabase
    .from("action_plan_milestones")
    .update({
      status: "completed",
      actual_date: new Date().toISOString().split("T")[0],
      completion_pct: 100,
      evidence_urls: evidenceUrls || null,
      updated_by: (await supabase.auth.getUser()).data.user?.id!,
    })
    .eq("id", milestoneId)
    .select()
    .single();

  if (error) {
    console.error("completeMilestone error:", error);
    throw new Error(`فشل إكمال المعلم: ${error.message}`);
  }

  return data;
}

// ============================================================
// Roadmap Compatibility Aliases
// ============================================================

/**
 * Alias for getMilestones - matches Roadmap specification
 * @see getMilestones
 */
export const fetchActionPlanMilestones = getMilestones;

/**
 * Update milestone progress - simplified wrapper for updateMilestone
 * @param id - Milestone ID
 * @param progress - Progress percentage (0-100)
 */
export async function updateMilestoneProgress(
  id: string,
  progress: number
): Promise<void> {
  await updateMilestone({
    milestoneId: id,
    completionPct: Math.max(0, Math.min(100, progress)),
  });
}

