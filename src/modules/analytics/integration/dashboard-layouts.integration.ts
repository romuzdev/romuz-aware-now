/**
 * M14 Enhancement - Dashboard Layouts Integration
 */

import { supabase } from '@/integrations/supabase/client';
import type { DashboardLayout, SaveLayoutInput } from '../types/custom-kpi.types';

/**
 * Fetch user's dashboard layouts
 */
export async function fetchDashboardLayouts(
  tenantId: string,
  userId: string
): Promise<DashboardLayout[]> {
  const { data, error } = await supabase
    .from('dashboard_layouts')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch default layout for user
 */
export async function fetchDefaultLayout(
  tenantId: string,
  userId: string
): Promise<DashboardLayout | null> {
  const { data, error } = await supabase
    .from('dashboard_layouts')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .eq('is_default', true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Save dashboard layout
 */
export async function saveDashboardLayout(
  tenantId: string,
  userId: string,
  input: SaveLayoutInput
): Promise<DashboardLayout> {
  // If setting as default, unset other defaults first
  if (input.is_default) {
    await supabase
      .from('dashboard_layouts')
      .update({ is_default: false })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId);
  }

  const layoutName = input.layout_name || 'default';

  // Check if layout exists
  const { data: existing } = await supabase
    .from('dashboard_layouts')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .eq('layout_name', layoutName)
    .maybeSingle();

  if (existing) {
    // Update existing layout
    const { data, error } = await supabase
      .from('dashboard_layouts')
      .update({
        widgets: input.widgets,
        grid_layout: input.grid_layout,
        is_default: input.is_default || false
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new layout
    const { data, error } = await supabase
      .from('dashboard_layouts')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        layout_name: layoutName,
        widgets: input.widgets,
        grid_layout: input.grid_layout,
        is_default: input.is_default || false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

/**
 * Delete dashboard layout
 */
export async function deleteDashboardLayout(
  layoutId: string
): Promise<void> {
  const { error } = await supabase
    .from('dashboard_layouts')
    .delete()
    .eq('id', layoutId);

  if (error) throw error;
}

/**
 * Set layout as default
 */
export async function setDefaultLayout(
  tenantId: string,
  userId: string,
  layoutId: string
): Promise<void> {
  // Unset all defaults
  await supabase
    .from('dashboard_layouts')
    .update({ is_default: false })
    .eq('tenant_id', tenantId)
    .eq('user_id', userId);

  // Set new default
  const { error } = await supabase
    .from('dashboard_layouts')
    .update({ is_default: true })
    .eq('id', layoutId);

  if (error) throw error;
}
