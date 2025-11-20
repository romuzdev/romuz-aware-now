import { z } from 'zod';
import { arabicNameSchema, pastDateSchema } from './common.schemas';

/**
 * Employee Profile Validation Schemas
 */

export const employeeProfileSchema = z.object({
  full_name: arabicNameSchema,
  department: z.string()
    .trim()
    .min(2, 'القسم مطلوب')
    .max(100, 'اسم القسم طويل جداً'),
  position: z.string()
    .trim()
    .max(100, 'المسمى الوظيفي طويل جداً')
    .optional(),
  hire_date: z.string()
    .or(z.date())
    .refine((date) => {
      const hireDate = new Date(date);
      return hireDate <= new Date();
    }, {
      message: 'تاريخ التوظيف لا يمكن أن يكون في المستقبل',
    })
    .optional(),
  status: z.enum(['active', 'inactive', 'on_leave', 'terminated'], {
    errorMap: () => ({ message: 'حالة الموظف غير صحيحة' }),
  }).default('active'),
  email: z.string()
    .email('البريد الإلكتروني غير صحيح')
    .max(255)
    .optional(),
  phone: z.string()
    .regex(/^[+]?[0-9]{10,15}$/, 'رقم الهاتف غير صحيح')
    .optional()
    .or(z.literal('')),
});

export type EmployeeProfileFormData = z.infer<typeof employeeProfileSchema>;

export const employeeBulkImportSchema = z.array(
  z.object({
    employee_ref: z.string().trim().min(1).max(50),
    full_name: arabicNameSchema,
    department: z.string().trim().min(1).max(100),
    position: z.string().trim().max(100).optional(),
    email: z.string().email().max(255).optional(),
    hire_date: z.string().optional(),
  })
);

export type EmployeeBulkImportData = z.infer<typeof employeeBulkImportSchema>;
