// ============================================================================
// Gate-H: Tracking Integration Layer
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
import type {
  ActionTrackingSnapshot,
  ActionHealthMetrics,
  CreateTrackingSnapshotInput,
} from "../types/tracking.types";

// ============================================================
// 1) Get Tracking History
// ============================================================
export async function getTrackingHistory(
  actionId: string,
  limit: number = 30
): Promise<ActionTrackingSnapshot[]> {
  const { data, error } = await supabase.rpc("fn_gate_h_get_tracking", {
    p_action_id: actionId,
    p_limit: limit,
  });

  if (error) {
    console.error("getTrackingHistory error:", error);
    throw new Error(`فشل جلب سجل التتبع: ${error.message}`);
  }

  return data || [];
}

// ============================================================
// 2) Create Tracking Snapshot
// ============================================================
export async function createTrackingSnapshot(
  input: CreateTrackingSnapshotInput
): Promise<ActionTrackingSnapshot> {
  const { data, error } = await supabase
    .from("action_plan_tracking")
    .insert({
      action_id: input.actionId,
      progress_pct: input.progressPct,
      milestones_completed: input.milestonesCompleted,
      milestones_total: input.milestonesTotal,
      days_elapsed: input.daysElapsed || null,
      days_remaining: input.daysRemaining || null,
      is_on_track: input.isOnTrack || null,
      is_at_risk: input.isAtRisk || null,
      is_overdue: input.isOverdue || null,
      velocity_score: input.velocityScore || null,
      health_score: input.healthScore || null,
      blockers_count: input.blockersCount,
      issues_summary: input.issuesSummary || [],
    })
    .select()
    .single();

  if (error) {
    console.error("createTrackingSnapshot error:", error);
    throw new Error(`فشل إنشاء لقطة التتبع: ${error.message}`);
  }

  return data;
}

// ============================================================
// 3) Get Action Health Metrics
// ============================================================
export async function getActionHealthMetrics(
  actionId: string
): Promise<ActionHealthMetrics> {
  // Get latest tracking snapshot
  const history = await getTrackingHistory(actionId, 1);
  const latestSnapshot = history[0];

  // Get action details
  const { data: action, error: actionError } = await supabase
    .from("action_items")
    .select("due_date, status")
    .eq("id", actionId)
    .single();

  if (actionError) {
    throw new Error(`فشل جلب بيانات الإجراء: ${actionError.message}`);
  }

  // Calculate health score
  const { data: healthScore } = await supabase.rpc(
    "fn_calculate_action_health_score",
    {
      p_action_id: actionId,
    }
  );

  // Calculate days remaining
  let daysRemaining: number | null = null;
  let estimatedCompletionDate: string | null = null;

  if (action.due_date) {
    const dueDate = new Date(action.due_date);
    const now = new Date();
    daysRemaining = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    estimatedCompletionDate = action.due_date;
  }

  // Identify risk factors
  const riskFactors: ActionHealthMetrics["riskFactors"] = [];

  if (latestSnapshot?.is_overdue) {
    riskFactors.push({
      factor: "overdue",
      severity: "critical",
      description: "الإجراء متأخر عن الموعد المحدد",
    });
  }

  if (latestSnapshot?.blockers_count > 0) {
    riskFactors.push({
      factor: "blockers",
      severity: "high",
      description: `يوجد ${latestSnapshot.blockers_count} عوائق تمنع التقدم`,
    });
  }

  if (latestSnapshot?.velocity_score && latestSnapshot.velocity_score < 0.5) {
    riskFactors.push({
      factor: "low_velocity",
      severity: "medium",
      description: "سرعة التقدم منخفضة",
    });
  }

  return {
    actionId,
    currentProgress: latestSnapshot?.progress_pct || 0,
    healthScore: healthScore || 0,
    velocityScore: latestSnapshot?.velocity_score || null,
    milestonesCompleted: latestSnapshot?.milestones_completed || 0,
    milestonesTotal: latestSnapshot?.milestones_total || 0,
    isOnTrack: latestSnapshot?.is_on_track || false,
    isAtRisk: latestSnapshot?.is_at_risk || false,
    isOverdue: latestSnapshot?.is_overdue || false,
    blockersCount: latestSnapshot?.blockers_count || 0,
    daysRemaining,
    estimatedCompletionDate,
    riskFactors,
  };
}

// ============================================================
// 4) Auto-Create Snapshot (called periodically or on updates)
// ============================================================
export async function autoCreateSnapshot(actionId: string): Promise<void> {
  // Get action details
  const { data: action } = await supabase
    .from("action_items")
    .select("due_date, status, created_at")
    .eq("id", actionId)
    .single();

  if (!action) return;

  // Get milestones
  const { data: milestones } = await supabase
    .from("action_plan_milestones")
    .select("status")
    .eq("action_id", actionId);

  const milestonesTotal = milestones?.length || 0;
  const milestonesCompleted =
    milestones?.filter((m) => m.status === "completed").length || 0;

  const progressPct =
    milestonesTotal > 0
      ? Math.round((milestonesCompleted / milestonesTotal) * 100)
      : 0;

  // Calculate time metrics
  const now = new Date();
  const createdAt = new Date(action.created_at);
  const daysElapsed = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  let daysRemaining: number | null = null;
  let isOverdue = false;

  if (action.due_date) {
    const dueDate = new Date(action.due_date);
    daysRemaining = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    isOverdue = daysRemaining < 0;
  }

  // Calculate velocity
  const velocityScore = daysElapsed > 0 ? progressPct / daysElapsed : null;

  // Determine status flags
  const isOnTrack = !isOverdue && progressPct >= 50;
  const isAtRisk = daysRemaining !== null && daysRemaining < 7 && progressPct < 80;

  // Get health score
  const { data: healthScore } = await supabase.rpc(
    "fn_calculate_action_health_score",
    {
      p_action_id: actionId,
    }
  );

  // Create snapshot
  await createTrackingSnapshot({
    actionId,
    progressPct,
    milestonesCompleted,
    milestonesTotal,
    daysElapsed,
    daysRemaining,
    isOnTrack,
    isAtRisk,
    isOverdue,
    velocityScore,
    healthScore: healthScore || null,
    blockersCount: 0, // TODO: Calculate from dependencies
  });
}
