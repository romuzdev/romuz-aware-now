import { z } from 'zod';
import { 
  codeSchema, 
  shortTextSchema, 
  mediumTextSchema, 
  longTextSchema, 
  scoreSchema, 
  dateRangeSchema,
  prioritySchema 
} from './common.schemas';

/**
 * GRC (Governance, Risk, Compliance) Validation Schemas
 */

// Risk schemas
export const riskSchema = z.object({
  risk_code: codeSchema,
  risk_title: shortTextSchema,
  risk_description: longTextSchema,
  risk_category: z.enum(['strategic', 'operational', 'financial', 'compliance', 'reputational', 'technology'], {
    errorMap: () => ({ message: 'فئة المخاطر غير صحيحة' }),
  }),
  risk_owner: z.string().uuid('معرف المالك غير صحيح').optional(),
  inherent_likelihood_score: scoreSchema(1, 5),
  inherent_impact_score: scoreSchema(1, 5),
  inherent_risk_score: scoreSchema(1, 25),
  current_likelihood_score: scoreSchema(1, 5).optional(),
  current_impact_score: scoreSchema(1, 5).optional(),
  risk_status: z.enum(['identified', 'assessed', 'treated', 'monitored', 'closed'], {
    errorMap: () => ({ message: 'حالة المخاطر غير صحيحة' }),
  }),
  risk_appetite: z.enum(['avoid', 'transfer', 'mitigate', 'accept'], {
    errorMap: () => ({ message: 'مستوى القبول غير صحيح' }),
  }).optional(),
});

export type RiskFormData = z.infer<typeof riskSchema>;

// Control schemas
export const controlSchema = z.object({
  control_code: codeSchema,
  control_title: shortTextSchema,
  control_description: longTextSchema,
  control_type: z.enum(['preventive', 'detective', 'corrective', 'directive'], {
    errorMap: () => ({ message: 'نوع الضابط غير صحيح' }),
  }),
  control_category: z.enum(['manual', 'automated', 'it_dependent', 'it_general'], {
    errorMap: () => ({ message: 'فئة الضابط غير صحيحة' }),
  }),
  control_owner: z.string().uuid('معرف المالك غير صحيح').optional(),
  control_frequency: z.enum(['continuous', 'daily', 'weekly', 'monthly', 'quarterly', 'annually', 'ad_hoc'], {
    errorMap: () => ({ message: 'تكرار الضابط غير صحيح' }),
  }),
  effectiveness_rating: z.enum(['not_tested', 'effective', 'partially_effective', 'ineffective'], {
    errorMap: () => ({ message: 'تقييم الفعالية غير صحيح' }),
  }).optional(),
  implementation_status: z.enum(['planned', 'in_progress', 'implemented', 'not_implemented'], {
    errorMap: () => ({ message: 'حالة التنفيذ غير صحيحة' }),
  }),
});

export type ControlFormData = z.infer<typeof controlSchema>;

// Risk Treatment schemas
export const riskTreatmentSchema = z.object({
  risk_id: z.string().uuid('معرف المخاطر غير صحيح'),
  treatment_strategy: z.enum(['avoid', 'transfer', 'mitigate', 'accept'], {
    errorMap: () => ({ message: 'استراتيجية المعالجة غير صحيحة' }),
  }),
  treatment_description: mediumTextSchema,
  responsible_user_id: z.string().uuid('معرف المسؤول غير صحيح').optional(),
  target_completion_date: z.string().or(z.date()).optional(),
  target_likelihood_score: scoreSchema(1, 5).optional(),
  target_impact_score: scoreSchema(1, 5).optional(),
  plan_status: z.enum(['draft', 'approved', 'in_progress', 'completed', 'cancelled'], {
    errorMap: () => ({ message: 'حالة الخطة غير صحيحة' }),
  }),
  cost_estimate: z.number().min(0, 'التكلفة يجب أن تكون قيمة موجبة').optional(),
});

export type RiskTreatmentFormData = z.infer<typeof riskTreatmentSchema>;

// Control Test schemas
export const controlTestSchema = z.object({
  control_id: z.string().uuid('معرف الضابط غير صحيح'),
  test_date: z.string().or(z.date()),
  test_type: z.enum(['design', 'operating_effectiveness', 'both'], {
    errorMap: () => ({ message: 'نوع الاختبار غير صحيح' }),
  }),
  tester_user_id: z.string().uuid('معرف المختبر غير صحيح').optional(),
  test_procedures: mediumTextSchema,
  test_results: mediumTextSchema.optional(),
  issues_identified: longTextSchema,
  effectiveness_conclusion: z.enum(['effective', 'partially_effective', 'ineffective', 'not_concluded'], {
    errorMap: () => ({ message: 'نتيجة الفعالية غير صحيحة' }),
  }).optional(),
});

export type ControlTestFormData = z.infer<typeof controlTestSchema>;

// Compliance Requirement schemas
export const complianceRequirementSchema = z.object({
  requirement_code: codeSchema,
  requirement_title: shortTextSchema,
  requirement_description: longTextSchema,
  framework_name: z.string().trim().min(1, 'اسم الإطار مطلوب').max(100),
  category: z.string().trim().max(100).optional(),
  compliance_status: z.enum(['compliant', 'partially_compliant', 'non_compliant', 'not_assessed'], {
    errorMap: () => ({ message: 'حالة الامتثال غير صحيحة' }),
  }),
  owner_user_id: z.string().uuid('معرف المالك غير صحيح').optional(),
  due_date: z.string().or(z.date()).optional(),
  priority: prioritySchema,
  evidence_required: z.string().trim().max(500).optional(),
});

export type ComplianceRequirementFormData = z.infer<typeof complianceRequirementSchema>;
