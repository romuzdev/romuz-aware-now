/**
 * LMS Modules - Zod Validation Schemas
 */

import { z } from 'zod';

// ============================================
// Module Unlock Mode Enum
// ============================================

export const unlockModeEnum = z.enum(['sequential', 'open', 'scheduled']);

// ============================================
// Module Creation Schema
// ============================================

export const createModuleSchema = z.object({
  course_id: z.string()
    .uuid('Invalid course ID'),
  
  name: z.string()
    .trim()
    .min(2, 'Module name must be at least 2 characters')
    .max(255, 'Module name must not exceed 255 characters'),
  
  name_ar: z.string()
    .trim()
    .min(2, 'Arabic name must be at least 2 characters')
    .max(255, 'Arabic name must not exceed 255 characters')
    .optional()
    .nullable(),
  
  description: z.string()
    .trim()
    .max(2000, 'Description must not exceed 2000 characters')
    .optional()
    .nullable(),
  
  description_ar: z.string()
    .trim()
    .max(2000, 'Arabic description must not exceed 2000 characters')
    .optional()
    .nullable(),
  
  position: z.number()
    .int()
    .min(0, 'Position must be non-negative'),
  
  is_required: z.boolean().optional(),
  
  estimated_minutes: z.number()
    .int()
    .min(1, 'Estimated duration must be at least 1 minute')
    .max(1440, 'Estimated duration must not exceed 24 hours')
    .optional()
    .nullable(),
  
  unlock_mode: unlockModeEnum.optional(),
  
  unlock_at: z.string()
    .datetime('Invalid unlock date format')
    .optional()
    .nullable(),
  
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

// ============================================
// Module Update Schema
// ============================================

export const updateModuleSchema = createModuleSchema.partial().omit({ course_id: true });

// ============================================
// Reorder Modules Schema
// ============================================

export const reorderModulesSchema = z.object({
  course_id: z.string().uuid('Invalid course ID'),
  modules: z.array(
    z.object({
      id: z.string().uuid('Invalid module ID'),
      position: z.number().int().min(0),
    })
  ).min(1, 'Must provide at least one module'),
});

// ============================================
// Validation Functions
// ============================================

export const validateModuleCreate = (data: unknown) => {
  return createModuleSchema.safeParse(data);
};

export const validateModuleUpdate = (data: unknown) => {
  return updateModuleSchema.safeParse(data);
};

export const validateReorderModules = (data: unknown) => {
  return reorderModulesSchema.safeParse(data);
};

// ============================================
// Type Inference
// ============================================

export type ModuleCreateInput = z.infer<typeof createModuleSchema>;
export type ModuleUpdateInput = z.infer<typeof updateModuleSchema>;
export type ReorderModulesInput = z.infer<typeof reorderModulesSchema>;
