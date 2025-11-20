/**
 * LMS Lessons Integration Layer
 */

import { supabase } from '@/integrations/supabase/client';
import type { Lesson, CreateLessonInput, UpdateLessonInput } from '../types';

export async function fetchLessonsByModule(moduleId: string): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lms_course_lessons')
    .select('*')
    .eq('module_id', moduleId)
    .order('position', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchLessonById(id: string): Promise<Lesson | null> {
  const { data, error } = await supabase
    .from('lms_course_lessons')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createLesson(input: CreateLessonInput): Promise<Lesson> {
  const { data, error } = await supabase
    .from('lms_course_lessons')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateLesson(id: string, input: UpdateLessonInput): Promise<Lesson> {
  const { data, error } = await supabase
    .from('lms_course_lessons')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteLesson(id: string): Promise<void> {
  const { error } = await supabase
    .from('lms_course_lessons')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function reorderLessons(
  moduleId: string,
  lessons: Array<{ id: string; position: number }>
): Promise<void> {
  const updates = lessons.map(l => 
    supabase
      .from('lms_course_lessons')
      .update({ position: l.position })
      .eq('id', l.id)
      .eq('module_id', moduleId)
  );

  const results = await Promise.all(updates);
  const errors = results.filter(r => r.error);
  
  if (errors.length > 0) {
    throw new Error('Failed to reorder lessons');
  }
}
