/**
 * Workflow Automation Types
 * Week 4 - Phase 4
 */

export interface AutomationRule {
  id: string;
  tenant_id: string;
  rule_name: string;
  description_ar?: string;
  trigger_event_types: string[];
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  is_enabled: boolean;
  priority: number;
  execution_mode: 'immediate' | 'scheduled' | 'batch';
  schedule_config?: ScheduleConfig;
  retry_config?: RetryConfig;
  execution_count: number;
  last_executed_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'between';
  value: any;
  logic?: 'AND' | 'OR';
}

export interface AutomationAction {
  type: 'send_notification' | 'update_field' | 'create_record' | 'trigger_webhook' | 'run_function';
  config: Record<string, any>;
  delay_seconds?: number;
}

export interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  time?: string;
  day_of_week?: number;
  day_of_month?: number;
  cron_expression?: string;
}

export interface RetryConfig {
  max_attempts: number;
  backoff_seconds: number;
  retry_on_errors: string[];
}

export interface WorkflowExecution {
  id: string;
  rule_id: string;
  tenant_id: string;
  trigger_event: string;
  trigger_data: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  actions_executed: number;
  actions_total: number;
  execution_log: ExecutionLogEntry[];
  created_at: string;
}

export interface ExecutionLogEntry {
  timestamp: string;
  action: string;
  status: 'success' | 'failed';
  message: string;
  data?: any;
}

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  trigger_event_types: string[];
  default_conditions: AutomationCondition[];
  default_actions: AutomationAction[];
  is_builtin: boolean;
}

export interface AutomationStats {
  total_rules: number;
  active_rules: number;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  avg_execution_time_ms: number;
}

// Form types
export interface AutomationRuleFormData {
  rule_name: string;
  description_ar?: string;
  trigger_event_types: string[];
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  is_enabled: boolean;
  priority: number;
  execution_mode: 'immediate' | 'scheduled' | 'batch';
  schedule_config?: ScheduleConfig;
}
