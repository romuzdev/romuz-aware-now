/**
 * Alerts & Notifications Module - Event Integration Hook
 * 
 * Integration between Alerts module and Event System
 */

import { useCallback } from 'react';
import { useEventBus } from '../useEventBus';
import type { PublishEventParams } from '../event.types';

export function useAlertEvents() {
  const { publishEvent } = useEventBus();

  /**
   * Alert Triggered Event
   */
  const publishAlertTriggered = useCallback(async (
    alertId: string,
    alertData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'alert_triggered',
      event_category: 'alert',
      source_module: 'alerts',
      entity_type: 'alert',
      entity_id: alertId,
      priority: alertData.severity === 'critical' ? 'critical' : 'high',
      payload: {
        alert_type: alertData.alert_type,
        severity: alertData.severity,
        message: alertData.message,
        source: alertData.source,
        triggered_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Alert Acknowledged Event
   */
  const publishAlertAcknowledged = useCallback(async (
    alertId: string,
    acknowledgedBy: string,
    ackData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'alert_acknowledged',
      event_category: 'alert',
      source_module: 'alerts',
      entity_type: 'alert',
      entity_id: alertId,
      priority: 'low',
      payload: {
        alert_type: ackData.alert_type,
        acknowledged_by: acknowledgedBy,
        acknowledged_at: new Date().toISOString(),
        note: ackData.note,
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  return {
    publishAlertTriggered,
    publishAlertAcknowledged,
  };
}
