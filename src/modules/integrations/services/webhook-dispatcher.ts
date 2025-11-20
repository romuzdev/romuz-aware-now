/**
 * Webhook Dispatcher Service
 * Gate-M15: Dispatch events to registered webhooks
 */

import { supabase } from '@/integrations/supabase/client';
import type { IntegrationWebhook } from '../types';

interface WebhookEvent {
  event_type: string;
  event_data: Record<string, any>;
  tenant_id: string;
  triggered_by?: string;
}

/**
 * Generate HMAC signature for webhook payload using Web Crypto API
 */
async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Dispatch webhook to a single endpoint
 */
async function dispatchToWebhook(
  webhook: IntegrationWebhook,
  event: WebhookEvent
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = JSON.stringify({
      webhook_id: webhook.id,
      event: event.event_type,
      data: event.event_data,
      timestamp: new Date().toISOString(),
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add signature if verification is enabled
    if (webhook.verify_signature) {
      const signature = await generateSignature(payload, webhook.secret);
      headers[webhook.signature_header] = signature;
    }

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: payload,
    });

    return {
      success: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Find active webhooks that match the event type
 */
async function findMatchingWebhooks(
  tenantId: string,
  eventType: string
): Promise<IntegrationWebhook[]> {
  const { data, error } = await supabase
    .from('integration_webhooks')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('active', true);

  if (error) {
    console.error('❌ Error fetching webhooks:', error);
    return [];
  }

  // Filter webhooks that subscribe to this event
  return (data as IntegrationWebhook[]).filter(webhook => {
    // If events array is empty, webhook receives all events
    if (webhook.events.length === 0) return true;
    // Check if event type matches or wildcard exists
    return webhook.events.includes(eventType) || webhook.events.includes('*');
  });
}

/**
 * Log webhook dispatch result
 */
async function logWebhookDispatch(
  tenantId: string,
  webhookId: string,
  event: WebhookEvent,
  result: { success: boolean; error?: string },
  duration: number
): Promise<void> {
  try {
    await supabase.from('integration_logs').insert({
      tenant_id: tenantId,
      connector_id: webhookId,
      event_type: `webhook.dispatch.${event.event_type}`,
      event_category: 'webhook',
      payload: { event_type: event.event_type, event_data: event.event_data },
      response: result,
      status: result.success ? 'success' : 'failed',
      error_message: result.error || null,
      duration_ms: duration,
    });
  } catch (error) {
    console.error('❌ Failed to log webhook dispatch:', error);
  }
}

/**
 * Dispatch event to all matching webhooks
 */
export async function dispatchWebhook(event: WebhookEvent): Promise<{
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}> {
  const startTime = Date.now();
  
  // Find matching webhooks
  const webhooks = await findMatchingWebhooks(event.tenant_id, event.event_type);
  
  if (webhooks.length === 0) {
    console.log(`No active webhooks found for event type: ${event.event_type}`);
    return {
      total: 0,
      successful: 0,
      failed: 0,
      errors: [],
    };
  }

  // Dispatch to all webhooks in parallel
  const results = await Promise.all(
    webhooks.map(async (webhook) => {
      const webhookStart = Date.now();
      const result = await dispatchToWebhook(webhook, event);
      const duration = Date.now() - webhookStart;
      
      // Log the dispatch
      await logWebhookDispatch(
        event.tenant_id,
        webhook.id,
        event,
        result,
        duration
      );
      
      return result;
    })
  );

  // Calculate statistics
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const errors = results
    .filter(r => !r.success && r.error)
    .map(r => r.error!);

  const totalDuration = Date.now() - startTime;
  
  console.log(`✅ Webhook dispatch completed in ${totalDuration}ms:`, {
    total: webhooks.length,
    successful,
    failed,
  });

  return {
    total: webhooks.length,
    successful,
    failed,
    errors,
  };
}

/**
 * Register a new webhook (helper)
 */
export async function registerWebhook(config: {
  tenant_id: string;
  name: string;
  connector_id?: string;
  events: string[];
  verify_signature?: boolean;
  signature_header?: string;
}): Promise<IntegrationWebhook> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('المستخدم غير مصرح');

  const webhookId = crypto.randomUUID();
  const secret = crypto.randomUUID();
  const url = `${window.location.origin}/api/webhooks/${webhookId}`;

  const { data, error } = await supabase
    .from('integration_webhooks')
    .insert({
      id: webhookId,
      tenant_id: config.tenant_id,
      connector_id: config.connector_id || null,
      name: config.name,
      url,
      secret,
      events: config.events,
      active: true,
      verify_signature: config.verify_signature ?? true,
      signature_header: config.signature_header || 'x-webhook-signature',
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ registerWebhook error:', error);
    throw new Error(error.message);
  }

  return data as IntegrationWebhook;
}

/**
 * Test webhook dispatch (for debugging)
 */
export async function testWebhookDispatch(
  tenantId: string,
  webhookId: string
): Promise<boolean> {
  const testEvent: WebhookEvent = {
    event_type: 'test.webhook',
    event_data: {
      message: 'This is a test webhook dispatch',
      timestamp: new Date().toISOString(),
    },
    tenant_id: tenantId,
  };

  const { data: webhook } = await supabase
    .from('integration_webhooks')
    .select('*')
    .eq('id', webhookId)
    .single();

  if (!webhook) {
    throw new Error('Webhook not found');
  }

  const result = await dispatchToWebhook(webhook as IntegrationWebhook, testEvent);
  return result.success;
}
