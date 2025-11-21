/**
 * SecOps Integration Types
 * M18.5 - Security Operations Management
 */

export type EventSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type EventStatus = 'pending' | 'processed' | 'escalated' | 'resolved';
export type PlaybookStatus = 'active' | 'inactive' | 'archived';
export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type ConnectorType =
  | 'firewall'
  | 'dlp'
  | 'mdm'
  | 'endpoint_protection'
  | 'siem'
  | 'ids_ips'
  | 'email_security'
  | 'web_proxy'
  | 'cloud_security'
  | 'network_monitoring'
  | 'vulnerability_scanner';
export type ConnectorSyncStatus = 'idle' | 'syncing' | 'success' | 'error';

/**
 * Security Event from SIEM or other sources
 */
export interface SecurityEvent {
  id: string;
  tenant_id: string;
  event_timestamp: string;
  event_type: string;
  severity: EventSeverity;
  source_system?: string;
  source_ip?: string;
  destination_ip?: string;
  user_id?: string;
  event_data: Record<string, any>;
  raw_log?: string;
  normalized_fields?: Record<string, any>;
  correlation_id?: string;
  is_processed: boolean;
  threat_indicator_matched?: string;
  incident_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * SOAR Playbook for automated response
 */
export interface SOARPlaybook {
  id: string;
  tenant_id: string;
  playbook_name_ar: string;
  playbook_name_en?: string;
  description_ar?: string;
  description_en?: string;
  trigger_conditions: PlaybookTriggerConditions;
  automation_steps: AutomationStep[];
  approval_required: boolean;
  is_active: boolean;
  execution_count: number;
  success_count: number;
  last_executed_at?: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
  updated_by?: string;
}

export interface PlaybookTriggerConditions {
  event_type?: string[];
  severity?: EventSeverity[];
  source_system?: string[];
  custom_conditions?: Record<string, any>;
}

export interface AutomationStep {
  action:
    | 'block_ip'
    | 'isolate_endpoint'
    | 'disable_user'
    | 'send_notification'
    | 'create_ticket'
    | 'update_firewall'
    | 'quarantine_file'
    | 'custom_action';
  parameters: Record<string, any>;
  on_success?: 'continue' | 'stop';
  on_failure?: 'continue' | 'stop' | 'retry';
  retry_count?: number;
  timeout_seconds?: number;
}

/**
 * SOAR Execution Log
 */
export interface SOARExecution {
  id: string;
  tenant_id: string;
  playbook_id: string;
  trigger_event_id?: string;
  status: ExecutionStatus;
  started_at: string;
  completed_at?: string;
  execution_log: ExecutionLogEntry[];
  actions_taken: string[];
  result?: Record<string, any>;
  error_message?: string;
  executed_by?: string;
  created_at: string;
}

export interface ExecutionLogEntry {
  timestamp: string;
  action: string;
  status: 'success' | 'failed';
  details: Record<string, any>;
  error?: string;
}

/**
 * SecOps Connector
 */
export interface SecOpsConnector {
  id: string;
  tenant_id: string;
  name_ar: string;
  name_en: string;
  connector_type: ConnectorType;
  vendor: string;
  version?: string;
  connection_config: Record<string, any>;
  auth_config?: Record<string, any>;
  sync_enabled: boolean;
  sync_interval_minutes: number;
  sync_status: ConnectorSyncStatus;
  last_sync_at?: string;
  last_sync_result?: Record<string, any>;
  next_sync_at?: string;
  error_count: number;
  last_error?: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
  updated_at: string;
  updated_by?: string;
}

/**
 * Connector Sync Log
 */
export interface ConnectorSyncLog {
  id: string;
  tenant_id: string;
  connector_id: string;
  sync_started_at: string;
  sync_completed_at?: string;
  status: 'started' | 'success' | 'error';
  records_processed: number;
  records_imported: number;
  records_failed: number;
  error_message?: string;
  sync_details?: Record<string, any>;
  created_at: string;
}

/**
 * Event Correlation Rule
 */
export interface EventCorrelationRule {
  id: string;
  tenant_id: string;
  rule_name_ar: string;
  rule_name_en?: string;
  description_ar?: string;
  description_en?: string;
  event_patterns: EventPattern[];
  correlation_logic: 'all' | 'any' | 'sequence' | 'threshold';
  time_window_minutes: number;
  threshold_count: number;
  severity_override?: EventSeverity;
  auto_create_incident: boolean;
  is_active: boolean;
  match_count: number;
  last_matched_at?: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
  updated_by?: string;
}

export interface EventPattern {
  event_type: string;
  conditions: Record<string, any>;
  time_window?: number;
}

/**
 * SecOps Statistics for Dashboard
 */
export interface SecOpsStatistics {
  tenant_id: string;
  events_last_24h: number;
  critical_events_24h: number;
  unprocessed_events: number;
  correlated_event_groups: number;
  active_playbooks: number;
  running_executions: number;
  completed_executions_24h: number;
  active_connectors: number;
  connectors_with_errors: number;
}

/**
 * Filters
 */
export interface SecurityEventFilters {
  severity?: EventSeverity[];
  source_system?: string[];
  is_processed?: boolean;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface SOARPlaybookFilters {
  is_active?: boolean;
  search?: string;
}

export interface ConnectorFilters {
  connector_type?: ConnectorType[];
  is_active?: boolean;
  sync_status?: ConnectorSyncStatus[];
  search?: string;
}
