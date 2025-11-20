/**
 * Gate-M: Reference Mappings Integration
 * 
 * Supabase integration for managing external system mappings
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  RefMapping,
  CreateMappingInput,
  UpdateMappingInput,
  MappingFilters,
} from '../types';

/**
 * Map database row to RefMapping type
 */
function mapMapping(raw: any): RefMapping {
  return {
    id: raw.id,
    catalogId: raw.catalog_id,
    termId: raw.term_id,
    sourceSystem: raw.source_system,
    srcCode: raw.src_code,
    targetCode: raw.target_code,
    notes: raw.notes,
    createdBy: raw.created_by,
    createdAt: raw.created_at,
  };
}

/**
 * Fetch all mappings (filtered)
 */
export async function fetchMappings(filters?: MappingFilters): Promise<RefMapping[]> {
  let query = supabase
    .from('ref_mappings')
    .select('*')
    .order('source_system', { ascending: true })
    .order('src_code', { ascending: true });

  if (filters?.catalogId) {
    query = query.eq('catalog_id', filters.catalogId);
  }

  if (filters?.termId) {
    query = query.eq('term_id', filters.termId);
  }

  if (filters?.sourceSystem) {
    query = query.eq('source_system', filters.sourceSystem);
  }

  if (filters?.search) {
    query = query.or(
      `src_code.ilike.%${filters.search}%,target_code.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching mappings:', error);
    throw error;
  }

  return (data || []).map(mapMapping);
}

/**
 * Fetch mapping by ID
 */
export async function fetchMappingById(id: string): Promise<RefMapping | null> {
  const { data, error } = await supabase
    .from('ref_mappings')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching mapping:', error);
    throw error;
  }

  return data ? mapMapping(data) : null;
}

/**
 * Fetch mapping by source code
 */
export async function fetchMappingBySourceCode(
  catalogId: string,
  sourceSystem: string,
  srcCode: string,
  termId?: string | null
): Promise<RefMapping | null> {
  let query = supabase
    .from('ref_mappings')
    .select('*')
    .eq('catalog_id', catalogId)
    .eq('source_system', sourceSystem)
    .eq('src_code', srcCode);

  if (termId !== undefined) {
    if (termId === null) {
      query = query.is('term_id', null);
    } else {
      query = query.eq('term_id', termId);
    }
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('Error fetching mapping by source code:', error);
    throw error;
  }

  return data ? mapMapping(data) : null;
}

/**
 * Lookup target code from source code
 */
export async function lookupTargetCode(
  catalogId: string,
  sourceSystem: string,
  srcCode: string
): Promise<string | null> {
  const mapping = await fetchMappingBySourceCode(catalogId, sourceSystem, srcCode);
  return mapping ? mapping.targetCode : null;
}

/**
 * Fetch mappings by catalog
 */
export async function fetchMappingsByCatalog(catalogId: string): Promise<RefMapping[]> {
  return fetchMappings({ catalogId });
}

/**
 * Fetch mappings by source system
 */
export async function fetchMappingsBySystem(sourceSystem: string): Promise<RefMapping[]> {
  return fetchMappings({ sourceSystem });
}

/**
 * Create a new mapping
 */
export async function createMapping(input: CreateMappingInput): Promise<RefMapping> {
  const { data, error } = await supabase
    .from('ref_mappings')
    .insert({
      catalog_id: input.catalogId,
      term_id: input.termId || null,
      source_system: input.sourceSystem,
      src_code: input.srcCode,
      target_code: input.targetCode,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating mapping:', error);
    throw error;
  }

  return mapMapping(data);
}

/**
 * Update an existing mapping
 */
export async function updateMapping(
  id: string,
  input: UpdateMappingInput
): Promise<RefMapping> {
  const updateData: any = {};

  if (input.targetCode !== undefined) updateData.target_code = input.targetCode;
  if (input.notes !== undefined) updateData.notes = input.notes;

  const { data, error } = await supabase
    .from('ref_mappings')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating mapping:', error);
    throw error;
  }

  return mapMapping(data);
}

/**
 * Delete a mapping
 */
export async function deleteMapping(id: string): Promise<void> {
  const { error } = await supabase.from('ref_mappings').delete().eq('id', id);

  if (error) {
    console.error('Error deleting mapping:', error);
    throw error;
  }
}

/**
 * Upsert mapping (create or update) using RPC
 */
export async function upsertMapping(
  catalogId: string,
  termId: string | null,
  sourceSystem: string,
  srcCode: string,
  targetCode: string,
  notes?: string | null
): Promise<string> {
  const { data, error } = await supabase.rpc('fn_md_upsert_mapping', {
    p_catalog_id: catalogId,
    p_term_id: termId,
    p_source_system: sourceSystem,
    p_src_code: srcCode,
    p_target_code: targetCode,
    p_notes: notes || null,
  });

  if (error) {
    console.error('Error upserting mapping:', error);
    throw error;
  }

  return data; // Returns the mapping ID
}

/**
 * Bulk create mappings (using upsert RPC)
 */
export async function bulkCreateMappings(
  inputs: CreateMappingInput[]
): Promise<string[]> {
  const results = await Promise.all(
    inputs.map((input) =>
      upsertMapping(
        input.catalogId,
        input.termId || null,
        input.sourceSystem,
        input.srcCode,
        input.targetCode,
        input.notes
      )
    )
  );

  return results;
}
