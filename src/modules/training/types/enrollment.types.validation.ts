/**
 * LMS Enrollments - Zod Validation Schemas
 */

import { z } from 'zod';

// ============================================
// Enrollment Enums
// ============================================

export const enrollmentStatusEnum = z.enum([
  'enrolled',
  'in_progress',
  'completed',
  'failed',
  'withdrawn',
  'expired'
]);

export const enrollmentTypeEnum = z.enum([
  'required',
  'optional',
  'recommended'
]);

// ============================================
// Enrollment Creation Schema
// ============================================

export const createEnrollmentSchema = z.object({
  user_id: z.string()
    .uuid('Invalid user ID'),
  
  course_id: z.string()
    .uuid('Invalid course ID'),
  
  enrollment_type: enrollmentTypeEnum.optional(),
  
  enrolled_by: z.string()
    .uuid('Invalid enrolled_by user ID')
    .optional()
    .nullable(),
  
  due_date: z.string()
    .datetime('Invalid due date format')
    .optional()
    .nullable(),
  
  notes: z.string()
    .trim()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional()
    .nullable(),
});

// ============================================
// Enrollment Update Schema
// ============================================

export const updateEnrollmentSchema = z.object({
  status: enrollmentStatusEnum.optional(),
  
  progress_percentage: z.number()
    .min(0, 'Progress must be at least 0%')
    .max(100, 'Progress must not exceed 100%')
    .optional()
    .nullable(),
  
  started_at: z.string()
    .datetime('Invalid start date')
    .optional()
    .nullable(),
  
  completed_at: z.string()
    .datetime('Invalid completion date')
    .optional()
    .nullable(),
  
  due_date: z.string()
    .datetime('Invalid due date')
    .optional()
    .nullable(),
  
  final_score: z.number()
    .min(0, 'Score must be at least 0')
    .max(100, 'Score must not exceed 100')
    .optional()
    .nullable(),
  
  notes: z.string()
    .trim()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional()
    .nullable(),
});

// ============================================
// Bulk Enrollment Schema
// ============================================

export const bulkEnrollmentSchema = z.object({
  course_id: z.string()
    .uuid('Invalid course ID'),
  
  user_ids: z.array(z.string().uuid('Invalid user ID'))
    .min(1, 'Must enroll at least 1 user')
    .max(1000, 'Cannot enroll more than 1000 users at once'),
  
  enrollment_type: enrollmentTypeEnum.optional(),
  
  due_date: z.string()
    .datetime('Invalid due date format')
    .optional()
    .nullable(),
  
  notes: z.string()
    .trim()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional()
    .nullable(),
});

// ============================================
// Enrollment Filters Schema
// ============================================

export const enrollmentFiltersSchema = z.object({
  course_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  status: enrollmentStatusEnum.optional(),
  enrollment_type: enrollmentTypeEnum.optional(),
  is_overdue: z.boolean().optional(),
  search: z.string().trim().max(255).optional(),
});

// ============================================
// Unenroll Schema
// ============================================

export const unenrollSchema = z.object({
  enrollment_id: z.string().uuid('Invalid enrollment ID'),
  reason: z.string()
    .trim()
    .max(500, 'Reason must not exceed 500 characters')
    .optional()
    .nullable(),
});

// ============================================
// Validation Functions
// ============================================

export const validateEnrollmentCreate = (data: unknown) => {
  return createEnrollmentSchema.safeParse(data);
};

export const validateEnrollmentUpdate = (data: unknown) => {
  return updateEnrollmentSchema.safeParse(data);
};

export const validateBulkEnrollment = (data: unknown) => {
  return bulkEnrollmentSchema.safeParse(data);
};

export const validateEnrollmentFilters = (data: unknown) => {
  return enrollmentFiltersSchema.safeParse(data);
};

export const validateUnenroll = (data: unknown) => {
  return unenrollSchema.safeParse(data);
};

// ============================================
// Type Inference
// ============================================

export type EnrollmentCreateInput = z.infer<typeof createEnrollmentSchema>;
export type EnrollmentUpdateInput = z.infer<typeof updateEnrollmentSchema>;
export type BulkEnrollmentInput = z.infer<typeof bulkEnrollmentSchema>;
export type EnrollmentFiltersInput = z.infer<typeof enrollmentFiltersSchema>;
export type UnenrollInput = z.infer<typeof unenrollSchema>;
