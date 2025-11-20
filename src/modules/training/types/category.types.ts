/**
 * LMS Categories Types with Zod Validation
 */

import { z } from 'zod';
import type { Database } from '@/integrations/supabase/types';

export type CategoryRow = Database['public']['Tables']['lms_categories']['Row'];
export type CategoryInsert = Database['public']['Tables']['lms_categories']['Insert'];
export type CategoryUpdate = Database['public']['Tables']['lms_categories']['Update'];

export interface Category extends CategoryRow {
  parent?: Category | null;
  children?: Category[];
  courseCount?: number;
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
  level: number;
}

export interface CategoryFilters {
  search?: string;
  parent_id?: string | null;
  is_active?: boolean;
}

// ============================================
// Zod Validation Schemas
// ============================================

/**
 * Category Creation Schema
 */
export const createCategorySchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Category name must be at least 2 characters')
    .max(255, 'Category name must not exceed 255 characters'),
  name_ar: z.string()
    .trim()
    .min(2, 'Arabic name must be at least 2 characters')
    .max(255, 'Arabic name must not exceed 255 characters')
    .optional()
    .nullable(),
  description: z.string()
    .trim()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional()
    .nullable(),
  description_ar: z.string()
    .trim()
    .max(1000, 'Arabic description must not exceed 1000 characters')
    .optional()
    .nullable(),
  parent_id: z.string().uuid('Invalid parent category ID').optional().nullable(),
  icon: z.string()
    .trim()
    .max(100, 'Icon name must not exceed 100 characters')
    .optional()
    .nullable(),
  color: z.string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (use #RRGGBB)')
    .optional()
    .nullable(),
  position: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

/**
 * Category Update Schema
 */
export const updateCategorySchema = createCategorySchema.partial();

/**
 * Category Filters Schema
 */
export const categoryFiltersSchema = z.object({
  search: z.string().trim().max(255).optional(),
  parent_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().optional(),
});

// ============================================
// Validation Functions
// ============================================

/**
 * Validate category creation input
 */
export const validateCategoryCreate = (data: unknown) => {
  return createCategorySchema.safeParse(data);
};

/**
 * Validate category update input
 */
export const validateCategoryUpdate = (data: unknown) => {
  return updateCategorySchema.safeParse(data);
};

/**
 * Validate category filters
 */
export const validateCategoryFilters = (data: unknown) => {
  return categoryFiltersSchema.safeParse(data);
};

// ============================================
// Type Inference from Schemas
// ============================================

export type CategoryCreateInput = z.infer<typeof createCategorySchema>;
export type CategoryUpdateInput = z.infer<typeof updateCategorySchema>;
export type CategoryFiltersInput = z.infer<typeof categoryFiltersSchema>;
