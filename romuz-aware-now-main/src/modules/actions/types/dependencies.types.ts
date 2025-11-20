// ============================================================================
// Gate-H: Dependencies Types & Schemas
// ============================================================================

import { z } from "zod";

// ============================================================
// 1) Dependency Types
// ============================================================
export const DependencyType = z.enum([
  "finish_to_start", // Target can't start until source finishes
  "start_to_start",  // Target can't start until source starts
  "finish_to_finish", // Target can't finish until source finishes
  "start_to_finish",  // Target can't finish until source starts
]);
export type DependencyType = z.infer<typeof DependencyType>;

export const ViolationStatus = z.enum([
  "ok",
  "warning",
  "violation",
]);
export type ViolationStatus = z.infer<typeof ViolationStatus>;

// ============================================================
// 2) Dependency Row (from DB)
// ============================================================
export const ActionDependency = z.object({
  id: z.string().uuid(),
  source_action_id: z.string().uuid(),
  target_action_id: z.string().uuid(),
  dependency_type: DependencyType,
  lag_days: z.number().int(),
  is_active: z.boolean(),
  violation_status: ViolationStatus.nullable(),
  notes_ar: z.string().nullable(),
  source_action_title: z.string().optional(),
  target_action_title: z.string().optional(),
});
export type ActionDependency = z.infer<typeof ActionDependency>;

// ============================================================
// 3) Create Dependency Input
// ============================================================
export const CreateDependencyInput = z.object({
  sourceActionId: z.string().uuid(),
  targetActionId: z.string().uuid(),
  dependencyType: DependencyType,
  lagDays: z.number().int().default(0),
  notesAr: z.string().optional(),
});
export type CreateDependencyInput = z.infer<typeof CreateDependencyInput>;

// ============================================================
// 4) Update Dependency Input
// ============================================================
export const UpdateDependencyInput = z.object({
  dependencyId: z.string().uuid(),
  dependencyType: DependencyType.optional(),
  lagDays: z.number().int().optional(),
  isActive: z.boolean().optional(),
  notesAr: z.string().optional(),
});
export type UpdateDependencyInput = z.infer<typeof UpdateDependencyInput>;

// ============================================================
// 5) Dependency Graph Node
// ============================================================
export const DependencyGraphNode = z.object({
  id: z.string().uuid(),
  title: z.string(),
  status: z.string(),
  dependencies: z.array(
    z.object({
      targetId: z.string().uuid(),
      type: DependencyType,
      violationStatus: ViolationStatus.nullable(),
    })
  ),
});
export type DependencyGraphNode = z.infer<typeof DependencyGraphNode>;
