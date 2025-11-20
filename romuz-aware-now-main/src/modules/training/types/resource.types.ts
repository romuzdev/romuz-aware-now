/**
 * LMS Resources Types
 */

import type { Database } from '@/integrations/supabase/types';

export type ResourceRow = Database['public']['Tables']['lms_course_resources']['Row'];
export type ResourceInsert = Database['public']['Tables']['lms_course_resources']['Insert'];
export type ResourceUpdate = Database['public']['Tables']['lms_course_resources']['Update'];

export type ResourceType = 'document' | 'video' | 'link' | 'attachment';

export interface Resource extends ResourceRow {}

export interface CreateResourceInput {
  course_id: string;
  module_id?: string;
  name: string;
  description?: string;
  resource_type: ResourceType;
  file_url: string;
  file_size_bytes?: number;
  mime_type?: string;
  is_downloadable?: boolean;
  position?: number;
}

export type UpdateResourceInput = Partial<Omit<CreateResourceInput, 'course_id'>>;
