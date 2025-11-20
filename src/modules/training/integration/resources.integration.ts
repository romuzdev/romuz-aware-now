/**
 * LMS Resources Integration Layer
 */

import { supabase } from '@/integrations/supabase/client';
import type { Resource, CreateResourceInput, UpdateResourceInput } from '../types';

export async function fetchResourcesByCourse(courseId: string): Promise<Resource[]> {
  const { data, error } = await supabase
    .from('lms_course_resources')
    .select('*')
    .eq('course_id', courseId)
    .order('position', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchResourceById(id: string): Promise<Resource | null> {
  const { data, error } = await supabase
    .from('lms_course_resources')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createResource(input: CreateResourceInput): Promise<Resource> {
  const { data, error } = await supabase
    .from('lms_course_resources')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateResource(id: string, input: UpdateResourceInput): Promise<Resource> {
  const { data, error } = await supabase
    .from('lms_course_resources')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteResource(id: string): Promise<void> {
  const { error } = await supabase
    .from('lms_course_resources')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}
