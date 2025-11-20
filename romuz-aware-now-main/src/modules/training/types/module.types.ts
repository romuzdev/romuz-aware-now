/**
 * LMS Course Modules Types
 */

import type { Database } from '@/integrations/supabase/types';
import type { Lesson } from './lesson.types';

export type ModuleRow = Database['public']['Tables']['lms_course_modules']['Row'];
export type ModuleInsert = Database['public']['Tables']['lms_course_modules']['Insert'];
export type ModuleUpdate = Database['public']['Tables']['lms_course_modules']['Update'];

export interface CourseModule extends ModuleRow {
  lessons?: Lesson[];
  completedLessons?: number;
  totalLessons?: number;
}

export interface CreateModuleInput {
  course_id: string;
  name: string;
  description?: string;
  position: number;
  estimated_minutes?: number;
  is_required?: boolean;
  metadata?: Record<string, any>;
}

export type UpdateModuleInput = Partial<Omit<CreateModuleInput, 'course_id'>>;
