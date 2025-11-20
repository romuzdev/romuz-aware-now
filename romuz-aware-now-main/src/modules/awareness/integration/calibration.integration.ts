// Gate-J Part 4.2: Calibration Data Model - Supabase Integration

import { supabase } from '@/integrations/supabase/client';
import type {
  CalibrationRun,
  CreateCalibrationRunParams,
  CalibrationCell,
  CreateCalibrationCellParams,
  WeightSuggestion,
  CreateWeightSuggestionParams,
  UpdateWeightSuggestionStatusParams,
  CalibrationStats,
  CalibrationRunFilters,
  WeightSuggestionFilters,
  OverallStatus,
  SuggestionStatus,
} from '../types';

// ============================================================================
// Calibration Runs
// ============================================================================

/**
 * Fetch calibration runs for a tenant
 */
export async function fetchCalibrationRuns(
  tenantId: string,
  filters?: {
    modelVersion?: number;
    overallStatus?: OverallStatus;
    periodStart?: string;
    periodEnd?: string;
  }
) {
  let query = supabase
    .from('awareness_impact_calibration_runs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.modelVersion) {
    query = query.eq('model_version', filters.modelVersion);
  }
  if (filters?.overallStatus) {
    query = query.eq('overall_status', filters.overallStatus);
  }
  if (filters?.periodStart) {
    query = query.gte('period_start', filters.periodStart);
  }
  if (filters?.periodEnd) {
    query = query.lte('period_end', filters.periodEnd);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching calibration runs:', error);
    throw error;
  }

  return (data || []).map(mapCalibrationRun);
}

/**
 * Fetch a single calibration run by ID
 */
export async function fetchCalibrationRunById(id: string) {
  const { data, error } = await supabase
    .from('awareness_impact_calibration_runs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching calibration run:', error);
    throw error;
  }

  return mapCalibrationRun(data);
}

/**
 * Create a new calibration run
 */
export async function createCalibrationRun(
  params: CreateCalibrationRunParams
): Promise<CalibrationRun> {
  const payload = {
    tenant_id: params.tenantId,
    model_version: params.modelVersion,
    period_start: params.periodStart,
    period_end: params.periodEnd,
    run_label: params.runLabel,
    description: params.description,
    created_by: params.createdBy,
  };

  const { data, error } = await supabase
    .from('awareness_impact_calibration_runs')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('Error creating calibration run:', error);
    throw error;
  }

  return mapCalibrationRun(data);
}

/**
 * Update calibration run metrics
 */
export async function updateCalibrationRunMetrics(
  id: string,
  metrics: {
    sampleSize?: number;
    avgValidationGap?: number;
    maxValidationGap?: number;
    minValidationGap?: number;
    correlationScore?: number;
    overallStatus?: OverallStatus;
  }
) {
  const payload = {
    sample_size: metrics.sampleSize,
    avg_validation_gap: metrics.avgValidationGap,
    max_validation_gap: metrics.maxValidationGap,
    min_validation_gap: metrics.minValidationGap,
    correlation_score: metrics.correlationScore,
    overall_status: metrics.overallStatus,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('awareness_impact_calibration_runs')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating calibration run:', error);
    throw error;
  }

  return mapCalibrationRun(data);
}

/**
 * Delete a calibration run
 */
export async function deleteCalibrationRun(id: string) {
  const { error } = await supabase
    .from('awareness_impact_calibration_runs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting calibration run:', error);
    throw error;
  }
}

// ============================================================================
// Calibration Cells
// ============================================================================

/**
 * Fetch calibration cells for a run
 */
export async function fetchCalibrationCells(
  tenantId: string,
  calibrationRunId: string
) {
  const { data, error } = await supabase
    .from('awareness_impact_calibration_cells')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('calibration_run_id', calibrationRunId)
    .order('predicted_bucket')
    .order('actual_bucket');

  if (error) {
    console.error('Error fetching calibration cells:', error);
    throw error;
  }

  return (data || []).map(mapCalibrationCell);
}

/**
 * Create a calibration cell
 */
export async function createCalibrationCell(
  params: CreateCalibrationCellParams
): Promise<CalibrationCell> {
  const payload = {
    calibration_run_id: params.calibrationRunId,
    tenant_id: params.tenantId,
    predicted_bucket: params.predictedBucket,
    predicted_score_min: params.predictedScoreMin,
    predicted_score_max: params.predictedScoreMax,
    actual_bucket: params.actualBucket,
    actual_score_min: params.actualScoreMin,
    actual_score_max: params.actualScoreMax,
    count_samples: params.countSamples,
    avg_predicted_score: params.avgPredictedScore,
    avg_actual_score: params.avgActualScore,
    avg_gap: params.avgGap,
    gap_direction: params.gapDirection,
    is_outlier_bucket: params.isOutlierBucket || false,
    notes: params.notes,
  };

  const { data, error } = await supabase
    .from('awareness_impact_calibration_cells')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('Error creating calibration cell:', error);
    throw error;
  }

  return mapCalibrationCell(data);
}

/**
 * Batch create calibration cells
 */
export async function batchCreateCalibrationCells(
  cells: CreateCalibrationCellParams[]
): Promise<CalibrationCell[]> {
  const payload = cells.map(cell => ({
    calibration_run_id: cell.calibrationRunId,
    tenant_id: cell.tenantId,
    predicted_bucket: cell.predictedBucket,
    predicted_score_min: cell.predictedScoreMin,
    predicted_score_max: cell.predictedScoreMax,
    actual_bucket: cell.actualBucket,
    actual_score_min: cell.actualScoreMin,
    actual_score_max: cell.actualScoreMax,
    count_samples: cell.countSamples,
    avg_predicted_score: cell.avgPredictedScore,
    avg_actual_score: cell.avgActualScore,
    avg_gap: cell.avgGap,
    gap_direction: cell.gapDirection,
    is_outlier_bucket: cell.isOutlierBucket || false,
    notes: cell.notes,
  }));

  const { data, error } = await supabase
    .from('awareness_impact_calibration_cells')
    .insert(payload)
    .select();

  if (error) {
    console.error('Error batch creating calibration cells:', error);
    throw error;
  }

  return (data || []).map(mapCalibrationCell);
}

// ============================================================================
// Weight Suggestions
// ============================================================================

/**
 * Fetch weight suggestions for a tenant
 */
export async function fetchWeightSuggestions(
  tenantId: string,
  filters?: {
    calibrationRunId?: string;
    status?: SuggestionStatus;
  }
) {
  let query = supabase
    .from('awareness_impact_weight_suggestions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.calibrationRunId) {
    query = query.eq('calibration_run_id', filters.calibrationRunId);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching weight suggestions:', error);
    throw error;
  }

  return (data || []).map(mapWeightSuggestion);
}

/**
 * Create a weight suggestion
 */
export async function createWeightSuggestion(
  params: CreateWeightSuggestionParams
): Promise<WeightSuggestion> {
  const payload = {
    tenant_id: params.tenantId,
    calibration_run_id: params.calibrationRunId,
    source_weight_version: params.sourceWeightVersion,
    suggested_weight_version: params.suggestedWeightVersion,
    suggested_engagement_weight: params.suggestedEngagementWeight,
    suggested_completion_weight: params.suggestedCompletionWeight,
    suggested_feedback_quality_weight: params.suggestedFeedbackQualityWeight,
    suggested_compliance_linkage_weight: params.suggestedComplianceLinkageWeight,
    rationale: params.rationale,
    status: params.status || 'draft',
  };

  const { data, error } = await supabase
    .from('awareness_impact_weight_suggestions')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('Error creating weight suggestion:', error);
    throw error;
  }

  return mapWeightSuggestion(data);
}

/**
 * Update weight suggestion status
 */
export async function updateWeightSuggestionStatus(
  params: UpdateWeightSuggestionStatusParams
): Promise<WeightSuggestion> {
  const payload: any = {
    status: params.status,
    updated_at: new Date().toISOString(),
  };

  if (params.approvedBy) {
    payload.approved_by = params.approvedBy;
    payload.approved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('awareness_impact_weight_suggestions')
    .update(payload)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating weight suggestion status:', error);
    throw error;
  }

  return mapWeightSuggestion(data);
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get calibration statistics for a tenant
 */
export async function fetchCalibrationStats(
  tenantId: string
): Promise<CalibrationStats> {
  const { data, error } = await supabase
    .from('awareness_impact_calibration_runs')
    .select('sample_size, avg_validation_gap, overall_status')
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Error fetching calibration stats:', error);
    throw error;
  }

  const total = data.length;
  const avgSample = total > 0
    ? data.reduce((sum, r) => sum + (r.sample_size || 0), 0) / total
    : 0;
  const avgGap = total > 0
    ? data.reduce((sum, r) => sum + (r.avg_validation_gap || 0), 0) / total
    : 0;

  const statusBreakdown = {
    good: data.filter(r => r.overall_status === 'good').length,
    needs_tuning: data.filter(r => r.overall_status === 'needs_tuning').length,
    bad: data.filter(r => r.overall_status === 'bad').length,
    experimental: data.filter(r => r.overall_status === 'experimental').length,
  };

  return {
    totalRuns: total,
    avgSampleSize: avgSample,
    avgValidationGap: avgGap,
    statusBreakdown,
  };
}

// ============================================================================
// Mappers
// ============================================================================

function mapCalibrationRun(raw: any): CalibrationRun {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    modelVersion: raw.model_version,
    periodStart: raw.period_start,
    periodEnd: raw.period_end,
    runLabel: raw.run_label,
    description: raw.description,
    sampleSize: raw.sample_size,
    avgValidationGap: raw.avg_validation_gap ? parseFloat(raw.avg_validation_gap) : null,
    maxValidationGap: raw.max_validation_gap ? parseFloat(raw.max_validation_gap) : null,
    minValidationGap: raw.min_validation_gap ? parseFloat(raw.min_validation_gap) : null,
    correlationScore: raw.correlation_score ? parseFloat(raw.correlation_score) : null,
    overallStatus: raw.overall_status,
    createdBy: raw.created_by,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function mapCalibrationCell(raw: any): CalibrationCell {
  return {
    id: raw.id,
    calibrationRunId: raw.calibration_run_id,
    tenantId: raw.tenant_id,
    predictedBucket: raw.predicted_bucket,
    predictedScoreMin: raw.predicted_score_min ? parseFloat(raw.predicted_score_min) : null,
    predictedScoreMax: raw.predicted_score_max ? parseFloat(raw.predicted_score_max) : null,
    actualBucket: raw.actual_bucket,
    actualScoreMin: raw.actual_score_min ? parseFloat(raw.actual_score_min) : null,
    actualScoreMax: raw.actual_score_max ? parseFloat(raw.actual_score_max) : null,
    countSamples: raw.count_samples,
    avgPredictedScore: raw.avg_predicted_score ? parseFloat(raw.avg_predicted_score) : null,
    avgActualScore: raw.avg_actual_score ? parseFloat(raw.avg_actual_score) : null,
    avgGap: raw.avg_gap ? parseFloat(raw.avg_gap) : null,
    gapDirection: raw.gap_direction,
    isOutlierBucket: raw.is_outlier_bucket,
    notes: raw.notes,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function mapWeightSuggestion(raw: any): WeightSuggestion {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    calibrationRunId: raw.calibration_run_id,
    sourceWeightVersion: raw.source_weight_version,
    suggestedWeightVersion: raw.suggested_weight_version,
    suggestedEngagementWeight: raw.suggested_engagement_weight 
      ? parseFloat(raw.suggested_engagement_weight) : null,
    suggestedCompletionWeight: raw.suggested_completion_weight 
      ? parseFloat(raw.suggested_completion_weight) : null,
    suggestedFeedbackQualityWeight: raw.suggested_feedback_quality_weight 
      ? parseFloat(raw.suggested_feedback_quality_weight) : null,
    suggestedComplianceLinkageWeight: raw.suggested_compliance_linkage_weight 
      ? parseFloat(raw.suggested_compliance_linkage_weight) : null,
    rationale: raw.rationale,
    status: raw.status,
    approvedBy: raw.approved_by,
    approvedAt: raw.approved_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}
