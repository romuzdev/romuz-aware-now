/**
 * LMS Progress - Zod Validation Schemas
 */

import { z } from 'zod';

// ============================================
// Progress Status Enum
// ============================================

export const progressStatusEnum = z.enum([
  'not_started',
  'in_progress',
  'completed',
  'failed'
]);

// ============================================
// Update Progress Schema
// ============================================

export const updateProgressSchema = z.object({
  enrollment_id: z.string()
    .uuid('Invalid enrollment ID'),
  
  lesson_id: z.string()
    .uuid('Invalid lesson ID'),
  
  status: progressStatusEnum.optional(),
  
  progress_percentage: z.number()
    .min(0, 'Progress must be at least 0%')
    .max(100, 'Progress must not exceed 100%')
    .optional(),
  
  time_spent_minutes: z.number()
    .int()
    .min(0, 'Time spent must be non-negative')
    .optional()
    .nullable(),
  
  completed_at: z.string()
    .datetime('Invalid completion date')
    .optional()
    .nullable(),
  
  last_accessed_at: z.string()
    .datetime('Invalid last access date')
    .optional()
    .nullable(),
  
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

// ============================================
// Mark Lesson Complete Schema
// ============================================

export const markLessonCompleteSchema = z.object({
  enrollment_id: z.string()
    .uuid('Invalid enrollment ID'),
  
  lesson_id: z.string()
    .uuid('Invalid lesson ID'),
  
  time_spent_minutes: z.number()
    .int()
    .min(0)
    .optional()
    .nullable(),
});

// ============================================
// Batch Update Progress Schema
// ============================================

export const batchUpdateProgressSchema = z.object({
  enrollment_id: z.string()
    .uuid('Invalid enrollment ID'),
  
  progress_updates: z.array(
    z.object({
      lesson_id: z.string().uuid('Invalid lesson ID'),
      progress_percentage: z.number().min(0).max(100),
      time_spent_minutes: z.number().int().min(0).optional(),
      status: progressStatusEnum.optional(),
    })
  ).min(1, 'Must provide at least one progress update')
    .max(100, 'Cannot update more than 100 lessons at once'),
});

// ============================================
// Validation Functions
// ============================================

export const validateUpdateProgress = (data: unknown) => {
  return updateProgressSchema.safeParse(data);
};

export const validateMarkLessonComplete = (data: unknown) => {
  return markLessonCompleteSchema.safeParse(data);
};

export const validateBatchUpdateProgress = (data: unknown) => {
  return batchUpdateProgressSchema.safeParse(data);
};

// ============================================
// Type Inference
// ============================================

export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;
export type MarkLessonCompleteInput = z.infer<typeof markLessonCompleteSchema>;
export type BatchUpdateProgressInput = z.infer<typeof batchUpdateProgressSchema>;
