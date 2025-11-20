/**
 * Integration API Keys Data Layer
 * Gate-M15: CRUD operations for API keys
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  IntegrationAPIKey,
  CreateAPIKeyInput,
  APIKeyWithSecret,
} from '../types';

/**
 * Generate API key and hash
 */
function generateAPIKey(): { key: string; hash: string; prefix: string } {
  const key = `rmz_${crypto.randomUUID().replace(/-/g, '')}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  
  // Simple hash (in production, use crypto.subtle.digest)
  const hash = btoa(String.fromCharCode(...data));
  const prefix = key.substring(0, 11); // "rmz_" + first 7 chars
  
  return { key, hash, prefix };
}

/**
 * Fetch all API keys for the current tenant (without secret)
 */
export async function fetchAPIKeys(tenantId: string): Promise<IntegrationAPIKey[]> {
  const { data, error } = await supabase
    .from('integration_api_keys')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ fetchAPIKeys error:', error);
    throw new Error(error.message);
  }

  return data as IntegrationAPIKey[];
}

/**
 * Create a new API key
 */
export async function createAPIKey(
  tenantId: string,
  input: CreateAPIKeyInput
): Promise<APIKeyWithSecret> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('المستخدم غير مصرح');

  const { key, hash, prefix } = generateAPIKey();

  const { data, error } = await supabase
    .from('integration_api_keys')
    .insert({
      tenant_id: tenantId,
      key_name: input.key_name,
      key_hash: hash,
      key_prefix: prefix,
      permissions: input.permissions,
      allowed_ips: input.allowed_ips || null,
      expires_at: input.expires_at || null,
      status: 'active',
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ createAPIKey error:', error);
    throw new Error(error.message);
  }

  return {
    ...data,
    api_key: key, // Only returned on creation
  } as APIKeyWithSecret;
}

/**
 * Revoke an API key
 */
export async function revokeAPIKey(
  tenantId: string,
  keyId: string
): Promise<void> {
  const { error } = await supabase
    .from('integration_api_keys')
    .update({ status: 'revoked' })
    .eq('tenant_id', tenantId)
    .eq('id', keyId);

  if (error) {
    console.error('❌ revokeAPIKey error:', error);
    throw new Error(error.message);
  }
}

/**
 * Delete an API key
 */
export async function deleteAPIKey(
  tenantId: string,
  keyId: string
): Promise<void> {
  const { error } = await supabase
    .from('integration_api_keys')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('id', keyId);

  if (error) {
    console.error('❌ deleteAPIKey error:', error);
    throw new Error(error.message);
  }
}

/**
 * Update last used timestamp
 */
export async function updateAPIKeyLastUsed(keyId: string): Promise<void> {
  const { error } = await supabase
    .from('integration_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyId);

  if (error) {
    console.error('❌ updateAPIKeyLastUsed error:', error);
    throw new Error(error.message);
  }
}
