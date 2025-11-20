/**
 * LMS Assessments - Zod Validation Schemas
 */

import { z } from 'zod';

// ============================================
// Assessment Enums
// ============================================

export const assessmentTypeEnum = z.enum(['quiz', 'exam', 'survey', 'practice']);
export const questionTypeEnum = z.enum(['multiple_choice', 'true_false', 'short_answer', 'essay']);

// ============================================
// Assessment Creation Schema
// ============================================

export const createAssessmentSchema = z.object({
  course_id: z.string()
    .uuid('Invalid course ID'),
  
  name: z.string()
    .trim()
    .min(3, 'Assessment name must be at least 3 characters')
    .max(255, 'Assessment name must not exceed 255 characters'),
  
  name_ar: z.string()
    .trim()
    .min(3, 'Arabic name must be at least 3 characters')
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
  
  assessment_type: assessmentTypeEnum,
  
  passing_score: z.number()
    .min(0, 'Passing score must be at least 0')
    .max(100, 'Passing score must not exceed 100')
    .optional()
    .nullable(),
  
  time_limit_minutes: z.number()
    .int()
    .min(1, 'Time limit must be at least 1 minute')
    .max(480, 'Time limit must not exceed 8 hours')
    .optional()
    .nullable(),
  
  max_attempts: z.number()
    .int()
    .min(1, 'Max attempts must be at least 1')
    .max(10, 'Max attempts must not exceed 10')
    .optional()
    .nullable(),
  
  randomize_questions: z.boolean().optional(),
  
  show_correct_answers: z.boolean().optional(),
  
  allow_review: z.boolean().optional(),
  
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

// ============================================
// Assessment Update Schema
// ============================================

export const updateAssessmentSchema = createAssessmentSchema.partial().omit({ course_id: true });

// ============================================
// Question Creation Schema
// ============================================

export const createQuestionSchema = z.object({
  assessment_id: z.string()
    .uuid('Invalid assessment ID'),
  
  question_text: z.string()
    .trim()
    .min(5, 'Question must be at least 5 characters')
    .max(1000, 'Question must not exceed 1000 characters'),
  
  question_text_ar: z.string()
    .trim()
    .min(5, 'Arabic question must be at least 5 characters')
    .max(1000, 'Arabic question must not exceed 1000 characters')
    .optional()
    .nullable(),
  
  question_type: questionTypeEnum,
  
  options: z.array(z.string().trim().min(1).max(500))
    .min(2, 'Must have at least 2 options')
    .max(10, 'Cannot have more than 10 options')
    .optional()
    .nullable(),
  
  correct_answer: z.string()
    .trim()
    .max(1000, 'Correct answer must not exceed 1000 characters')
    .optional()
    .nullable(),
  
  points: z.number()
    .int()
    .min(1, 'Points must be at least 1')
    .max(100, 'Points must not exceed 100'),
  
  position: z.number()
    .int()
    .min(0),
  
  explanation: z.string()
    .trim()
    .max(1000, 'Explanation must not exceed 1000 characters')
    .optional()
    .nullable(),
  
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

// ============================================
// Question Update Schema
// ============================================

export const updateQuestionSchema = createQuestionSchema.partial().omit({ assessment_id: true });

// ============================================
// Submit Assessment Schema
// ============================================

export const submitAssessmentSchema = z.object({
  enrollment_id: z.string()
    .uuid('Invalid enrollment ID'),
  
  assessment_id: z.string()
    .uuid('Invalid assessment ID'),
  
  answers: z.record(z.string(), z.any())
    .refine(data => Object.keys(data).length > 0, {
      message: 'Must provide at least one answer',
    }),
  
  time_spent_minutes: z.number()
    .int()
    .min(0, 'Time spent must be non-negative')
    .optional()
    .nullable(),
});

// ============================================
// Validation Functions
// ============================================

export const validateAssessmentCreate = (data: unknown) => {
  return createAssessmentSchema.safeParse(data);
};

export const validateAssessmentUpdate = (data: unknown) => {
  return updateAssessmentSchema.safeParse(data);
};

export const validateQuestionCreate = (data: unknown) => {
  return createQuestionSchema.safeParse(data);
};

export const validateQuestionUpdate = (data: unknown) => {
  return updateQuestionSchema.safeParse(data);
};

export const validateSubmitAssessment = (data: unknown) => {
  return submitAssessmentSchema.safeParse(data);
};

// ============================================
// Type Inference
// ============================================

export type AssessmentCreateInput = z.infer<typeof createAssessmentSchema>;
export type AssessmentUpdateInput = z.infer<typeof updateAssessmentSchema>;
export type QuestionCreateInput = z.infer<typeof createQuestionSchema>;
export type QuestionUpdateInput = z.infer<typeof updateQuestionSchema>;
export type SubmitAssessmentInput = z.infer<typeof submitAssessmentSchema>;
