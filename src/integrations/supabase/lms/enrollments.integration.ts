/**
 * LMS Enrollments Integration
 * 
 * Handles all database operations for course enrollments
 */

import { supabase } from '@/integrations/supabase/client';

export type EnrollmentStatus = 'active' | 'completed' | 'dropped' | 'suspended';

export interface Enrollment {
  id: string;
  tenant_id: string;
  course_id: string;
  user_id: string;
  status: EnrollmentStatus;
  enrolled_at: string;
  started_at?: string;
  completed_at?: string;
  progress_percent: number;
  score?: number;
  certificate_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateEnrollmentInput {
  course_id: string;
  user_id: string;
  status?: EnrollmentStatus;
  metadata?: Record<string, any>;
}

export interface UpdateEnrollmentInput {
  status?: EnrollmentStatus;
  started_at?: string;
  completed_at?: string;
  progress_percent?: number;
  score?: number;
  certificate_id?: string;
  metadata?: Record<string, any>;
}

/**
 * Fetch enrollments for a user
 */
export async function fetchUserEnrollments(userId: string): Promise<Enrollment[]> {
  const { data, error } = await supabase
    .from('lms_enrollments')
    .select('*')
    .eq('user_id', userId)
    .order('enrolled_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch enrollments for a course
 */
export async function fetchCourseEnrollments(courseId: string): Promise<Enrollment[]> {
  const { data, error } = await supabase
    .from('lms_enrollments')
    .select('*')
    .eq('course_id', courseId)
    .order('enrolled_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch a single enrollment
 */
export async function fetchEnrollmentById(id: string): Promise<Enrollment | null> {
  const { data, error } = await supabase
    .from('lms_enrollments')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Check if user is enrolled in a course
 */
export async function checkEnrollment(userId: string, courseId: string): Promise<Enrollment | null> {
  const { data, error } = await supabase
    .from('lms_enrollments')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Create a new enrollment
 */
export async function createEnrollment(input: CreateEnrollmentInput): Promise<Enrollment> {
  const { data, error } = await supabase
    .from('lms_enrollments')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an enrollment
 */
export async function updateEnrollment(id: string, input: UpdateEnrollmentInput): Promise<Enrollment> {
  const { data, error } = await supabase
    .from('lms_enrollments')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete an enrollment
 */
export async function deleteEnrollment(id: string): Promise<void> {
  const { error } = await supabase
    .from('lms_enrollments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
