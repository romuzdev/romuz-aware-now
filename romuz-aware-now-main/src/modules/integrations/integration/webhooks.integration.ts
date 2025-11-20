/**
 * Integration Webhooks Data Layer
 * Gate-M15: CRUD operations for webhooks
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  IntegrationWebhook,
  CreateWebhookInput,
  UpdateWebhookInput,
} from '../types';

/**
 * Fetch all webhooks for the current tenant
 */
export async function fetchWebhooks(tenantId: string): Promise<IntegrationWebhook[]> {
  const { data, error } = await supabase
    .from('integration_webhooks')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ fetchWebhooks error:', error);
    throw new Error(error.message);
  }

  return data as IntegrationWebhook[];
}

/**
 * Fetch single webhook by ID
 */
export async function fetchWebhookById(
  tenantId: string,
  webhookId: string
): Promise<IntegrationWebhook | null> {
  const { data, error } = await supabase
    .from('integration_webhooks')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', webhookId)
    .maybeSingle();

  if (error) {
    console.error('❌ fetchWebhookById error:', error);
    throw new Error(error.message);
  }

  return data as IntegrationWebhook | null;
}

/**
 * Create a new webhook
 */
export async function createWebhook(
  tenantId: string,
  input: CreateWebhookInput
): Promise<IntegrationWebhook> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('المستخدم غير مصرح');

  // Generate webhook URL and secret
  const webhookId = crypto.randomUUID();
  const secret = crypto.randomUUID();
  const url = `${window.location.origin}/api/webhooks/${webhookId}`;

  const { data, error } = await supabase
    .from('integration_webhooks')
    .insert({
      id: webhookId,
      tenant_id: tenantId,
      connector_id: input.connector_id || null,
      name: input.name,
      url,
      secret,
      events: input.events,
      active: true,
      verify_signature: input.verify_signature ?? true,
      signature_header: input.signature_header || 'x-webhook-signature',
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ createWebhook error:', error);
    throw new Error(error.message);
  }

  return data as IntegrationWebhook;
}

/**
 * Update an existing webhook
 */
export async function updateWebhook(
  tenantId: string,
  webhookId: string,
  input: UpdateWebhookInput
): Promise<IntegrationWebhook> {
  const { data, error } = await supabase
    .from('integration_webhooks')
    .update(input)
    .eq('tenant_id', tenantId)
    .eq('id', webhookId)
    .select()
    .single();

  if (error) {
    console.error('❌ updateWebhook error:', error);
    throw new Error(error.message);
  }

  return data as IntegrationWebhook;
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(
  tenantId: string,
  webhookId: string
): Promise<void> {
  const { error } = await supabase
    .from('integration_webhooks')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('id', webhookId);

  if (error) {
    console.error('❌ deleteWebhook error:', error);
    throw new Error(error.message);
  }
}

/**
 * Regenerate webhook secret
 */
export async function regenerateWebhookSecret(
  tenantId: string,
  webhookId: string
): Promise<string> {
  const newSecret = crypto.randomUUID();

  const { error } = await supabase
    .from('integration_webhooks')
    .update({ secret: newSecret })
    .eq('tenant_id', tenantId)
    .eq('id', webhookId);

  if (error) {
    console.error('❌ regenerateWebhookSecret error:', error);
    throw new Error(error.message);
  }

  return newSecret;
}
