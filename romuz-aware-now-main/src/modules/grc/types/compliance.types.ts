/**
 * GRC Compliance Types
 * Types for compliance frameworks, requirements, and gaps
 */

import { Database } from '@/integrations/supabase/types';

// Database types
export type ComplianceFramework = Database['public']['Tables']['grc_compliance_frameworks']['Row'];
export type ComplianceRequirement = Database['public']['Tables']['grc_compliance_requirements']['Row'];
export type ComplianceGap = Database['public']['Tables']['grc_compliance_gaps']['Row'];

// Insert types
export type ComplianceFrameworkInsert = Database['public']['Tables']['grc_compliance_frameworks']['Insert'];
export type ComplianceRequirementInsert = Database['public']['Tables']['grc_compliance_requirements']['Insert'];
export type ComplianceGapInsert = Database['public']['Tables']['grc_compliance_gaps']['Insert'];

// Update types
export type ComplianceFrameworkUpdate = Database['public']['Tables']['grc_compliance_frameworks']['Update'];
export type ComplianceRequirementUpdate = Database['public']['Tables']['grc_compliance_requirements']['Update'];
export type ComplianceGapUpdate = Database['public']['Tables']['grc_compliance_gaps']['Update'];

// Enum types
export type FrameworkType = 'regulatory' | 'industry_standard' | 'best_practice' | 'internal';
export type FrameworkStatus = 'active' | 'deprecated' | 'under_review';
export type ComplianceStatus = 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_assessed' | 'not_applicable';
export type CompliancePriority = 'critical' | 'high' | 'medium' | 'low';
export type GapType = 'policy' | 'process' | 'technology' | 'people' | 'documentation';
export type GapStatus = 'open' | 'in_progress' | 'remediated' | 'accepted' | 'mitigated' | 'closed';
export type GapSeverity = 'critical' | 'high' | 'medium' | 'low';

// Filter types
export interface ComplianceFrameworkFilters {
  q?: string;
  framework_type?: FrameworkType;
  framework_status?: FrameworkStatus;
  sortBy?: 'framework_code' | 'framework_name' | 'overall_compliance_score' | 'created_at';
  sortDir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ComplianceRequirementFilters {
  q?: string;
  framework_id?: string;
  compliance_status?: ComplianceStatus;
  priority?: CompliancePriority;
  category?: string;
  domain?: string;
  sortBy?: 'requirement_code' | 'requirement_title' | 'priority' | 'created_at';
  sortDir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ComplianceGapFilters {
  q?: string;
  requirement_id?: string;
  gap_status?: GapStatus;
  severity?: GapSeverity;
  gap_type?: GapType;
  sortBy?: 'identified_date' | 'severity' | 'target_closure_date' | 'gap_status';
  sortDir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Statistics types
export interface ComplianceStatistics {
  total_frameworks: number;
  active_frameworks: number;
  avg_compliance_score: number;
  total_requirements: number;
  compliant_requirements: number;
  non_compliant_requirements: number;
  total_gaps: number;
  critical_gaps: number;
  open_gaps: number;
}

// Framework with requirements
export interface FrameworkWithRequirements extends ComplianceFramework {
  requirements?: ComplianceRequirement[];
}

// Requirement with gaps
export interface RequirementWithGaps extends ComplianceRequirement {
  gaps?: ComplianceGap[];
}
