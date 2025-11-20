/**
 * LMS Certificates Integration Layer
 * Handles certificate generation and management
 */

import { supabase } from '@/integrations/supabase/client';
import type { Certificate, CreateCertificateInput } from '../types';

export async function fetchCertificatesByUser(userId: string): Promise<Certificate[]> {
  const { data, error } = await supabase
    .from('lms_certificates')
    .select(`
      *,
      course:lms_courses(id, code, name)
    `)
    .eq('user_id', userId)
    .order('issued_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchCertificateByCourse(
  userId: string, 
  courseId: string
): Promise<Certificate | null> {
  const { data, error } = await supabase
    .from('lms_certificates')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function issueCertificate(input: CreateCertificateInput): Promise<Certificate> {
  const { data, error } = await supabase
    .from('lms_certificates')
    .insert({
      ...input,
      issued_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function verifyCertificate(certificateNumber: string): Promise<Certificate | null> {
  const { data, error } = await supabase
    .from('lms_certificates')
    .select(`
      *,
      course:lms_courses(id, code, name),
      user:users(id, full_name, email)
    `)
    .eq('certificate_number', certificateNumber)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function fetchMyCertificates(): Promise<Certificate[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  return fetchCertificatesByUser(user.id);
}

export async function fetchCertificateById(id: string): Promise<Certificate | null> {
  const { data, error } = await supabase
    .from('lms_certificates')
    .select(`
      *,
      course:lms_courses(id, code, name)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

// Certificate Templates
export async function fetchCertificateTemplates(): Promise<any[]> {
  const { data, error } = await supabase
    .from('lms_certificate_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchTemplateById(id: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('lms_certificate_templates')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createTemplate(input: any): Promise<any> {
  const { data, error } = await supabase
    .from('lms_certificate_templates')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateTemplate(id: string, input: any): Promise<any> {
  const { data, error } = await supabase
    .from('lms_certificate_templates')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('lms_certificate_templates')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function revokeCertificate(id: string): Promise<void> {
  const { error } = await supabase
    .from('lms_certificates')
    .update({ is_revoked: true })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/**
 * Generate PDF certificate for a completed enrollment
 */
export async function generateCertificatePDF(enrollmentId: string): Promise<Blob> {
  const { data, error } = await supabase.functions.invoke('generate-certificate', {
    body: { enrollment_id: enrollmentId },
  });

  if (error) {
    console.error('Certificate generation error:', error);
    throw new Error('Failed to generate certificate');
  }

  return data as Blob;
}

/**
 * Download certificate as PDF file (using enrollment ID)
 */
export async function downloadCertificate(enrollmentId: string, fileName?: string): Promise<void> {
  try {
    const pdfBlob = await generateCertificatePDF(enrollmentId);
    
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `certificate-${enrollmentId.substring(0, 8)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Certificate download error:', error);
    throw error;
  }
}

/**
 * Preview certificate in new tab
 */
export async function previewCertificate(enrollmentId: string): Promise<void> {
  try {
    const pdfBlob = await generateCertificatePDF(enrollmentId);
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
  } catch (error) {
    console.error('Certificate preview error:', error);
    throw error;
  }
}

/**
 * Share certificate via Web Share API (if available)
 */
export async function shareCertificate(enrollmentId: string): Promise<void> {
  if (!navigator.share) {
    throw new Error('Web Share API not supported');
  }

  try {
    const pdfBlob = await generateCertificatePDF(enrollmentId);
    const file = new File([pdfBlob], `certificate-${enrollmentId.substring(0, 8)}.pdf`, {
      type: 'application/pdf',
    });

    await navigator.share({
      title: 'شهادة إتمام الدورة',
      text: 'شهادة إتمام دورة تدريبية',
      files: [file],
    });
  } catch (error) {
    console.error('Certificate share error:', error);
    throw error;
  }
}
