// ============================================================================
// Gate-H: TypeScript Types & Zod Schemas
// Closed-loop action planning derived from Gate-K/J recommendations
// ============================================================================

import { z } from "zod";

// ============================================================
// 1) Enums - Action Status
// ============================================================
export const GateHActionStatus = z.enum([
  "new",
  "in_progress",
  "blocked",
  "verify",
  "closed",
]);
export type GateHActionStatus = z.infer<typeof GateHActionStatus>;

// ============================================================
// 2) Enums - Priority
// ============================================================
export const GateHActionPriority = z.enum([
  "critical",
  "high",
  "medium",
  "low",
]);
export type GateHActionPriority = z.infer<typeof GateHActionPriority>;

// ============================================================
// 3) Enums - Effort
// ============================================================
export const GateHActionEffort = z.enum(["XS", "S", "M", "L", "XL"]);
export type GateHActionEffort = z.infer<typeof GateHActionEffort>;

// ============================================================
// 4) Enums - Update Type
// ============================================================
export const GateHActionUpdateType = z.enum([
  "comment",
  "progress",
  "status_change",
  "evidence",
]);
export type GateHActionUpdateType = z.infer<typeof GateHActionUpdateType>;

// ============================================================
// 5) Enums - Source
// ============================================================
export const GateHActionSource = z.enum(["K", "I", "J", "manual"]);
export type GateHActionSource = z.infer<typeof GateHActionSource>;

// ============================================================
// 5.1) Export Filters Schema
// ============================================================
/**
 * Filters for Gate-H action export (JSON/CSV)
 * Used by gate_h_export_actions_json/csv RPCs
 */
export const GateHExportFilters = z.object({
  fromDate: z.string().nullable().optional(), // ISO date string
  toDate: z.string().nullable().optional(),
  statuses: z.array(GateHActionStatus).nullable().optional(),
  priorities: z.array(GateHActionPriority).nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  overdueOnly: z.boolean().optional(),
});
export type GateHExportFilters = z.infer<typeof GateHExportFilters>;

// ============================================================
// 6) Action Item Row (from DB)
// ============================================================
/**
 * Gate-H Action Item - Closed-loop action plan item
 * Derived from Gate-K KPIs, Gate-J Impact, or manual entry
 */
export const GateHActionItemRow = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  source: GateHActionSource,
  source_reco_id: z.string().uuid().nullable(),
  kpi_key: z.string().nullable(),
  dim_key: z.string().nullable(),
  dim_value: z.string().nullable(),
  title_ar: z.string(),
  desc_ar: z.string().nullable(),
  priority: GateHActionPriority,
  status: GateHActionStatus,
  effort: GateHActionEffort.nullable(),
  sla_days: z.number().int().nullable(),
  due_date: z.string().nullable(), // ISO date string
  owner_user_id: z.string().uuid(),
  assignee_user_id: z.string().uuid().nullable(),
  verified_by: z.string().uuid().nullable(),
  verified_at: z.string().nullable(), // ISO datetime
  closed_at: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid(),
  updated_by: z.string().uuid(),
});
export type GateHActionItemRow = z.infer<typeof GateHActionItemRow>;

// ============================================================
// 7) Action Update Row (from DB)
// ============================================================
/**
 * Gate-H Action Update - Progress log, comment, evidence, or status change
 */
export const GateHActionUpdateRow = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  action_id: z.string().uuid(),
  update_type: GateHActionUpdateType,
  body_ar: z.string().nullable(),
  evidence_url: z.string().nullable(),
  new_status: GateHActionStatus.nullable(),
  progress_pct: z.number().int().nullable(),
  created_at: z.string(),
  created_by: z.string().uuid(),
});
export type GateHActionUpdateRow = z.infer<typeof GateHActionUpdateRow>;

// ============================================================
// 8) Action Link Row (from DB)
// ============================================================
/**
 * Gate-H Action Link - External/internal references (Jira, docs, etc.)
 */
export const GateHActionLinkRow = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  action_id: z.string().uuid(),
  link_type: z.string().nullable(),
  url: z.string(),
  title_ar: z.string().nullable(),
  created_at: z.string(),
  created_by: z.string().uuid(),
});
export type GateHActionLinkRow = z.infer<typeof GateHActionLinkRow>;

// ============================================================
// 9) Enriched Action Item (for UI)
// ============================================================
/**
 * Enriched action item with display names and computed flags
 */
export const GateHActionItem = GateHActionItemRow.extend({
  assignee_display_name: z.string().nullable().optional(),
  owner_display_name: z.string().nullable().optional(),
  verified_by_display_name: z.string().nullable().optional(),
  is_overdue: z.boolean().optional(),
  is_closed: z.boolean().optional(),
  is_in_progress: z.boolean().optional(),
  days_until_due: z.number().nullable().optional(),
});
export type GateHActionItem = z.infer<typeof GateHActionItem>;

// ============================================================
// 10) Enriched Action Update (for UI)
// ============================================================
export const GateHActionUpdate = GateHActionUpdateRow.extend({
  created_by_display_name: z.string().nullable().optional(),
});
export type GateHActionUpdate = z.infer<typeof GateHActionUpdate>;

// ============================================================
// 11) Action Link (for UI)
// ============================================================
export const GateHActionLink = GateHActionLinkRow;
export type GateHActionLink = z.infer<typeof GateHActionLink>;

// ============================================================
// 12) RPC Inputs - Create Action from Recommendation
// ============================================================
export const CreateActionFromRecommendationInput = z.object({
  source: GateHActionSource,
  sourceRecoId: z.string().uuid().nullable().optional(),
  kpiKey: z.string().nullable().optional(),
  dimKey: z.string().nullable().optional(),
  dimValue: z.string().nullable().optional(),
  titleAr: z.string().min(1, "العنوان مطلوب"),
  descAr: z.string().nullable().optional(),
  priority: GateHActionPriority.optional(),
  dueDate: z.string().nullable().optional(), // ISO date YYYY-MM-DD
  slaDays: z.number().int().positive().nullable().optional(),
  assigneeUserId: z.string().uuid().nullable().optional(),
  effort: GateHActionEffort.nullable().optional(),
  tags: z.array(z.string()).optional(),
});
export type CreateActionFromRecommendationInput = z.infer<
  typeof CreateActionFromRecommendationInput
>;

// ============================================================
// 13) RPC Inputs - Add Update
// ============================================================
export const AddActionUpdateInput = z.object({
  actionId: z.string().uuid(),
  updateType: GateHActionUpdateType,
  bodyAr: z.string().nullable().optional(),
  evidenceUrl: z.string().nullable().optional(),
  newStatus: GateHActionStatus.nullable().optional(),
  progressPct: z.number().int().min(0).max(100).nullable().optional(),
});
export type AddActionUpdateInput = z.infer<typeof AddActionUpdateInput>;

// ============================================================
// 14) RPC Inputs - Update Status
// ============================================================
export const UpdateActionStatusInput = z.object({
  actionId: z.string().uuid(),
  newStatus: GateHActionStatus,
  noteAr: z.string().nullable().optional(),
});
export type UpdateActionStatusInput = z.infer<typeof UpdateActionStatusInput>;

// ============================================================
// 15) RPC Inputs - Verify and Close
// ============================================================
export const VerifyAndCloseActionInput = z.object({
  actionId: z.string().uuid(),
  evidenceUrl: z.string().nullable().optional(),
  noteAr: z.string().nullable().optional(),
});
export type VerifyAndCloseActionInput = z.infer<
  typeof VerifyAndCloseActionInput
>;

// ============================================================
// 16) List Actions Filters
// ============================================================
export const ListActionsFilters = z.object({
  statuses: z.array(GateHActionStatus).optional(),
  priorities: z.array(GateHActionPriority).optional(),
  assigneeId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  overdueOnly: z.boolean().optional(),
  closedAfter: z.string().optional(), // ISO date
  search: z.string().optional(),
});
export type ListActionsFilters = z.infer<typeof ListActionsFilters>;

// ============================================================
// 17) RPC Response - Action Created
// ============================================================
export const ActionCreatedResponse = GateHActionItemRow;
export type ActionCreatedResponse = z.infer<typeof ActionCreatedResponse>;

// ============================================================
// 18) Demo Seed Response
// ============================================================
export const DemoSeedResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  actions_created: z.number().optional(),
});
export type DemoSeedResponse = z.infer<typeof DemoSeedResponse>;

// ============================================================
// 19) Saved Views
// ============================================================

/**
 * Saved view for Gate-H actions
 */
export const SaveViewInput = z.object({
  viewName: z.string().min(1, "اسم العرض مطلوب"),
  descriptionAr: z.string().nullable().optional(),
  filters: z.record(z.string(), z.any()),
  sortConfig: z.record(z.string(), z.any()).nullable().optional(),
  isDefault: z.boolean().optional(),
  isShared: z.boolean().optional(),
});
export type SaveViewInput = z.infer<typeof SaveViewInput>;

export const GateHActionView = z.object({
  id: z.string().uuid(),
  view_name: z.string(),
  description_ar: z.string().nullable().optional(),
  filters: z.record(z.string(), z.any()),
  sort_config: z.record(z.string(), z.any()).nullable().optional(),
  is_default: z.boolean(),
  is_shared: z.boolean(),
  is_owner: z.boolean().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type GateHActionView = z.infer<typeof GateHActionView>;

// ============================================================
// 20) Bulk Operations
// ============================================================

export const BulkOperationResult = z.object({
  operation_id: z.string().uuid(),
  affected_count: z.number(),
  status: z.enum(["processing", "completed", "failed", "partial"] as const),
  errors: z.array(z.record(z.string(), z.any())).nullable().optional(),
});
export type BulkOperationResult = z.infer<typeof BulkOperationResult>;

/**
 * Bulk update status input
 */
export const BulkUpdateStatusInput = z.object({
  actionIds: z.array(z.string().uuid()).min(1, "يجب تحديد إجراء واحد على الأقل"),
  newStatus: GateHActionStatus,
  noteAr: z.string().nullable().optional(),
});
export type BulkUpdateStatusInput = z.infer<typeof BulkUpdateStatusInput>;

/**
 * Bulk assign input
 */
export const BulkAssignInput = z.object({
  actionIds: z.array(z.string().uuid()).min(1, "يجب تحديد إجراء واحد على الأقل"),
  assigneeUserId: z.string().uuid(),
  noteAr: z.string().nullable().optional(),
});
export type BulkAssignInput = z.infer<typeof BulkAssignInput>;

/**
 * Bulk delete input
 */
export const BulkDeleteInput = z.object({
  actionIds: z.array(z.string().uuid()).min(1, "يجب تحديد إجراء واحد على الأقل"),
});
export type BulkDeleteInput = z.infer<typeof BulkDeleteInput>;

// ============================================================
// 21) Import/Export
// ============================================================

export const ImportHistoryRow = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  format: z.enum(["csv", "json", "excel"] as const),
  total_rows: z.number(),
  success_count: z.number(),
  error_count: z.number(),
  errors: z.array(z.record(z.string(), z.any())).nullable().optional(),
  status: z.enum(["processing", "completed", "failed"] as const),
  created_at: z.string(),
});
export type ImportHistoryRow = z.infer<typeof ImportHistoryRow>;

/**
 * Import actions input
 */
export const ImportActionsInput = z.object({
  filename: z.string(),
  format: z.enum(["csv", "json", "excel"] as const),
  actions: z.array(z.record(z.string(), z.any())),
});
export type ImportActionsInput = z.infer<typeof ImportActionsInput>;

/**
 * Import result
 */
export const ImportResult = z.object({
  import_id: z.string().uuid(),
  status: z.enum(["processing", "completed", "failed"]),
  total_rows: z.number().int(),
  success_count: z.number().int(),
  error_count: z.number().int(),
  error_details: z.array(z.any()).nullable().optional(),
});
export type ImportResult = z.infer<typeof ImportResult>;
