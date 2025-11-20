// ============================================================================
// Gate-H: Tracking Types & Schemas
// ============================================================================

import { z } from "zod";

// ============================================================
// 1) Tracking Snapshot Row (from DB)
// ============================================================
export const ActionTrackingSnapshot = z.object({
  id: z.string().uuid(),
  snapshot_at: z.string(),
  progress_pct: z.number().int().min(0).max(100),
  milestones_completed: z.number().int(),
  milestones_total: z.number().int(),
  days_elapsed: z.number().int().nullable(),
  days_remaining: z.number().int().nullable(),
  is_on_track: z.boolean().nullable(),
  is_at_risk: z.boolean().nullable(),
  is_overdue: z.boolean().nullable(),
  velocity_score: z.number().nullable(),
  health_score: z.number().nullable(),
  blockers_count: z.number().int(),
});
export type ActionTrackingSnapshot = z.infer<typeof ActionTrackingSnapshot>;

// ============================================================
// 2) Action Health Metrics
// ============================================================
export const ActionHealthMetrics = z.object({
  actionId: z.string().uuid(),
  currentProgress: z.number().int().min(0).max(100),
  healthScore: z.number().min(0).max(100),
  velocityScore: z.number().nullable(),
  milestonesCompleted: z.number().int(),
  milestonesTotal: z.number().int(),
  isOnTrack: z.boolean(),
  isAtRisk: z.boolean(),
  isOverdue: z.boolean(),
  blockersCount: z.number().int(),
  daysRemaining: z.number().int().nullable(),
  estimatedCompletionDate: z.string().nullable(),
  riskFactors: z.array(
    z.object({
      factor: z.string(),
      severity: z.enum(["low", "medium", "high", "critical"]),
      description: z.string(),
    })
  ),
});
export type ActionHealthMetrics = z.infer<typeof ActionHealthMetrics>;

// ============================================================
// 3) Progress Timeline Item
// ============================================================
export const ProgressTimelineItem = z.object({
  date: z.string(),
  progressPct: z.number(),
  healthScore: z.number(),
  milestonesCompleted: z.number(),
  velocityScore: z.number().nullable(),
  event: z.string().optional(),
});
export type ProgressTimelineItem = z.infer<typeof ProgressTimelineItem>;

// ============================================================
// 4) Create Tracking Snapshot Input
// ============================================================
export const CreateTrackingSnapshotInput = z.object({
  actionId: z.string().uuid(),
  progressPct: z.number().int().min(0).max(100),
  milestonesCompleted: z.number().int(),
  milestonesTotal: z.number().int(),
  daysElapsed: z.number().int().optional(),
  daysRemaining: z.number().int().optional(),
  isOnTrack: z.boolean().optional(),
  isAtRisk: z.boolean().optional(),
  isOverdue: z.boolean().optional(),
  velocityScore: z.number().optional(),
  healthScore: z.number().optional(),
  blockersCount: z.number().int().default(0),
  issuesSummary: z.array(z.any()).optional(),
});
export type CreateTrackingSnapshotInput = z.infer<typeof CreateTrackingSnapshotInput>;
