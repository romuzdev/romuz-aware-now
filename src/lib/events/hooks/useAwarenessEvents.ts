/**
 * Awareness Impact Scoring Module - Event Integration Hook
 * 
 * Integration between Awareness module and Event System
 */

import { useCallback } from 'react';
import { useEventBus } from '../useEventBus';
import type { PublishEventParams } from '../event.types';

export function useAwarenessEvents() {
  const { publishEvent } = useEventBus();

  /**
   * Impact Score Calculated Event
   */
  const publishImpactScoreCalculated = useCallback(async (
    scoreId: string,
    scoreData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'impact_score_calculated',
      event_category: 'awareness',
      source_module: 'awareness_impact',
      entity_type: 'impact_score',
      entity_id: scoreId,
      priority: 'medium',
      payload: {
        org_unit_id: scoreData.org_unit_id,
        period_month: scoreData.period_month,
        period_year: scoreData.period_year,
        impact_score: scoreData.impact_score,
        completion_score: scoreData.completion_score,
        engagement_score: scoreData.engagement_score,
        risk_level: scoreData.risk_level,
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Calibration Completed Event
   */
  const publishCalibrationCompleted = useCallback(async (
    runId: string,
    calibrationData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'calibration_completed',
      event_category: 'awareness',
      source_module: 'awareness_impact',
      entity_type: 'calibration_run',
      entity_id: runId,
      priority: 'high',
      payload: {
        model_version: calibrationData.model_version,
        sample_size: calibrationData.sample_size,
        avg_validation_gap: calibrationData.avg_validation_gap,
        correlation_score: calibrationData.correlation_score,
        overall_status: calibrationData.overall_status,
        completed_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  return {
    publishImpactScoreCalculated,
    publishCalibrationCompleted,
  };
}
