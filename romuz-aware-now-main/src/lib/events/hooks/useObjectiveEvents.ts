/**
 * Objectives Management Module - Event Integration Hook
 * 
 * Integration between Objectives module and Event System
 */

import { useCallback } from 'react';
import { useEventBus } from '../useEventBus';
import type { PublishEventParams } from '../event.types';

export function useObjectiveEvents() {
  const { publishEvent } = useEventBus();

  /**
   * Objective Created Event
   */
  const publishObjectiveCreated = useCallback(async (
    objectiveId: string,
    objectiveData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'objective_created',
      event_category: 'objective',
      source_module: 'objectives',
      entity_type: 'objective',
      entity_id: objectiveId,
      priority: 'medium',
      payload: {
        objective_title: objectiveData.title,
        category: objectiveData.category,
        target_date: objectiveData.target_date,
        owner: objectiveData.owner,
        priority: objectiveData.priority,
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Objective Progress Updated Event
   */
  const publishObjectiveProgressUpdated = useCallback(async (
    objectiveId: string,
    progressData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'objective_progress_updated',
      event_category: 'objective',
      source_module: 'objectives',
      entity_type: 'objective',
      entity_id: objectiveId,
      priority: 'medium',
      payload: {
        objective_title: progressData.title,
        previous_progress: progressData.previous_progress,
        current_progress: progressData.current_progress,
        progress_percentage: progressData.progress_percentage,
        updated_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  return {
    publishObjectiveCreated,
    publishObjectiveProgressUpdated,
  };
}
