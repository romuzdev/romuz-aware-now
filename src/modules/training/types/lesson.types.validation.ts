/**
 * LMS Lessons - Zod Validation Schemas
 */

import { z } from 'zod';

// ============================================
// Lesson Type Enum
// ============================================

export const lessonTypeEnum = z.enum([
  'video',
  'article',
  'quiz',
  'assignment',
  'scorm',
  'external_link'
]);

// ============================================
// Lesson Creation Schema
// ============================================

export const createLessonSchema = z.object({
  module_id: z.string()
    .uuid('Invalid module ID'),
  
  name: z.string()
    .trim()
    .min(2, 'Lesson name must be at least 2 characters')
    .max(255, 'Lesson name must not exceed 255 characters'),
  
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
  
  lesson_type: lessonTypeEnum,
  
  content: z.string()
    .trim()
    .max(50000, 'Content must not exceed 50000 characters')
    .optional()
    .nullable(),
  
  content_ar: z.string()
    .trim()
    .max(50000, 'Arabic content must not exceed 50000 characters')
    .optional()
    .nullable(),
  
  video_url: z.string()
    .trim()
    .url('Invalid video URL')
    .max(500, 'URL must not exceed 500 characters')
    .optional()
    .nullable(),
  
  duration_minutes: z.number()
    .int()
    .min(1, 'Duration must be at least 1 minute')
    .max(480, 'Duration must not exceed 8 hours (480 minutes)')
    .optional()
    .nullable(),
  
  position: z.number()
    .int()
    .min(0, 'Position must be non-negative'),
  
  is_required: z.boolean().optional(),
  
  is_preview_available: z.boolean().optional(),
  
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

// ============================================
// Lesson Update Schema
// ============================================

export const updateLessonSchema = createLessonSchema.partial().omit({ module_id: true });

// ============================================
// Reorder Lessons Schema
// ============================================

export const reorderLessonsSchema = z.object({
  module_id: z.string().uuid('Invalid module ID'),
  lessons: z.array(
    z.object({
      id: z.string().uuid('Invalid lesson ID'),
      position: z.number().int().min(0),
    })
  ).min(1, 'Must provide at least one lesson'),
});

// ============================================
// Validation Functions
// ============================================

export const validateLessonCreate = (data: unknown) => {
  return createLessonSchema.safeParse(data);
};

export const validateLessonUpdate = (data: unknown) => {
  return updateLessonSchema.safeParse(data);
};

export const validateReorderLessons = (data: unknown) => {
  return reorderLessonsSchema.safeParse(data);
};

// ============================================
// Type Inference
// ============================================

export type LessonCreateInput = z.infer<typeof createLessonSchema>;
export type LessonUpdateInput = z.infer<typeof updateLessonSchema>;
export type ReorderLessonsInput = z.infer<typeof reorderLessonsSchema>;
