// ============================================================================
// Gate-H: Milestones Types & Schemas
// ============================================================================

import { z } from "zod";

// ============================================================
// 1) Milestone Types
// ============================================================
export const MilestoneType = z.enum([
  "start",
  "checkpoint",
  "deliverable",
  "review",
  "completion",
]);
export type MilestoneType = z.infer<typeof MilestoneType>;

export const MilestoneStatus = z.enum([
  "pending",
  "in_progress",
  "completed",
  "delayed",
  "cancelled",
]);
export type MilestoneStatus = z.infer<typeof MilestoneStatus>;

// ============================================================
// 2) Milestone Row (from DB)
// ============================================================
export const ActionMilestone = z.object({
  id: z.string().uuid(),
  action_id: z.string().uuid(),
  title_ar: z.string(),
  description_ar: z.string().nullable(),
  milestone_type: MilestoneType,
  planned_date: z.string(), // DATE string
  actual_date: z.string().nullable(),
  status: MilestoneStatus,
  completion_pct: z.number().int().min(0).max(100),
  deliverables: z.array(z.any()).default([]),
  evidence_urls: z.array(z.string()).nullable(),
  sequence_order: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type ActionMilestone = z.infer<typeof ActionMilestone>;

// ============================================================
// 3) Create Milestone Input
// ============================================================
export const CreateMilestoneInput = z.object({
  actionId: z.string().uuid(),
  titleAr: z.string().min(1, "العنوان مطلوب"),
  descriptionAr: z.string().optional(),
  milestoneType: MilestoneType,
  plannedDate: z.string(), // YYYY-MM-DD
  sequenceOrder: z.number().int().min(0),
  deliverables: z.array(z.any()).optional(),
});
export type CreateMilestoneInput = z.infer<typeof CreateMilestoneInput>;

// ============================================================
// 4) Update Milestone Input
// ============================================================
export const UpdateMilestoneInput = z.object({
  milestoneId: z.string().uuid(),
  titleAr: z.string().optional(),
  descriptionAr: z.string().optional(),
  plannedDate: z.string().optional(),
  actualDate: z.string().nullable().optional(),
  status: MilestoneStatus.optional(),
  completionPct: z.number().int().min(0).max(100).optional(),
  evidenceUrls: z.array(z.string()).optional(),
  deliverables: z.array(z.any()).optional(),
});
export type UpdateMilestoneInput = z.infer<typeof UpdateMilestoneInput>;

// ============================================================
// 5) Milestone with Progress
// ============================================================
export const MilestoneWithProgress = ActionMilestone.extend({
  is_overdue: z.boolean(),
  days_until_due: z.number().nullable(),
  progress_indicator: z.enum(["on_track", "at_risk", "overdue", "completed"]),
});
export type MilestoneWithProgress = z.infer<typeof MilestoneWithProgress>;
