/**
 * LMS Categories Integration
 * 
 * Handles all database operations for course categories
 */

import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  description?: string;
  parent_id?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateCategoryInput {
  code: string;
  name: string;
  description?: string;
  parent_id?: string;
  is_active?: boolean;
  sort_order?: number;
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

/**
 * Fetch all categories
 */
export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('lms_categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch a single category by ID
 */
export async function fetchCategoryById(id: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('lms_categories')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Fetch subcategories for a parent category
 */
export async function fetchSubcategories(parentId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('lms_categories')
    .select('*')
    .eq('parent_id', parentId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Create a new category
 */
export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const { data, error } = await supabase
    .from('lms_categories')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing category
 */
export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
  const { data, error } = await supabase
    .from('lms_categories')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('lms_categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
