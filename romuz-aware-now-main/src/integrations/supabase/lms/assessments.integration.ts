/**
 * LMS Assessments Integration
 * 
 * Handles all database operations for assessments and attempts
 */

import { supabase } from '@/integrations/supabase/client';

export type AssessmentType = 'quiz' | 'exam' | 'assignment' | 'survey';
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'matching';
export type AttemptStatus = 'in_progress' | 'submitted' | 'graded' | 'abandoned';

export interface Assessment {
  id: string;
  tenant_id: string;
  course_id: string;
  title: string;
  description?: string;
  assessment_type: AssessmentType;
  time_limit_minutes?: number;
  passing_score: number;
  max_attempts?: number;
  randomize_questions: boolean;
  show_correct_answers: boolean;
  is_required: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface AssessmentQuestion {
  id: string;
  tenant_id: string;
  assessment_id: string;
  question_text: string;
  question_type: QuestionType;
  options?: any[];
  correct_answer?: any;
  points: number;
  position: number;
  explanation?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AssessmentAttempt {
  id: string;
  tenant_id: string;
  enrollment_id: string;
  assessment_id: string;
  attempt_number: number;
  status: AttemptStatus;
  started_at: string;
  submitted_at?: string;
  graded_at?: string;
  score?: number;
  passed?: boolean;
  answers?: Record<string, any>;
  time_spent_minutes: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateAssessmentInput {
  course_id: string;
  title: string;
  description?: string;
  assessment_type?: AssessmentType;
  time_limit_minutes?: number;
  passing_score?: number;
  max_attempts?: number;
  randomize_questions?: boolean;
  show_correct_answers?: boolean;
  is_required?: boolean;
  metadata?: Record<string, any>;
}

export interface CreateQuestionInput {
  assessment_id: string;
  question_text: string;
  question_type: QuestionType;
  options?: any[];
  correct_answer?: any;
  points?: number;
  position: number;
  explanation?: string;
  metadata?: Record<string, any>;
}

export interface CreateAttemptInput {
  enrollment_id: string;
  assessment_id: string;
  attempt_number: number;
}

/**
 * Fetch assessments for a course
 */
export async function fetchCourseAssessments(courseId: string): Promise<Assessment[]> {
  const { data, error } = await supabase
    .from('lms_assessments')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch a single assessment
 */
export async function fetchAssessmentById(id: string): Promise<Assessment | null> {
  const { data, error } = await supabase
    .from('lms_assessments')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Fetch questions for an assessment
 */
export async function fetchAssessmentQuestions(assessmentId: string): Promise<AssessmentQuestion[]> {
  const { data, error } = await supabase
    .from('lms_assessment_questions')
    .select('*')
    .eq('assessment_id', assessmentId)
    .order('position', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch attempts for an enrollment
 */
export async function fetchEnrollmentAttempts(enrollmentId: string): Promise<AssessmentAttempt[]> {
  const { data, error } = await supabase
    .from('lms_assessment_attempts')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .order('started_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch attempts for a specific assessment
 */
export async function fetchAssessmentAttempts(
  enrollmentId: string,
  assessmentId: string
): Promise<AssessmentAttempt[]> {
  const { data, error } = await supabase
    .from('lms_assessment_attempts')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .eq('assessment_id', assessmentId)
    .order('attempt_number', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Create a new assessment
 */
export async function createAssessment(input: CreateAssessmentInput): Promise<Assessment> {
  const { data, error } = await supabase
    .from('lms_assessments')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a new question
 */
export async function createQuestion(input: CreateQuestionInput): Promise<AssessmentQuestion> {
  const { data, error } = await supabase
    .from('lms_assessment_questions')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Start a new assessment attempt
 */
export async function createAttempt(input: CreateAttemptInput): Promise<AssessmentAttempt> {
  const { data, error } = await supabase
    .from('lms_assessment_attempts')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an assessment attempt
 */
export async function updateAttempt(
  attemptId: string,
  updates: Partial<AssessmentAttempt>
): Promise<AssessmentAttempt> {
  const { data, error } = await supabase
    .from('lms_assessment_attempts')
    .update(updates)
    .eq('id', attemptId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Submit an assessment attempt
 */
export async function submitAttempt(
  attemptId: string,
  answers: Record<string, any>,
  score?: number
): Promise<AssessmentAttempt> {
  return updateAttempt(attemptId, {
    status: 'submitted',
    submitted_at: new Date().toISOString(),
    answers,
    score,
  });
}

/**
 * Delete an assessment
 */
export async function deleteAssessment(id: string): Promise<void> {
  const { error } = await supabase
    .from('lms_assessments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Delete a question
 */
export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('lms_assessment_questions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
