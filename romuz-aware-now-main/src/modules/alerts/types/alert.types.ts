/**
 * Alerts Module - Types
 */

export interface AlertPolicy {
  id: string;
  name: string;
  metric: string;
  operator: string;
  threshold_value: number;
  severity: AlertSeverity;
  is_enabled: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AlertEvent {
  id: string;
  policy_id: string;
  metric_value: number;
  severity: AlertSeverity;
  status: AlertEventStatus;
  tenant_id: string;
  created_at: string;
}

export type AlertEventStatus = 'pending' | 'dispatched' | 'acknowledged' | 'resolved';

export interface AlertChannel {
  id: string;
  name: string;
  type: AlertChannelType;
  config_json: any;
  is_active: boolean;
  tenant_id: string;
  created_at: string;
}

export type AlertChannelType = 'email' | 'sms' | 'webhook' | 'slack';
