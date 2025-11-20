/**
 * Awareness Application Module - Event Integration Hook
 * 
 * Integration between Awareness App and Event System
 * Handles: Campaigns, Participants, Modules, Feedback, Impact Scores
 */

import { useCallback } from 'react';
import { useEventBus } from '@/lib/events/useEventBus';
import type { PublishEventParams } from '@/lib/events/event.types';

export function useAwarenessAppEvents() {
  const { publishEvent } = useEventBus();

  /**
   * Campaign Participant Enrolled Event
   */
  const publishParticipantEnrolled = useCallback(async (
    campaignId: string,
    participantData: {
      participant_id: string;
      employee_ref: string;
      enrolled_by: string;
      is_required: boolean;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'participant_enrolled',
      event_category: 'awareness',
      source_module: 'awareness_app',
      entity_type: 'campaign_participant',
      entity_id: participantData.participant_id,
      priority: 'medium',
      payload: {
        campaign_id: campaignId,
        participant_id: participantData.participant_id,
        employee_ref: participantData.employee_ref,
        enrolled_by: participantData.enrolled_by,
        is_required: participantData.is_required,
        enrolled_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Module Completion Event
   */
  const publishModuleCompleted = useCallback(async (
    moduleData: {
      module_id: string;
      campaign_id: string;
      participant_id: string;
      module_title: string;
      completion_time_seconds: number;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'module_completed',
      event_category: 'awareness',
      source_module: 'awareness_app',
      entity_type: 'campaign_module',
      entity_id: moduleData.module_id,
      priority: 'low',
      payload: {
        module_id: moduleData.module_id,
        campaign_id: moduleData.campaign_id,
        participant_id: moduleData.participant_id,
        module_title: moduleData.module_title,
        completion_time_seconds: moduleData.completion_time_seconds,
        completed_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Campaign Feedback Submitted Event
   */
  const publishFeedbackSubmitted = useCallback(async (
    feedbackData: {
      feedback_id: string;
      campaign_id: string;
      participant_id: string;
      score: number;
      comment?: string;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'feedback_submitted',
      event_category: 'awareness',
      source_module: 'awareness_app',
      entity_type: 'campaign_feedback',
      entity_id: feedbackData.feedback_id,
      priority: 'low',
      payload: {
        feedback_id: feedbackData.feedback_id,
        campaign_id: feedbackData.campaign_id,
        participant_id: feedbackData.participant_id,
        score: feedbackData.score,
        comment: feedbackData.comment,
        submitted_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Campaign Status Changed Event
   */
  const publishCampaignStatusChanged = useCallback(async (
    campaignId: string,
    statusData: {
      old_status: string;
      new_status: string;
      changed_by: string;
      reason?: string;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'campaign_status_changed',
      event_category: 'awareness',
      source_module: 'awareness_app',
      entity_type: 'campaign',
      entity_id: campaignId,
      priority: 'high',
      payload: {
        campaign_id: campaignId,
        old_status: statusData.old_status,
        new_status: statusData.new_status,
        changed_by: statusData.changed_by,
        reason: statusData.reason,
        changed_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Impact Score Calculated Event
   */
  const publishImpactScoreCalculated = useCallback(async (
    scoreData: {
      score_id: string;
      org_unit_id: string;
      impact_score: number;
      period_year: number;
      period_month: number;
      risk_level: string;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'impact_score_calculated',
      event_category: 'awareness',
      source_module: 'awareness_app',
      entity_type: 'impact_score',
      entity_id: scoreData.score_id,
      priority: 'high',
      payload: {
        score_id: scoreData.score_id,
        org_unit_id: scoreData.org_unit_id,
        impact_score: scoreData.impact_score,
        period_year: scoreData.period_year,
        period_month: scoreData.period_month,
        risk_level: scoreData.risk_level,
        calculated_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  return {
    publishParticipantEnrolled,
    publishModuleCompleted,
    publishFeedbackSubmitted,
    publishCampaignStatusChanged,
    publishImpactScoreCalculated,
  };
}
