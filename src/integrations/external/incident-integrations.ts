/**
 * M18: Incident Response - External Integrations Layer
 * Manages connections to external systems (SIEM, Cloud Providers, Security Tools)
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// Types
// ============================================================================

export interface IncidentIntegration {
  id: string;
  tenant_id: string;
  integration_type: 'siem' | 'webhook' | 'cloud_provider' | 'log_monitor' | 'security_tool';
  integration_name: string;
  provider: string;
  config_json: Record<string, any>;
  is_active: boolean;
  is_verified: boolean;
  auth_type?: string;
  auth_config?: Record<string, any>;
  field_mapping?: Record<string, string>;
  severity_mapping?: Record<string, string>;
  total_events_received: number;
  last_event_at?: string;
  last_sync_at?: string;
  sync_status: 'idle' | 'syncing' | 'error';
  last_error?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

export interface WebhookLog {
  id: string;
  tenant_id: string;
  integration_id?: string;
  webhook_source: string;
  source_identifier?: string;
  http_method: string;
  headers?: Record<string, string>;
  raw_payload: any;
  parsed_payload?: any;
  processing_status: 'pending' | 'processed' | 'failed' | 'ignored';
  processing_error?: string;
  processing_duration_ms?: number;
  incident_id?: string;
  action_taken?: string;
  received_at: string;
  processed_at?: string;
}

export interface ExternalSource {
  id: string;
  tenant_id: string;
  integration_id: string;
  source_name: string;
  source_type: string;
  source_identifier: string;
  is_monitored: boolean;
  alert_threshold: string;
  auto_create_incident: boolean;
  include_filters?: any[];
  exclude_filters?: any[];
  total_events: number;
  total_incidents_created: number;
  last_event_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateIntegrationInput {
  integration_type: IncidentIntegration['integration_type'];
  integration_name: string;
  provider: string;
  config_json: Record<string, any>;
  auth_type?: string;
  auth_config?: Record<string, any>;
  field_mapping?: Record<string, string>;
  severity_mapping?: Record<string, string>;
}

export interface UpdateIntegrationInput {
  integration_name?: string;
  config_json?: Record<string, any>;
  is_active?: boolean;
  auth_type?: string;
  auth_config?: Record<string, any>;
  field_mapping?: Record<string, string>;
  severity_mapping?: Record<string, string>;
}

// ============================================================================
// Integration Management
// ============================================================================

export async function fetchIntegrations(): Promise<IncidentIntegration[]> {
  const { data, error } = await supabase
    .from('incident_integrations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchIntegrationById(id: string): Promise<IncidentIntegration | null> {
  const { data, error } = await supabase
    .from('incident_integrations')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createIntegration(
  input: CreateIntegrationInput
): Promise<IncidentIntegration> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('incident_integrations')
    .insert({
      ...input,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateIntegration(
  id: string,
  input: UpdateIntegrationInput
): Promise<IncidentIntegration> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('incident_integrations')
    .update({
      ...input,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteIntegration(id: string): Promise<void> {
  const { error } = await supabase
    .from('incident_integrations')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function toggleIntegration(id: string, is_active: boolean): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;

  if (!userId) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('incident_integrations')
    .update({
      is_active,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function verifyIntegration(id: string): Promise<{ success: boolean; message: string }> {
  const integration = await fetchIntegrationById(id);
  if (!integration) {
    throw new Error('Integration not found');
  }

  try {
    // Test connection based on integration type
    if (integration.integration_type === 'siem') {
      // Trigger SIEM connector to test
      const { data, error } = await supabase.functions.invoke('incident-siem-connector', {
        body: {
          integration_id: id,
          fetch_window_minutes: 1,
          max_alerts: 1,
        },
      });

      if (error) throw error;

      // Mark as verified
      await supabase
        .from('incident_integrations')
        .update({ is_verified: true })
        .eq('id', id);

      return { success: true, message: 'SIEM connection verified successfully' };
    } else if (integration.integration_type === 'webhook') {
      // For webhooks, just mark as verified (will be verified on first event)
      await supabase
        .from('incident_integrations')
        .update({ is_verified: true })
        .eq('id', id);

      return { success: true, message: 'Webhook endpoint configured successfully' };
    }

    return { success: false, message: 'Verification not supported for this integration type' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

// ============================================================================
// Webhook Logs
// ============================================================================

export async function fetchWebhookLogs(limit: number = 100): Promise<WebhookLog[]> {
  const { data, error } = await supabase
    .from('incident_webhook_logs')
    .select('*')
    .order('received_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchWebhookLogsByIntegration(
  integrationId: string,
  limit: number = 50
): Promise<WebhookLog[]> {
  const { data, error } = await supabase
    .from('incident_webhook_logs')
    .select('*')
    .eq('integration_id', integrationId)
    .order('received_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchWebhookLogById(id: string): Promise<WebhookLog | null> {
  const { data, error } = await supabase
    .from('incident_webhook_logs')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

// ============================================================================
// External Sources
// ============================================================================

export async function fetchExternalSources(): Promise<ExternalSource[]> {
  const { data, error } = await supabase
    .from('incident_external_sources')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchExternalSourcesByIntegration(
  integrationId: string
): Promise<ExternalSource[]> {
  const { data, error } = await supabase
    .from('incident_external_sources')
    .select('*')
    .eq('integration_id', integrationId)
    .order('source_name');

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createExternalSource(
  integrationId: string,
  input: {
    source_name: string;
    source_type: string;
    source_identifier: string;
    is_monitored?: boolean;
    alert_threshold?: string;
    auto_create_incident?: boolean;
  }
): Promise<ExternalSource> {
  const { data, error } = await supabase
    .from('incident_external_sources')
    .insert({
      integration_id: integrationId,
      ...input,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateExternalSource(
  id: string,
  input: {
    is_monitored?: boolean;
    alert_threshold?: string;
    auto_create_incident?: boolean;
    include_filters?: any[];
    exclude_filters?: any[];
  }
): Promise<ExternalSource> {
  const { data, error } = await supabase
    .from('incident_external_sources')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteExternalSource(id: string): Promise<void> {
  const { error } = await supabase
    .from('incident_external_sources')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ============================================================================
// Webhook URL Generation
// ============================================================================

export function getWebhookUrl(integrationId: string): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/incident-webhook-receiver?integration_id=${integrationId}`;
}

export function getCloudEventsUrl(): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/incident-cloud-events`;
}

// ============================================================================
// Manual Sync Trigger
// ============================================================================

export async function triggerSIEMSync(
  integrationId: string,
  windowMinutes: number = 15
): Promise<any> {
  const { data, error } = await supabase.functions.invoke('incident-siem-connector', {
    body: {
      integration_id: integrationId,
      fetch_window_minutes: windowMinutes,
      max_alerts: 100,
    },
  });

  if (error) throw error;
  return data;
}

// ============================================================================
// Integration Statistics
// ============================================================================

export async function getIntegrationStats(): Promise<{
  total_integrations: number;
  active_integrations: number;
  total_events_received: number;
  events_last_24h: number;
  incidents_created_last_24h: number;
}> {
  // Get integration counts
  const { data: integrations } = await supabase
    .from('incident_integrations')
    .select('is_active, total_events_received');

  const total_integrations = integrations?.length || 0;
  const active_integrations = integrations?.filter((i) => i.is_active).length || 0;
  const total_events_received = integrations?.reduce(
    (sum, i) => sum + (i.total_events_received || 0),
    0
  ) || 0;

  // Get events in last 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { count: events_last_24h } = await supabase
    .from('incident_webhook_logs')
    .select('*', { count: 'exact', head: true })
    .gte('received_at', oneDayAgo);

  const { count: incidents_created_last_24h } = await supabase
    .from('security_incidents')
    .select('*', { count: 'exact', head: true })
    .eq('detection_method', 'external_integration')
    .gte('detected_at', oneDayAgo);

  return {
    total_integrations,
    active_integrations,
    total_events_received,
    events_last_24h: events_last_24h || 0,
    incidents_created_last_24h: incidents_created_last_24h || 0,
  };
}
