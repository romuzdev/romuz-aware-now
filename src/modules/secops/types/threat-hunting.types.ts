/**
 * Threat Hunting Types
 * M18.5 - SecOps Enhancement
 */

export interface ThreatHuntQuery {
  id: string;
  tenant_id: string;
  query_name: string;
  description_ar?: string;
  query_type: 'ioc_search' | 'pattern_match' | 'anomaly_detection' | 'correlation';
  query_config: Record<string, any>;
  saved_filters?: Record<string, any>;
  is_scheduled: boolean;
  schedule_cron?: string;
  last_executed_at?: string;
  execution_count: number;
  results_count: number;
  created_by: string;
  is_active: boolean;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface ThreatHuntResult {
  id: string;
  tenant_id: string;
  query_id: string;
  executed_by: string;
  executed_at: string;
  results_data: any[];
  matched_events_count: number;
  matched_indicators_count: number;
  execution_time_ms?: number;
  status: 'running' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
}

export interface SecurityEventThreatMatch {
  id: string;
  tenant_id: string;
  event_id: string;
  indicator_id: string;
  match_type: 'ip' | 'domain' | 'hash' | 'url' | 'email';
  match_value: string;
  confidence_score: number;
  matched_at: string;
  is_confirmed: boolean;
  confirmed_by?: string;
  confirmed_at?: string;
  notes?: string;
  created_at: string;
}

export interface ThreatHuntDashboard {
  tenant_id: string;
  total_queries: number;
  active_queries: number;
  total_executions: number;
  total_matches: number;
  last_execution?: string;
}

export interface ThreatHuntFilters {
  query_type?: string;
  is_active?: boolean;
  search?: string;
}
