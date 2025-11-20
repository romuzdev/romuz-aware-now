/**
 * GRC Audit Types
 * Types for audits and audit findings
 */

import { Database } from '@/integrations/supabase/types';

// Database types
export type Audit = Database['public']['Tables']['grc_audits']['Row'];
export type AuditFinding = Database['public']['Tables']['grc_audit_findings']['Row'];

// Insert types
export type AuditInsert = Database['public']['Tables']['grc_audits']['Insert'];
export type AuditFindingInsert = Database['public']['Tables']['grc_audit_findings']['Insert'];

// Update types
export type AuditUpdate = Database['public']['Tables']['grc_audits']['Update'];
export type AuditFindingUpdate = Database['public']['Tables']['grc_audit_findings']['Update'];

// Enum types
export type AuditType = 'internal' | 'external' | 'compliance' | 'operational' | 'financial' | 'it';
export type AuditStatus = 'planned' | 'in_progress' | 'fieldwork_complete' | 'report_draft' | 'report_final' | 'closed';
export type AuditRating = 'satisfactory' | 'needs_improvement' | 'unsatisfactory';
export type FindingType = 'deficiency' | 'observation' | 'opportunity' | 'non_compliance';
export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'informational';
export type FindingStatus = 'open' | 'in_progress' | 'resolved' | 'verified' | 'accepted_risk' | 'closed';

// Filter types
export interface AuditFilters {
  q?: string;
  audit_type?: AuditType;
  audit_status?: AuditStatus;
  framework_id?: string;
  lead_auditor_id?: string;
  sortBy?: 'audit_code' | 'audit_title' | 'planned_start_date' | 'audit_status' | 'created_at';
  sortDir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface AuditFindingFilters {
  q?: string;
  audit_id?: string;
  finding_status?: FindingStatus;
  severity?: FindingSeverity;
  finding_type?: FindingType;
  responsible_user_id?: string;
  sortBy?: 'finding_code' | 'severity' | 'identified_date' | 'target_closure_date' | 'finding_status';
  sortDir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Statistics types
export interface AuditStatistics {
  total_audits: number;
  in_progress_audits: number;
  completed_audits: number;
  total_findings: number;
  critical_findings: number;
  open_findings: number;
  closed_findings: number;
  avg_closure_days: number;
}

// Audit with findings
export interface AuditWithFindings extends Audit {
  findings?: AuditFinding[];
}

// Finding with linked entities
export interface FindingWithDetails extends AuditFinding {
  audit?: Audit;
  responsible_user?: {
    id: string;
    email?: string;
    full_name?: string;
  };
}
