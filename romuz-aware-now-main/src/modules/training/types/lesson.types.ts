/**
 * LMS Lessons Types
 */

import type { Database } from '@/integrations/supabase/types';

export type LessonRow = Database['public']['Tables']['lms_course_lessons']['Row'];
export type LessonInsert = Database['public']['Tables']['lms_course_lessons']['Insert'];
export type LessonUpdate = Database['public']['Tables']['lms_course_lessons']['Update'];

export type ContentType = 'text' | 'video' | 'pdf' | 'scorm' | 'interactive';

export interface Lesson extends LessonRow {
  isCompleted?: boolean;
  userProgress?: {
    status: 'not_started' | 'in_progress' | 'completed';
    time_spent_seconds: number;
    last_accessed_at?: string;
  };
}

export interface CreateLessonInput {
  module_id: string;
  course_id: string;
  name: string;
  content_type: ContentType;
  content?: string;
  content_url?: string;
  position: number;
  estimated_minutes?: number;
  is_required?: boolean;
  metadata?: Record<string, any>;
}

export type UpdateLessonInput = Partial<Omit<CreateLessonInput, 'module_id' | 'course_id'>>;
