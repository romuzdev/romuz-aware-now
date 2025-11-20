/**
 * LMS Enrollments Types
 */

import type { Database } from '@/integrations/supabase/types';
import type { Course } from './course.types';

export type EnrollmentRow = Database['public']['Tables']['lms_enrollments']['Row'];
export type EnrollmentInsert = Database['public']['Tables']['lms_enrollments']['Insert'];
export type EnrollmentUpdate = Database['public']['Tables']['lms_enrollments']['Update'];

export type EnrollmentType = 'self' | 'assigned' | 'mandatory';
export type EnrollmentStatus = 'enrolled' | 'in_progress' | 'completed' | 'withdrawn';

export interface Enrollment extends EnrollmentRow {
  course?: Course;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
  enrolled_by_user?: {
    id: string;
    full_name: string;
  };
}

export interface EnrollmentFilters {
  course_id?: string;
  user_id?: string;
  status?: EnrollmentStatus;
  enrollment_type?: EnrollmentType;
  date_from?: string;
  date_to?: string;
  overdue?: boolean;
}

export interface CreateEnrollmentInput {
  course_id: string;
  user_id: string;
  enrollment_type?: EnrollmentType;
  due_date?: string;
  metadata?: Record<string, any>;
}

export interface BulkEnrollmentInput {
  course_id: string;
  user_ids: string[];
  enrollment_type?: EnrollmentType;
  due_date?: string;
}

export interface BulkEnrollmentResult {
  total: number;
  success: number;
  failed: number;
  errors?: Array<{
    user_id: string;
    error: string;
  }>;
}
