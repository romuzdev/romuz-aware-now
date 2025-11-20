/**
 * Gate-M: Reference Catalogs Integration
 * 
 * Supabase integration for managing reference catalogs (GLOBAL & TENANT)
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  RefCatalog,
  CreateCatalogInput,
  UpdateCatalogInput,
  CatalogFilters,
} from '../types';

/**
 * Map database row to RefCatalog type
 */
function mapCatalog(raw: any): RefCatalog {
  return {
    id: raw.id,
    code: raw.code,
    labelAr: raw.label_ar,
    labelEn: raw.label_en,
    scope: raw.scope,
    tenantId: raw.tenant_id,
    status: raw.status,
    version: raw.version,
    meta: raw.meta || {},
    createdBy: raw.created_by,
    updatedBy: raw.updated_by,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

/**
 * Fetch all catalogs (filtered)
 */
export async function fetchCatalogs(filters?: CatalogFilters): Promise<RefCatalog[]> {
  let query = supabase
    .from('ref_catalogs')
    .select('*')
    .order('label_ar', { ascending: true });

  if (filters?.scope) {
    query = query.eq('scope', filters.scope);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.tenantId) {
    query = query.eq('tenant_id', filters.tenantId);
  }

  if (filters?.search) {
    query = query.or(
      `label_ar.ilike.%${filters.search}%,label_en.ilike.%${filters.search}%,code.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching catalogs:', error);
    throw error;
  }

  return (data || []).map(mapCatalog);
}

/**
 * Fetch catalog by ID
 */
export async function fetchCatalogById(id: string): Promise<RefCatalog | null> {
  const { data, error } = await supabase
    .from('ref_catalogs')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching catalog:', error);
    throw error;
  }

  return data ? mapCatalog(data) : null;
}

/**
 * Fetch catalog by code
 */
export async function fetchCatalogByCode(
  code: string,
  scope: 'GLOBAL' | 'TENANT',
  tenantId?: string
): Promise<RefCatalog | null> {
  let query = supabase
    .from('ref_catalogs')
    .select('*')
    .eq('code', code)
    .eq('scope', scope);

  if (scope === 'TENANT' && tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('Error fetching catalog by code:', error);
    throw error;
  }

  return data ? mapCatalog(data) : null;
}

/**
 * Create a new catalog
 */
export async function createCatalog(input: CreateCatalogInput): Promise<RefCatalog> {
  const { data, error } = await supabase
    .from('ref_catalogs')
    .insert({
      code: input.code,
      label_ar: input.labelAr,
      label_en: input.labelEn,
      scope: input.scope,
      tenant_id: input.tenantId || null,
      status: input.status || 'DRAFT',
      meta: input.meta || {},
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error creating catalog:', error);
    throw error;
  }

  if (!data) {
    throw new Error('فشل إنشاء الكتالوج. قد لا تملك الصلاحيات المطلوبة.');
  }

  return mapCatalog(data);
}

/**
 * Update an existing catalog
 */
export async function updateCatalog(
  id: string,
  input: UpdateCatalogInput
): Promise<RefCatalog> {
  const updateData: any = {};

  if (input.labelAr !== undefined) updateData.label_ar = input.labelAr;
  if (input.labelEn !== undefined) updateData.label_en = input.labelEn;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.version !== undefined) updateData.version = input.version;
  if (input.meta !== undefined) updateData.meta = input.meta;

  const { data, error } = await supabase
    .from('ref_catalogs')
    .update(updateData)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating catalog:', error);
    throw error;
  }

  if (!data) {
    throw new Error('لا يمكن تحديث الكتالوج. قد لا تملك الصلاحيات أو الكتالوج غير موجود.');
  }

  return mapCatalog(data);
}

/**
 * Delete a catalog (cascade deletes terms & mappings)
 */
export async function deleteCatalog(id: string): Promise<void> {
  const { error } = await supabase.from('ref_catalogs').delete().eq('id', id);

  if (error) {
    console.error('Error deleting catalog:', error);
    throw error;
  }
}

/**
 * Publish a catalog (change status to PUBLISHED and bump version)
 */
export async function publishCatalog(id: string): Promise<RefCatalog> {
  // First bump the version using RPC
  await supabase.rpc('fn_md_bump_catalog_version', {
    p_catalog_id: id,
  });

  // Then update status to PUBLISHED
  return updateCatalog(id, { status: 'PUBLISHED' });
}

/**
 * Archive a catalog (change status to ARCHIVED)
 */
export async function archiveCatalog(id: string): Promise<RefCatalog> {
  return updateCatalog(id, { status: 'ARCHIVED' });
}

/**
 * Bump catalog version (using RPC)
 */
export async function bumpCatalogVersion(id: string): Promise<number> {
  const { data, error } = await supabase.rpc('fn_md_bump_catalog_version', {
    p_catalog_id: id,
  });

  if (error) {
    console.error('Error bumping catalog version:', error);
    throw error;
  }

  return data || 0;
}
