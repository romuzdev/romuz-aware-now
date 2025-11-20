/**
 * M13.1 - Content Hub: Categories Service
 * إدارة التصنيفات
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ContentCategory = Database['public']['Tables']['content_categories']['Row'];
type ContentCategoryInsert = Database['public']['Tables']['content_categories']['Insert'];
type ContentCategoryUpdate = Database['public']['Tables']['content_categories']['Update'];

/**
 * Get all categories for a tenant
 */
export async function getCategories(tenantId: string, activeOnly: boolean = false) {
  let query = supabase
    .from('content_categories')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('display_order', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Get category by ID
 */
export async function getCategory(id: string) {
  const { data, error } = await supabase
    .from('content_categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get hierarchical categories (parent-child structure)
 */
export async function getHierarchicalCategories(tenantId: string) {
  const categories = await getCategories(tenantId, true);

  // Build tree structure
  const categoriesMap = new Map<string, ContentCategory & { children: ContentCategory[] }>();
  const rootCategories: (ContentCategory & { children: ContentCategory[] })[] = [];

  // Initialize all categories with empty children array
  categories.forEach(cat => {
    categoriesMap.set(cat.id, { ...cat, children: [] });
  });

  // Build tree
  categories.forEach(cat => {
    const categoryWithChildren = categoriesMap.get(cat.id)!;
    
    if (cat.parent_category_id) {
      const parent = categoriesMap.get(cat.parent_category_id);
      if (parent) {
        parent.children.push(categoryWithChildren);
      }
    } else {
      rootCategories.push(categoryWithChildren);
    }
  });

  return rootCategories;
}

/**
 * Create new category
 */
export async function createCategory(
  category: Omit<ContentCategoryInsert, 'id' | 'created_at' | 'updated_at'>
) {
  const { data, error } = await supabase
    .from('content_categories')
    .insert(category)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update category
 */
export async function updateCategory(
  id: string,
  updates: ContentCategoryUpdate
) {
  const { data, error } = await supabase
    .from('content_categories')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete category
 */
export async function deleteCategory(id: string) {
  const { error } = await supabase
    .from('content_categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Reorder categories
 */
export async function reorderCategories(
  updates: Array<{ id: string; display_order: number }>
) {
  const promises = updates.map(({ id, display_order }) =>
    supabase
      .from('content_categories')
      .update({ display_order, updated_at: new Date().toISOString() })
      .eq('id', id)
  );

  const results = await Promise.all(promises);
  
  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    throw errors[0].error;
  }

  return true;
}

/**
 * Get category with content count
 */
export async function getCategoryWithStats(tenantId: string) {
  const { data, error } = await supabase
    .from('content_categories')
    .select(`
      *,
      content_count
    `)
    .eq('tenant_id', tenantId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Toggle category active status
 */
export async function toggleCategoryStatus(id: string, userId: string) {
  const category = await getCategory(id);
  
  const { data, error } = await supabase
    .from('content_categories')
    .update({
      is_active: !category.is_active,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
