/**
 * LMS Certificates Types
 */

import type { Database } from '@/integrations/supabase/types';

export type CertificateRow = Database['public']['Tables']['lms_certificates']['Row'];
export type CertificateInsert = Database['public']['Tables']['lms_certificates']['Insert'];
export type CertificateUpdate = Database['public']['Tables']['lms_certificates']['Update'];

export interface Certificate extends CertificateRow {
  course?: {
    id: string;
    name: string;
    code: string;
  };
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
  is_revoked?: boolean;
}

export interface CertificateTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  header_text: string;
  body_template: string;
  footer_text?: string;
  signature_fields?: Record<string, any>;
  is_default: boolean;
  validity_days?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCertificateInput {
  enrollment_id: string;
  course_id: string;
  user_id: string;
  certificate_number: string;
  template_id?: string;
  certificate_data: Record<string, any>;
  expires_at?: string;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  header_text: string;
  body_template: string;
  footer_text?: string;
  signature_fields?: Record<string, any>;
  is_default?: boolean;
  validity_days?: number;
}

export type UpdateTemplateInput = Partial<CreateTemplateInput>;
