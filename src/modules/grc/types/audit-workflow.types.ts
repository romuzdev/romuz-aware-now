/**
 * GRC Audit Workflow Types
 * M12: Types for audit workflow management and tracking
 */

import { Database } from '@/integrations/supabase/types';
import type { GapSeverity } from './compliance.types';

// Database types
export type AuditWorkflow = Database['public']['Tables']['audit_workflows']['Row'];
export type AuditWorkflowInsert = Database['public']['Tables']['audit_workflows']['Insert'];
export type AuditWorkflowUpdate = Database['public']['Tables']['audit_workflows']['Update'];

// Enum types
export type WorkflowType = 'planning' | 'execution' | 'reporting' | 'followup';
export type WorkflowStatus = 'pending' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
export type WorkflowPriority = 'low' | 'medium' | 'high' | 'critical';

// Stage definitions by workflow type
export const WORKFLOW_STAGES: Record<WorkflowType, string[]> = {
  planning: [
    'scope_definition',
    'risk_assessment',
    'resource_allocation',
    'planning_approval'
  ],
  execution: [
    'fieldwork',
    'evidence_collection',
    'testing_controls'
  ],
  reporting: [
    'draft_preparation',
    'management_review',
    'final_report'
  ],
  followup: [
    'action_tracking',
    'verification',
    'closure'
  ]
};

// Filter types
export interface AuditWorkflowFilters {
  q?: string;
  audit_id?: string;
  workflow_type?: WorkflowType;
  status?: WorkflowStatus;
  assigned_to?: string;
  priority?: WorkflowPriority;
  is_overdue?: boolean;
  sortBy?: 'created_at' | 'due_date' | 'priority' | 'status';
  sortDir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Workflow creation input
export interface CreateWorkflowInput {
  audit_id: string;
  workflow_type: WorkflowType;
  current_stage?: string;
  assigned_to?: string;
  start_date?: string;
  due_date?: string;
  priority?: WorkflowPriority;
  notes?: string;
}

// Workflow update input
export interface UpdateWorkflowInput {
  workflow_id: string;
  current_stage?: string;
  assigned_to?: string;
  due_date?: string;
  status?: WorkflowStatus;
  progress_pct?: number;
  notes?: string;
}

// Workflow progress tracking
export interface WorkflowProgress {
  workflow_type: WorkflowType;
  current_stage: string;
  progress_pct: number;
  status: WorkflowStatus;
  assigned_to?: string;
  due_date?: string;
  is_overdue: boolean;
}

// Workflow with extended details
export interface AuditWorkflowWithDetails extends AuditWorkflow {
  audit?: {
    audit_code: string;
    audit_title: string;
    audit_status: string;
  };
  assigned_user?: {
    id: string;
    email?: string;
    full_name?: string;
  };
  is_overdue: boolean;
  days_until_due?: number;
}

// Report generation types
export type AuditReportType = 'executive' | 'detailed' | 'findings_only' | 'compliance_gap';
export type ReportFormat = 'pdf' | 'excel' | 'word' | 'json';

export interface ReportOptions {
  type: AuditReportType;
  format: ReportFormat;
  include_charts?: boolean;
  include_signatures?: boolean;
  include_evidence?: boolean;
  language?: 'ar' | 'en';
}

export interface GeneratedReport {
  report_id: string;
  audit_id: string;
  type: AuditReportType;
  format: ReportFormat;
  file_url?: string;
  generated_at: string;
  generated_by: string;
  metadata?: Record<string, any>;
}

// Gap analysis types (reusing GapSeverity from compliance.types)

export interface AuditComplianceGap {
  id: string;
  framework_requirement_id: string;
  requirement_code: string;
  requirement_title: string;
  requirement_title_ar?: string;
  current_status: string;
  target_status: string;
  gap_severity: GapSeverity;
  gap_description: string;
  gap_description_ar?: string;
  recommended_actions: string[];
  linked_findings?: string[];
  estimated_effort_days?: number;
  priority: number;
}

export interface GapAnalysisResult {
  audit_id: string;
  framework_id: string;
  framework_name: string;
  total_requirements: number;
  compliant_requirements: number;
  gaps_identified: number;
  compliance_score: number;
  gaps: AuditComplianceGap[];
  risk_heat_map?: {
    severity: GapSeverity;
    count: number;
    percentage: number;
  }[];
  generated_at: string;
}

// Finding resolution tracking
export interface FindingResolution {
  finding_id: string;
  resolution_status: 'open' | 'in_progress' | 'resolved' | 'verified' | 'closed';
  resolution_date?: string;
  resolution_notes?: string;
  verified_by?: string;
  verification_date?: string;
  linked_action_id?: string;
  evidence_urls?: string[];
}

// Statistics types
export interface WorkflowStatistics {
  total_workflows: number;
  pending_workflows: number;
  in_progress_workflows: number;
  completed_workflows: number;
  overdue_workflows: number;
  avg_completion_days: number;
  by_type: {
    type: WorkflowType;
    count: number;
    completed: number;
    overdue: number;
  }[];
}
