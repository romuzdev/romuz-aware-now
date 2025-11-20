/**
 * LMS Courses Integration
 * 
 * Handles all database operations for LMS courses
 */

import { supabase } from '@/integrations/supabase/client';

export interface Course {
  id: string;
  tenant_id: string;
  code: string;
  title: string;
  description: string | null;
  category: string | null;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'published' | 'archived';
  thumbnail_url: string | null;
  estimated_duration_minutes: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

// Lesson interface moved to lessons.integration.ts

/**
 * Fetch all courses for the current tenant
 */
export async function fetchCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('lms_courses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch a single course by ID
 */
export async function fetchCourseById(courseId: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from('lms_courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a new course
 */
export async function createCourse(course: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<Course> {
  const { data, error } = await supabase
    .from('lms_courses')
    .insert(course)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a course
 */
export async function updateCourse(courseId: string, updates: Partial<Course>): Promise<Course> {
  const { data, error } = await supabase
    .from('lms_courses')
    .update(updates)
    .eq('id', courseId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a course
 */
export async function deleteCourse(courseId: string): Promise<void> {
  const { error } = await supabase
    .from('lms_courses')
    .delete()
    .eq('id', courseId);

  if (error) throw error;
}

/**
 * Fetch modules for a course
 */
export async function fetchCourseModules(courseId: string): Promise<CourseModule[]> {
  const { data, error } = await supabase
    .from('lms_modules')
    .select('*')
    .eq('course_id', courseId)
    .order('position', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Create a new module
 */
export async function createModule(module: Omit<CourseModule, 'id' | 'created_at' | 'updated_at'>): Promise<CourseModule> {
  const { data, error } = await supabase
    .from('lms_modules')
    .insert(module)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a module
 */
export async function updateModule(moduleId: string, updates: Partial<CourseModule>): Promise<CourseModule> {
  const { data, error } = await supabase
    .from('lms_modules')
    .update(updates)
    .eq('id', moduleId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a module
 */
export async function deleteModule(moduleId: string): Promise<void> {
  const { error } = await supabase
    .from('lms_modules')
    .delete()
    .eq('id', moduleId);

  if (error) throw error;
}
