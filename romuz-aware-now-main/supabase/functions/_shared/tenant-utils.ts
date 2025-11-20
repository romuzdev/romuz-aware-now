/**
 * ============================================================================
 * M23 - Tenant Utilities
 * Purpose: Centralized tenant ID retrieval and validation
 * Security: Unified approach across all Edge Functions
 * ============================================================================
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface TenantInfo {
  tenantId: string;
  tenantName?: string;
  tenantStatus?: string;
}

/**
 * Get tenant ID for authenticated user
 * CRITICAL: This is the ONLY way to retrieve tenant_id in Edge Functions
 * 
 * Priority order:
 * 1. user_tenants table (most reliable)
 * 2. user_metadata (fallback for backward compatibility)
 * 
 * @throws Error if tenant not found or user not associated with tenant
 */
export async function getTenantId(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  console.log(`[TenantUtils] Fetching tenant for user: ${userId}`);

  // Method 1: Query user_tenants table (PREFERRED)
  const { data: userTenant, error: userTenantError } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (userTenantError) {
    console.error('[TenantUtils] Error querying user_tenants:', userTenantError);
    throw new Error(`Failed to fetch tenant information: ${userTenantError.message}`);
  }

  if (userTenant?.tenant_id) {
    console.log(`[TenantUtils] Found tenant from user_tenants: ${userTenant.tenant_id}`);
    return userTenant.tenant_id;
  }

  // Method 2: Fallback to user metadata (for backward compatibility)
  console.warn('[TenantUtils] user_tenants not found, checking user metadata...');
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Failed to fetch user information');
  }

  const tenantIdFromMetadata = user.user_metadata?.tenant_id;
  
  if (tenantIdFromMetadata) {
    console.log(`[TenantUtils] Found tenant from user metadata: ${tenantIdFromMetadata}`);
    return tenantIdFromMetadata;
  }

  // No tenant found
  throw new Error(
    'User is not associated with any tenant. ' +
    'Please contact support to assign a tenant.'
  );
}

/**
 * Get full tenant information (ID, name, status)
 */
export async function getTenantInfo(
  supabase: SupabaseClient,
  userId: string
): Promise<TenantInfo> {
  const tenantId = await getTenantId(supabase, userId);

  // Get tenant details
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name, status')
    .eq('id', tenantId)
    .single();

  if (tenantError) {
    console.warn('[TenantUtils] Could not fetch tenant details:', tenantError);
    return { tenantId };
  }

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    tenantStatus: tenant.status
  };
}

/**
 * Validate that tenant is active and can perform operations
 */
export async function validateTenantActive(
  supabase: SupabaseClient,
  tenantId: string
): Promise<void> {
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('status')
    .eq('id', tenantId)
    .single();

  if (error) {
    throw new Error(`Failed to validate tenant: ${error.message}`);
  }

  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  if (tenant.status !== 'ACTIVE') {
    throw new Error(
      `Tenant is not active (status: ${tenant.status}). ` +
      'Please contact support.'
    );
  }
}

/**
 * Check if user has permission for operation
 * (Placeholder - implement based on your RBAC system)
 */
export async function checkUserPermission(
  supabase: SupabaseClient,
  userId: string,
  permission: string
): Promise<boolean> {
  // TODO: Implement actual permission check based on your RBAC system
  // For now, return true to not block operations
  // This should be implemented based on your user_roles and role_permissions tables
  
  console.warn(`[TenantUtils] Permission check not implemented: ${permission}`);
  return true;
}

/**
 * Get tenant-scoped query builder
 * Automatically adds tenant_id filter
 */
export function getTenantScopedQuery(
  supabase: SupabaseClient,
  tableName: string,
  tenantId: string
) {
  return supabase
    .from(tableName)
    .select('*')
    .eq('tenant_id', tenantId);
}

/**
 * Validate that resource belongs to tenant
 */
export async function validateResourceOwnership(
  supabase: SupabaseClient,
  tableName: string,
  resourceId: string,
  tenantId: string
): Promise<void> {
  const { data, error } = await supabase
    .from(tableName)
    .select('tenant_id')
    .eq('id', resourceId)
    .single();

  if (error) {
    throw new Error(`Resource not found: ${resourceId}`);
  }

  if (data.tenant_id !== tenantId) {
    throw new Error(
      `Access denied: Resource ${resourceId} does not belong to your tenant`
    );
  }
}
