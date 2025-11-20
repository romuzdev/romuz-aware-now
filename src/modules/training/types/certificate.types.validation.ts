/**
 * LMS Certificates - Zod Validation Schemas
 */

import { z } from 'zod';

// ============================================
// Certificate Creation Schema
// ============================================

export const createCertificateSchema = z.object({
  user_id: z.string()
    .uuid('Invalid user ID'),
  
  course_id: z.string()
    .uuid('Invalid course ID'),
  
  enrollment_id: z.string()
    .uuid('Invalid enrollment ID'),
  
  certificate_number: z.string()
    .trim()
    .min(5, 'Certificate number must be at least 5 characters')
    .max(50, 'Certificate number must not exceed 50 characters')
    .regex(/^[A-Z0-9-]+$/, 'Certificate number must contain only uppercase letters, numbers and hyphens'),
  
  issued_at: z.string()
    .datetime('Invalid issue date'),
  
  expires_at: z.string()
    .datetime('Invalid expiry date')
    .optional()
    .nullable(),
  
  certificate_url: z.string()
    .url('Invalid certificate URL')
    .max(500, 'URL must not exceed 500 characters')
    .optional()
    .nullable(),
  
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

// ============================================
// Issue Certificate Schema
// ============================================

export const issueCertificateSchema = z.object({
  user_id: z.string()
    .uuid('Invalid user ID'),
  
  course_id: z.string()
    .uuid('Invalid course ID'),
  
  enrollment_id: z.string()
    .uuid('Invalid enrollment ID'),
  
  template_id: z.string()
    .uuid('Invalid template ID')
    .optional()
    .nullable(),
  
  expires_in_days: z.number()
    .int()
    .min(1, 'Expiry must be at least 1 day')
    .max(3650, 'Expiry must not exceed 10 years')
    .optional()
    .nullable(),
});

// ============================================
// Verify Certificate Schema
// ============================================

export const verifyCertificateSchema = z.object({
  certificate_number: z.string()
    .trim()
    .min(5, 'Certificate number must be at least 5 characters')
    .max(50, 'Certificate number must not exceed 50 characters'),
});

// ============================================
// Revoke Certificate Schema
// ============================================

export const revokeCertificateSchema = z.object({
  certificate_id: z.string()
    .uuid('Invalid certificate ID'),
  
  reason: z.string()
    .trim()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must not exceed 500 characters'),
});

// ============================================
// Certificate Template Creation Schema
// ============================================

export const createCertificateTemplateSchema = z.object({
  name: z.string()
    .trim()
    .min(3, 'Template name must be at least 3 characters')
    .max(255, 'Template name must not exceed 255 characters'),
  
  name_ar: z.string()
    .trim()
    .min(3, 'Arabic name must be at least 3 characters')
    .max(255, 'Arabic name must not exceed 255 characters')
    .optional()
    .nullable(),
  
  description: z.string()
    .trim()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional()
    .nullable(),
  
  template_html: z.string()
    .trim()
    .min(100, 'Template HTML must be at least 100 characters')
    .max(50000, 'Template HTML must not exceed 50000 characters'),
  
  template_css: z.string()
    .trim()
    .max(10000, 'Template CSS must not exceed 10000 characters')
    .optional()
    .nullable(),
  
  is_default: z.boolean().optional(),
  
  is_active: z.boolean().optional(),
  
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

// ============================================
// Certificate Template Update Schema
// ============================================

export const updateCertificateTemplateSchema = createCertificateTemplateSchema.partial();

// ============================================
// Validation Functions
// ============================================

export const validateCertificateCreate = (data: unknown) => {
  return createCertificateSchema.safeParse(data);
};

export const validateIssueCertificate = (data: unknown) => {
  return issueCertificateSchema.safeParse(data);
};

export const validateVerifyCertificate = (data: unknown) => {
  return verifyCertificateSchema.safeParse(data);
};

export const validateRevokeCertificate = (data: unknown) => {
  return revokeCertificateSchema.safeParse(data);
};

export const validateCertificateTemplateCreate = (data: unknown) => {
  return createCertificateTemplateSchema.safeParse(data);
};

export const validateCertificateTemplateUpdate = (data: unknown) => {
  return updateCertificateTemplateSchema.safeParse(data);
};

// ============================================
// Type Inference
// ============================================

export type CertificateCreateInput = z.infer<typeof createCertificateSchema>;
export type IssueCertificateInput = z.infer<typeof issueCertificateSchema>;
export type VerifyCertificateInput = z.infer<typeof verifyCertificateSchema>;
export type RevokeCertificateInput = z.infer<typeof revokeCertificateSchema>;
export type CertificateTemplateCreateInput = z.infer<typeof createCertificateTemplateSchema>;
export type CertificateTemplateUpdateInput = z.infer<typeof updateCertificateTemplateSchema>;
