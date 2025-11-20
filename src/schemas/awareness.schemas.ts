import { z } from 'zod';
import { shortTextSchema, longTextSchema, dateRangeSchema, statusSchema } from './common.schemas';

/**
 * Awareness Campaign Validation Schemas
 */

export const campaignSchema = z.object({
  name: shortTextSchema,
  description: longTextSchema,
  start_date: z.string().or(z.date()),
  end_date: z.string().or(z.date()),
  status: statusSchema,
  owner_name: z.string().trim().max(100).optional(),
  is_test: z.boolean().default(false),
}).refine((data) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end >= start;
}, {
  message: 'تاريخ النهاية يجب أن يكون بعد أو يساوي تاريخ البداية',
  path: ['end_date'],
});

export type CampaignFormData = z.infer<typeof campaignSchema>;

export const campaignModuleSchema = z.object({
  campaign_id: z.string().uuid('معرف الحملة غير صحيح'),
  title: shortTextSchema,
  type: z.enum(['video', 'document', 'quiz', 'interactive', 'link'], {
    errorMap: () => ({ message: 'نوع الوحدة غير صحيح' }),
  }),
  content: longTextSchema,
  url_or_ref: z.string().url('الرابط غير صحيح').max(500).optional().or(z.literal('')),
  position: z.number().int().min(0, 'الترتيب يجب أن يكون رقم صحيح موجب'),
  estimated_minutes: z.number().int().min(1, 'المدة يجب أن تكون دقيقة واحدة على الأقل').optional(),
  is_required: z.boolean().default(true),
});

export type CampaignModuleFormData = z.infer<typeof campaignModuleSchema>;

export const campaignParticipantSchema = z.object({
  campaign_id: z.string().uuid('معرف الحملة غير صحيح'),
  employee_ref: z.string()
    .trim()
    .min(1, 'مرجع الموظف مطلوب')
    .max(50, 'مرجع الموظف طويل جداً'),
  status: z.enum(['not_started', 'in_progress', 'completed', 'failed'], {
    errorMap: () => ({ message: 'الحالة غير صحيحة' }),
  }).default('not_started'),
  is_test: z.boolean().default(false),
  notes: z.string().trim().max(500).optional(),
});

export type CampaignParticipantFormData = z.infer<typeof campaignParticipantSchema>;

export const campaignFeedbackSchema = z.object({
  campaign_id: z.string().uuid('معرف الحملة غير صحيح'),
  participant_id: z.string().uuid('معرف المشارك غير صحيح').optional(),
  score: z.number()
    .int('التقييم يجب أن يكون رقم صحيح')
    .min(1, 'التقييم يجب أن يكون 1 على الأقل')
    .max(5, 'التقييم يجب أن لا يتجاوز 5')
    .optional(),
  comment: z.string()
    .trim()
    .max(1000, 'التعليق يجب أن لا يتجاوز 1000 حرف')
    .optional(),
});

export type CampaignFeedbackFormData = z.infer<typeof campaignFeedbackSchema>;
