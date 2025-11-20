// Gate-J D1: Impact Views Integration Layer
// Supabase integration for saved views management

import { supabase } from '@/integrations/supabase/client';
import type { 
  ImpactView, 
  SaveImpactViewParams 
} from '../types';

/**
 * Save or update an impact view
 */
export async function saveImpactView(params: SaveImpactViewParams) {
  const { data, error } = await supabase.rpc('fn_gate_j_save_impact_view', {
    p_view_name: params.viewName,
    p_description_ar: params.descriptionAr || null,
    p_filters: params.filters as any,
    p_sort_config: params.sortConfig as any,
    p_is_default: params.isDefault || false,
    p_is_shared: params.isShared || false,
  });

  if (error) {
    console.error('Error saving impact view:', error);
    throw error;
  }

  return data.map(mapImpactView);
}

/**
 * List all impact views for current user
 */
export async function listImpactViews() {
  const { data, error } = await supabase.rpc('fn_gate_j_list_impact_views');

  if (error) {
    console.error('Error listing impact views:', error);
    throw error;
  }

  return data.map(mapImpactView);
}

/**
 * Delete an impact view
 */
export async function deleteImpactView(viewId: string) {
  const { data, error } = await supabase.rpc('fn_gate_j_delete_impact_view', {
    p_view_id: viewId,
  });

  if (error) {
    console.error('Error deleting impact view:', error);
    throw error;
  }

  return data;
}

/**
 * Map raw database result to ImpactView type
 */
function mapImpactView(raw: any): ImpactView {
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
