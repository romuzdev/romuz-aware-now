/**
 * Culture Index Module - Event Integration Hook
 * 
 * Integration between Culture Index and Event System
 */

import { useCallback } from 'react';
import { useEventBus } from '../useEventBus';
import type { PublishEventParams } from '../event.types';

export function useCultureEvents() {
  const { publishEvent } = useEventBus();

  /**
   * Survey Completed Event
   */
  const publishSurveyCompleted = useCallback(async (
    surveyId: string,
    userId: string,
    surveyData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'survey_completed',
      event_category: 'culture',
      source_module: 'culture_index',
      entity_type: 'survey_response',
      entity_id: `${surveyId}_${userId}`,
      priority: 'low',
      payload: {
        survey_id: surveyId,
        user_id: userId,
        survey_title: surveyData.title,
        completed_at: new Date().toISOString(),
        response_count: surveyData.response_count,
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Culture Score Calculated Event
   */
  const publishCultureScoreCalculated = useCallback(async (
    scoreId: string,
    scoreData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'culture_score_calculated',
      event_category: 'culture',
      source_module: 'culture_index',
      entity_type: 'culture_score',
      entity_id: scoreId,
      priority: 'high',
      payload: {
        org_unit_id: scoreData.org_unit_id,
        culture_score: scoreData.culture_score,
        awareness_dimension: scoreData.awareness_dimension,
        compliance_dimension: scoreData.compliance_dimension,
        engagement_dimension: scoreData.engagement_dimension,
        period: scoreData.period,
        calculated_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  return {
    publishSurveyCompleted,
    publishCultureScoreCalculated,
  };
}
