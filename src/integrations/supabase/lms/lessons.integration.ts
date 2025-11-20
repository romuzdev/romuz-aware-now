/**
 * LMS Lessons Integration
 * 
 * Handles all database operations for course lessons
 */

import { supabase } from '@/integrations/supabase/client';

export type LessonContentType = 'video' | 'document' | 'quiz' | 'scorm' | 'text' | 'interactive';

export interface Lesson {
  id: string;
  tenant_id: string;
  module_id: string;
  title: string;
  description?: string;
  content_type: LessonContentType;
  content_url?: string;
  content_data?: Record<string, any>;
  duration_minutes: number;
  position: number;
  is_required: boolean;
  passing_score?: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateLessonInput {
  module_id: string;
  title: string;
  description?: string;
  content_type: LessonContentType;
  content_url?: string;
  content_data?: Record<string, any>;
  duration_minutes?: number;
  position: number;
  is_required?: boolean;
  passing_score?: number;
  metadata?: Record<string, any>;
}

export type UpdateLessonInput = Partial<Omit<CreateLessonInput, 'module_id'>>;

/**
 * Fetch lessons for a module
 */
export async function fetchLessonsByModule(moduleId: string): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lms_course_lessons')
    .select('*')
    .eq('module_id', moduleId)
    .order('position', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch a single lesson by ID
 */
export async function fetchLessonById(id: string): Promise<Lesson | null> {
  const { data, error } = await supabase
    .from('lms_course_lessons')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Create a new lesson
 */
export async function createLesson(input: CreateLessonInput): Promise<Lesson> {
  const { data, error } = await supabase
    .from('lms_course_lessons')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing lesson
 */
export async function updateLesson(id: string, input: UpdateLessonInput): Promise<Lesson> {
  const { data, error } = await supabase
    .from('lms_course_lessons')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a lesson
 */
export async function deleteLesson(id: string): Promise<void> {
  const { error } = await supabase
    .from('lms_course_lessons')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Reorder lessons within a module
 */
export async function reorderLessons(
  moduleId: string,
  lessons: Array<{ id: string; position: number }>
): Promise<void> {
  const updates = lessons.map(({ id, position }) =>
    supabase
      .from('lms_course_lessons')
      .update({ position })
      .eq('id', id)
      .eq('module_id', moduleId)
  );

  const results = await Promise.all(updates);
  const errors = results.filter(r => r.error);
  
  if (errors.length > 0) {
    throw errors[0].error;
  }
}
