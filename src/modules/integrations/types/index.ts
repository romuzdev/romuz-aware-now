/**
 * Integrations Module Types
 * Gate-M15: External Systems Integration Layer
 */

// =========================================
// Integration Connector Types
// =========================================

export type ConnectorType = 'slack' | 'teams' | 'google_workspace' | 'odoo' | 'webhook' | 'api' | 'custom';
export type ConnectorStatus = 'active' | 'inactive' | 'error' | 'testing';

export interface IntegrationConnector {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  type: ConnectorType;
  config: Record<string, any>;
  status: ConnectorStatus;
  last_sync_at: string | null;
  sync_frequency_minutes: number;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateConnectorInput {
  name: string;
  description?: string;
  type: ConnectorType;
  config: Record<string, any>;
  sync_frequency_minutes?: number;
}

export interface UpdateConnectorInput {
  name?: string;
  description?: string | null;
  config?: Record<string, any>;
  status?: ConnectorStatus;
  sync_frequency_minutes?: number;
}

// =========================================
// Integration Log Types
// =========================================

export type LogStatus = 'success' | 'failed' | 'pending' | 'retrying';
export type LogCategory = 'sync' | 'notification' | 'webhook' | 'api_call' | 'error';

export interface IntegrationLog {
  id: string;
  tenant_id: string;
  connector_id: string | null;
  event_type: string;
  event_category: LogCategory | null;
  payload: Record<string, any> | null;
  response: Record<string, any> | null;
  status: LogStatus;
  error_message: string | null;
  error_code: string | null;
  retry_count: number;
  max_retries: number;
  next_retry_at: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface CreateLogInput {
  connector_id?: string;
  event_type: string;
  event_category?: LogCategory;
  payload?: Record<string, any>;
  response?: Record<string, any>;
  status?: LogStatus;
  error_message?: string;
  error_code?: string;
  duration_ms?: number;
}

// =========================================
// API Key Types
// =========================================

export type APIKeyStatus = 'active' | 'revoked' | 'expired';

export interface IntegrationAPIKey {
  id: string;
  tenant_id: string;
  key_name: string;
  key_hash: string;
  key_prefix: string;
  permissions: string[];
  allowed_ips: string[] | null;
  status: APIKeyStatus;
  expires_at: string | null;
  last_used_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAPIKeyInput {
  key_name: string;
  permissions: string[];
  allowed_ips?: string[];
  expires_at?: string;
}

export interface APIKeyWithSecret extends IntegrationAPIKey {
  api_key: string; // Full key (only returned on creation)
}

// =========================================
// Webhook Types
// =========================================

export interface IntegrationWebhook {
  id: string;
  tenant_id: string;
  connector_id: string | null;
  name: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  verify_signature: boolean;
  signature_header: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWebhookInput {
  name: string;
  connector_id?: string;
  events: string[];
  verify_signature?: boolean;
  signature_header?: string;
}

export interface UpdateWebhookInput {
  name?: string;
  events?: string[];
  active?: boolean;
  verify_signature?: boolean;
}

// =========================================
// Slack Integration Types
// =========================================

export interface SlackConfig {
  webhook_url: string;
  channel?: string;
  username?: string;
  icon_emoji?: string;
}

export interface SlackMessage {
  text: string;
  attachments?: SlackAttachment[];
  blocks?: SlackBlock[];
}

export interface SlackAttachment {
  color?: string;
  title?: string;
  text?: string;
  fields?: { title: string; value: string; short?: boolean }[];
}

export interface SlackBlock {
  type: string;
  [key: string]: any;
}

// =========================================
// Google Workspace Integration Types
// =========================================

export interface GoogleWorkspaceConfig {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  refresh_token?: string;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  createdTime: string;
}

// =========================================
// Odoo Integration Types
// =========================================

export interface OdooConfig {
  url: string;
  database: string;
  username: string;
  api_key: string;
}

export interface OdooEmployee {
  id: number;
  name: string;
  email: string;
  department_id: number;
  job_title: string;
}

// =========================================
// Generic API Connector Types
// =========================================

export interface APIConnectorConfig {
  base_url: string;
  auth_type: 'api_key' | 'bearer_token' | 'oauth2' | 'basic';
  auth_credentials: Record<string, any>;
  headers?: Record<string, string>;
  timeout_ms?: number;
}

export interface APIRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: any;
}

export interface APIResponse {
  status: number;
  data: any;
  headers: Record<string, string>;
  duration_ms: number;
}
