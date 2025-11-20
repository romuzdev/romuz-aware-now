// Gate-J Part 4.1: Validation Framework - Edge Function
// Handles validation data collection and evaluation

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CollectActionParams {
  action: 'collect';
  tenantId: string;
  periodYear: number;
  periodMonth: number;
  lookbackMonths?: number;
}

interface EvaluateActionParams {
  action: 'evaluate';
  tenantId: string;
  periodYear: number;
  periodMonth: number;
}

type ValidationRequestBody = CollectActionParams | EvaluateActionParams;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const body: ValidationRequestBody = await req.json();
    const { action, tenantId, periodYear, periodMonth } = body;

    console.log(`[Validation] Action: ${action}, Tenant: ${tenantId}, Period: ${periodYear}-${periodMonth}`);

    let result;
    if (action === 'collect') {
      result = await collectValidationData(
        supabaseClient,
        tenantId,
        periodYear,
        periodMonth,
        body.lookbackMonths || 3
      );
    } else if (action === 'evaluate') {
      result = await evaluateValidationResults(
        supabaseClient,
        tenantId,
        periodYear,
        periodMonth
      );
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Validation] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Collect validation data job
 * Pulls impact scores and compares with mock HR/Compliance data
 */
async function collectValidationData(
  supabase: any,
  tenantId: string,
  periodYear: number,
  periodMonth: number,
  lookbackMonths: number
) {
  const result = {
    success: true,
    processedCount: 0,
    insertedCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    errors: [] as string[],
  };

  try {
    // Calculate period range
    const periods = generatePeriodRange(periodYear, periodMonth, lookbackMonths);

    for (const period of periods) {
      console.log(`[Collect] Processing period: ${period.year}-${period.month}`);

      // Fetch computed impact scores for this period
      const { data: scores, error: scoresError } = await supabase
        .from('awareness_impact_scores')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('period_year', period.year)
        .eq('period_month', period.month);

      if (scoresError) {
        console.error('[Collect] Error fetching scores:', scoresError);
        result.errors.push(`Period ${period.year}-${period.month}: ${scoresError.message}`);
        continue;
      }

      if (!scores || scores.length === 0) {
        console.log(`[Collect] No scores found for period ${period.year}-${period.month}`);
        result.skippedCount++;
        continue;
      }

      // Process each org unit
      for (const score of scores) {
        result.processedCount++;

        try {
          // Fetch mock HR and Compliance data
          const hrScore = getMockHRBehaviorScore(tenantId, score.org_unit_id, period.year, period.month);
          const complianceScore = getMockComplianceAlignment(tenantId, score.org_unit_id, period.year, period.month);

          // Calculate validation gap
          const computedScore = parseFloat(score.impact_score);
          const actualScore = hrScore ? hrScore.score : null;
          const validationGap = actualScore !== null ? Math.abs(computedScore - actualScore) : null;

          // Check if validation record already exists
          const { data: existing } = await supabase
            .from('awareness_impact_validations')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('org_unit_id', score.org_unit_id)
            .eq('period_year', period.year)
            .eq('period_month', period.month)
            .maybeSingle();

          const validationRecord = {
            tenant_id: tenantId,
            org_unit_id: score.org_unit_id,
            period_year: period.year,
            period_month: period.month,
            computed_impact_score: computedScore,
            actual_behavior_score: actualScore,
            compliance_alignment_score: complianceScore?.score || null,
            risk_incident_count: hrScore?.incidentCount || 0,
            validation_gap: validationGap,
            validation_status: 'pending',
            confidence_gap: null, // Will be computed in evaluate step
            data_source: 'Gate-J Validation Engine',
          };

          if (existing) {
            // Update existing record
            const { error: updateError } = await supabase
              .from('awareness_impact_validations')
              .update(validationRecord)
              .eq('id', existing.id);

            if (updateError) {
              console.error('[Collect] Update error:', updateError);
              result.errors.push(`Update failed for ${score.org_unit_id}: ${updateError.message}`);
            } else {
              result.updatedCount++;
            }
          } else {
            // Insert new record
            const { error: insertError } = await supabase
              .from('awareness_impact_validations')
              .insert(validationRecord);

            if (insertError) {
              console.error('[Collect] Insert error:', insertError);
              result.errors.push(`Insert failed for ${score.org_unit_id}: ${insertError.message}`);
            } else {
              result.insertedCount++;
            }
          }
        } catch (error) {
          console.error('[Collect] Processing error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Processing failed for ${score.org_unit_id}: ${errorMessage}`);
        }
      }
    }

    console.log('[Collect] Summary:', result);
    return result;
  } catch (error) {
    console.error('[Collect] Fatal error:', error);
    result.success = false;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMessage);
    return result;
  }
}

/**
 * Evaluate validation results job
 * Updates validation_status based on validation_gap thresholds
 */
async function evaluateValidationResults(
  supabase: any,
  tenantId: string,
  periodYear: number,
  periodMonth: number
) {
  const result = {
    success: true,
    processedCount: 0,
    insertedCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    errors: [] as string[],
  };

  try {
    // Fetch pending validations
    const { data: validations, error: fetchError } = await supabase
      .from('awareness_impact_validations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('period_year', periodYear)
      .eq('period_month', periodMonth)
      .eq('validation_status', 'pending');

    if (fetchError) {
      console.error('[Evaluate] Error fetching validations:', fetchError);
      throw fetchError;
    }

    if (!validations || validations.length === 0) {
      console.log('[Evaluate] No pending validations found');
      return result;
    }

    console.log(`[Evaluate] Processing ${validations.length} validations`);

    // Evaluate each validation
    for (const validation of validations) {
      result.processedCount++;

      try {
        const gap = validation.validation_gap;
        
        // Skip if gap is null (no actual data)
        if (gap === null) {
          result.skippedCount++;
          continue;
        }

        // Determine validation status based on gap thresholds
        let newStatus: string;
        if (gap <= 10) {
          newStatus = 'validated';
        } else if (gap > 10 && gap < 25) {
          newStatus = 'anomaly';
        } else {
          newStatus = 'calibrated';
        }

        // Calculate confidence gap (simplified v1)
        // Compare stored confidence_level from impact_scores with actual consistency
        const confidenceGap = gap > 15 ? gap * 0.5 : 0;

        // Update validation record
        const { error: updateError } = await supabase
          .from('awareness_impact_validations')
          .update({
            validation_status: newStatus,
            confidence_gap: confidenceGap,
            updated_at: new Date().toISOString(),
          })
          .eq('id', validation.id);

        if (updateError) {
          console.error('[Evaluate] Update error:', updateError);
          result.errors.push(`Update failed for ${validation.id}: ${updateError.message}`);
        } else {
          result.updatedCount++;
          console.log(`[Evaluate] Updated ${validation.id} to status: ${newStatus}, gap: ${gap}`);
        }
      } catch (error) {
        console.error('[Evaluate] Processing error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Processing failed for ${validation.id}: ${errorMessage}`);
      }
    }

    console.log('[Evaluate] Summary:', result);
    return result;
  } catch (error) {
    console.error('[Evaluate] Fatal error:', error);
    result.success = false;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMessage);
    return result;
  }
}

/**
 * Generate array of periods for lookback
 */
function generatePeriodRange(year: number, month: number, lookbackMonths: number) {
  const periods = [];
  let currentYear = year;
  let currentMonth = month;

  for (let i = 0; i < lookbackMonths; i++) {
    periods.push({ year: currentYear, month: currentMonth });

    currentMonth--;
    if (currentMonth < 1) {
      currentMonth = 12;
      currentYear--;
    }
  }

  return periods;
}

/**
 * MOCK: Generate HR behavior score
 */
function getMockHRBehaviorScore(
  tenantId: string,
  orgUnitId: string,
  year: number,
  month: number
) {
  // Generate consistent pseudo-random score based on inputs
  const seed = `${tenantId}-${orgUnitId}-${year}-${month}`.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (seed * 9301 + 49297) % 233280 / 233280;
  
  return {
    tenantId,
    orgUnitId,
    year,
    month,
    score: Math.floor(random * 40) + 60, // 60-100
    incidentCount: Math.floor(random * 5), // 0-4
  };
}

/**
 * MOCK: Generate compliance alignment score
 */
function getMockComplianceAlignment(
  tenantId: string,
  orgUnitId: string,
  year: number,
  month: number
) {
  // Generate consistent pseudo-random score based on inputs
  const seed = `${tenantId}-${orgUnitId}-${year}-${month}-compliance`.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (seed * 9301 + 49297) % 233280 / 233280;
  
  return {
    tenantId,
    orgUnitId,
    year,
    month,
    score: Math.floor(random * 30) + 70, // 70-100
    findingsCount: Math.floor(random * 3), // 0-2
  };
}
