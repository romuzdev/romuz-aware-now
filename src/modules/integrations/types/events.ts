/**
 * Integration Events Types
 * Gate-M15: Event definitions for integrations
 */

// =========================================
// Event Types
// =========================================

export type IntegrationEventType =
  | 'connector.created'
  | 'connector.updated'
  | 'connector.deleted'
  | 'connector.activated'
  | 'connector.deactivated'
  | 'connector.synced'
  | 'connector.sync_failed'
  | 'webhook.received'
  | 'webhook.processed'
  | 'webhook.failed'
  | 'api_key.created'
  | 'api_key.revoked'
  | 'api_key.used'
  | 'notification.sent'
  | 'notification.failed'
  | 'sync.started'
  | 'sync.completed'
  | 'sync.failed';

// =========================================
// Event Payload Interfaces
// =========================================

export interface ConnectorCreatedEvent {
  connector_id: string;
  connector_name: string;
  connector_type: string;
  tenant_id: string;
  created_by: string;
}

export interface ConnectorSyncedEvent {
  connector_id: string;
  connector_name: string;
  sync_duration_ms: number;
  records_synced: number;
  tenant_id: string;
}

export interface ConnectorSyncFailedEvent {
  connector_id: string;
  connector_name: string;
  error_message: string;
  error_code: string;
  tenant_id: string;
}

export interface WebhookReceivedEvent {
  webhook_id: string;
  webhook_name: string;
  event_type: string;
  payload: Record<string, any>;
  tenant_id: string;
}

export interface NotificationSentEvent {
  connector_id: string;
  notification_type: string;
  recipient: string;
  message: string;
  tenant_id: string;
}

// =========================================
// Event Bus Interface
// =========================================

export interface IntegrationEvent<T = any> {
  id: string;
  type: IntegrationEventType;
  timestamp: string;
  tenant_id: string;
  data: T;
  metadata?: Record<string, any>;
}

export type EventHandler<T = any> = (event: IntegrationEvent<T>) => void | Promise<void>;

export interface EventSubscription {
  unsubscribe: () => void;
}
