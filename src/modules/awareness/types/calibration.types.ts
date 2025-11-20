// ============================================================================
// Awareness Module - Calibration Types
// Gate-J Part 4.2: Calibration Data Model Types
// ============================================================================

export type OverallStatus = 'good' | 'needs_tuning' | 'bad' | 'experimental';

export type PredictedBucket = 
  | 'very_low_risk' 
  | 'low_risk' 
  | 'medium_risk' 
  | 'high_risk';

export type ActualBucket = 
  | 'very_good_behavior' 
  | 'good_behavior' 
  | 'average_behavior' 
  | 'poor_behavior' 
  | 'very_poor_behavior';

export type GapDirection = 'overestimate' | 'underestimate' | 'balanced';

export type SuggestionStatus = 
  | 'draft' 
  | 'proposed' 
  | 'approved' 
  | 'rejected' 
  | 'applied';

// ============================================================================
// Calibration Run
// ============================================================================

export interface CalibrationRun {
  id: string;
  tenantId: string;
  
  // Scope & versioning
  modelVersion: number;
  periodStart: string | null; // ISO date
  periodEnd: string | null;   // ISO date
  runLabel: string | null;
  description: string | null;
  
  // Aggregated metrics
  sampleSize: number;
  avgValidationGap: number | null;
  maxValidationGap: number | null;
  minValidationGap: number | null;
  correlationScore: number | null;
  
  // Overall quality
  overallStatus: OverallStatus | null;
  
  // Lifecycle
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalibrationRunParams {
  tenantId: string;
  modelVersion: number;
  periodStart?: string;
  periodEnd?: string;
  runLabel?: string;
  description?: string;
  createdBy?: string;
}

// ============================================================================
// Calibration Cell (Matrix)
// ============================================================================

export interface CalibrationCell {
  id: string;
  calibrationRunId: string;
  tenantId: string;
  
  // Predicted dimension
  predictedBucket: PredictedBucket;
  predictedScoreMin: number | null;
  predictedScoreMax: number | null;
  
  // Actual dimension
  actualBucket: ActualBucket;
  actualScoreMin: number | null;
  actualScoreMax: number | null;
  
  // Metrics
  countSamples: number;
  avgPredictedScore: number | null;
  avgActualScore: number | null;
  avgGap: number | null;
  gapDirection: GapDirection | null;
  
  // Quality flags
  isOutlierBucket: boolean;
  notes: string | null;
  
  // Audit
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalibrationCellParams {
  calibrationRunId: string;
  tenantId: string;
  predictedBucket: PredictedBucket;
  actualBucket: ActualBucket;
  countSamples: number;
  avgPredictedScore?: number;
  avgActualScore?: number;
  avgGap?: number;
  gapDirection?: GapDirection;
  predictedScoreMin?: number;
  predictedScoreMax?: number;
  actualScoreMin?: number;
  actualScoreMax?: number;
  isOutlierBucket?: boolean;
  notes?: string;
}

// ============================================================================
// Weight Suggestions
// ============================================================================

export interface WeightSuggestion {
  id: string;
  tenantId: string;
  calibrationRunId: string;
  
  // Version tracking
  sourceWeightVersion: number;
  suggestedWeightVersion: number;
  
  // Suggested weights
  suggestedEngagementWeight: number | null;
  suggestedCompletionWeight: number | null;
  suggestedFeedbackQualityWeight: number | null;
  suggestedComplianceLinkageWeight: number | null;
  
  // Approval workflow
  rationale: string | null;
  status: SuggestionStatus | null;
  approvedBy: string | null;
  approvedAt: string | null;
  
  // Audit
  createdAt: string;
  updatedAt: string;
}

export interface CreateWeightSuggestionParams {
  tenantId: string;
  calibrationRunId: string;
  sourceWeightVersion: number;
  suggestedWeightVersion: number;
  suggestedEngagementWeight?: number;
  suggestedCompletionWeight?: number;
  suggestedFeedbackQualityWeight?: number;
  suggestedComplianceLinkageWeight?: number;
  rationale?: string;
  status?: SuggestionStatus;
}

export interface UpdateWeightSuggestionStatusParams {
  id: string;
  status: SuggestionStatus;
  approvedBy?: string;
  notes?: string;
}

// ============================================================================
// Calibration Statistics
// ============================================================================

export interface CalibrationStats {
  totalRuns: number;
  avgSampleSize: number;
  avgValidationGap: number;
  statusBreakdown: {
    good: number;
    needs_tuning: number;
    bad: number;
    experimental: number;
  };
}

// ============================================================================
// Query Params
// ============================================================================

export interface CalibrationRunFilters {
  modelVersion?: number;
  overallStatus?: OverallStatus;
  fromDate?: string;
  toDate?: string;
}

export interface WeightSuggestionFilters {
  calibrationRunId?: string;
  status?: SuggestionStatus;
}
