/**
 * Committees & Governance Module - Event Integration Hook
 * 
 * Integration between Committees module and Event System
 */

import { useCallback } from 'react';
import { useEventBus } from '../useEventBus';
import type { PublishEventParams } from '../event.types';

export function useCommitteeEvents() {
  const { publishEvent } = useEventBus();

  /**
   * Meeting Scheduled Event
   */
  const publishMeetingScheduled = useCallback(async (
    meetingId: string,
    meetingData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'meeting_scheduled',
      event_category: 'committee',
      source_module: 'committees',
      entity_type: 'meeting',
      entity_id: meetingId,
      priority: 'medium',
      payload: {
        committee_id: meetingData.committee_id,
        meeting_title: meetingData.title,
        scheduled_at: meetingData.scheduled_at,
        location: meetingData.location,
        attendees_count: meetingData.attendees_count,
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Decision Made Event
   */
  const publishDecisionMade = useCallback(async (
    decisionId: string,
    decisionData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'decision_made',
      event_category: 'committee',
      source_module: 'committees',
      entity_type: 'decision',
      entity_id: decisionId,
      priority: 'high',
      payload: {
        meeting_id: decisionData.meeting_id,
        decision_title: decisionData.title,
        decision_type: decisionData.type,
        votes_for: decisionData.votes_for,
        votes_against: decisionData.votes_against,
        status: decisionData.status,
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Followup Created Event
   */
  const publishFollowupCreated = useCallback(async (
    followupId: string,
    followupData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'followup_created',
      event_category: 'committee',
      source_module: 'committees',
      entity_type: 'followup',
      entity_id: followupId,
      priority: 'medium',
      payload: {
        decision_id: followupData.decision_id,
        title: followupData.title,
        assigned_to: followupData.assigned_to,
        due_date: followupData.due_date,
        priority: followupData.priority,
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  return {
    publishMeetingScheduled,
    publishDecisionMade,
    publishFollowupCreated,
  };
}
