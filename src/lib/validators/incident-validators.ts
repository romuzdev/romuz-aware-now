/**
 * M18: Incident Response System - Input Validators
 * Zod schemas for incident data validation
 */

import { z } from 'zod';

// Incident severity levels
export const incidentSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);

// Incident types
export const incidentTypeSchema = z.enum([
  'data_breach',
  'malware',
  'phishing',
  'unauthorized_access',
  'dos_attack',
  'ddos_attack',
  'policy_violation',
  'system_failure',
  'social_engineering',
  'insider_threat',
  'ransomware',
  'other',
]);

// Incident status
export const incidentStatusSchema = z.enum([
  'open',
  'investigating',
  'contained',
  'eradicating',
  'recovering',
  'resolved',
  'closed',
]);

// Impact level
export const impactLevelSchema = z.enum(['minimal', 'moderate', 'significant', 'severe']);

// Create incident schema
export const createIncidentSchema = z.object({
  title_ar: z.string()
    .min(5, 'العنوان يجب أن يكون 5 أحرف على الأقل')
    .max(200, 'العنوان يجب ألا يتجاوز 200 حرف'),
  title_en: z.string().max(200).optional(),
  
  description_ar: z.string()
    .min(10, 'الوصف يجب أن يكون 10 أحرف على الأقل')
    .max(5000, 'الوصف يجب ألا يتجاوز 5000 حرف'),
  description_en: z.string().max(5000).optional(),
  
  severity: incidentSeveritySchema,
  incident_type: incidentTypeSchema,
  
  detected_at: z.string().datetime(),
  reported_by: z.string().uuid(),
  
  assigned_to: z.string().uuid().optional(),
  assigned_team: z.string().max(100).optional(),
  
  response_plan_id: z.string().uuid().optional(),
  
  affected_assets: z.array(z.string()).optional(),
  affected_users: z.array(z.string()).optional(),
  affected_systems: z.array(z.string()).optional(),
  
  impact_level: impactLevelSchema.optional(),
  estimated_cost: z.number().min(0).optional(),
  
  tags: z.array(z.string()).optional(),
  priority: z.number().min(1).max(5).default(3),
});

// Update incident schema
export const updateIncidentSchema = createIncidentSchema.partial();

// Close incident schema
export const closeIncidentSchema = z.object({
  root_cause_ar: z.string().max(2000).optional(),
  root_cause_en: z.string().max(2000).optional(),
  
  lessons_learned_ar: z.string().max(5000).optional(),
  lessons_learned_en: z.string().max(5000).optional(),
  
  recommendations_ar: z.string().max(5000).optional(),
  recommendations_en: z.string().max(5000).optional(),
  
  actual_cost: z.number().min(0).optional(),
});

// Timeline event schema
export const timelineEventSchema = z.object({
  action_ar: z.string()
    .min(3, 'الإجراء يجب أن يكون 3 أحرف على الأقل')
    .max(1000, 'الإجراء يجب ألا يتجاوز 1000 حرف'),
  action_en: z.string().max(1000).optional(),
  
  details: z.record(z.any()).optional(),
  evidence_urls: z.array(z.string().url()).optional(),
});

// Response plan schema
export const createResponsePlanSchema = z.object({
  plan_name_ar: z.string()
    .min(5, 'اسم الخطة يجب أن يكون 5 أحرف على الأقل')
    .max(200, 'اسم الخطة يجب ألا يتجاوز 200 حرف'),
  plan_name_en: z.string().max(200).optional(),
  
  plan_code: z.string()
    .min(3)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, 'يجب أن يحتوي رمز الخطة على أحرف إنجليزية كبيرة وأرقام فقط')
    .optional(),
  
  description_ar: z.string().max(2000).optional(),
  description_en: z.string().max(2000).optional(),
  
  incident_type: incidentTypeSchema,
  severity_level: incidentSeveritySchema.or(z.literal('all')).optional(),
  
  response_steps: z.array(z.object({
    step_number: z.number().int().positive(),
    title_ar: z.string().min(3).max(200),
    title_en: z.string().max(200).optional(),
    description_ar: z.string().max(1000).optional(),
    description_en: z.string().max(1000).optional(),
    responsible_role: z.string().max(100).optional(),
    max_duration_minutes: z.number().int().positive().optional(),
    is_critical: z.boolean().default(false),
  })).min(1, 'يجب إضافة خطوة واحدة على الأقل'),
  
  escalation_rules: z.record(z.any()).optional(),
  notification_rules: z.record(z.any()).optional(),
  
  is_active: z.boolean().default(true),
  priority: z.number().int().min(1).max(10).default(5),
});

// Update response plan schema
export const updateResponsePlanSchema = createResponsePlanSchema.partial();

// Search incidents schema
export const searchIncidentsSchema = z.object({
  query: z.string().min(2, 'البحث يجب أن يكون حرفين على الأقل').max(100),
  status: incidentStatusSchema.optional(),
  severity: incidentSeveritySchema.optional(),
  incident_type: incidentTypeSchema.optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

// Export types
export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;
export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>;
export type CloseIncidentInput = z.infer<typeof closeIncidentSchema>;
export type TimelineEventInput = z.infer<typeof timelineEventSchema>;
export type CreateResponsePlanInput = z.infer<typeof createResponsePlanSchema>;
export type UpdateResponsePlanInput = z.infer<typeof updateResponsePlanSchema>;
export type SearchIncidentsInput = z.infer<typeof searchIncidentsSchema>;
