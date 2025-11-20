// Gate-J Part 4.1: Validation Framework - Service Layer

import { supabase } from '@/integrations/supabase/client';
import type {
  CollectValidationDataParams,
  EvaluateValidationResultsParams,
  ValidationJobResult,
  HRBehaviorScore,
  ComplianceAlignmentScore,
} from '@/modules/awareness';

/**
 * Trigger validation data collection job
 */
export async function collectValidationData(
  params: CollectValidationDataParams
): Promise<ValidationJobResult> {
  const { data, error } = await supabase.functions.invoke('validate-impact-scores', {
    body: {
      action: 'collect',
      tenantId: params.tenantId,
      periodYear: params.periodYear,
      periodMonth: params.periodMonth,
      lookbackMonths: params.lookbackMonths || 3,
    },
  });

  if (error) {
    console.error('Error collecting validation data:', error);
    throw error;
  }

  return data as ValidationJobResult;
}

/**
 * Trigger validation results evaluation job
 */
export async function evaluateValidationResults(
  params: EvaluateValidationResultsParams
): Promise<ValidationJobResult> {
  const { data, error } = await supabase.functions.invoke('validate-impact-scores', {
    body: {
      action: 'evaluate',
      tenantId: params.tenantId,
      periodYear: params.periodYear,
      periodMonth: params.periodMonth,
    },
  });

  if (error) {
    console.error('Error evaluating validation results:', error);
    throw error;
  }

  return data as ValidationJobResult;
}

/**
 * Run full validation cycle (collect + evaluate)
 */
export async function runFullValidation(
  params: CollectValidationDataParams
): Promise<{
  collectResult: ValidationJobResult;
  evaluateResult: ValidationJobResult;
}> {
  const collectResult = await collectValidationData(params);
  const evaluateResult = await evaluateValidationResults({
    tenantId: params.tenantId,
    periodYear: params.periodYear,
    periodMonth: params.periodMonth,
  });

  return { collectResult, evaluateResult };
}

/**
 * MOCK: Get HR behavioral score for an org unit
 * TODO: Replace with real HR integration
 */
export function getHRBehaviorScore(
  tenantId: string,
  orgUnitId: string,
  periodYear: number,
  periodMonth: number
): HRBehaviorScore | null {
  // Simulate real data with some randomization
  const randomScore = Math.floor(Math.random() * 40) + 60; // 60-100
  const randomIncidents = Math.floor(Math.random() * 5); // 0-4

  return {
    tenantId,
    orgUnitId,
    periodYear,
    periodMonth,
    score: randomScore,
    incidentCount: randomIncidents,
  };
}

/**
 * MOCK: Get compliance alignment score for an org unit
 * TODO: Replace with real Compliance integration
 */
export function getComplianceAlignment(
  tenantId: string,
  orgUnitId: string,
  periodYear: number,
  periodMonth: number
): ComplianceAlignmentScore | null {
  // Simulate real data with some randomization
  const randomScore = Math.floor(Math.random() * 30) + 70; // 70-100
  const randomFindings = Math.floor(Math.random() * 3); // 0-2

  return {
    tenantId,
    orgUnitId,
    periodYear,
    periodMonth,
    score: randomScore,
    findingsCount: randomFindings,
  };
}
