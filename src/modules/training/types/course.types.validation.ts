/**
 * LMS Courses - Zod Validation Schemas
 */

import { z } from 'zod';

// ============================================
// Course Status & Level Enums
// ============================================

export const courseStatusEnum = z.enum(['draft', 'published', 'archived']);
export const courseLevelEnum = z.enum(['beginner', 'intermediate', 'advanced', 'expert']);

// ============================================
// Course Creation Schema
// ============================================

export const createCourseSchema = z.object({
  name: z.string()
    .trim()
    .min(3, 'Course name must be at least 3 characters')
    .max(255, 'Course name must not exceed 255 characters'),
  
  name_ar: z.string()
    .trim()
    .min(3, 'Arabic name must be at least 3 characters')
    .max(255, 'Arabic name must not exceed 255 characters')
    .optional()
    .nullable(),
  
  code: z.string()
    .trim()
    .min(2, 'Course code must be at least 2 characters')
    .max(50, 'Course code must not exceed 50 characters')
    .regex(/^[A-Z0-9-_]+$/, 'Code must contain only uppercase letters, numbers, hyphens and underscores'),
  
  description: z.string()
    .trim()
    .max(5000, 'Description must not exceed 5000 characters')
    .optional()
    .nullable(),
  
  description_ar: z.string()
    .trim()
    .max(5000, 'Arabic description must not exceed 5000 characters')
    .optional()
    .nullable(),
  
  category_id: z.string()
    .uuid('Invalid category ID')
    .optional()
    .nullable(),
  
  instructor_id: z.string()
    .uuid('Invalid instructor ID')
    .optional()
    .nullable(),
  
  thumbnail_url: z.string()
    .trim()
    .url('Invalid thumbnail URL')
    .max(500, 'URL must not exceed 500 characters')
    .optional()
    .nullable(),
  
  level: courseLevelEnum.optional().nullable(),
  
  status: courseStatusEnum.optional(),
  
  estimated_duration_minutes: z.number()
    .int()
    .min(1, 'Duration must be at least 1 minute')
    .max(10080, 'Duration must not exceed 7 days (10080 minutes)')
    .optional()
    .nullable(),
  
  passing_score: z.number()
    .min(0, 'Passing score must be at least 0')
    .max(100, 'Passing score must not exceed 100')
    .optional()
    .nullable(),
  
  max_attempts: z.number()
    .int()
    .min(1, 'Max attempts must be at least 1')
    .max(10, 'Max attempts must not exceed 10')
    .optional()
    .nullable(),
  
  certificate_template_id: z.string()
    .uuid('Invalid certificate template ID')
    .optional()
    .nullable(),
  
  tags: z.array(z.string().trim().max(50))
    .max(10, 'Cannot have more than 10 tags')
    .optional()
    .nullable(),
  
  prerequisites: z.array(z.string().uuid())
    .max(5, 'Cannot have more than 5 prerequisites')
    .optional()
    .nullable(),
  
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

// ============================================
// Course Update Schema
// ============================================

export const updateCourseSchema = createCourseSchema.partial();

// ============================================
// Course Filters Schema
// ============================================

export const courseFiltersSchema = z.object({
  search: z.string().trim().max(255).optional(),
  status: courseStatusEnum.optional(),
  category_id: z.string().uuid().optional(),
  instructor_id: z.string().uuid().optional(),
  level: courseLevelEnum.optional(),
  tags: z.array(z.string()).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

// ============================================
// Course Publish/Archive Schemas
// ============================================

export const publishCourseSchema = z.object({
  id: z.string().uuid('Invalid course ID'),
});

export const archiveCourseSchema = z.object({
  id: z.string().uuid('Invalid course ID'),
});

// ============================================
// Validation Functions
// ============================================

export const validateCourseCreate = (data: unknown) => {
  return createCourseSchema.safeParse(data);
};

export const validateCourseUpdate = (data: unknown) => {
  return updateCourseSchema.safeParse(data);
};

export const validateCourseFilters = (data: unknown) => {
  return courseFiltersSchema.safeParse(data);
};

export const validateCoursePublish = (data: unknown) => {
  return publishCourseSchema.safeParse(data);
};

export const validateCourseArchive = (data: unknown) => {
  return archiveCourseSchema.safeParse(data);
};

// ============================================
// Type Inference
// ============================================

export type CourseCreateInput = z.infer<typeof createCourseSchema>;
export type CourseUpdateInput = z.infer<typeof updateCourseSchema>;
export type CourseFiltersInput = z.infer<typeof courseFiltersSchema>;
export type CoursePublishInput = z.infer<typeof publishCourseSchema>;
export type CourseArchiveInput = z.infer<typeof archiveCourseSchema>;
