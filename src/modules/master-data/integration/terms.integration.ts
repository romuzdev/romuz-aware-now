/**
 * Gate-M: Reference Terms Integration
 * 
 * Supabase integration for managing hierarchical reference terms
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  RefTerm,
  CreateTermInput,
  UpdateTermInput,
  TermFilters,
} from '../types';

/**
 * Map database row to RefTerm type
 */
function mapTerm(raw: any): RefTerm {
  return {
    id: raw.id,
    catalogId: raw.catalog_id,
    parentId: raw.parent_id,
    code: raw.code,
    labelAr: raw.label_ar,
    labelEn: raw.label_en,
    sortOrder: raw.sort_order,
    active: raw.active,
    attrs: raw.attrs || {},
    createdBy: raw.created_by,
    updatedBy: raw.updated_by,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

/**
 * Fetch all terms (filtered)
 */
export async function fetchTerms(filters?: TermFilters): Promise<RefTerm[]> {
  let query = supabase
    .from('ref_terms')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('label_ar', { ascending: true });

  if (filters?.catalogId) {
    query = query.eq('catalog_id', filters.catalogId);
  }

  if (filters?.parentId !== undefined) {
    if (filters.parentId === null) {
      query = query.is('parent_id', null);
    } else {
      query = query.eq('parent_id', filters.parentId);
    }
  }

  if (filters?.active !== undefined) {
    query = query.eq('active', filters.active);
  }

  if (filters?.search) {
    query = query.or(
      `label_ar.ilike.%${filters.search}%,label_en.ilike.%${filters.search}%,code.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching terms:', error);
    throw error;
  }

  return (data || []).map(mapTerm);
}

/**
 * Fetch term by ID
 */
export async function fetchTermById(id: string): Promise<RefTerm | null> {
  const { data, error } = await supabase
    .from('ref_terms')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching term:', error);
    throw error;
  }

  return data ? mapTerm(data) : null;
}

/**
 * Fetch term by code within a catalog
 */
export async function fetchTermByCode(
  catalogId: string,
  code: string
): Promise<RefTerm | null> {
  const { data, error } = await supabase
    .from('ref_terms')
    .select('*')
    .eq('catalog_id', catalogId)
    .eq('code', code)
    .maybeSingle();

  if (error) {
    console.error('Error fetching term by code:', error);
    throw error;
  }

  return data ? mapTerm(data) : null;
}

/**
 * Fetch terms by catalog ID
 */
export async function fetchTermsByCatalog(catalogId: string): Promise<RefTerm[]> {
  return fetchTerms({ catalogId });
}

/**
 * Fetch child terms (direct children of a parent)
 */
export async function fetchChildTerms(parentId: string): Promise<RefTerm[]> {
  return fetchTerms({ parentId });
}

/**
 * Fetch root terms (terms without parent)
 */
export async function fetchRootTerms(catalogId: string): Promise<RefTerm[]> {
  return fetchTerms({ catalogId, parentId: null });
}

/**
 * Create a new term
 */
export async function createTerm(input: CreateTermInput): Promise<RefTerm> {
  const { data, error } = await supabase
    .from('ref_terms')
    .insert({
      catalog_id: input.catalogId,
      parent_id: input.parentId || null,
      code: input.code,
      label_ar: input.labelAr,
      label_en: input.labelEn,
      sort_order: input.sortOrder ?? 0,
      active: input.active ?? true,
      attrs: input.attrs || {},
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating term:', error);
    throw error;
  }

  return mapTerm(data);
}

/**
 * Update an existing term
 */
export async function updateTerm(id: string, input: UpdateTermInput): Promise<RefTerm> {
  const updateData: any = {};

  if (input.parentId !== undefined) updateData.parent_id = input.parentId;
  if (input.labelAr !== undefined) updateData.label_ar = input.labelAr;
  if (input.labelEn !== undefined) updateData.label_en = input.labelEn;
  if (input.sortOrder !== undefined) updateData.sort_order = input.sortOrder;
  if (input.active !== undefined) updateData.active = input.active;
  if (input.attrs !== undefined) updateData.attrs = input.attrs;

  const { data, error } = await supabase
    .from('ref_terms')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating term:', error);
    throw error;
  }

  return mapTerm(data);
}

/**
 * Delete a term
 */
export async function deleteTerm(id: string): Promise<void> {
  const { error } = await supabase.from('ref_terms').delete().eq('id', id);

  if (error) {
    console.error('Error deleting term:', error);
    throw error;
  }
}

/**
 * Activate a term
 */
export async function activateTerm(id: string): Promise<RefTerm> {
  return updateTerm(id, { active: true });
}

/**
 * Deactivate a term
 */
export async function deactivateTerm(id: string): Promise<RefTerm> {
  return updateTerm(id, { active: false });
}

/**
 * Reorder terms (using RPC for atomic operation)
 */
export async function reorderTerms(termIds: string[]): Promise<void> {
  const { error } = await supabase.rpc('fn_md_reorder_terms', {
    p_term_ids: termIds,
  });

  if (error) {
    console.error('Error reordering terms:', error);
    throw error;
  }
}

/**
 * Bulk activate/deactivate terms (using RPC)
 */
export async function bulkSetTermsActive(
  termIds: string[],
  active: boolean
): Promise<number> {
  const { data, error } = await supabase.rpc('fn_md_bulk_set_active', {
    p_term_ids: termIds,
    p_active: active,
  });

  if (error) {
    console.error('Error bulk setting terms active:', error);
    throw error;
  }

  return data || 0;
}

/**
 * Advanced lookup/search within a catalog (using RPC)
 */
export async function lookupTerms(
  catalogId: string,
  query?: string,
  limit: number = 50,
  includeInactive: boolean = false
): Promise<RefTerm[]> {
  const { data, error } = await supabase.rpc('fn_md_lookup_terms', {
    p_catalog_id: catalogId,
    p_query: query || null,
    p_limit: limit,
    p_include_inactive: includeInactive,
  });

  if (error) {
    console.error('Error looking up terms:', error);
    throw error;
  }

  return (data || []).map(mapTerm);
}

/**
 * Import terms from CSV/JSON data (using RPC)
 */
export async function importTermsCSV(params: {
  catalogId: string;
  rows: Array<{
    code: string;
    label_ar: string;
    label_en: string;
    parent_code?: string;
    sort_order?: number;
    active?: boolean;
    attrs?: Record<string, any>;
  }>;
}): Promise<{ status: string; updated: number; inserted: number; message?: string }> {
  const { data, error } = await supabase.rpc('fn_md_import_terms_csv', {
    p_catalog_id: params.catalogId,
    p_file_url: null,
    p_rows: params.rows as any,
  });

  if (error) {
    console.error('Error importing terms:', error);
    throw error;
  }

  return data;
}

/**
 * Export terms to CSV-ready format (using RPC)
 */
export async function exportTerms(
  catalogId: string,
  includeInactive: boolean = false
): Promise<
  Array<{
    code: string;
    label_ar: string;
    label_en: string;
    parent_code: string | null;
    sort_order: number;
    active: boolean;
    attrs: Record<string, any>;
  }>
> {
  const { data, error } = await supabase.rpc('fn_md_export_terms', {
    p_catalog_id: catalogId,
    p_include_inactive: includeInactive,
  });

  if (error) {
    console.error('Error exporting terms:', error);
    throw error;
  }

  return data || [];
}

/**
 * Export terms to CSV format (alias for compatibility)
 */
export async function exportTermsCSV(params: {
  catalogId: string;
  includeInactive?: boolean;
}): Promise<
  Array<{
    code: string;
    label_ar: string;
    label_en: string;
    parent_code: string | null;
    sort_order: number;
    active: boolean;
    attrs: Record<string, any>;
  }>
> {
  return exportTerms(params.catalogId, params.includeInactive || false);
}
