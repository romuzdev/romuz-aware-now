/**
 * LMS Assessments Integration Layer
 */

import { supabase } from '@/integrations/supabase/client';
import type { Assessment, CreateAssessmentInput, UpdateAssessmentInput } from '../types';

export async function fetchAssessmentsByCourse(courseId: string): Promise<Assessment[]> {
  const { data, error } = await supabase
    .from('lms_assessments')
    .select('*')
    .eq('course_id', courseId)
    .order('position', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchAssessmentById(id: string): Promise<Assessment | null> {
  const { data, error } = await supabase
    .from('lms_assessments')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createAssessment(input: CreateAssessmentInput): Promise<Assessment> {
  const { data, error } = await supabase
    .from('lms_assessments')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateAssessment(
  id: string, 
  input: UpdateAssessmentInput
): Promise<Assessment> {
  const { data, error } = await supabase
    .from('lms_assessments')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteAssessment(id: string): Promise<void> {
  const { error } = await supabase
    .from('lms_assessments')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// Questions Management
export async function fetchAssessmentQuestions(assessmentId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('lms_assessment_questions')
    .select('*')
    .eq('assessment_id', assessmentId)
    .order('position', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function addQuestion(input: any): Promise<any> {
  const { data, error } = await supabase
    .from('lms_assessment_questions')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateQuestion(id: string, input: any): Promise<any> {
  const { data, error } = await supabase
    .from('lms_assessment_questions')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('lms_assessment_questions')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// Assessment Attempts
export async function fetchAssessmentAttempts(assessmentId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('lms_assessment_attempts')
    .select('*')
    .eq('assessment_id', assessmentId)
    .order('started_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchAttemptById(attemptId: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('lms_assessment_attempts')
    .select('*')
    .eq('id', attemptId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function submitAssessment(input: any): Promise<any> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Create attempt record
  const { data, error } = await supabase
    .from('lms_assessment_attempts')
    .insert({
      assessment_id: input.assessment_id,
      user_id: user.id,
      answers: input.answers,
      started_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
