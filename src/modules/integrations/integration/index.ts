/**
 * Integrations Integration Layer - Barrel Export
 * Gate-M15: External Systems Integration Layer
 */

// Connectors
export {
  fetchConnectors,
  fetchConnectorsByType,
  fetchConnectorById,
  createConnector,
  updateConnector,
  deleteConnector,
  activateConnector,
  deactivateConnector,
  updateLastSync,
} from './connectors.integration';

// Logs
export {
  fetchConnectorLogs,
  fetchTenantLogs,
  fetchLogsByStatus,
  createLog,
  getLogStatistics,
  deleteOldLogs,
} from './logs.integration';

// Webhooks
export {
  fetchWebhooks,
  fetchWebhookById,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  regenerateWebhookSecret,
} from './webhooks.integration';

// API Keys
export {
  fetchAPIKeys,
  createAPIKey,
  revokeAPIKey,
  deleteAPIKey,
  updateAPIKeyLastUsed,
} from './api-keys.integration';

// Webhook Dispatcher
export {
  dispatchWebhook,
  registerWebhook,
  testWebhookDispatch,
} from '../services/webhook-dispatcher';

// Health Monitor
export {
  getIntegrationHealthStatus,
  getIntegrationHealthSummary,
  getConnectorHealth,
  getConnectorErrors,
  testConnectorConnection,
  getSyncJobHistory,
} from './health-monitor.integration';
