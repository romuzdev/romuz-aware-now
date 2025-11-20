import { z } from 'zod';

/**
 * Common validation schemas used across the application
 */

// Date validation
export const futureDateSchema = z.coerce.date();

export const pastDateSchema = z.coerce.date().refine((date) => date <= new Date(), {
  message: 'التاريخ لا يمكن أن يكون في المستقبل',
});

// Date range validation
export const dateRangeSchema = z.object({
  start_date: z.string().or(z.date()),
  end_date: z.string().or(z.date()),
}).refine((data) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end >= start;
}, {
  message: 'تاريخ النهاية يجب أن يكون بعد أو يساوي تاريخ البداية',
  path: ['end_date'],
});

// Arabic name validation
export const arabicNameSchema = z.string()
  .trim()
  .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
  .max(100, 'الاسم طويل جداً')
  .regex(/^[\u0600-\u06FF\s]+$/, 'الاسم يجب أن يحتوي على أحرف عربية فقط');

// Email validation
export const emailSchema = z.string()
  .trim()
  .email('البريد الإلكتروني غير صحيح')
  .max(255, 'البريد الإلكتروني طويل جداً');

// Status enum validation
export const statusSchema = z.enum(['draft', 'active', 'completed', 'archived'], {
  errorMap: () => ({ message: 'الحالة غير صحيحة' }),
});

// Text validation with length limits
export const shortTextSchema = z.string()
  .trim()
  .min(1, 'الحقل مطلوب')
  .max(200, 'النص يجب أن لا يتجاوز 200 حرف');

export const mediumTextSchema = z.string()
  .trim()
  .min(1, 'الحقل مطلوب')
  .max(1000, 'النص يجب أن لا يتجاوز 1000 حرف');

export const longTextSchema = z.string()
  .trim()
  .max(5000, 'النص يجب أن لا يتجاوز 5000 حرف')
  .optional();

// Code validation (uppercase letters, numbers, hyphens)
export const codeSchema = z.string()
  .trim()
  .min(1, 'الكود مطلوب')
  .max(50, 'الكود يجب أن لا يتجاوز 50 حرف')
  .regex(/^[A-Z0-9-]+$/, 'الكود يجب أن يحتوي على أحرف إنجليزية كبيرة وأرقام وشرطات فقط');

// Score validation
export const scoreSchema = (min: number = 0, max: number = 100) => 
  z.number()
    .min(min, `القيمة يجب أن تكون ${min} على الأقل`)
    .max(max, `القيمة يجب أن لا تتجاوز ${max}`);

// Priority validation
export const prioritySchema = z.enum(['low', 'medium', 'high', 'critical'], {
  errorMap: () => ({ message: 'الأولوية غير صحيحة' }),
});

// URL validation
export const urlSchema = z.string()
  .url('الرابط غير صحيح')
  .max(500, 'الرابط طويل جداً')
  .optional();
