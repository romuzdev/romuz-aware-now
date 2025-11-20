/**
 * Phishing Simulations Module - Event Integration Hook
 * 
 * Integration between Phishing module and Event System
 */

import { useCallback } from 'react';
import { useEventBus } from '../useEventBus';
import type { PublishEventParams } from '../event.types';

export function usePhishingEvents() {
  const { publishEvent } = useEventBus();

  /**
   * Simulation Launched Event
   */
  const publishSimulationLaunched = useCallback(async (
    simulationId: string,
    simulationData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'simulation_launched',
      event_category: 'phishing',
      source_module: 'phishing_sim',
      entity_type: 'simulation',
      entity_id: simulationId,
      priority: 'high',
      payload: {
        simulation_name: simulationData.name,
        template_type: simulationData.template_type,
        target_count: simulationData.target_count,
        launched_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * User Clicked Event (Phishing Link)
   */
  const publishUserClicked = useCallback(async (
    simulationId: string,
    userId: string,
    clickData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'user_clicked',
      event_category: 'phishing',
      source_module: 'phishing_sim',
      entity_type: 'click_event',
      entity_id: `${simulationId}_${userId}`,
      priority: 'critical',
      payload: {
        simulation_id: simulationId,
        user_id: userId,
        clicked_at: new Date().toISOString(),
        device_type: clickData.device_type,
        location: clickData.location,
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * User Reported Event (Phishing Attempt)
   */
  const publishUserReported = useCallback(async (
    simulationId: string,
    userId: string,
    reportData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'user_reported',
      event_category: 'phishing',
      source_module: 'phishing_sim',
      entity_type: 'report_event',
      entity_id: `${simulationId}_${userId}`,
      priority: 'low',
      payload: {
        simulation_id: simulationId,
        user_id: userId,
        reported_at: new Date().toISOString(),
        report_method: reportData.report_method,
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  return {
    publishSimulationLaunched,
    publishUserClicked,
    publishUserReported,
  };
}
