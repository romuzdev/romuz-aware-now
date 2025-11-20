/**
 * LMS Resources - Zod Validation Schemas
 */

import { z } from 'zod';

// ============================================
// Resource Type Enum
// ============================================

export const resourceTypeEnum = z.enum([
  'pdf',
  'video',
  'audio',
  'document',
  'presentation',
  'spreadsheet',
  'link',
  'other'
]);

// ============================================
// Resource Creation Schema
// ============================================

export const createResourceSchema = z.object({
  course_id: z.string()
    .uuid('Invalid course ID'),
  
  name: z.string()
    .trim()
    .min(2, 'Resource name must be at least 2 characters')
    .max(255, 'Resource name must not exceed 255 characters'),
  
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
  
  resource_type: resourceTypeEnum,
  
  file_url: z.string()
    .trim()
    .url('Invalid file URL')
    .max(1000, 'URL must not exceed 1000 characters')
    .optional()
    .nullable(),
  
  file_size_bytes: z.number()
    .int()
    .min(0, 'File size must be non-negative')
    .max(1073741824, 'File size must not exceed 1GB (1073741824 bytes)')
    .optional()
    .nullable(),
  
  mime_type: z.string()
    .trim()
    .max(100, 'MIME type must not exceed 100 characters')
    .optional()
    .nullable(),
  
  is_downloadable: z.boolean().optional(),
  
  position: z.number()
    .int()
    .min(0, 'Position must be non-negative')
    .optional(),
  
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

// ============================================
// Resource Update Schema
// ============================================

export const updateResourceSchema = createResourceSchema.partial().omit({ course_id: true });

// ============================================
// Reorder Resources Schema
// ============================================

export const reorderResourcesSchema = z.object({
  course_id: z.string().uuid('Invalid course ID'),
  resources: z.array(
    z.object({
      id: z.string().uuid('Invalid resource ID'),
      position: z.number().int().min(0),
    })
  ).min(1, 'Must provide at least one resource'),
});

// ============================================
// Upload Resource Schema
// ============================================

export const uploadResourceSchema = z.object({
  course_id: z.string()
    .uuid('Invalid course ID'),
  
  name: z.string()
    .trim()
    .min(2, 'Resource name must be at least 2 characters')
    .max(255, 'Resource name must not exceed 255 characters'),
  
  file: z.instanceof(File, { message: 'Must provide a valid file' })
    .refine(file => file.size <= 1073741824, {
      message: 'File size must not exceed 1GB',
    })
    .refine(file => file.name.length <= 255, {
      message: 'File name must not exceed 255 characters',
    }),
  
  description: z.string()
    .trim()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
});

// ============================================
// Validation Functions
// ============================================

export const validateResourceCreate = (data: unknown) => {
  return createResourceSchema.safeParse(data);
};

export const validateResourceUpdate = (data: unknown) => {
  return updateResourceSchema.safeParse(data);
};

export const validateReorderResources = (data: unknown) => {
  return reorderResourcesSchema.safeParse(data);
};

export const validateUploadResource = (data: unknown) => {
  return uploadResourceSchema.safeParse(data);
};

// ============================================
// Type Inference
// ============================================

export type ResourceCreateInput = z.infer<typeof createResourceSchema>;
export type ResourceUpdateInput = z.infer<typeof updateResourceSchema>;
export type ReorderResourcesInput = z.infer<typeof reorderResourcesSchema>;
export type UploadResourceInput = z.infer<typeof uploadResourceSchema>;
