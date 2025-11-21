/**
 * M14 - Custom Dashboards Integration
 * Integration layer for custom dashboard management
 */

import { supabase } from '../client';

export interface CustomDashboard {
  id: string;
  tenant_id: string;
  user_id: string;
  name_ar: string;
  name_en?: string;
  description_ar?: string;
  description_en?: string;
  layout: any[];
  widgets: any[];
  is_default: boolean;
  is_shared: boolean;
  shared_with_roles?: string[];
  refresh_interval: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDashboardInput {
  name_ar: string;
  name_en?: string;
  description_ar?: string;
  description_en?: string;
  layout?: any[];
  widgets?: any[];
  is_default?: boolean;
  is_shared?: boolean;
  shared_with_roles?: string[];
  refresh_interval?: number;
}

/**
 * Get all dashboards for current user
 */
export async function getUserDashboards(): Promise<CustomDashboard[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('custom_dashboards')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get single dashboard by ID
 */
export async function getDashboard(id: string): Promise<CustomDashboard> {
  const { data, error } = await supabase
    .from('custom_dashboards')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create new dashboard
 */
export async function createDashboard(input: CreateDashboardInput): Promise<CustomDashboard> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: tenantData } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!tenantData) throw new Error('Tenant not found');

  const { data, error } = await supabase
    .from('custom_dashboards')
    .insert({
      ...input,
      tenant_id: tenantData.tenant_id,
      user_id: user.id,
      layout: input.layout || [],
      widgets: input.widgets || [],
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update dashboard
 */
export async function updateDashboard(
  id: string,
  updates: Partial<CreateDashboardInput>
): Promise<CustomDashboard> {
  const { data, error } = await supabase
    .from('custom_dashboards')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete dashboard
 */
export async function deleteDashboard(id: string): Promise<void> {
  const { error } = await supabase
    .from('custom_dashboards')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Set dashboard as default
 */
export async function setDefaultDashboard(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // First, unset all default dashboards for this user
  await supabase
    .from('custom_dashboards')
    .update({ is_default: false })
    .eq('user_id', user.id);

  // Then set this one as default
  const { error } = await supabase
    .from('custom_dashboards')
    .update({ is_default: true })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Share dashboard with roles
 */
export async function shareDashboard(
  id: string,
  roles: string[]
): Promise<CustomDashboard> {
  const { data, error } = await supabase
    .from('custom_dashboards')
    .update({ 
      is_shared: true,
      shared_with_roles: roles
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
