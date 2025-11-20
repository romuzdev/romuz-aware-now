// Gate-I D1: KPI Views Integration Layer
// Supabase integration for saved views management

import { supabase } from '@/integrations/supabase/client';
import type { 
  KPIView, 
  SaveKPIViewParams 
} from '../types';

/**
 * Save or update a KPI view
 */
export async function saveKPIView(params: SaveKPIViewParams) {
  const { data, error } = await supabase.rpc('fn_gate_i_save_kpi_view', {
    p_view_name: params.viewName,
    p_description_ar: params.descriptionAr || null,
    p_filters: params.filters as any,
    p_sort_config: params.sortConfig as any,
    p_is_default: params.isDefault || false,
    p_is_shared: params.isShared || false,
  });

  if (error) {
    console.error('Error saving KPI view:', error);
    throw error;
  }

  return data.map(mapKPIView);
}

/**
 * List all KPI views for current user
 */
export async function listKPIViews() {
  const { data, error } = await supabase.rpc('fn_gate_i_list_kpi_views');

  if (error) {
    console.error('Error listing KPI views:', error);
    throw error;
  }

  return data.map(mapKPIView);
}

/**
 * Delete a KPI view
 */
export async function deleteKPIView(viewId: string) {
  const { data, error } = await supabase.rpc('fn_gate_i_delete_kpi_view', {
    p_view_id: viewId,
  });

  if (error) {
    console.error('Error deleting KPI view:', error);
    throw error;
  }

  return data;
}

/**
 * Map raw database result to KPIView type
 */
function mapKPIView(raw: any): KPIView {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    userId: raw.user_id,
    viewName: raw.view_name,
    descriptionAr: raw.description_ar,
    filters: raw.filters || {},
    sortConfig: raw.sort_config || { field: 'created_at', direction: 'desc' },
    isDefault: raw.is_default,
    isShared: raw.is_shared,
    isOwner: raw.is_owner,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}
