/**
 * Unified GRC Validation Layer
 * Phase 2: Integration Layer Enhancement
 * 
 * Centralized validation utilities for all GRC operations
 */

import { z } from 'zod';

/**
 * ===== COMMON VALIDATION HELPERS =====
 */

export const validateRequired = (value: any, fieldName: string): void => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw new Error(`${fieldName} مطلوب`);
  }
};

export const validateUUID = (value: string, fieldName: string): void => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new Error(`${fieldName} غير صحيح`);
  }
};

export const validateDateRange = (startDate: string | Date, endDate: string | Date): void => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start >= end) {
    throw new Error('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
  }
};

export const validateScore = (score: number, min: number, max: number, fieldName: string): void => {
  if (score < min || score > max) {
    throw new Error(`${fieldName} يجب أن يكون بين ${min} و ${max}`);
  }
};

/**
 * ===== RISK VALIDATION =====
 */

export interface RiskValidationInput {
  risk_code?: string;
  risk_title: string;
  inherent_likelihood_score: number;
  inherent_impact_score: number;
  risk_category: string;
}

export const validateRisk = (data: RiskValidationInput): void => {
  validateRequired(data.risk_title, 'عنوان المخاطر');
  validateScore(data.inherent_likelihood_score, 1, 5, 'احتمالية المخاطر');
  validateScore(data.inherent_impact_score, 1, 5, 'تأثير المخاطر');
  
  const validCategories = ['strategic', 'operational', 'financial', 'compliance', 'reputational', 'technology'];
  if (!validCategories.includes(data.risk_category)) {
    throw new Error('فئة المخاطر غير صحيحة');
  }
};

export const validateRiskTreatment = (data: {
  risk_id: string;
  treatment_strategy: string;
  target_completion_date?: string;
}): void => {
  validateUUID(data.risk_id, 'معرف المخاطر');
  
  const validStrategies = ['avoid', 'transfer', 'mitigate', 'accept'];
  if (!validStrategies.includes(data.treatment_strategy)) {
    throw new Error('استراتيجية المعالجة غير صحيحة');
  }
  
  if (data.target_completion_date) {
    const targetDate = new Date(data.target_completion_date);
    if (targetDate < new Date()) {
      throw new Error('تاريخ الإنجاز المستهدف يجب أن يكون في المستقبل');
    }
  }
};

/**
 * ===== CONTROL VALIDATION =====
 */

export interface ControlValidationInput {
  control_code?: string;
  control_title: string;
  control_type: string;
  control_frequency: string;
}

export const validateControl = (data: ControlValidationInput): void => {
  validateRequired(data.control_title, 'عنوان الضابط');
  
  const validTypes = ['preventive', 'detective', 'corrective', 'directive'];
  if (!validTypes.includes(data.control_type)) {
    throw new Error('نوع الضابط غير صحيح');
  }
  
  const validFrequencies = ['continuous', 'daily', 'weekly', 'monthly', 'quarterly', 'annually', 'ad_hoc'];
  if (!validFrequencies.includes(data.control_frequency)) {
    throw new Error('تكرار الضابط غير صحيح');
  }
};

export const validateControlTest = (data: {
  control_id: string;
  test_date: string;
  test_type: string;
}): void => {
  validateUUID(data.control_id, 'معرف الضابط');
  
  const testDate = new Date(data.test_date);
  if (testDate > new Date()) {
    throw new Error('تاريخ الاختبار لا يمكن أن يكون في المستقبل');
  }
  
  const validTestTypes = ['design', 'operating_effectiveness', 'both'];
  if (!validTestTypes.includes(data.test_type)) {
    throw new Error('نوع الاختبار غير صحيح');
  }
};

/**
 * ===== COMPLIANCE VALIDATION =====
 */

export interface ComplianceRequirementInput {
  requirement_code?: string;
  requirement_title: string;
  framework_name: string;
  compliance_status: string;
  priority?: string;
}

export const validateComplianceRequirement = (data: ComplianceRequirementInput): void => {
  validateRequired(data.requirement_title, 'عنوان المتطلب');
  validateRequired(data.framework_name, 'اسم الإطار');
  
  const validStatuses = ['compliant', 'partially_compliant', 'non_compliant', 'not_assessed'];
  if (!validStatuses.includes(data.compliance_status)) {
    throw new Error('حالة الامتثال غير صحيحة');
  }
  
  if (data.priority) {
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(data.priority)) {
      throw new Error('الأولوية غير صحيحة');
    }
  }
};

/**
 * ===== POLICY VALIDATION =====
 */

export interface PolicyValidationInput {
  policy_code: string;
  policy_title: string;
  policy_type: string;
  policy_status: string;
  effective_date?: string;
  review_date?: string;
}

export const validatePolicy = (data: PolicyValidationInput): void => {
  validateRequired(data.policy_code, 'كود السياسة');
  validateRequired(data.policy_title, 'عنوان السياسة');
  
  const validTypes = ['security', 'privacy', 'operational', 'financial', 'hr', 'it', 'compliance'];
  if (!validTypes.includes(data.policy_type)) {
    throw new Error('نوع السياسة غير صحيح');
  }
  
  const validStatuses = ['draft', 'under_review', 'approved', 'published', 'retired'];
  if (!validStatuses.includes(data.policy_status)) {
    throw new Error('حالة السياسة غير صحيحة');
  }
  
  if (data.effective_date && data.review_date) {
    validateDateRange(data.effective_date, data.review_date);
  }
};

/**
 * ===== AUDIT VALIDATION =====
 */

export interface AuditValidationInput {
  audit_code: string;
  audit_title: string;
  audit_type: string;
  planned_start_date: string;
  planned_end_date: string;
}

export const validateAudit = (data: AuditValidationInput): void => {
  validateRequired(data.audit_code, 'كود التدقيق');
  validateRequired(data.audit_title, 'عنوان التدقيق');
  
  const validTypes = ['internal', 'external', 'compliance', 'operational', 'financial', 'it'];
  if (!validTypes.includes(data.audit_type)) {
    throw new Error('نوع التدقيق غير صحيح');
  }
  
  validateDateRange(data.planned_start_date, data.planned_end_date);
};

export const validateFinding = (data: {
  audit_id: string;
  severity: string;
  finding_ar: string;
}): void => {
  validateUUID(data.audit_id, 'معرف التدقيق');
  validateRequired(data.finding_ar, 'وصف النتيجة');
  
  const validSeverities = ['low', 'medium', 'high', 'critical'];
  if (!validSeverities.includes(data.severity)) {
    throw new Error('درجة الخطورة غير صحيحة');
  }
};

/**
 * ===== COMMITTEE & MEETING VALIDATION =====
 */

export const validateCommittee = (data: {
  committee_code: string;
  committee_name: string;
  committee_type: string;
}): void => {
  validateRequired(data.committee_code, 'كود اللجنة');
  validateRequired(data.committee_name, 'اسم اللجنة');
  
  const validTypes = ['steering', 'advisory', 'oversight', 'executive', 'technical'];
  if (!validTypes.includes(data.committee_type)) {
    throw new Error('نوع اللجنة غير صحيح');
  }
};

export const validateMeeting = (data: {
  committee_id: string;
  meeting_title: string;
  scheduled_at: string;
}): void => {
  validateUUID(data.committee_id, 'معرف اللجنة');
  validateRequired(data.meeting_title, 'عنوان الاجتماع');
  
  const scheduledDate = new Date(data.scheduled_at);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (scheduledDate < today) {
    throw new Error('موعد الاجتماع لا يمكن أن يكون في الماضي');
  }
};

/**
 * ===== BULK VALIDATION =====
 */

export const validateBulkOperation = (
  ids: string[],
  operation: string
): void => {
  if (!ids || ids.length === 0) {
    throw new Error('يجب تحديد عنصر واحد على الأقل');
  }
  
  if (ids.length > 100) {
    throw new Error('لا يمكن معالجة أكثر من 100 عنصر في وقت واحد');
  }
  
  ids.forEach(id => validateUUID(id, 'معرف العنصر'));
  
  const validOperations = ['delete', 'update_status', 'assign', 'export', 'backup'];
  if (!validOperations.includes(operation)) {
    throw new Error('نوع العملية غير صحيح');
  }
};

/**
 * ===== BACKUP & RESTORE VALIDATION =====
 */

export const validateBackupRequest = (data: {
  entity_type: string;
  entity_ids?: string[];
  backup_type: string;
}): void => {
  validateRequired(data.entity_type, 'نوع الكيان');
  
  const validTypes = ['full', 'incremental', 'selective'];
  if (!validTypes.includes(data.backup_type)) {
    throw new Error('نوع النسخ الاحتياطي غير صحيح');
  }
  
  if (data.backup_type === 'selective' && (!data.entity_ids || data.entity_ids.length === 0)) {
    throw new Error('يجب تحديد الكيانات للنسخ الاحتياطي الانتقائي');
  }
};

export const validateRestoreRequest = (data: {
  backup_id: string;
  restore_type: string;
  target_date?: string;
}): void => {
  validateUUID(data.backup_id, 'معرف النسخة الاحتياطية');
  
  const validTypes = ['full', 'partial', 'point_in_time'];
  if (!validTypes.includes(data.restore_type)) {
    throw new Error('نوع الاستعادة غير صحيح');
  }
  
  if (data.restore_type === 'point_in_time' && !data.target_date) {
    throw new Error('يجب تحديد تاريخ الاستعادة');
  }
};
