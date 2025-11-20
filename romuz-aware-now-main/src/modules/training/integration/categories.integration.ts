/**
 * LMS Categories Integration Layer
 * Gate-K Standard: D1 + Zod Validation
 */

import { supabase } from '@/integrations/supabase/client';
import type { Category, CategoryFilters, CategoryInsert, CategoryUpdate } from '../types';
import { createCategorySchema, updateCategorySchema } from '../types/category.types';

export async function fetchCategories(filters?: CategoryFilters): Promise<Category[]> {
  let query = supabase
    .from('lms_categories')
    .select('*')
    .order('position', { ascending: true });

  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  if (filters?.parent_id !== undefined) {
    query = filters.parent_id === null
      ? query.is('parent_id', null)
      : query.eq('parent_id', filters.parent_id);
  }

  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchCategoryById(id: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('lms_categories')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createCategory(input: CategoryInsert): Promise<Category> {
  // Validate input with Zod
  const validated = createCategorySchema.parse(input);
  
  const { data, error } = await supabase
    .from('lms_categories')
    .insert(validated)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateCategory(id: string, input: CategoryUpdate): Promise<Category> {
  // Validate input with Zod
  const validated = updateCategorySchema.parse(input);
  
  const { data, error } = await supabase
    .from('lms_categories')
    .update(validated)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('lms_categories')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}
