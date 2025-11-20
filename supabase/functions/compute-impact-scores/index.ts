// Gate-J: Awareness Impact Score Computation Engine
// Formula: weighted sum of normalized engagement, completion, feedback, and compliance scores

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Default weights (fallback if no active configuration exists)
const DEFAULT_WEIGHTS = {
  engagement_weight: 0.25,
  completion_weight: 0.25,
  feedback_quality_weight: 0.25,
  compliance_linkage_weight: 0.25,
};

interface InputMetrics {
  engagement_score: number | null;
  completion_score: number | null;
  feedback_quality_score: number | null;
  compliance_linkage_score: number | null;
}

interface ComputedResult {
  impact_score: number;
  risk_level: 'very_low' | 'low' | 'medium' | 'high';
  confidence_level: number;
}

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Normalize a score to 0-1 range
 */
function normalizeScore(score: number | null): number {
  if (score === null || score === undefined) return 0;
  return clamp(score, 0, 100) / 100;
}

/**
 * Compute impact score using weighted sum formula
 */
function computeImpactScore(
  metrics: InputMetrics,
  weights: typeof DEFAULT_WEIGHTS
): ComputedResult {
  // Step 1: Normalize input scores to 0-1 range
  const engagement_norm = normalizeScore(metrics.engagement_score);
  const completion_norm = normalizeScore(metrics.completion_score);
  const feedback_norm = normalizeScore(metrics.feedback_quality_score);
  const compliance_norm = normalizeScore(metrics.compliance_linkage_score);

  // Step 2: Compute weighted sum
  const base_score = clamp(
    engagement_norm * weights.engagement_weight +
    completion_norm * weights.completion_weight +
    feedback_norm * weights.feedback_quality_weight +
    compliance_norm * weights.compliance_linkage_weight,
    0.0,
    1.0
  );

  // Step 3: Convert to 0-100 score and round to 2 decimals
  const impact_score = Math.round(base_score * 100 * 100) / 100;

  // Step 4: Derive risk level from impact score
  let risk_level: 'very_low' | 'low' | 'medium' | 'high';
  if (impact_score < 40) {
    risk_level = 'high'; // High risk, low impact
  } else if (impact_score < 70) {
    risk_level = 'medium';
  } else if (impact_score < 85) {
    risk_level = 'low';
  } else {
    risk_level = 'very_low'; // Very low risk, very high impact
  }

  // Step 5: Compute confidence level (v1 placeholder)
  // Start at 90%, reduce by 10 per missing metric, floor at 50
  const missing_metrics = [
    metrics.engagement_score,
    metrics.completion_score,
    metrics.feedback_quality_score,
    metrics.compliance_linkage_score,
  ].filter(m => m === null || m === undefined).length;

  const confidence_level = clamp(90 - (missing_metrics * 10), 50, 99);

  return {
    impact_score,
    risk_level,
    confidence_level,
  };
}

/**
 * Fetch active weight configuration for tenant
 */
async function fetchActiveWeights(supabase: any, tenantId: string) {
  const { data, error } = await supabase
    .from('awareness_impact_weights')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching weights:', error);
    return DEFAULT_WEIGHTS;
  }

  if (!data) {
    console.log(`No active weights found for tenant ${tenantId}, using defaults`);
    return DEFAULT_WEIGHTS;
  }

  return {
    engagement_weight: parseFloat(data.engagement_weight),
    completion_weight: parseFloat(data.completion_weight),
    feedback_quality_weight: parseFloat(data.feedback_quality_weight),
    compliance_linkage_weight: parseFloat(data.compliance_linkage_weight),
  };
}

/**
 * Fetch input metrics from Gate-I analytics
 * TODO: Replace with actual org_unit_id when organizational structure is defined
 * Currently using campaign_id as placeholder for org_unit_id
 */
async function fetchInputMetrics(
  supabase: any,
  tenantId: string,
  orgUnitId: string,
  periodYear: number,
  periodMonth: number
): Promise<InputMetrics | null> {
  // Try to fetch from mv_awareness_campaign_kpis (Gate-I materialized view)
  // Using campaign_id as temporary org_unit_id
  const { data, error } = await supabase
    .from('mv_awareness_campaign_kpis')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('campaign_id', orgUnitId) // TODO: Replace with org_unit_id when available
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching input metrics:', error);
    return null;
  }

  if (!data) {
    console.log(`No metrics found for tenant ${tenantId}, org ${orgUnitId}, period ${periodYear}-${periodMonth}`);
    return null;
  }

  // Map Gate-I KPIs to impact engine input metrics
  // Note: This is a v1 placeholder mapping. Adjust based on actual requirements.
  return {
    engagement_score: data.started_rate || null, // Engagement = started rate
    completion_score: data.completion_rate || null, // Completion = completion rate
    feedback_quality_score: data.avg_score || null, // Feedback = average score
    compliance_linkage_score: null, // TODO: Link with compliance data when available
  };
}

/**
 * Compute and upsert impact score for a single org unit
 */
async function computeImpactScoreForOrgUnit(
  supabase: any,
  tenantId: string,
  orgUnitId: string,
  periodYear: number,
  periodMonth: number
) {
  console.log(`Computing impact score for tenant ${tenantId}, org ${orgUnitId}, period ${periodYear}-${periodMonth}`);

  // Step 1: Fetch input metrics from Gate-I
  const metrics = await fetchInputMetrics(supabase, tenantId, orgUnitId, periodYear, periodMonth);
  
  if (!metrics) {
    console.warn(`No data available for org ${orgUnitId}, skipping`);
    return { success: false, reason: 'no_data' };
  }

  // Step 2: Fetch active weights
  const weights = await fetchActiveWeights(supabase, tenantId);

  // Step 3: Compute impact score using formula
  const result = computeImpactScore(metrics, weights);

  // Step 4: Upsert into awareness_impact_scores
  const payload = {
    tenant_id: tenantId,
    org_unit_id: orgUnitId,
    period_year: periodYear,
    period_month: periodMonth,
    engagement_score: metrics.engagement_score || 0,
    completion_score: metrics.completion_score || 0,
    feedback_quality_score: metrics.feedback_quality_score || 0,
    compliance_linkage_score: metrics.compliance_linkage_score || 0,
    impact_score: result.impact_score,
    risk_level: result.risk_level,
    confidence_level: result.confidence_level,
    data_source: 'Gate-J:formula_v1',
  };

  const { error: upsertError } = await supabase
    .from('awareness_impact_scores')
    .upsert(payload, {
      onConflict: 'tenant_id,org_unit_id,period_year,period_month',
    });

  if (upsertError) {
    console.error('Error upserting impact score:', upsertError);
    return { success: false, reason: 'upsert_error', error: upsertError };
  }

  console.log(`✅ Impact score computed: ${result.impact_score}, risk: ${result.risk_level}, confidence: ${result.confidence_level}%`);
  return { success: true, result };
}

/**
 * Recompute impact scores for all org units in a tenant for a given period
 */
async function recomputeImpactScoresForTenant(
  supabase: any,
  tenantId: string,
  periodYear: number,
  periodMonth: number
) {
  console.log(`🔄 Recomputing impact scores for tenant ${tenantId}, period ${periodYear}-${periodMonth}`);

  // Step 1: Enumerate all org units (campaigns) with data in Gate-I
  // TODO: Replace with actual org_units table when available
  const { data: campaigns, error: campaignsError } = await supabase
    .from('mv_awareness_campaign_kpis')
    .select('campaign_id')
    .eq('tenant_id', tenantId);

  if (campaignsError) {
    console.error('Error fetching org units:', campaignsError);
    throw new Error('Failed to fetch org units');
  }

  if (!campaigns || campaigns.length === 0) {
    console.log('No org units found for tenant');
    return {
      total: 0,
      processed: 0,
      successful: 0,
      skipped: 0,
      failed: 0,
    };
  }

  // Step 2: Process each org unit (campaign)
  const stats = {
    total: campaigns.length,
    processed: 0,
    successful: 0,
    skipped: 0,
    failed: 0,
  };

  for (const campaign of campaigns) {
    const result = await computeImpactScoreForOrgUnit(
      supabase,
      tenantId,
      campaign.campaign_id,
      periodYear,
      periodMonth
    );

    stats.processed++;

    if (result.success) {
      stats.successful++;
    } else if (result.reason === 'no_data') {
      stats.skipped++;
    } else {
      stats.failed++;
    }
  }

  console.log(`✅ Batch recomputation complete:`, stats);
  return stats;
}

/**
 * Main Edge Function handler
 */
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

    // Parse request body
    const { action, tenantId, orgUnitId, periodYear, periodMonth } = await req.json();

    // Validate required parameters
    if (!tenantId || !periodYear || !periodMonth) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: tenantId, periodYear, periodMonth' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;

    // Route based on action
    if (action === 'compute_single' && orgUnitId) {
      // Compute for a single org unit
      result = await computeImpactScoreForOrgUnit(
        supabase,
        tenantId,
        orgUnitId,
        periodYear,
        periodMonth
      );
    } else if (action === 'recompute_tenant') {
      // Recompute for all org units in tenant
      result = await recomputeImpactScoresForTenant(
        supabase,
        tenantId,
        periodYear,
        periodMonth
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "compute_single" or "recompute_tenant"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in compute-impact-scores function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
