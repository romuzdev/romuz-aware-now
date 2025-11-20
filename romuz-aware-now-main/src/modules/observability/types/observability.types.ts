// ============================================================================
// Gate-E: Observability Types & Zod Schemas
// ============================================================================

import { z } from "zod";

// ============================================================
// Legacy Types (keep for backward compatibility)
// ============================================================
export interface FeatureFlag {
  id: string;
  tenant_id: string | null;
  flag_key: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  metadata: Record<string, any>;
}

export interface JobRun {
  id: string;
  tenant_id: string;
  job_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  error_message?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SmokeTestResult {
  success: boolean;
  flag?: {
    enabled_tenants: number;
    tenants: string[];
  };
  channel?: {
    id: string;
    type: string;
    config: Record<string, any>;
  };
  seed?: {
    tenant_id: string;
    campaigns_created: number;
    date_range: string;
  };
  policy?: {
    count: number;
    enabled: number;
  };
  tests?: {
    job_run_id: string;
    alert_generated: boolean;
    alert_count: number;
    kpi_view_accessible: boolean;
    kpi_records: number;
  };
  errors?: string[];
}

// ============================================================
// D1 Standard Types (New)
// ============================================================

// Saved Alert Views (D1 Standard)
export const GateEAlertView = z.object({
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
export type GateEAlertView = z.infer<typeof GateEAlertView>;

export const SaveAlertViewInput = z.object({
  viewName: z.string().min(1, "اسم العرض مطلوب"),
  descriptionAr: z.string().nullable().optional(),
  filters: z.record(z.string(), z.any()),
  sortConfig: z.record(z.string(), z.any()).nullable().optional(),
  isDefault: z.boolean().optional(),
  isShared: z.boolean().optional(),
});
export type SaveAlertViewInput = z.infer<typeof SaveAlertViewInput>;

// Bulk Alert Operations (D1 Standard)
export const BulkAlertOperationResult = z.object({
  operation_id: z.string().uuid(),
  affected_count: z.number(),
  status: z.enum(["processing", "completed", "failed", "partial"] as const),
  errors: z.array(z.record(z.string(), z.any())).nullable().optional(),
});
export type BulkAlertOperationResult = z.infer<typeof BulkAlertOperationResult>;

export const BulkToggleRulesInput = z.object({
  policyIds: z.array(z.string().uuid()).min(1, "يجب تحديد قاعدة واحدة على الأقل"),
  enable: z.boolean(),
});
export type BulkToggleRulesInput = z.infer<typeof BulkToggleRulesInput>;

export const BulkUpdateSeverityInput = z.object({
  policyIds: z.array(z.string().uuid()).min(1, "يجب تحديد قاعدة واحدة على الأقل"),
  severity: z.enum(["low", "medium", "high", "critical"]),
});
export type BulkUpdateSeverityInput = z.infer<typeof BulkUpdateSeverityInput>;

export const BulkDeleteRulesInput = z.object({
  policyIds: z.array(z.string().uuid()).min(1, "يجب تحديد قاعدة واحدة على الأقل"),
});
export type BulkDeleteRulesInput = z.infer<typeof BulkDeleteRulesInput>;

export const BulkEnableAlertsInput = z.object({
  policyIds: z.array(z.string().uuid()).min(1, "يجب تحديد قاعدة واحدة على الأقل"),
});
export type BulkEnableAlertsInput = z.infer<typeof BulkEnableAlertsInput>;

export const BulkDisableAlertsInput = z.object({
  policyIds: z.array(z.string().uuid()).min(1, "يجب تحديد قاعدة واحدة على الأقل"),
});
export type BulkDisableAlertsInput = z.infer<typeof BulkDisableAlertsInput>;

export const BulkDeleteAlertsInput = z.object({
  policyIds: z.array(z.string().uuid()).min(1, "يجب تحديد قاعدة واحدة على الأقل"),
});
export type BulkDeleteAlertsInput = z.infer<typeof BulkDeleteAlertsInput>;

// Alert Rules Import (D1 Standard)
export const ImportAlertRulesInput = z.object({
  filename: z.string(),
  format: z.enum(["csv", "json"] as const),
  rules: z.array(z.record(z.string(), z.any())),
});
export type ImportAlertRulesInput = z.infer<typeof ImportAlertRulesInput>;

export const ImportAlertResult = z.object({
  import_id: z.string().uuid(),
  status: z.enum(["pending", "completed", "failed"]),
  total_rows: z.number().int(),
  success_count: z.number().int(),
  error_count: z.number().int(),
  error_details: z.array(z.any()).nullable().optional(),
});
export type ImportAlertResult = z.infer<typeof ImportAlertResult>;

export const AlertImportHistory = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  format: z.enum(["csv", "json"] as const),
  total_rows: z.number(),
  success_count: z.number(),
  error_count: z.number(),
  errors: z.array(z.record(z.string(), z.any())).nullable().optional(),
  status: z.enum(["processing", "completed", "failed"] as const),
  created_at: z.string(),
});
export type AlertImportHistory = z.infer<typeof AlertImportHistory>;

// ============================================================
// Alert Core Types (from src/types/observability.ts)
// ============================================================

export type AlertChannelType = 'email' | 'webhook' | 'slack';

export interface AlertChannel {
  id: string;
  tenant_id: string | null;
  type: AlertChannelType;
  name: string;
  config_json: {
    to?: string;
    reply_to?: string;
    url?: string;
    webhook_url?: string;
    secret?: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export type AlertSeverity = 'info' | 'warn' | 'critical';
export type AlertScope = 'campaign' | 'tenant' | 'platform';
export type AlertMetric = 'open_rate' | 'click_rate' | 'activation_rate' | 'completion_rate' | 'bounce_rate' | 'export_failure_events';
export type AlertTimeWindow = 'daily' | 'ctd';
export type AlertOperator = '<' | '<=' | '>=' | '>' | 'delta_pct' | 'mom' | 'wow';

export interface AlertPolicy {
  id: string;
  tenant_id: string;
  name: string;
  scope: AlertScope;
  metric: AlertMetric;
  time_window: AlertTimeWindow;
  operator: AlertOperator;
  threshold_value: number;
  lookback_days: number;
  is_enabled: boolean;
  severity: AlertSeverity;
  notify_cooldown_minutes: number;
  template_code?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  last_triggered_at?: string;
}

export interface AlertTemplate {
  id: string;
  tenant_id: string | null;
  code: string;
  locale: 'ar' | 'en';
  subject_tpl: string;
  body_tpl: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface AlertPolicyTarget {
  id: string;
  policy_id: string;
  tenant_id: string;
  campaign_id?: string;
  tag?: string;
  created_at: string;
}

export interface AlertPolicyChannel {
  id: string;
  policy_id: string;
  channel_id: string;
  tenant_id: string;
  subject_prefix?: string;
  created_at: string;
}

export type AlertEventStatus = 'pending' | 'dispatched' | 'failed';

export interface AlertEvent {
  id: string;
  policy_id: string;
  tenant_id: string;
  target_ref?: string;
  metric_value: number;
  baseline_value?: number;
  delta_pct?: number;
  severity: AlertSeverity;
  dedupe_key: string;
  status: AlertEventStatus;
  dispatched_at?: string;
  error_message?: string;
  created_at: string;
}

export interface CampaignKPIDaily {
  tenant_id: string;
  campaign_id: string;
  date_r: string; // Riyadh date
  invited_count: number;
  opened_count: number;
  clicked_count: number;
  activated_count: number;
  completed_count: number;
  reminded_count: number;
  bounced_count: number;
  kpi_open_rate: number;
  kpi_click_rate: number;
  kpi_activation_rate: number;
  kpi_completion_rate: number;
  refreshed_at: string;
}

export interface CampaignKPICTD {
  tenant_id: string;
  campaign_id: string;
  invited_count: number;
  opened_count: number;
  clicked_count: number;
  activated_count: number;
  completed_count: number;
  reminded_count: number;
  bounced_count: number;
  kpi_open_rate: number;
  kpi_click_rate: number;
  kpi_activation_rate: number;
  kpi_completion_rate: number;
  last_activity_date: string;
  first_activity_date: string;
}

// Form types for CRUD operations
export interface CreateAlertChannelData {
  type: AlertChannelType;
  name: string;
  config_json: AlertChannel['config_json'];
  is_active?: boolean;
}

export interface UpdateAlertChannelData {
  name?: string;
  config_json?: AlertChannel['config_json'];
  is_active?: boolean;
}

export interface CreateAlertPolicyData {
  name: string;
  scope: AlertScope;
  metric: AlertMetric;
  time_window: AlertTimeWindow;
  operator: AlertOperator;
  threshold_value: number;
  lookback_days?: number;
  is_enabled?: boolean;
  severity: AlertSeverity;
  notify_cooldown_minutes?: number;
  template_code?: string;
}

export interface UpdateAlertPolicyData {
  name?: string;
  scope?: AlertScope;
  metric?: AlertMetric;
  time_window?: AlertTimeWindow;
  operator?: AlertOperator;
  threshold_value?: number;
  lookback_days?: number;
  is_enabled?: boolean;
  severity?: AlertSeverity;
  notify_cooldown_minutes?: number;
  template_code?: string;
}

export interface CreateAlertTemplateData {
  code: string;
  locale: 'ar' | 'en';
  subject_tpl: string;
  body_tpl: string;
}

export interface UpdateAlertTemplateData {
  subject_tpl?: string;
  body_tpl?: string;
}

// Feature flags
export interface FeatureFlagConfig {
  id: string;
  flag_key: string;
  description_ar: string | null;
  is_enabled: boolean;
  tenant_id: string | null;
  rollout_pct: number;
  conditions: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateFeatureFlagParams {
  is_enabled?: boolean;
  rollout_pct?: number;
  conditions?: Record<string, any>;
}
