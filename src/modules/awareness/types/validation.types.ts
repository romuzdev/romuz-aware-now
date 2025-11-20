// ============================================================================
// Gate-J Part 4.1: Validation Framework Types
// ============================================================================

export type ValidationStatus = 'pending' | 'validated' | 'anomaly' | 'calibrated';

export interface ImpactValidation {
  id: string;
  tenantId: string;
  orgUnitId: string;
  periodYear: number;
  periodMonth: number;
  
  // Reference data
  computedImpactScore: number;
  actualBehaviorScore: number | null;
  complianceAlignmentScore: number | null;
  riskIncidentCount: number | null;
  
  // Validation metrics
  validationGap: number | null;
  validationStatus: ValidationStatus;
  confidenceGap: number | null;
  
  // Meta
  dataSource: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CollectValidationDataParams {
  tenantId: string;
  periodYear: number;
  periodMonth: number;
  lookbackMonths?: number; // Default: 3
}

export interface EvaluateValidationResultsParams {
  tenantId: string;
  periodYear: number;
  periodMonth: number;
}

export interface ValidationJobResult {
  success: boolean;
  processedCount: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: string[];
}

export interface HRBehaviorScore {
  tenantId: string;
  orgUnitId: string;
  periodYear: number;
  periodMonth: number;
  score: number; // 0-100
  incidentCount: number;
}

export interface ComplianceAlignmentScore {
  tenantId: string;
  orgUnitId: string;
  periodYear: number;
  periodMonth: number;
  score: number; // 0-100
  findingsCount: number;
}
