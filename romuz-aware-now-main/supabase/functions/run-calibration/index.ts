// Gate-J Part 4.3: Calibration Run Edge Function
// Secure admin endpoint to trigger calibration analysis

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalibrationRequest {
  tenantId: string;
  modelVersion: number;
  periodStart?: string;
  periodEnd?: string;
  runLabel?: string;
  description?: string;
}

interface CalibrationCell {
  predictedBucket: string;
  actualBucket: string;
  predictedScores: number[];
  actualScores: number[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin' || r.role === 'super_admin');
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: CalibrationRequest = await req.json();
    const { tenantId, modelVersion, periodStart, periodEnd, runLabel, description } = body;

    if (!tenantId || !modelVersion) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: tenantId, modelVersion' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting calibration run', { tenantId, modelVersion, periodStart, periodEnd });

    // Step 1: Create calibration run
    const { data: calibrationRun, error: runError } = await supabase
      .from('awareness_impact_calibration_runs')
      .insert({
        tenant_id: tenantId,
        model_version: modelVersion,
        period_start: periodStart || null,
        period_end: periodEnd || null,
        run_label: runLabel || `Calibration Run ${new Date().toISOString().split('T')[0]}`,
        description: description || null,
        created_by: user.id,
        sample_size: 0,
      })
      .select()
      .single();

    if (runError || !calibrationRun) {
      console.error('Failed to create calibration run:', runError);
      return new Response(
        JSON.stringify({ error: 'Failed to create calibration run', details: runError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calibration run created:', calibrationRun.id);

    // Step 2: Fetch validations
    let query = supabase
      .from('awareness_impact_validations')
      .select('*')
      .eq('tenant_id', tenantId)
      .not('computed_impact_score', 'is', null)
      .not('actual_behavior_score', 'is', null);

    // TODO: Add period filtering based on periodStart/periodEnd if needed

    const { data: validations, error: validationsError } = await query;

    if (validationsError) {
      console.error('Failed to fetch validations:', validationsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch validations', details: validationsError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${validations?.length || 0} validation records`);

    if (!validations || validations.length === 0) {
      return new Response(
        JSON.stringify({
          calibrationRunId: calibrationRun.id,
          message: 'No validation data available for calibration',
          metrics: { sampleSize: 0 },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Classify and group into cells
    const cellMap = new Map<string, CalibrationCell>();

    const classifyPredictedBucket = (score: number): string => {
      if (score >= 85) return 'very_low_risk';
      if (score >= 70) return 'low_risk';
      if (score >= 40) return 'medium_risk';
      return 'high_risk';
    };

    const classifyActualBucket = (score: number): string => {
      if (score >= 85) return 'very_good_behavior';
      if (score >= 70) return 'good_behavior';
      if (score >= 50) return 'average_behavior';
      if (score >= 30) return 'poor_behavior';
      return 'very_poor_behavior';
    };

    for (const validation of validations) {
      const predictedBucket = classifyPredictedBucket(validation.computed_impact_score);
      const actualBucket = classifyActualBucket(validation.actual_behavior_score);
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
      cell.predictedScores.push(validation.computed_impact_score);
      cell.actualScores.push(validation.actual_behavior_score);
    }

    console.log(`Created ${cellMap.size} calibration cells`);

    // Step 4: Create calibration cells
    const cellsToInsert = [];
    for (const [key, data] of cellMap.entries()) {
      const avgPredicted = data.predictedScores.reduce((a, b) => a + b, 0) / data.predictedScores.length;
      const avgActual = data.actualScores.reduce((a, b) => a + b, 0) / data.actualScores.length;
      const gaps = data.predictedScores.map((p, i) => Math.abs(p - data.actualScores[i]));
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;

      const diff = avgPredicted - avgActual;
      let gapDirection = 'balanced';
      if (Math.abs(diff) > 5) {
        gapDirection = diff > 0 ? 'overestimate' : 'underestimate';
      }

      const isOutlier = data.predictedScores.length < 3 || avgGap > 25;

      cellsToInsert.push({
        tenant_id: tenantId,
        calibration_run_id: calibrationRun.id,
        predicted_bucket: data.predictedBucket,
        actual_bucket: data.actualBucket,
        count_samples: data.predictedScores.length,
        avg_predicted_score: avgPredicted,
        avg_actual_score: avgActual,
        avg_gap: avgGap,
        gap_direction: gapDirection,
        is_outlier_bucket: isOutlier,
        predicted_score_min: Math.min(...data.predictedScores),
        predicted_score_max: Math.max(...data.predictedScores),
        actual_score_min: Math.min(...data.actualScores),
        actual_score_max: Math.max(...data.actualScores),
      });
    }

    const { error: cellsError } = await supabase
      .from('awareness_impact_calibration_cells')
      .insert(cellsToInsert);

    if (cellsError) {
      console.error('Failed to insert cells:', cellsError);
    }

    // Step 5: Calculate run-level metrics
    const allGaps = validations.map(v => Math.abs(v.computed_impact_score - v.actual_behavior_score));
    const avgValidationGap = allGaps.reduce((a, b) => a + b, 0) / allGaps.length;
    const maxValidationGap = Math.max(...allGaps);
    const minValidationGap = Math.min(...allGaps);
    const correlationScore = Math.max(0, 100 - avgValidationGap);

    let overallStatus = 'bad';
    if (avgValidationGap <= 10 && correlationScore >= 75) {
      overallStatus = 'good';
    } else if (avgValidationGap <= 20) {
      overallStatus = 'needs_tuning';
    }

    // Update calibration run
    await supabase
      .from('awareness_impact_calibration_runs')
      .update({
        sample_size: validations.length,
        avg_validation_gap: avgValidationGap,
        max_validation_gap: maxValidationGap,
        min_validation_gap: minValidationGap,
        correlation_score: correlationScore,
        overall_status: overallStatus,
      })
      .eq('id', calibrationRun.id);

    console.log('Calibration run metrics updated');

    // Step 6: Generate weight suggestion
    const { data: currentWeights } = await supabase
      .from('awareness_impact_weights')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .single();

    if (!currentWeights) {
      console.warn('No active weights found, skipping weight suggestion');
      return new Response(
        JSON.stringify({
          calibrationRunId: calibrationRun.id,
          metrics: {
            sampleSize: validations.length,
            avgValidationGap,
            correlationScore,
            overallStatus,
          },
          message: 'Calibration completed but no weight suggestion generated (no active weights)',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Analyze patterns
    let overestimationInLowRisk = 0;
    let underestimationInHighRisk = 0;
    let totalWeight = 0;

    for (const cell of cellsToInsert) {
      if (cell.is_outlier_bucket) continue;
      
      const weight = cell.count_samples;
      totalWeight += weight;

      if (
        (cell.predicted_bucket === 'very_low_risk' || cell.predicted_bucket === 'low_risk') &&
        (cell.actual_bucket === 'poor_behavior' || cell.actual_bucket === 'very_poor_behavior')
      ) {
        overestimationInLowRisk += weight;
      }

      if (
        (cell.predicted_bucket === 'high_risk' || cell.predicted_bucket === 'medium_risk') &&
        (cell.actual_bucket === 'good_behavior' || cell.actual_bucket === 'very_good_behavior')
      ) {
        underestimationInHighRisk += weight;
      }
    }

    const overestimationRatio = totalWeight > 0 ? overestimationInLowRisk / totalWeight : 0;
    const underestimationRatio = totalWeight > 0 ? underestimationInHighRisk / totalWeight : 0;

    let suggestedEngagement = currentWeights.engagement_weight;
    let suggestedCompletion = currentWeights.completion_weight;
    let suggestedFeedbackQuality = currentWeights.feedback_quality_weight;
    let suggestedComplianceLinkage = currentWeights.compliance_linkage_weight;

    let rationale = '';

    if (overestimationRatio > 0.2) {
      suggestedComplianceLinkage += 0.05;
      suggestedEngagement -= 0.03;
      suggestedCompletion -= 0.02;
      rationale += 'Overestimation in low-risk segments. Increasing compliance weight. ';
    }

    if (underestimationRatio > 0.2) {
      suggestedComplianceLinkage -= 0.03;
      suggestedFeedbackQuality += 0.02;
      suggestedEngagement += 0.01;
      rationale += 'Underestimation in high-risk segments. Decreasing compliance weight. ';
    }

    if (overestimationRatio <= 0.2 && underestimationRatio <= 0.2) {
      rationale = 'No significant bias detected. Weights are well-calibrated.';
    }

    // Normalize
    let sum = suggestedEngagement + suggestedCompletion + suggestedFeedbackQuality + suggestedComplianceLinkage;
    suggestedEngagement /= sum;
    suggestedCompletion /= sum;
    suggestedFeedbackQuality /= sum;
    suggestedComplianceLinkage /= sum;

    // Clamp
    suggestedEngagement = Math.max(0.1, Math.min(0.5, suggestedEngagement));
    suggestedCompletion = Math.max(0.1, Math.min(0.5, suggestedCompletion));
    suggestedFeedbackQuality = Math.max(0.1, Math.min(0.5, suggestedFeedbackQuality));
    suggestedComplianceLinkage = Math.max(0.1, Math.min(0.5, suggestedComplianceLinkage));

    // Re-normalize
    sum = suggestedEngagement + suggestedCompletion + suggestedFeedbackQuality + suggestedComplianceLinkage;
    suggestedEngagement /= sum;
    suggestedCompletion /= sum;
    suggestedFeedbackQuality /= sum;
    suggestedComplianceLinkage /= sum;

    // Create suggestion
    const { data: suggestion, error: suggestionError } = await supabase
      .from('awareness_impact_weight_suggestions')
      .insert({
        tenant_id: tenantId,
        calibration_run_id: calibrationRun.id,
        source_weight_version: currentWeights.version,
        suggested_weight_version: currentWeights.version + 1,
        suggested_engagement_weight: suggestedEngagement,
        suggested_completion_weight: suggestedCompletion,
        suggested_feedback_quality_weight: suggestedFeedbackQuality,
        suggested_compliance_linkage_weight: suggestedComplianceLinkage,
        rationale: rationale.trim(),
        status: 'draft',
      })
      .select()
      .single();

    console.log('Weight suggestion created:', suggestion?.id);

    return new Response(
      JSON.stringify({
        calibrationRunId: calibrationRun.id,
        metrics: {
          sampleSize: validations.length,
          avgValidationGap,
          maxValidationGap,
          minValidationGap,
          correlationScore,
          overallStatus,
        },
        weightSuggestion: suggestion ? {
          id: suggestion.id,
          sourceVersion: currentWeights.version,
          suggestedVersion: currentWeights.version + 1,
          weights: {
            engagement: suggestedEngagement,
            completion: suggestedCompletion,
            feedbackQuality: suggestedFeedbackQuality,
            complianceLinkage: suggestedComplianceLinkage,
          },
          rationale,
        } : null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Calibration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
