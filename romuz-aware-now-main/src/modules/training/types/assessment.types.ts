/**
 * LMS Assessments Types
 */

import type { Database } from '@/integrations/supabase/types';

export type AssessmentRow = Database['public']['Tables']['lms_assessments']['Row'];
export type AssessmentInsert = Database['public']['Tables']['lms_assessments']['Insert'];
export type AssessmentUpdate = Database['public']['Tables']['lms_assessments']['Update'];

export type AssessmentType = 'quiz' | 'exam' | 'assignment' | 'survey';

export interface Assessment extends AssessmentRow {
  attemptCount?: number;
  averageScore?: number;
}

export interface Question {
  id: string;
  assessment_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  points: number;
  position: number;
  options?: Array<{ text: string; is_correct: boolean }>;
  correct_answer?: string;
  explanation?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AssessmentAttempt {
  id: string;
  assessment_id: string;
  user_id: string;
  enrollment_id: string;
  score?: number;
  percentage?: number;
  passed: boolean;
  started_at: string;
  submitted_at?: string;
  time_spent_seconds?: number;
  answers: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface CreateAssessmentInput {
  course_id: string;
  name: string;
  description?: string;
  assessment_type: AssessmentType;
  passing_score?: number;
  time_limit_minutes?: number;
  max_attempts?: number;
  randomize_questions?: boolean;
  show_correct_answers?: boolean;
  available_from?: string;
  available_until?: string;
  is_required?: boolean;
  position?: number;
  metadata?: Record<string, any>;
}

export type UpdateAssessmentInput = Partial<Omit<CreateAssessmentInput, 'course_id'>>;

export interface CreateQuestionInput {
  assessment_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  points: number;
  position: number;
  options?: Array<{ text: string; is_correct: boolean }>;
  correct_answer?: string;
  explanation?: string;
  metadata?: Record<string, any>;
}

export type UpdateQuestionInput = Partial<Omit<CreateQuestionInput, 'assessment_id'>>;

export interface SubmitAssessmentInput {
  assessment_id: string;
  answers: Record<string, any>;
}
