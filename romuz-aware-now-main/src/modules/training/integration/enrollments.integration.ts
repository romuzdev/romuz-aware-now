/**
 * LMS Enrollments Integration Layer
 */

import { supabase } from '@/integrations/supabase/client';
import type { 
  Enrollment, 
  EnrollmentFilters, 
  CreateEnrollmentInput,
  BulkEnrollmentInput,
  BulkEnrollmentResult
} from '../types';

export async function fetchEnrollments(filters?: EnrollmentFilters): Promise<Enrollment[]> {
  let query = supabase
    .from('lms_enrollments')
    .select(`
      *,
      course:lms_courses(id, code, name, thumbnail_url)
    `)
    .order('enrolled_at', { ascending: false });

  if (filters?.course_id) {
    query = query.eq('course_id', filters.course_id);
  }

  if (filters?.user_id) {
    query = query.eq('user_id', filters.user_id);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.enrollment_type) {
    query = query.eq('enrollment_type', filters.enrollment_type);
  }

  if (filters?.overdue) {
    query = query.lt('due_date', new Date().toISOString());
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchEnrollmentById(id: string): Promise<Enrollment | null> {
  const { data, error } = await supabase
    .from('lms_enrollments')
    .select(`
      *,
      course:lms_courses(*)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createEnrollment(input: CreateEnrollmentInput): Promise<Enrollment> {
  const { data, error } = await supabase
    .from('lms_enrollments')
    .insert({
      ...input,
      enrolled_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function bulkEnroll(input: BulkEnrollmentInput): Promise<BulkEnrollmentResult> {
  const enrollments = input.user_ids.map(user_id => ({
    course_id: input.course_id,
    user_id,
    enrollment_type: input.enrollment_type || 'assigned',
    due_date: input.due_date,
    enrolled_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('lms_enrollments')
    .insert(enrollments)
    .select();

  const result: BulkEnrollmentResult = {
    total: input.user_ids.length,
    success: data?.length || 0,
    failed: error ? input.user_ids.length : 0,
  };

  if (error) {
    result.errors = [{ user_id: 'bulk', error: error.message }];
  }

  return result;
}

export async function unenrollUser(enrollmentId: string): Promise<void> {
  const { error } = await supabase
    .from('lms_enrollments')
    .update({ status: 'withdrawn' })
    .eq('id', enrollmentId);

  if (error) throw new Error(error.message);
}

export async function calculateProgress(enrollmentId: string): Promise<number> {
  const { data: enrollment } = await supabase
    .from('lms_enrollments')
    .select('course_id')
    .eq('id', enrollmentId)
    .single();

  if (!enrollment) return 0;

  const { count: totalLessons } = await supabase
    .from('lms_course_lessons')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', enrollment.course_id);

  const { count: completedLessons } = await supabase
    .from('lms_progress')
    .select('*', { count: 'exact', head: true })
    .eq('enrollment_id', enrollmentId)
    .eq('status', 'completed');

  if (!totalLessons || totalLessons === 0) return 0;

  return Math.round((completedLessons || 0) / totalLessons * 100);
}

export async function fetchMyEnrollments(): Promise<Enrollment[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  return fetchEnrollments({ user_id: user.id });
}

export async function fetchCourseEnrollments(courseId: string): Promise<Enrollment[]> {
  return fetchEnrollments({ course_id: courseId });
}

export async function enrollInCourse(courseId: string): Promise<Enrollment> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  return createEnrollment({
    course_id: courseId,
    user_id: user.id,
    enrollment_type: 'self',
  });
}

export async function updateEnrollmentProgress(
  enrollmentId: string,
  lessonId: string,
  status: 'not_started' | 'in_progress' | 'completed',
  timeSpent?: number
): Promise<void> {
  const { data: enrollment } = await supabase
    .from('lms_enrollments')
    .select('course_id, user_id')
    .eq('id', enrollmentId)
    .single();

  if (!enrollment) throw new Error('Enrollment not found');

  // Update or create progress record
  const { data: existing } = await supabase
    .from('lms_progress')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('lms_progress')
      .update({
        status,
        time_spent_seconds: timeSpent 
          ? existing.time_spent_seconds + timeSpent 
          : existing.time_spent_seconds,
        last_accessed_at: new Date().toISOString(),
        completed_at: status === 'completed' ? new Date().toISOString() : existing.completed_at,
      })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('lms_progress')
      .insert({
        enrollment_id: enrollmentId,
        lesson_id: lessonId,
        course_id: enrollment.course_id,
        user_id: enrollment.user_id,
        status,
        time_spent_seconds: timeSpent || 0,
        last_accessed_at: new Date().toISOString(),
        completed_at: status === 'completed' ? new Date().toISOString() : null,
      });
  }

  // Update enrollment progress percentage
  const progress = await calculateProgress(enrollmentId);
  await supabase
    .from('lms_enrollments')
    .update({ progress_percentage: progress })
    .eq('id', enrollmentId);
}

export async function completeEnrollment(enrollmentId: string): Promise<void> {
  const { error } = await supabase
    .from('lms_enrollments')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      progress_percentage: 100,
    })
    .eq('id', enrollmentId);

  if (error) throw new Error(error.message);
}
