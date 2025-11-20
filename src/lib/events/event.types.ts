/**
 * Event System - Core Type Definitions
 * 
 * Comprehensive type system for the unified event architecture
 */

// ============================================================================
// Event Categories (14 modules + core)
// ============================================================================
export type EventCategory = 
  | 'auth'           // Authentication & Authorization
  | 'policy'         // Gate-F: Policies Management
  | 'action'         // Gate-H: Actions/Remediation
  | 'kpi'            // Gate-I: KPIs & Metrics
  | 'campaign'       // Gate-K: Campaigns Management
  | 'analytics'      // Gate-L: Analytics & Reports
  | 'training'       // LMS Module
  | 'awareness'      // Awareness Impact Scoring
  | 'phishing'       // Phishing Simulations
  | 'document'       // Document Management
  | 'committee'      // Committees & Governance
  | 'content'        // Content Hub
  | 'culture'        // Culture Index
  | 'objective'      // Objectives Management
  | 'alert'          // Alerts & Notifications
  | 'admin'          // Admin Module
  | 'grc'            // GRC Module
  | 'platform'       // Platform Module
  | 'system';        // System-level events

// ============================================================================
// Event Priority Levels
// ============================================================================
export type EventPriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'critical';

// ============================================================================
// Event Processing Status
// ============================================================================
export type EventStatus = 
  | 'pending'       // Just created, not processed yet
  | 'processing'    // Currently being processed
  | 'processed'     // Successfully processed
  | 'failed';       // Processing failed

// ============================================================================
// Main Event Interface
// ============================================================================
export interface SystemEvent {
  id: string;
  tenant_id: string;
  event_type: string;
  event_category: EventCategory;
  source_module: string;
  entity_type?: string;
  entity_id?: string;
  user_id?: string;
  priority: EventPriority;
  payload: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  processed_at?: string;
  status: EventStatus;
}

// ============================================================================
// Event Publishing Parameters
// ============================================================================
export interface PublishEventParams {
  event_type: string;
  event_category: EventCategory;
  source_module: string;
  entity_type?: string;
  entity_id?: string;
  priority?: EventPriority;
  payload?: Record<string, any>;
  metadata?: Record<string, any>;
}

// ============================================================================
// Event Subscription
// ============================================================================
export interface EventSubscription {
  id: string;
  subscriber_module: string;
  event_types: string[];
  callback: (event: SystemEvent) => void | Promise<void>;
}

// ============================================================================
// Automation Rule Types
// ============================================================================
export interface AutomationRule {
  id: string;
  tenant_id: string;
  rule_name: string;
  description_ar?: string;
  trigger_event_types: string[];
  conditions: RuleConditions;
  actions: RuleAction[];
  priority: number;
  is_enabled: boolean;
  execution_mode: 'immediate' | 'scheduled' | 'delayed';
  schedule_config?: Record<string, any>;
  retry_config?: RetryConfig;
  execution_count: number;
  last_executed_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Rule Conditions
// ============================================================================
export interface RuleConditions {
  logic: 'AND' | 'OR';
  rules: RuleCondition[];
}

export interface RuleCondition {
  field: string;
  operator: ConditionOperator;
  value: string;
}

export type ConditionOperator =
  | 'eq'           // Equal
  | 'neq'          // Not equal
  | 'gt'           // Greater than
  | 'gte'          // Greater than or equal
  | 'lt'           // Less than
  | 'lte'          // Less than or equal
  | 'contains'     // Contains text
  | 'not_contains' // Does not contain
  | 'starts_with'  // Starts with
  | 'ends_with'    // Ends with
  | 'in'           // In list
  | 'not_in'       // Not in list
  | 'is_null'      // Is null
  | 'is_not_null'; // Is not null

// ============================================================================
// Rule Actions
// ============================================================================
export interface RuleAction {
  action_type: ActionType;
  config: Record<string, any>;
}

export type ActionType =
  | 'enroll_in_course'
  | 'send_notification'
  | 'send_email'
  | 'create_action_plan'
  | 'update_kpi'
  | 'update_record'
  | 'trigger_campaign'
  | 'trigger_workflow'
  | 'create_task'
  | 'log_event'
  | 'call_webhook';

// ============================================================================
// Retry Configuration
// ============================================================================
export interface RetryConfig {
  max_retries: number;
  backoff_seconds: number[];
}

// ============================================================================
// Event Execution Log
// ============================================================================
export interface EventExecutionLog {
  id: string;
  tenant_id: string;
  event_id: string;
  rule_id?: string;
  execution_status: 'success' | 'failed' | 'partial' | 'skipped';
  execution_result?: Record<string, any>;
  error_message?: string;
  execution_duration_ms?: number;
  executed_at: string;
}

// ============================================================================
// Event Statistics
// ============================================================================
export interface EventStatistics {
  total_events: number;
  today_events: number;
  processing_events: number;
  failed_events: number;
  by_category: Record<EventCategory, number>;
  by_priority: Record<EventPriority, number>;
}

// ============================================================================
// Integration Webhook
// ============================================================================
export interface IntegrationWebhook {
  id: string;
  tenant_id: string;
  webhook_name: string;
  url: string;
  event_types: string[];
  auth_type: 'none' | 'basic' | 'bearer' | 'api_key';
  auth_config?: Record<string, any>;
  is_active: boolean;
  retry_count: number;
  timeout_seconds: number;
  last_triggered_at?: string;
  success_count: number;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Common Event Types by Module (for reference & autocomplete)
// ============================================================================
export const COMMON_EVENT_TYPES = {
  // Gate-F: Policies
  POLICY_CREATED: 'policy_created',
  POLICY_UPDATED: 'policy_updated',
  POLICY_PUBLISHED: 'policy_published',
  POLICY_ARCHIVED: 'policy_archived',

  // Gate-H: Actions
  ACTION_CREATED: 'action_created',
  ACTION_ASSIGNED: 'action_assigned',
  ACTION_COMPLETED: 'action_completed',
  ACTION_OVERDUE: 'action_overdue',

  // Gate-I: KPIs
  KPI_CREATED: 'kpi_created',
  KPI_UPDATED: 'kpi_updated',
  KPI_THRESHOLD_BREACH: 'kpi_threshold_breach',

  // Gate-K: Campaigns
  CAMPAIGN_CREATED: 'campaign_created',
  CAMPAIGN_STARTED: 'campaign_started',
  CAMPAIGN_COMPLETED: 'campaign_completed',
  PARTICIPANT_ENROLLED: 'participant_enrolled',

  // Gate-L: Analytics
  REPORT_GENERATED: 'report_generated',
  INSIGHT_DETECTED: 'insight_detected',
  ANOMALY_DETECTED: 'anomaly_detected',

  // Training/LMS
  COURSE_CREATED: 'course_created',
  ENROLLMENT_CREATED: 'enrollment_created',
  PROGRESS_UPDATED: 'progress_updated',
  CERTIFICATE_ISSUED: 'certificate_issued',

  // Awareness
  IMPACT_SCORE_CALCULATED: 'impact_score_calculated',
  CALIBRATION_COMPLETED: 'calibration_completed',

  // Phishing
  SIMULATION_LAUNCHED: 'simulation_launched',
  USER_CLICKED: 'user_clicked',
  USER_REPORTED: 'user_reported',

  // Documents
  DOCUMENT_UPLOADED: 'document_uploaded',
  DOCUMENT_APPROVED: 'document_approved',
  DOCUMENT_EXPIRED: 'document_expired',

  // Committees
  MEETING_SCHEDULED: 'meeting_scheduled',
  DECISION_MADE: 'decision_made',
  FOLLOWUP_CREATED: 'followup_created',

  // Content Hub
  CONTENT_PUBLISHED: 'content_published',
  CONTENT_VIEWED: 'content_viewed',

  // Culture Index
  SURVEY_COMPLETED: 'survey_completed',
  CULTURE_SCORE_CALCULATED: 'culture_score_calculated',

  // Objectives
  OBJECTIVE_CREATED: 'objective_created',
  OBJECTIVE_PROGRESS_UPDATED: 'objective_progress_updated',

  // Alerts
  ALERT_TRIGGERED: 'alert_triggered',
  ALERT_ACKNOWLEDGED: 'alert_acknowledged',

  // Auth
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  USER_ROLE_CHANGED: 'user_role_changed',
} as const;

export type CommonEventType = typeof COMMON_EVENT_TYPES[keyof typeof COMMON_EVENT_TYPES];
