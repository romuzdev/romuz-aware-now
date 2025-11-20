// Gate-J Part 4.3: Calibration Service Layer
// Implements validation logic and scoring rules

import { supabase } from '@/integrations/supabase/client';
import {
  createCalibrationRun,
  updateCalibrationRunMetrics,
  batchCreateCalibrationCells,
  createWeightSuggestion,
} from '@/modules/awareness/integration';
import { fetchValidations } from '@/lib/shared';
import type {
  CalibrationRun,
  CreateCalibrationRunParams,
  CalibrationCell,
  WeightSuggestion,
  CreateCalibrationCellParams,
  PredictedBucket,
  ActualBucket,
  GapDirection,
  OverallStatus,
  ImpactValidation,
  ImpactWeight,
} from '@/modules/awareness';

/**
 * Start a new calibration run
 */
export async function startCalibrationRun(
  params: CreateCalibrationRunParams
): Promise<CalibrationRun> {
  const run = await createCalibrationRun(params);
  console.log('Calibration run created:', run.id, { tenantId: params.tenantId, modelVersion: params.modelVersion });
  return run;
}

/**
 * Build calibration cells from validation data
 */
export async function buildCalibrationFromValidations(
  tenantId: string,
  calibrationRunId: string
): Promise<CalibrationCell[]> {
  console.log('Building calibration cells for run:', calibrationRunId);

  // Fetch the calibration run to determine period window
  const { data: runData, error: runError } = await supabase
    .from('awareness_impact_calibration_runs')
    .select('*')
    .eq('id', calibrationRunId)
    .eq('tenant_id', tenantId)
    .single();

  if (runError || !runData) {
    throw new Error(`Calibration run not found: ${calibrationRunId}`);
  }

  // Fetch validations within the period (if specified)
  const filters: any = {};
  if (runData.period_start && runData.period_end) {
    // Filter by period_year and period_month that fall within range
    // Simplified: fetch all and filter in memory for v1
  }

  const validations = await fetchValidations(tenantId, filters);
  
  // Filter validations with both scores present
  const validValidations = validations.filter(
    v => v.computedImpactScore != null && v.actualBehaviorScore != null
  );

  console.log(`Found ${validValidations.length} valid validation records`);

  if (validValidations.length === 0) {
    console.warn('No validation records with complete scores found');
    return [];
  }

  // Group validations by (predicted_bucket, actual_bucket)
  const cellMap = new Map<string, {
    predictedBucket: string;
    actualBucket: string;
    predictedScores: number[];
    actualScores: number[];
  }>();

  for (const validation of validValidations) {
    const predictedBucket = classifyPredictedBucket(validation.computedImpactScore);
    const actualBucket = classifyActualBucket(validation.actualBehaviorScore!);
    const key = `${predictedBucket}:${actualBucket}`;

    if (!cellMap.has(key)) {
      cellMap.set(key, {
        predictedBucket,
        actualBucket,
        predictedScores: [],
        actualScores: [],
      });
    }

    const cell = cellMap.get(key)!;
    cell.predictedScores.push(validation.computedImpactScore);
    cell.actualScores.push(validation.actualBehaviorScore!);
  }

  // Create calibration cells
  const cellsToCreate: CreateCalibrationCellParams[] = [];

  for (const [key, data] of cellMap.entries()) {
    const avgPredicted = data.predictedScores.reduce((a, b) => a + b, 0) / data.predictedScores.length;
    const avgActual = data.actualScores.reduce((a, b) => a + b, 0) / data.actualScores.length;
    const gaps = data.predictedScores.map((p, i) => Math.abs(p - data.actualScores[i]));
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const gapDirection = determineGapDirection(avgPredicted - avgActual) as GapDirection;

    const minThreshold = 3;
    const isOutlier = data.predictedScores.length < minThreshold || avgGap > 25;

    cellsToCreate.push({
      tenantId,
      calibrationRunId,
      predictedBucket: data.predictedBucket as PredictedBucket,
      actualBucket: data.actualBucket as ActualBucket,
      countSamples: data.predictedScores.length,
      avgPredictedScore: avgPredicted,
      avgActualScore: avgActual,
      avgGap,
      gapDirection,
      isOutlierBucket: isOutlier,
      predictedScoreMin: Math.min(...data.predictedScores),
      predictedScoreMax: Math.max(...data.predictedScores),
      actualScoreMin: Math.min(...data.actualScores),
      actualScoreMax: Math.max(...data.actualScores),
    });
  }

  console.log(`Creating ${cellsToCreate.length} calibration cells`);
  const cells = await batchCreateCalibrationCells(cellsToCreate);

  // Calculate run-level metrics
  const allGaps = validValidations.map(v => 
    Math.abs(v.computedImpactScore - v.actualBehaviorScore!)
  );
  const avgValidationGap = allGaps.reduce((a, b) => a + b, 0) / allGaps.length;
  const maxValidationGap = Math.max(...allGaps);
  const minValidationGap = Math.min(...allGaps);

  // Simple correlation score (v1 approximation)
  const correlationScore = Math.max(0, 100 - avgValidationGap);

  // Determine overall status
  let overallStatus: OverallStatus;
  if (avgValidationGap <= 10 && correlationScore >= 75) {
    overallStatus = 'good';
  } else if (avgValidationGap <= 20) {
    overallStatus = 'needs_tuning';
  } else {
    overallStatus = 'bad';
  }

  // Update calibration run metrics
  await updateCalibrationRunMetrics(calibrationRunId, {
    sampleSize: validValidations.length,
    avgValidationGap,
    maxValidationGap,
    minValidationGap,
    correlationScore,
    overallStatus,
  });

  console.log('Calibration run metrics updated:', {
    sampleSize: validValidations.length,
    avgValidationGap,
    overallStatus,
  });

  return cells;
}

/**
 * Generate weight adjustment suggestions based on calibration cells
 */
export async function generateWeightSuggestion(
  tenantId: string,
  calibrationRunId: string
): Promise<WeightSuggestion> {
  console.log('Generating weight suggestion for run:', calibrationRunId);

  // Fetch calibration cells
  const { data: cells, error: cellsError } = await supabase
    .from('awareness_impact_calibration_cells')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('calibration_run_id', calibrationRunId);

  if (cellsError || !cells) {
    throw new Error('Failed to fetch calibration cells');
  }

  // Fetch current active weights
  const { data: currentWeights, error: weightsError } = await supabase
    .from('awareness_impact_weights')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .single();

  if (weightsError || !currentWeights) {
    throw new Error('No active weights found for tenant');
  }

  // Analyze patterns
  let overestimationInLowRisk = 0;
  let underestimationInHighRisk = 0;
  let totalWeight = 0;

  for (const cell of cells) {
    if (cell.is_outlier_bucket) continue; // Skip outliers
    
    const weight = cell.count_samples;
    totalWeight += weight;

    // Overestimation: predicted low/very_low risk but actual poor/very_poor behavior
    if (
      (cell.predicted_bucket === 'very_low_risk' || cell.predicted_bucket === 'low_risk') &&
      (cell.actual_bucket === 'poor_behavior' || cell.actual_bucket === 'very_poor_behavior')
    ) {
      overestimationInLowRisk += weight;
    }

    // Underestimation: predicted high/medium risk but actual good/very_good behavior
    if (
      (cell.predicted_bucket === 'high_risk' || cell.predicted_bucket === 'medium_risk') &&
      (cell.actual_bucket === 'good_behavior' || cell.actual_bucket === 'very_good_behavior')
    ) {
      underestimationInHighRisk += weight;
    }
  }

  // Calculate adjustment factors
  const overestimationRatio = totalWeight > 0 ? overestimationInLowRisk / totalWeight : 0;
  const underestimationRatio = totalWeight > 0 ? underestimationInHighRisk / totalWeight : 0;

  // Start with current weights
  let suggestedEngagement = currentWeights.engagement_weight;
  let suggestedCompletion = currentWeights.completion_weight;
  let suggestedFeedbackQuality = currentWeights.feedback_quality_weight;
  let suggestedComplianceLinkage = currentWeights.compliance_linkage_weight;

  let rationale = '';

  // Apply heuristics
  if (overestimationRatio > 0.2) {
    // Significant overestimation → increase compliance weight, decrease engagement
    suggestedComplianceLinkage += 0.05;
    suggestedEngagement -= 0.03;
    suggestedCompletion -= 0.02;
    rationale += 'Overestimation detected in low-risk segments with poor behavior. Increasing compliance linkage weight. ';
  }

  if (underestimationRatio > 0.2) {
    // Significant underestimation → decrease compliance weight, increase feedback/engagement
    suggestedComplianceLinkage -= 0.03;
    suggestedFeedbackQuality += 0.02;
    suggestedEngagement += 0.01;
    rationale += 'Underestimation detected in high-risk segments with good behavior. Decreasing compliance weight. ';
  }

  if (overestimationRatio <= 0.2 && underestimationRatio <= 0.2) {
    rationale = 'No significant bias detected. Weights are well-calibrated.';
  }

  // Normalize weights to sum to 1.0
  const sum = suggestedEngagement + suggestedCompletion + suggestedFeedbackQuality + suggestedComplianceLinkage;
  suggestedEngagement /= sum;
  suggestedCompletion /= sum;
  suggestedFeedbackQuality /= sum;
  suggestedComplianceLinkage /= sum;

  // Clamp to reasonable bounds [0.1, 0.5]
  suggestedEngagement = Math.max(0.1, Math.min(0.5, suggestedEngagement));
  suggestedCompletion = Math.max(0.1, Math.min(0.5, suggestedCompletion));
  suggestedFeedbackQuality = Math.max(0.1, Math.min(0.5, suggestedFeedbackQuality));
  suggestedComplianceLinkage = Math.max(0.1, Math.min(0.5, suggestedComplianceLinkage));

  // Re-normalize after clamping
  const finalSum = suggestedEngagement + suggestedCompletion + suggestedFeedbackQuality + suggestedComplianceLinkage;
  suggestedEngagement /= finalSum;
  suggestedCompletion /= finalSum;
  suggestedFeedbackQuality /= finalSum;
  suggestedComplianceLinkage /= finalSum;

  // Create weight suggestion
  const suggestion = await createWeightSuggestion({
    tenantId,
    calibrationRunId,
    sourceWeightVersion: currentWeights.version,
    suggestedWeightVersion: currentWeights.version + 1,
    suggestedEngagementWeight: suggestedEngagement,
    suggestedCompletionWeight: suggestedCompletion,
    suggestedFeedbackQualityWeight: suggestedFeedbackQuality,
    suggestedComplianceLinkageWeight: suggestedComplianceLinkage,
    rationale: rationale.trim() || 'Weights adjusted based on calibration analysis.',
    status: 'draft',
  });

  console.log('Weight suggestion created:', suggestion.id, {
    sourceVersion: currentWeights.version,
    suggestedVersion: currentWeights.version + 1,
  });

  return suggestion;
}

/**
 * Run full calibration analysis (orchestrator function)
 */
export async function runCalibrationAnalysis(
  tenantId: string,
  modelVersion: number,
  periodStart: string,
  periodEnd: string,
  runLabel?: string,
  description?: string,
  createdBy?: string
): Promise<{
  calibrationRun: CalibrationRun;
  cells: CalibrationCell[];
  suggestions: WeightSuggestion[];
}> {
  console.log('Starting full calibration analysis', { tenantId, modelVersion, periodStart, periodEnd });

  // Step 1: Create calibration run
  const calibrationRun = await startCalibrationRun({
    tenantId,
    modelVersion,
    periodStart,
    periodEnd,
    runLabel,
    description,
    createdBy,
  });

  // Step 2: Build calibration cells from validations
  const cells = await buildCalibrationFromValidations(tenantId, calibrationRun.id);

  // Step 3: Generate weight suggestion
  const suggestion = await generateWeightSuggestion(tenantId, calibrationRun.id);

  console.log('Calibration analysis completed', {
    runId: calibrationRun.id,
    cellsCreated: cells.length,
    suggestionId: suggestion.id,
  });

  return {
    calibrationRun,
    cells,
    suggestions: [suggestion],
  };
}

/**
 * PLACEHOLDER: Classify predicted bucket from impact score
 * 
 * Maps impact_score (0-100) to risk level buckets:
 * - 85-100: very_low_risk
 * - 70-84: low_risk
 * - 50-69: medium_risk
 * - 0-49: high_risk
 */
export function classifyPredictedBucket(impactScore: number): string {
  if (impactScore >= 85) return 'very_low_risk';
  if (impactScore >= 70) return 'low_risk';
  if (impactScore >= 40) return 'medium_risk';
  return 'high_risk';
}

/**
 * PLACEHOLDER: Classify actual bucket from behavior score
 * 
 * Maps actual_behavior_score (0-100) to behavior buckets:
 * - 85-100: very_good_behavior
 * - 70-84: good_behavior
 * - 50-69: average_behavior
 * - 30-49: poor_behavior
 * - 0-29: very_poor_behavior
 */
export function classifyActualBucket(behaviorScore: number): string {
  if (behaviorScore >= 85) return 'very_good_behavior';
  if (behaviorScore >= 70) return 'good_behavior';
  if (behaviorScore >= 50) return 'average_behavior';
  if (behaviorScore >= 30) return 'poor_behavior';
  return 'very_poor_behavior';
}

/**
 * PLACEHOLDER: Determine gap direction
 * 
 * Compares predicted vs actual to classify bias:
 * - gap <= 5: balanced
 * - predicted > actual (positive gap): overestimate
 * - predicted < actual (negative gap): underestimate
 */
export function determineGapDirection(gap: number): string {
  if (Math.abs(gap) <= 5) return 'balanced';
  return gap > 0 ? 'overestimate' : 'underestimate';
}

/**
 * Approve and apply weight suggestion
 */
export async function approveAndApplyWeightSuggestion(
  suggestionId: string,
  approvedBy: string
): Promise<void> {
  console.log('Approving weight suggestion:', suggestionId);

  // Fetch the suggestion
  const { data: suggestion, error: fetchError } = await supabase
    .from('awareness_impact_weight_suggestions')
    .select('*')
    .eq('id', suggestionId)
    .single();

  if (fetchError || !suggestion) {
    throw new Error('Weight suggestion not found');
  }

  // Update suggestion status to approved
  const { error: updateError } = await supabase
    .from('awareness_impact_weight_suggestions')
    .update({
      status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    })
    .eq('id', suggestionId);

  if (updateError) {
    throw new Error('Failed to update suggestion status');
  }

  // Deactivate current active weights
  const { error: deactivateError } = await supabase
    .from('awareness_impact_weights')
    .update({ is_active: false })
    .eq('tenant_id', suggestion.tenant_id)
    .eq('is_active', true);

  if (deactivateError) {
    throw new Error('Failed to deactivate current weights');
  }

  // Create new weight version
  const { error: createError } = await supabase
    .from('awareness_impact_weights')
    .insert({
      tenant_id: suggestion.tenant_id,
      version: suggestion.suggested_weight_version,
      is_active: true,
      engagement_weight: suggestion.suggested_engagement_weight,
      completion_weight: suggestion.suggested_completion_weight,
      feedback_quality_weight: suggestion.suggested_feedback_quality_weight,
      compliance_linkage_weight: suggestion.suggested_compliance_linkage_weight,
      label: `Calibrated Weights v${suggestion.suggested_weight_version}`,
      notes: `Applied from calibration suggestion ${suggestionId}`,
    });

  if (createError) {
    throw new Error('Failed to create new weight version');
  }

  // Update suggestion status to applied
  await supabase
    .from('awareness_impact_weight_suggestions')
    .update({ status: 'applied' })
    .eq('id', suggestionId);

  console.log('Weight suggestion applied successfully', {
    suggestionId,
    newVersion: suggestion.suggested_weight_version,
  });
}
