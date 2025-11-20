// Gate-J: Awareness Impact Engine - Service Layer
// Client-side service for invoking impact score computation

import { supabase } from '@/integrations/supabase/client';
import type { ComputeImpactScoreParams, RecomputeImpactScoresForTenantParams } from '@/modules/awareness';

/**
 * Compute impact score for a single org unit
 */
export async function computeImpactScoreForOrgUnit(params: ComputeImpactScoreParams) {
  const { data, error } = await supabase.functions.invoke('compute-impact-scores', {
    body: {
      action: 'compute_single',
      tenantId: params.tenantId,
      orgUnitId: params.orgUnitId,
      periodYear: params.periodYear,
      periodMonth: params.periodMonth,
    },
  });

  if (error) {
    console.error('Error computing impact score:', error);
    throw error;
  }

  return data;
}

/**
 * Recompute impact scores for all org units in a tenant for a given period
 */
export async function recomputeImpactScoresForTenant(params: RecomputeImpactScoresForTenantParams) {
  const { data, error } = await supabase.functions.invoke('compute-impact-scores', {
    body: {
      action: 'recompute_tenant',
      tenantId: params.tenantId,
      periodYear: params.periodYear,
      periodMonth: params.periodMonth,
    },
  });

  if (error) {
    console.error('Error recomputing impact scores:', error);
    throw error;
  }

  return data;
}
