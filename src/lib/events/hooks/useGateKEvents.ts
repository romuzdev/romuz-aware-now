/**
 * Gate-K: Campaigns Management - Event Integration Hook
 * 
 * Integration between Campaigns module and Event System
 */

import { useCallback } from 'react';
import { useEventBus } from '../useEventBus';
import type { PublishEventParams } from '../event.types';

export function useGateKEvents() {
  const { publishEvent } = useEventBus();

  /**
   * Campaign Created Event
   */
  const publishCampaignCreated = useCallback(async (campaignId: string, campaignData: any) => {
    const params: PublishEventParams = {
      event_type: 'campaign_created',
      event_category: 'campaign',
      source_module: 'gate_k',
      entity_type: 'campaign',
      entity_id: campaignId,
      priority: 'medium',
      payload: {
        name: campaignData.name,
        start_date: campaignData.start_date,
        end_date: campaignData.end_date,
        target_audience: campaignData.target_audience,
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Campaign Started Event
   */
  const publishCampaignStarted = useCallback(async (campaignId: string, campaignData: any) => {
    const params: PublishEventParams = {
      event_type: 'campaign_started',
      event_category: 'campaign',
      source_module: 'gate_k',
      entity_type: 'campaign',
      entity_id: campaignId,
      priority: 'high',
      payload: {
        name: campaignData.name,
        participant_count: campaignData.participant_count,
        start_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Campaign Completed Event
   */
  const publishCampaignCompleted = useCallback(async (campaignId: string, completionData: any) => {
    const params: PublishEventParams = {
      event_type: 'campaign_completed',
      event_category: 'campaign',
      source_module: 'gate_k',
      entity_type: 'campaign',
      entity_id: campaignId,
      priority: 'high',
      payload: {
        name: completionData.name,
        total_participants: completionData.total_participants,
        completion_rate: completionData.completion_rate,
        completed_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Participant Enrolled Event
   */
  const publishParticipantEnrolled = useCallback(async (
    campaignId: string,
    participantId: string,
    participantData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'participant_enrolled',
      event_category: 'campaign',
      source_module: 'gate_k',
      entity_type: 'participant',
      entity_id: participantId,
      priority: 'low',
      payload: {
        campaign_id: campaignId,
        employee_ref: participantData.employee_ref,
        enrolled_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  return {
    publishCampaignCreated,
    publishCampaignStarted,
    publishCampaignCompleted,
    publishParticipantEnrolled,
  };
}
