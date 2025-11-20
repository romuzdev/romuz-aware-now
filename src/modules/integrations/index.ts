/**
 * Integrations Module - Barrel Export
 * Gate-M15: External Systems Integration Layer
 */

// Types
export type {
  IntegrationConnector,
  CreateConnectorInput,
  UpdateConnectorInput,
  ConnectorType,
  ConnectorStatus,
  
  IntegrationLog,
  CreateLogInput,
  LogStatus,
  LogCategory,
  
  IntegrationAPIKey,
  CreateAPIKeyInput,
  APIKeyWithSecret,
  APIKeyStatus,
  
  IntegrationWebhook,
  CreateWebhookInput,
  UpdateWebhookInput,
  
  SlackConfig,
  SlackMessage,
  SlackAttachment,
  SlackBlock,
  
  GoogleWorkspaceConfig,
  GoogleDriveFile,
  
  OdooConfig,
  OdooEmployee,
  
  APIConnectorConfig,
  APIRequest,
  APIResponse,
} from './types';

export type {
  IntegrationEventType,
  IntegrationEvent,
  EventHandler,
  EventSubscription,
  ConnectorCreatedEvent,
  ConnectorSyncedEvent,
  ConnectorSyncFailedEvent,
  WebhookReceivedEvent,
  NotificationSentEvent,
} from './types/events';
