/**
 * LMS Certificates Integration
 * 
 * Handles all database operations for certificates and templates
 */

import { supabase } from '@/integrations/supabase/client';

export interface CertificateTemplate {
  id: string;
  tenant_id: string;
  name: string;
  design_json: Record<string, any>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface Certificate {
  id: string;
  tenant_id: string;
  enrollment_id: string;
  template_id?: string;
  certificate_number: string;
  issued_at: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface CreateTemplateInput {
  name: string;
  design_json: Record<string, any>;
  is_default?: boolean;
}

export interface CreateCertificateInput {
  enrollment_id: string;
  template_id?: string;
  certificate_number: string;
  metadata?: Record<string, any>;
}

/**
 * Fetch certificate templates
 */
export async function fetchCertificateTemplates(): Promise<CertificateTemplate[]> {
  const { data, error } = await supabase
    .from('lms_certificate_templates')
    .select('*')
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch default template
 */
export async function fetchDefaultTemplate(): Promise<CertificateTemplate | null> {
  const { data, error } = await supabase
    .from('lms_certificate_templates')
    .select('*')
    .eq('is_default', true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Fetch a single template
 */
export async function fetchTemplateById(id: string): Promise<CertificateTemplate | null> {
  const { data, error } = await supabase
    .from('lms_certificate_templates')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Create a new template
 */
export async function createTemplate(input: CreateTemplateInput): Promise<CertificateTemplate> {
  const { data, error } = await supabase
    .from('lms_certificate_templates')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a template
 */
export async function updateTemplate(
  id: string,
  input: Partial<CreateTemplateInput>
): Promise<CertificateTemplate> {
  const { data, error } = await supabase
    .from('lms_certificate_templates')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a template
 */
export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('lms_certificate_templates')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Fetch certificates for a user
 */
export async function fetchUserCertificates(userId: string): Promise<Certificate[]> {
  const { data, error } = await supabase
    .from('lms_certificates')
    .select(`
      *,
      lms_enrollments!inner(user_id)
    `)
    .eq('lms_enrollments.user_id', userId)
    .order('issued_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch certificate by enrollment
 */
export async function fetchCertificateByEnrollment(enrollmentId: string): Promise<Certificate | null> {
  const { data, error } = await supabase
    .from('lms_certificates')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Fetch certificate by number
 */
export async function fetchCertificateByNumber(certificateNumber: string): Promise<Certificate | null> {
  const { data, error } = await supabase
    .from('lms_certificates')
    .select('*')
    .eq('certificate_number', certificateNumber)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Create a new certificate
 */
export async function createCertificate(input: CreateCertificateInput): Promise<Certificate> {
  const { data, error } = await supabase
    .from('lms_certificates')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Generate certificate number
 * Format: CERT-YYYYMMDD-XXXXX
 */
export function generateCertificateNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  
  return `CERT-${year}${month}${day}-${random}`;
}

/**
 * Issue certificate for enrollment
 */
export async function issueCertificate(
  enrollmentId: string,
  templateId?: string
): Promise<Certificate> {
  const certificateNumber = generateCertificateNumber();
  
  return createCertificate({
    enrollment_id: enrollmentId,
    template_id: templateId,
    certificate_number: certificateNumber,
  });
}
