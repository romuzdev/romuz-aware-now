/**
 * LMS Progress Types
 */

import type { Database } from '@/integrations/supabase/types';

export type ProgressRow = Database['public']['Tables']['lms_progress']['Row'];
export type ProgressInsert = Database['public']['Tables']['lms_progress']['Insert'];
export type ProgressUpdate = Database['public']['Tables']['lms_progress']['Update'];

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface Progress extends ProgressRow {}

export interface UserProgress {
  enrollment_id: string;
  course_id: string;
  course_name: string;
  progress_percentage: number;
  completed_lessons: number;
  total_lessons: number;
  time_spent_seconds: number;
  last_accessed_at?: string;
  status: ProgressStatus;
}

export interface UpdateProgressInput {
  enrollment_id: string;
  lesson_id: string;
  status: ProgressStatus;
  time_spent_seconds?: number;
  metadata?: Record<string, any>;
}
