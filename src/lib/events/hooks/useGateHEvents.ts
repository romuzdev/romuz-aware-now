/**
 * Gate-H: Actions/Remediation - Event Integration Hook
 * 
 * Integration between Actions module and Event System
 */

import { useCallback } from 'react';
import { useEventBus } from '../useEventBus';
import type { PublishEventParams } from '../event.types';

export function useGateHEvents() {
  const { publishEvent } = useEventBus();

  /**
   * Action Created Event
   */
  const publishActionCreated = useCallback(async (actionId: string, actionData: any) => {
    const params: PublishEventParams = {
      event_type: 'action_created',
      event_category: 'action',
      source_module: 'gate_h',
      entity_type: 'action',
      entity_id: actionId,
      priority: actionData.priority === 'critical' ? 'high' : 'medium',
      payload: {
        title_ar: actionData.title_ar,
        status: actionData.status,
        priority: actionData.priority,
        due_date: actionData.due_date,
        kpi_key: actionData.kpi_key,
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Action Assigned Event
   */
  const publishActionAssigned = useCallback(async (actionId: string, assigneeId: string, actionData: any) => {
    const params: PublishEventParams = {
      event_type: 'action_assigned',
      event_category: 'action',
      source_module: 'gate_h',
      entity_type: 'action',
      entity_id: actionId,
      priority: 'medium',
      payload: {
        assignee_user_id: assigneeId,
        title_ar: actionData.title_ar,
        due_date: actionData.due_date,
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Action Completed Event
   */
  const publishActionCompleted = useCallback(async (actionId: string, completionData: any) => {
    const params: PublishEventParams = {
      event_type: 'action_completed',
      event_category: 'action',
      source_module: 'gate_h',
      entity_type: 'action',
      entity_id: actionId,
      priority: 'high',
      payload: {
        completed_at: new Date().toISOString(),
        completion_note: completionData.note,
        impact: completionData.impact,
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Action Overdue Event
   */
  const publishActionOverdue = useCallback(async (actionId: string, actionData: any) => {
    const params: PublishEventParams = {
      event_type: 'action_overdue',
      event_category: 'action',
      source_module: 'gate_h',
      entity_type: 'action',
      entity_id: actionId,
      priority: 'critical',
      payload: {
        title_ar: actionData.title_ar,
        due_date: actionData.due_date,
        days_overdue: actionData.days_overdue,
        assignee_user_id: actionData.assignee_user_id,
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  return {
    publishActionCreated,
    publishActionAssigned,
    publishActionCompleted,
    publishActionOverdue,
  };
}
