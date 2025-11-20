/**
 * LMS Courses Integration Layer
 * Gate-K Standard: D1 + Zod Validation
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  Course, 
  CourseFilters, 
  CreateCourseInput, 
  UpdateCourseInput,
  CourseStats 
} from '../types';
import { 
  createCourseSchema, 
  updateCourseSchema 
} from '../types/course.types.validation';

export async function fetchCourses(filters?: CourseFilters): Promise<Course[]> {
  let query = supabase
    .from('lms_courses')
    .select(`
      *,
      category:lms_categories(id, name),
      modules:lms_course_modules(count)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id);
  }

  if (filters?.instructor_id) {
    query = query.eq('instructor_id', filters.instructor_id);
  }

  if (filters?.level) {
    query = query.eq('level', filters.level);
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
  }

  if (filters?.date_from) {
    query = query.gte('created_at', filters.date_from);
  }

  if (filters?.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchCourseById(id: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from('lms_courses')
    .select(`
      *,
      category:lms_categories(id, name),
      modules:lms_course_modules(
        *,
        lessons:lms_course_lessons(*)
      )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createCourse(input: CreateCourseInput): Promise<Course> {
  // Validate input with Zod
  const validated = createCourseSchema.parse(input);
  
  const { data, error } = await supabase
    .from('lms_courses')
    .insert(validated)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateCourse(id: string, input: UpdateCourseInput): Promise<Course> {
  // Validate input with Zod
  const validated = updateCourseSchema.parse(input);
  
  const { data, error } = await supabase
    .from('lms_courses')
    .update(validated)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteCourse(id: string): Promise<void> {
  const { error } = await supabase
    .from('lms_courses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function publishCourse(id: string): Promise<Course> {
  return updateCourse(id, { status: 'published' });
}

export async function archiveCourse(id: string): Promise<Course> {
  return updateCourse(id, { status: 'archived' });
}

export async function fetchCourseStats(courseId: string): Promise<CourseStats> {
  const { data, error } = await supabase
    .from('vw_lms_course_stats')
    .select('*')
    .eq('course_id', courseId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  
  return data || {
    totalEnrollments: 0,
    activeEnrollments: 0,
    completedEnrollments: 0,
    averageProgress: 0,
    averageScore: 0,
    completionRate: 0,
  };
}
