// Gate-J: Impact Score Formula Engine (Client-Side Implementation)
// This is a pure TypeScript implementation for testing and validation

import type { InputMetrics, ComputedImpactResult } from '@/modules/awareness';

/**
 * Default weights configuration (fallback)
 */
export const DEFAULT_WEIGHTS = {
  engagementWeight: 0.25,
  completionWeight: 0.25,
  feedbackQualityWeight: 0.25,
  complianceLinkageWeight: 0.25,
};

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Normalize a score to 0-1 range
 */
export function normalizeScore(score: number | null): number {
  if (score === null || score === undefined) return 0;
  return clamp(score, 0, 100) / 100;
}

/**
 * Compute impact score using the canonical formula (v1)
 * 
 * Formula:
 * 1. Normalize each input score to 0-1 range
 * 2. Compute weighted sum: Σ(normalized_score * weight)
 * 3. Clamp to [0, 1]
 * 4. Convert to 0-100 scale and round to 2 decimals
 * 5. Derive risk level from impact score
 * 6. Compute confidence level based on missing metrics
 */
export function computeImpactScore(
  metrics: InputMetrics,
  weights = DEFAULT_WEIGHTS
): ComputedImpactResult {
  // Step 1: Normalize input scores to 0-1 range
  const engagementNorm = normalizeScore(metrics.engagementScore);
  const completionNorm = normalizeScore(metrics.completionScore);
  const feedbackNorm = normalizeScore(metrics.feedbackQualityScore);
  const complianceNorm = normalizeScore(metrics.complianceLinkageScore);

  // Step 2: Compute weighted sum
  const baseScore = clamp(
    engagementNorm * weights.engagementWeight +
    completionNorm * weights.completionWeight +
    feedbackNorm * weights.feedbackQualityWeight +
    complianceNorm * weights.complianceLinkageWeight,
    0.0,
    1.0
  );

  // Step 3: Convert to 0-100 score and round to 2 decimals
  const impactScore = Math.round(baseScore * 100 * 100) / 100;

  // Step 4: Derive risk level from impact score
  let riskLevel: 'very_low' | 'low' | 'medium' | 'high';
  if (impactScore < 40) {
    riskLevel = 'high'; // High risk, low impact
  } else if (impactScore < 70) {
    riskLevel = 'medium';
  } else if (impactScore < 85) {
    riskLevel = 'low';
  } else {
    riskLevel = 'very_low'; // Very low risk, very high impact
  }

  // Step 5: Compute confidence level (v1 placeholder)
  // Start at 90%, reduce by 10 per missing metric, floor at 50
  const missingMetrics = [
    metrics.engagementScore,
    metrics.completionScore,
    metrics.feedbackQualityScore,
    metrics.complianceLinkageScore,
  ].filter(m => m === null || m === undefined).length;

  const confidenceLevel = clamp(90 - (missingMetrics * 10), 50, 99);

  return {
    impactScore,
    riskLevel,
    confidenceLevel,
  };
}

/**
 * Get risk level color for UI display
 */
export function getRiskLevelColor(riskLevel: ComputedImpactResult['riskLevel']): string {
  const colors = {
    very_low: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    high: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  };
  return colors[riskLevel];
}

/**
 * Get risk level label (localized)
 */
export function getRiskLevelLabel(riskLevel: ComputedImpactResult['riskLevel']): string {
  const labels = {
    very_low: 'Very Low Risk',
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
  };
  return labels[riskLevel];
}

/**
 * Validate weights configuration
 * Returns true if weights sum to approximately 1.0 (±0.01 tolerance)
 */
export function validateWeights(weights: typeof DEFAULT_WEIGHTS): boolean {
  const sum = 
    weights.engagementWeight +
    weights.completionWeight +
    weights.feedbackQualityWeight +
    weights.complianceLinkageWeight;
  
  return Math.abs(sum - 1.0) <= 0.01;
}

/**
 * Test the formula with sample data
 */
export function testFormula() {
  console.log('=== Gate-J Formula Engine Test ===\n');

  // Test Case 1: Perfect scores (all 100)
  const test1 = computeImpactScore({
    engagementScore: 100,
    completionScore: 100,
    feedbackQualityScore: 100,
    complianceLinkageScore: 100,
  });
  console.log('Test 1 (Perfect Scores):');
  console.log(`  Impact: ${test1.impactScore}, Risk: ${test1.riskLevel}, Confidence: ${test1.confidenceLevel}%`);
  console.log(`  Expected: 100, very_low, 90%`);
  console.log(`  ✓ Pass: ${test1.impactScore === 100 && test1.riskLevel === 'very_low' && test1.confidenceLevel === 90}\n`);

  // Test Case 2: Zero scores (all 0)
  const test2 = computeImpactScore({
    engagementScore: 0,
    completionScore: 0,
    feedbackQualityScore: 0,
    complianceLinkageScore: 0,
  });
  console.log('Test 2 (Zero Scores):');
  console.log(`  Impact: ${test2.impactScore}, Risk: ${test2.riskLevel}, Confidence: ${test2.confidenceLevel}%`);
  console.log(`  Expected: 0, high, 90%`);
  console.log(`  ✓ Pass: ${test2.impactScore === 0 && test2.riskLevel === 'high' && test2.confidenceLevel === 90}\n`);

  // Test Case 3: Mixed scores
  const test3 = computeImpactScore({
    engagementScore: 80,
    completionScore: 70,
    feedbackQualityScore: 85,
    complianceLinkageScore: 75,
  });
  console.log('Test 3 (Mixed Scores: 80, 70, 85, 75):');
  console.log(`  Impact: ${test3.impactScore}, Risk: ${test3.riskLevel}, Confidence: ${test3.confidenceLevel}%`);
  console.log(`  Expected: 77.5, low, 90%`);
  console.log(`  ✓ Pass: ${test3.impactScore === 77.5 && test3.riskLevel === 'low' && test3.confidenceLevel === 90}\n`);

  // Test Case 4: One missing metric
  const test4 = computeImpactScore({
    engagementScore: 80,
    completionScore: 70,
    feedbackQualityScore: 85,
    complianceLinkageScore: null,
  });
  console.log('Test 4 (One Missing Metric):');
  console.log(`  Impact: ${test4.impactScore}, Risk: ${test4.riskLevel}, Confidence: ${test4.confidenceLevel}%`);
  console.log(`  Expected: ~58.75, medium, 80%`);
  console.log(`  ✓ Pass: ${test4.riskLevel === 'medium' && test4.confidenceLevel === 80}\n`);

  // Test Case 5: All missing metrics
  const test5 = computeImpactScore({
    engagementScore: null,
    completionScore: null,
    feedbackQualityScore: null,
    complianceLinkageScore: null,
  });
  console.log('Test 5 (All Missing):');
  console.log(`  Impact: ${test5.impactScore}, Risk: ${test5.riskLevel}, Confidence: ${test5.confidenceLevel}%`);
  console.log(`  Expected: 0, high, 50%`);
  console.log(`  ✓ Pass: ${test5.impactScore === 0 && test5.riskLevel === 'high' && test5.confidenceLevel === 50}\n`);

  // Test Case 6: Boundary - exactly 40 (medium)
  const test6 = computeImpactScore({
    engagementScore: 40,
    completionScore: 40,
    feedbackQualityScore: 40,
    complianceLinkageScore: 40,
  });
  console.log('Test 6 (Boundary at 40):');
  console.log(`  Impact: ${test6.impactScore}, Risk: ${test6.riskLevel}, Confidence: ${test6.confidenceLevel}%`);
  console.log(`  Expected: 40, medium, 90%`);
  console.log(`  ✓ Pass: ${test6.impactScore === 40 && test6.riskLevel === 'medium' && test6.confidenceLevel === 90}\n`);

  // Test Case 7: Boundary - exactly 85 (very_low)
  const test7 = computeImpactScore({
    engagementScore: 85,
    completionScore: 85,
    feedbackQualityScore: 85,
    complianceLinkageScore: 85,
  });
  console.log('Test 7 (Boundary at 85):');
  console.log(`  Impact: ${test7.impactScore}, Risk: ${test7.riskLevel}, Confidence: ${test7.confidenceLevel}%`);
  console.log(`  Expected: 85, very_low, 90%`);
  console.log(`  ✓ Pass: ${test7.impactScore === 85 && test7.riskLevel === 'very_low' && test7.confidenceLevel === 90}\n`);

  console.log('=== All Tests Complete ===');
}
