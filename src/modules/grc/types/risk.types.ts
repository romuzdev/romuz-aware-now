/**
 * GRC Module - Risk Management Types
 * Type definitions for Risk Register, Assessments, and Treatment Plans
 */

export type RiskCategory = 
  | 'strategic' 
  | 'operational' 
  | 'financial' 
  | 'compliance' 
  | 'reputational' 
  | 'technology';

export type RiskType = 'threat' | 'opportunity';

export type RiskLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export type RiskStatus = 
  | 'identified' 
  | 'assessed' 
  | 'treated' 
  | 'monitored' 
  | 'closed';

export type TreatmentStrategy = 'avoid' | 'mitigate' | 'transfer' | 'accept';

export type RiskAppetite = 'low' | 'medium' | 'high';

export type AssessmentType = 
  | 'initial' 
  | 'periodic' 
  | 'ad_hoc' 
  | 'incident_triggered';

export type AssessmentMethod = 
  | 'qualitative' 
  | 'quantitative' 
  | 'semi_quantitative';

export type AssessmentStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export type ControlEffectivenessRating = 
  | 'effective' 
  | 'partially_effective' 
  | 'ineffective' 
  | 'not_applicable';

export type TreatmentPlanStatus = 
  | 'planned' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'on_hold';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type EffectivenessRating = 
  | 'not_started' 
  | 'poor' 
  | 'fair' 
  | 'good' 
  | 'excellent';

/**
 * Core Risk Entity
 */
export interface Risk {
  id: string;
  tenant_id: string;
  
  // Risk Identification
  risk_code: string;
  risk_title: string;
  risk_description?: string;
  risk_category: RiskCategory;
  risk_owner_id?: string;
  
  // Risk Classification
  risk_type: RiskType;
  likelihood_level: RiskLevel;
  impact_level: RiskLevel;
  
  // Risk Scoring (1-5 scale)
  likelihood_score: number;
  impact_score: number;
  inherent_risk_score: number; // Computed: likelihood * impact
  
  // Current Risk Level (after controls)
  current_likelihood_score?: number;
  current_impact_score?: number;
  residual_risk_score?: number; // Computed: current_likelihood * current_impact
  
  // Risk Status & Treatment
  risk_status: RiskStatus;
  treatment_strategy?: TreatmentStrategy;
  risk_appetite?: RiskAppetite;
  
  // Related Entities
  related_policy_ids?: string[];
  related_objective_ids?: string[];
  tags?: string[];
  
  // Metadata
  identified_date: string;
  last_review_date?: string;
  next_review_date?: string;
  is_active: boolean;
  notes?: string;
  
  // Audit Fields
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

/**
 * Risk Assessment Record
 */
export interface RiskAssessment {
  id: string;
  tenant_id: string;
  risk_id: string;
  
  // Assessment Details
  assessment_date: string;
  assessment_type: AssessmentType;
  
  // Risk Analysis
  likelihood_score: number;
  impact_score: number;
  risk_score: number; // Computed: likelihood * impact
  risk_level: RiskLevel;
  
  // Assessment Context
  assessment_method?: AssessmentMethod;
  scenario_description?: string;
  assumptions?: string;
  limitations?: string;
  
  // Participants
  assessed_by: string;
  reviewed_by?: string;
  approved_by?: string;
  approval_date?: string;
  
  // Assessment Results
  key_findings?: string;
  recommendations?: string;
  control_effectiveness_rating?: ControlEffectivenessRating;
  
  // Status
  assessment_status: AssessmentStatus;
  
  // Metadata
  notes?: string;
  attachments_json?: any[];
  
  // Audit Fields
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

/**
 * Treatment Action within a Plan
 */
export interface TreatmentAction {
  title: string;
  description?: string;
  owner_id?: string;
  due_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  completion_date?: string;
  notes?: string;
}

/**
 * Risk Treatment Plan
 */
export interface RiskTreatmentPlan {
  id: string;
  tenant_id: string;
  risk_id: string;
  
  // Treatment Plan Details
  plan_title: string;
  plan_description?: string;
  treatment_strategy: TreatmentStrategy;
  
  // Treatment Actions
  actions_json?: TreatmentAction[];
  
  // Target Risk Level
  target_likelihood_score?: number;
  target_impact_score?: number;
  target_risk_score?: number; // Computed: target_likelihood * target_impact
  
  // Plan Status & Timeline
  plan_status: TreatmentPlanStatus;
  priority: Priority;
  start_date?: string;
  due_date?: string;
  completion_date?: string;
  
  // Resources & Budget
  estimated_cost?: number;
  actual_cost?: number;
  resources_required?: string;
  
  // Ownership & Accountability
  plan_owner_id: string;
  approved_by?: string;
  approval_date?: string;
  
  // Progress Tracking
  progress_percentage: number;
  last_review_date?: string;
  next_review_date?: string;
  
  // Effectiveness
  effectiveness_rating?: EffectivenessRating;
  effectiveness_notes?: string;
  
  // Metadata
  notes?: string;
  attachments_json?: any[];
  
  // Audit Fields
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

/**
 * Risk with computed fields and related data
 */
export interface RiskWithDetails extends Risk {
  // Computed fields
  risk_level: RiskLevel; // Based on inherent_risk_score
  current_risk_level?: RiskLevel; // Based on residual_risk_score
  
  // Related data
  assessments?: RiskAssessment[];
  treatment_plans?: RiskTreatmentPlan[];
  latest_assessment?: RiskAssessment;
  active_treatment_plan?: RiskTreatmentPlan;
}

/**
 * Create Risk Input
 */
export interface CreateRiskInput {
  risk_code: string;
  risk_title: string;
  risk_description?: string;
  risk_category: RiskCategory;
  risk_owner_id?: string;
  risk_type?: RiskType;
  likelihood_score: number;
  impact_score: number;
  treatment_strategy?: TreatmentStrategy;
  risk_appetite?: RiskAppetite;
  tags?: string[];
  identified_date?: string;
  notes?: string;
}

/**
 * Update Risk Input
 */
export interface UpdateRiskInput {
  risk_title?: string;
  risk_description?: string;
  risk_category?: RiskCategory;
  risk_owner_id?: string;
  risk_type?: RiskType;
  likelihood_score?: number;
  impact_score?: number;
  current_likelihood_score?: number;
  current_impact_score?: number;
  risk_status?: RiskStatus;
  treatment_strategy?: TreatmentStrategy;
  risk_appetite?: RiskAppetite;
  tags?: string[];
  last_review_date?: string;
  next_review_date?: string;
  notes?: string;
}

/**
 * Create Risk Assessment Input
 */
export interface CreateRiskAssessmentInput {
  risk_id: string;
  assessment_date?: string;
  assessment_type?: AssessmentType;
  likelihood_score: number;
  impact_score: number;
  risk_level: RiskLevel;
  assessment_method?: AssessmentMethod;
  scenario_description?: string;
  assumptions?: string;
  limitations?: string;
  key_findings?: string;
  recommendations?: string;
  control_effectiveness_rating?: ControlEffectivenessRating;
  notes?: string;
}

/**
 * Create Treatment Plan Input
 */
export interface CreateTreatmentPlanInput {
  risk_id: string;
  plan_title: string;
  plan_description?: string;
  treatment_strategy: TreatmentStrategy;
  actions_json?: TreatmentAction[];
  target_likelihood_score?: number;
  target_impact_score?: number;
  priority?: Priority;
  start_date?: string;
  due_date?: string;
  plan_owner_id: string;
  estimated_cost?: number;
  resources_required?: string;
  notes?: string;
}

/**
 * Risk Filters for List Views
 */
export interface RiskFilters {
  q?: string; // Search query
  risk_category?: RiskCategory;
  risk_status?: RiskStatus;
  risk_level?: RiskLevel;
  risk_owner_id?: string;
  treatment_strategy?: TreatmentStrategy;
  tags?: string[];
  from?: string; // Date range start
  to?: string; // Date range end
  is_active?: boolean;
  sortBy?: 'risk_code' | 'risk_title' | 'inherent_risk_score' | 'residual_risk_score' | 'identified_date';
  sortDir?: 'asc' | 'desc';
}

/**
 * Risk Matrix Data Point
 */
export interface RiskMatrixPoint {
  risk_id: string;
  risk_code: string;
  risk_title: string;
  likelihood: number;
  impact: number;
  risk_score: number;
  risk_level: RiskLevel;
  risk_category: RiskCategory;
}

/**
 * Risk Dashboard Statistics
 */
export interface RiskStatistics {
  total_risks: number;
  active_risks: number;
  by_status: Record<RiskStatus, number>;
  by_category: Record<RiskCategory, number>;
  by_level: Record<RiskLevel, number>;
  average_inherent_score: number;
  average_residual_score: number;
  risks_needing_review: number;
  high_critical_risks: number;
}
