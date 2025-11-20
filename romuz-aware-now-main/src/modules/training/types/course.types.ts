/**
 * LMS Courses Types
 */

import type { Database } from '@/integrations/supabase/types';
import type { Category } from './category.types';
import type { CourseModule } from './module.types';

export type CourseRow = Database['public']['Tables']['lms_courses']['Row'];
export type CourseInsert = Database['public']['Tables']['lms_courses']['Insert'];
export type CourseUpdate = Database['public']['Tables']['lms_courses']['Update'];

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseStatus = 'draft' | 'published' | 'archived';

export interface Course extends CourseRow {
  category?: Category;
  instructor?: {
    id: string;
    full_name: string;
    email: string;
  };
  modules?: CourseModule[];
  enrollmentCount?: number;
  completionRate?: number;
  averageScore?: number;
}

export interface CourseStats {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  averageProgress: number;
  averageScore: number;
  completionRate: number;
}

export interface CourseFilters {
  status?: CourseStatus;
  category_id?: string;
  instructor_id?: string;
  level?: CourseLevel;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface CreateCourseInput {
  code: string;
  name: string;
  description?: string;
  category_id: string;
  instructor_id: string;
  level: CourseLevel;
  duration_hours: number;
  thumbnail_url?: string;
  status?: CourseStatus;
  metadata?: Record<string, any>;
}

export type UpdateCourseInput = Partial<CreateCourseInput>;
