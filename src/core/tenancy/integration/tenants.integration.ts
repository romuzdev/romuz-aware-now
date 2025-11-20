/**
 * Tenancy Integration
 * Gate-P: Tenant Management
 * 
 * Handles tenant CRUD operations and default tenant management
 */

import { supabase } from '@/integrations/supabase/client';

export interface Tenant {
  id: string;
  name: string;
  domain: string | null;
  status: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

/**
 * Fetch all tenants
 */
export async function fetchTenants(): Promise<Tenant[]> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching tenants:', error);
    throw error;
  }

  return data || [];
}

/**
 * Set a tenant as the default (for new user registrations)
 */
export async function setDefaultTenant(tenantId: string): Promise<void> {
  const { error } = await supabase.rpc('set_default_tenant', {
    p_tenant_id: tenantId,
  });

  if (error) {
    console.error('Error setting default tenant:', error);
    throw error;
  }
}

/**
 * Get the default tenant
 */
export async function getDefaultTenant(): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('is_default', true)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (error) {
    console.error('Error fetching default tenant:', error);
    throw error;
  }

  return data;
}
