/**
 * LMS Progress Integration Layer
 */

import { supabase } from '@/integrations/supabase/client';
import type { Progress, UpdateProgressInput, UserProgress } from '../types';

export async function fetchProgressByEnrollment(enrollmentId: string): Promise<Progress[]> {
  const { data, error } = await supabase
    .from('lms_progress')
    .select('*')
    .eq('enrollment_id', enrollmentId);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchUserProgress(userId: string): Promise<UserProgress[]> {
  const { data, error } = await supabase
    .from('vw_lms_user_progress')
    .select('*')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function updateProgress(input: UpdateProgressInput): Promise<Progress> {
  const { enrollment_id, lesson_id, status, time_spent_seconds, metadata } = input;

  // Check if progress record exists
  const { data: existing } = await supabase
    .from('lms_progress')
    .select('*')
    .eq('enrollment_id', enrollment_id)
    .eq('lesson_id', lesson_id)
    .maybeSingle();

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('lms_progress')
      .update({
        status,
        time_spent_seconds: time_spent_seconds 
          ? existing.time_spent_seconds + time_spent_seconds 
          : existing.time_spent_seconds,
        last_accessed_at: new Date().toISOString(),
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        metadata,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  } else {
    // Create new
    const { data: enrollment } = await supabase
      .from('lms_enrollments')
      .select('course_id, user_id')
      .eq('id', enrollment_id)
      .single();

    if (!enrollment) throw new Error('Enrollment not found');

    const { data, error } = await supabase
      .from('lms_progress')
      .insert({
        enrollment_id,
        lesson_id,
        course_id: enrollment.course_id,
        user_id: enrollment.user_id,
        status,
        time_spent_seconds: time_spent_seconds || 0,
        last_accessed_at: new Date().toISOString(),
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        metadata,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}

export async function markLessonComplete(
  enrollmentId: string, 
  lessonId: string
): Promise<Progress> {
  return updateProgress({
    enrollment_id: enrollmentId,
    lesson_id: lessonId,
    status: 'completed',
  });
}

export async function fetchLessonProgress(
  enrollmentId: string,
  lessonId: string
): Promise<Progress | null> {
  const { data, error } = await supabase
    .from('lms_progress')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function fetchModuleProgress(
  enrollmentId: string,
  moduleId: string
): Promise<Progress[]> {
  const { data: lessons } = await supabase
    .from('lms_course_lessons')
    .select('id')
    .eq('module_id', moduleId);

  if (!lessons || lessons.length === 0) return [];

  const lessonIds = lessons.map(l => l.id);

  const { data, error } = await supabase
    .from('lms_progress')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .in('lesson_id', lessonIds);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchCourseProgress(enrollmentId: string): Promise<Progress[]> {
  return fetchProgressByEnrollment(enrollmentId);
}

export async function updateLessonProgress(input: UpdateProgressInput): Promise<Progress> {
  return updateProgress(input);
}
