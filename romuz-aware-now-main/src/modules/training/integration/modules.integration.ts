/**
 * LMS Course Modules Integration Layer
 */

import { supabase } from '@/integrations/supabase/client';
import type { CourseModule, CreateModuleInput, UpdateModuleInput } from '../types';

export async function fetchModulesByCourse(courseId: string): Promise<CourseModule[]> {
  const { data, error } = await supabase
    .from('lms_course_modules')
    .select(`
      *,
      lessons:lms_course_lessons(count)
    `)
    .eq('course_id', courseId)
    .order('position', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchModuleById(id: string): Promise<CourseModule | null> {
  const { data, error } = await supabase
    .from('lms_course_modules')
    .select(`
      *,
      lessons:lms_course_lessons(*)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createModule(input: CreateModuleInput): Promise<CourseModule> {
  const { data, error } = await supabase
    .from('lms_course_modules')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateModule(id: string, input: UpdateModuleInput): Promise<CourseModule> {
  const { data, error } = await supabase
    .from('lms_course_modules')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteModule(id: string): Promise<void> {
  const { error } = await supabase
    .from('lms_course_modules')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function reorderModules(
  courseId: string,
  modules: Array<{ id: string; position: number }>
): Promise<void> {
  const updates = modules.map(m => 
    supabase
      .from('lms_course_modules')
      .update({ position: m.position })
      .eq('id', m.id)
      .eq('course_id', courseId)
  );

  const results = await Promise.all(updates);
  const errors = results.filter(r => r.error);
  
  if (errors.length > 0) {
    throw new Error('Failed to reorder modules');
  }
}
