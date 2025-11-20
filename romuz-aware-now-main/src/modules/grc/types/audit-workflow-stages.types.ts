/**
 * GRC Audit Workflow Stages Types
 * M12: Types for advanced workflow stage management
 */

import { Database } from '@/integrations/supabase/types';
import type { FindingSeverity, FindingStatus } from './audit.types';

// Database types
export type AuditWorkflowStage = Database['public']['Tables']['audit_workflow_stages']['Row'];
export type AuditWorkflowStageInsert = Database['public']['Tables']['audit_workflow_stages']['Insert'];
export type AuditWorkflowStageUpdate = Database['public']['Tables']['audit_workflow_stages']['Update'];

export type AuditFindingCategory = Database['public']['Tables']['audit_findings_categories']['Row'];
export type AuditFindingCategoryInsert = Database['public']['Tables']['audit_findings_categories']['Insert'];
export type AuditFindingCategoryUpdate = Database['public']['Tables']['audit_findings_categories']['Update'];

// Stage status types
export type StageStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

// Re-export for convenience
export type { FindingSeverity, FindingStatus };

// Required action structure
export interface RequiredAction {
  id: string;
  title: string;
  title_ar?: string;
  description?: string;
  completed: boolean;
  completed_by?: string;
  completed_at?: string;
}

// Stage creation input
export interface CreateStageInput {
  workflow_id: string;
  stage_name: string;
  stage_name_ar?: string;
  sequence_order: number;
  required_actions?: RequiredAction[];
  approval_required?: boolean;
  approver_role?: string;
  notes?: string;
}

// Stage update input
export interface UpdateStageInput {
  stage_id: string;
  status?: StageStatus;
  required_actions?: RequiredAction[];
  notes?: string;
  started_at?: string;
  completed_at?: string;
}

// Stage with progress
export interface StageWithProgress extends AuditWorkflowStage {
  is_current: boolean;
  is_overdue: boolean;
  days_in_stage: number;
  completion_pct: number;
}

// Finding creation input
export interface CreateFindingInput {
  audit_id: string;
  category_code: string;
  category_name: string;
  category_name_ar?: string;
  severity: FindingSeverity;
  finding_ar: string;
  finding_en?: string;
  recommendation_ar?: string;
  recommendation_en?: string;
  assigned_to?: string;
  due_date?: string;
  impact_description?: string;
  root_cause?: string;
  control_ref?: string;
  framework_ref?: string;
  evidence_urls?: string[];
}

// Finding update input
export interface UpdateFindingInput {
  finding_id: string;
  status?: FindingStatus;
  assigned_to?: string;
  due_date?: string;
  resolution_notes?: string;
  evidence_urls?: string[];
}

// Finding resolution input
export interface ResolveFindingInput {
  finding_id: string;
  resolution_notes: string;
  evidence_urls?: string[];
}

// Workflow stage progress summary
export interface WorkflowStageProgress {
  workflow_id: string;
  total_stages: number;
  completed_stages: number;
  current_stage?: string;
  progress_pct: number;
}

// Findings summary by severity
export interface FindingsSummary {
  severity: FindingSeverity;
  count: number;
  open_count: number;
  resolved_count: number;
}

// Findings analytics
export interface FindingsAnalytics {
  total_findings: number;
  by_severity: FindingsSummary[];
  by_status: {
    status: FindingStatus;
    count: number;
  }[];
  resolution_rate: number;
  avg_resolution_days: number;
  overdue_count: number;
}

// Stage template for workflow builder
export interface StageTemplate {
  stage_name: string;
  stage_name_ar: string;
  sequence_order: number;
  default_actions: {
    title: string;
    title_ar: string;
    description?: string;
  }[];
  approval_required: boolean;
  approver_role?: string;
  estimated_days?: number;
}

// Predefined stage templates by workflow type
export const STAGE_TEMPLATES: Record<string, StageTemplate[]> = {
  planning: [
    {
      stage_name: 'Scope Definition',
      stage_name_ar: 'تحديد النطاق',
      sequence_order: 1,
      default_actions: [
        { title: 'Define audit objectives', title_ar: 'تحديد أهداف التدقيق' },
        { title: 'Identify audit areas', title_ar: 'تحديد مجالات التدقيق' },
        { title: 'Document scope boundaries', title_ar: 'توثيق حدود النطاق' }
      ],
      approval_required: true,
      approver_role: 'audit_manager',
      estimated_days: 3
    },
    {
      stage_name: 'Risk Assessment',
      stage_name_ar: 'تقييم المخاطر',
      sequence_order: 2,
      default_actions: [
        { title: 'Identify key risks', title_ar: 'تحديد المخاطر الرئيسية' },
        { title: 'Assess risk levels', title_ar: 'تقييم مستويات المخاطر' },
        { title: 'Prioritize audit focus', title_ar: 'تحديد أولويات التدقيق' }
      ],
      approval_required: false,
      estimated_days: 5
    },
    {
      stage_name: 'Resource Allocation',
      stage_name_ar: 'تخصيص الموارد',
      sequence_order: 3,
      default_actions: [
        { title: 'Assign audit team', title_ar: 'تعيين فريق التدقيق' },
        { title: 'Allocate budget', title_ar: 'تخصيص الميزانية' },
        { title: 'Plan timeline', title_ar: 'تخطيط الجدول الزمني' }
      ],
      approval_required: true,
      approver_role: 'audit_director',
      estimated_days: 2
    }
  ],
  execution: [
    {
      stage_name: 'Fieldwork',
      stage_name_ar: 'العمل الميداني',
      sequence_order: 1,
      default_actions: [
        { title: 'Conduct interviews', title_ar: 'إجراء المقابلات' },
        { title: 'Review documentation', title_ar: 'مراجعة الوثائق' },
        { title: 'Observe processes', title_ar: 'مراقبة العمليات' }
      ],
      approval_required: false,
      estimated_days: 10
    },
    {
      stage_name: 'Evidence Collection',
      stage_name_ar: 'جمع الأدلة',
      sequence_order: 2,
      default_actions: [
        { title: 'Document findings', title_ar: 'توثيق النتائج' },
        { title: 'Collect evidence', title_ar: 'جمع الأدلة' },
        { title: 'Validate data', title_ar: 'التحقق من البيانات' }
      ],
      approval_required: false,
      estimated_days: 7
    },
    {
      stage_name: 'Testing Controls',
      stage_name_ar: 'اختبار الضوابط',
      sequence_order: 3,
      default_actions: [
        { title: 'Test control effectiveness', title_ar: 'اختبار فعالية الضوابط' },
        { title: 'Document exceptions', title_ar: 'توثيق الاستثناءات' },
        { title: 'Assess compliance', title_ar: 'تقييم الامتثال' }
      ],
      approval_required: false,
      estimated_days: 8
    }
  ],
  reporting: [
    {
      stage_name: 'Draft Preparation',
      stage_name_ar: 'إعداد المسودة',
      sequence_order: 1,
      default_actions: [
        { title: 'Compile findings', title_ar: 'تجميع النتائج' },
        { title: 'Write report draft', title_ar: 'كتابة مسودة التقرير' },
        { title: 'Prepare recommendations', title_ar: 'إعداد التوصيات' }
      ],
      approval_required: false,
      estimated_days: 5
    },
    {
      stage_name: 'Management Review',
      stage_name_ar: 'مراجعة الإدارة',
      sequence_order: 2,
      default_actions: [
        { title: 'Submit to management', title_ar: 'تقديم للإدارة' },
        { title: 'Address feedback', title_ar: 'معالجة الملاحظات' },
        { title: 'Revise report', title_ar: 'مراجعة التقرير' }
      ],
      approval_required: true,
      approver_role: 'management',
      estimated_days: 3
    },
    {
      stage_name: 'Final Report',
      stage_name_ar: 'التقرير النهائي',
      sequence_order: 3,
      default_actions: [
        { title: 'Finalize report', title_ar: 'إنهاء التقرير' },
        { title: 'Obtain signatures', title_ar: 'الحصول على التوقيعات' },
        { title: 'Distribute report', title_ar: 'توزيع التقرير' }
      ],
      approval_required: true,
      approver_role: 'audit_committee',
      estimated_days: 2
    }
  ],
  followup: [
    {
      stage_name: 'Action Tracking',
      stage_name_ar: 'تتبع الإجراءات',
      sequence_order: 1,
      default_actions: [
        { title: 'Monitor corrective actions', title_ar: 'مراقبة الإجراءات التصحيحية' },
        { title: 'Track deadlines', title_ar: 'تتبع المواعيد النهائية' },
        { title: 'Request status updates', title_ar: 'طلب تحديثات الحالة' }
      ],
      approval_required: false,
      estimated_days: 30
    },
    {
      stage_name: 'Verification',
      stage_name_ar: 'التحقق',
      sequence_order: 2,
      default_actions: [
        { title: 'Review evidence', title_ar: 'مراجعة الأدلة' },
        { title: 'Verify implementation', title_ar: 'التحقق من التنفيذ' },
        { title: 'Test effectiveness', title_ar: 'اختبار الفعالية' }
      ],
      approval_required: false,
      estimated_days: 10
    },
    {
      stage_name: 'Closure',
      stage_name_ar: 'الإغلاق',
      sequence_order: 3,
      default_actions: [
        { title: 'Document closure', title_ar: 'توثيق الإغلاق' },
        { title: 'Archive records', title_ar: 'أرشفة السجلات' },
        { title: 'Lessons learned', title_ar: 'الدروس المستفادة' }
      ],
      approval_required: true,
      approver_role: 'audit_manager',
      estimated_days: 3
    }
  ]
};

// Finding category templates
export const FINDING_CATEGORIES = [
  { code: 'AC', name: 'Access Control', name_ar: 'التحكم في الوصول' },
  { code: 'AU', name: 'Audit and Accountability', name_ar: 'التدقيق والمساءلة' },
  { code: 'AT', name: 'Awareness and Training', name_ar: 'التوعية والتدريب' },
  { code: 'CM', name: 'Configuration Management', name_ar: 'إدارة التكوين' },
  { code: 'CP', name: 'Contingency Planning', name_ar: 'تخطيط الطوارئ' },
  { code: 'IA', name: 'Identification and Authentication', name_ar: 'التعريف والمصادقة' },
  { code: 'IR', name: 'Incident Response', name_ar: 'الاستجابة للحوادث' },
  { code: 'MA', name: 'Maintenance', name_ar: 'الصيانة' },
  { code: 'MP', name: 'Media Protection', name_ar: 'حماية الوسائط' },
  { code: 'PE', name: 'Physical and Environmental', name_ar: 'الحماية المادية والبيئية' },
  { code: 'PL', name: 'Planning', name_ar: 'التخطيط' },
  { code: 'PS', name: 'Personnel Security', name_ar: 'أمن الموظفين' },
  { code: 'RA', name: 'Risk Assessment', name_ar: 'تقييم المخاطر' },
  { code: 'SA', name: 'System and Services Acquisition', name_ar: 'اقتناء الأنظمة والخدمات' },
  { code: 'SC', name: 'System and Communications', name_ar: 'الأنظمة والاتصالات' },
  { code: 'SI', name: 'System and Information Integrity', name_ar: 'سلامة الأنظمة والمعلومات' }
];
