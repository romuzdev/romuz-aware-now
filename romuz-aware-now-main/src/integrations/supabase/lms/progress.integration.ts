/**
 * LMS Progress Integration
 * 
 * Handles all database operations for lesson progress tracking
 */

import { supabase } from '@/integrations/supabase/client';

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

export interface LessonProgress {
  id: string;
  tenant_id: string;
  enrollment_id: string;
  lesson_id: string;
  status: ProgressStatus;
  started_at?: string;
  completed_at?: string;
  time_spent_minutes: number;
  attempts: number;
  score?: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UpdateProgressInput {
  status?: ProgressStatus;
  started_at?: string;
  completed_at?: string;
  time_spent_minutes?: number;
  attempts?: number;
  score?: number;
  metadata?: Record<string, any>;
}

/**
 * Fetch progress for an enrollment
 */
export async function fetchEnrollmentProgress(enrollmentId: string): Promise<LessonProgress[]> {
  const { data, error } = await supabase
    .from('lms_lesson_progress')
    .select('*')
    .eq('enrollment_id', enrollmentId);

  if (error) throw error;
  return data || [];
}

/**
 * Fetch progress for a specific lesson
 */
export async function fetchLessonProgress(
  enrollmentId: string,
  lessonId: string
): Promise<LessonProgress | null> {
  const { data, error } = await supabase
    .from('lms_lesson_progress')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Update or create lesson progress
 */
export async function updateLessonProgress(
  enrollmentId: string,
  lessonId: string,
  input: UpdateProgressInput
): Promise<LessonProgress> {
  // Try to update existing progress
  const existing = await fetchLessonProgress(enrollmentId, lessonId);

  if (existing) {
    const { data, error } = await supabase
      .from('lms_lesson_progress')
      .update(input)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Create new progress record
  const { data, error } = await supabase
    .from('lms_lesson_progress')
    .insert({
      enrollment_id: enrollmentId,
      lesson_id: lessonId,
      ...input,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark lesson as completed
 */
export async function completeLesson(
  enrollmentId: string,
  lessonId: string,
  score?: number
): Promise<LessonProgress> {
  return updateLessonProgress(enrollmentId, lessonId, {
    status: 'completed',
    completed_at: new Date().toISOString(),
    score,
  });
}

/**
 * Mark lesson as started
 */
export async function startLesson(
  enrollmentId: string,
  lessonId: string
): Promise<LessonProgress> {
  return updateLessonProgress(enrollmentId, lessonId, {
    status: 'in_progress',
    started_at: new Date().toISOString(),
  });
}

/**
 * Increment time spent on a lesson
 */
export async function addTimeSpent(
  enrollmentId: string,
  lessonId: string,
  minutes: number
): Promise<LessonProgress> {
  const existing = await fetchLessonProgress(enrollmentId, lessonId);
  const currentTime = existing?.time_spent_minutes || 0;

  return updateLessonProgress(enrollmentId, lessonId, {
    time_spent_minutes: currentTime + minutes,
  });
}
