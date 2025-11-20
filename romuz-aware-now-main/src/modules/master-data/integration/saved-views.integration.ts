/**
 * Gate-M: Saved Views Integration
 * 
 * Supabase integration for managing saved views (filters & sorting)
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  SavedView,
  CreateSavedViewInput,
  UpdateSavedViewInput,
  EntityType,
} from '../types';

/**
 * Map database row to SavedView type
 */
function mapSavedView(raw: any): SavedView {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    entityType: raw.entity_type,
    viewName: raw.view_name,
    descriptionAr: raw.description_ar,
    filters: raw.filters || {},
    sortConfig: raw.sort_config || { field: 'created_at', direction: 'desc' },
    isDefault: raw.is_default,
    isShared: raw.is_shared,
    ownerId: raw.owner_id,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

/**
 * Save or update a saved view
 */
export async function saveSavedView(input: CreateSavedViewInput): Promise<SavedView> {
  const { data, error } = await supabase.rpc('fn_md_save_view', {
    p_entity_type: input.entityType,
    p_view_name: input.viewName,
    p_description_ar: input.descriptionAr || null,
    p_filters: input.filters as any || {},
    p_sort_config: input.sortConfig as any || { field: 'created_at', direction: 'desc' },
    p_is_default: input.isDefault || false,
    p_is_shared: input.isShared || false,
  });

  if (error) {
    console.error('Error saving view:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('Failed to save view');
  }

  return mapSavedView(data[0]);
}

/**
 * List all saved views for a specific entity type
 */
export async function listSavedViews(entityType: EntityType): Promise<SavedView[]> {
  const { data, error } = await supabase.rpc('fn_md_list_views', {
    p_entity_type: entityType,
  });

  if (error) {
    console.error('Error listing views:', error);
    throw error;
  }

  return (data || []).map(mapSavedView);
}

/**
 * List saved views for catalogs
 */
export async function listCatalogViews(): Promise<SavedView[]> {
  return listSavedViews('ref_catalogs');
}

/**
 * List saved views for terms
 */
export async function listTermViews(): Promise<SavedView[]> {
  return listSavedViews('ref_terms');
}

/**
 * List saved views for mappings
 */
export async function listMappingViews(): Promise<SavedView[]> {
  return listSavedViews('ref_mappings');
}

/**
 * Delete a saved view
 */
export async function deleteSavedView(viewId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('fn_md_delete_view', {
    p_view_id: viewId,
  });

  if (error) {
    console.error('Error deleting view:', error);
    throw error;
  }

  return Boolean(data);
}

/**
 * Get default view for entity type
 */
export async function getDefaultView(entityType: EntityType): Promise<SavedView | null> {
  const views = await listSavedViews(entityType);
  return views.find((v) => v.isDefault) || null;
}

/**
 * Set a saved view as default (using RPC)
 */
export async function setDefaultSavedView(viewId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('fn_md_set_default_view', {
    p_view_id: viewId,
  });

  if (error) {
    console.error('Error setting default view:', error);
    throw error;
  }

  return data || false;
}
