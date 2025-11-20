/**
 * Committees Module - Workflow Types
 * D4 Enhancement
 */

export type CommitteeWorkflowState = 
  | 'draft'
  | 'in_progress'
  | 'review'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled';

export type CommitteeWorkflowType = 
  | 'meeting_approval'
  | 'decision_review'
  | 'document_approval'
  | 'member_onboarding'
  | 'budget_approval'
  | 'custom';

export type WorkflowPriority = 'low' | 'medium' | 'high' | 'urgent';

export type WorkflowStageType = 'approval' | 'review' | 'action' | 'notification';

export interface CommitteeWorkflow {
  id: string;
  tenant_id: string;
  committee_id: string;
  workflow_type: CommitteeWorkflowType;
  title: string;
  description?: string;
  current_stage_id?: string;
  state: CommitteeWorkflowState;
  priority: WorkflowPriority;
  due_date?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  metadata?: Record<string, any>;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  committee?: {
    name: string;
    code: string;
  };
  stages?: CommitteeWorkflowStage[];
}

export interface CommitteeWorkflowStage {
  id: string;
  workflow_id: string;
  stage_order: number;
  stage_name: string;
  stage_type: WorkflowStageType;
  assigned_to?: string;
  state: CommitteeWorkflowState;
  started_at?: string;
  completed_at?: string;
  notes?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WorkflowFormData {
  committee_id: string;
  workflow_type: CommitteeWorkflowType;
  title: string;
  description?: string;
  priority: WorkflowPriority;
  due_date?: string;
  stages: {
    stage_order: number;
    stage_name: string;
    stage_type: WorkflowStageType;
    assigned_to?: string;
  }[];
}

export interface WorkflowFilters {
  state?: CommitteeWorkflowState;
  workflow_type?: CommitteeWorkflowType;
  committee_id?: string;
  priority?: WorkflowPriority;
}
