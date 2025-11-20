/**
 * Gate-L: Analytics & Reports - Real-time Event Listener Hook
 * 
 * استماع للأحداث الواردة من نظام التحليلات في الوقت الفعلي
 */

import { useEffect } from 'react';
import { useEventSubscription } from '../useEventBus';
import type { SystemEvent } from '../event.types';

export interface GateLEventHandlers {
  onReportGenerated?: (event: SystemEvent) => void;
  onInsightDetected?: (event: SystemEvent) => void;
  onAnomalyDetected?: (event: SystemEvent) => void;
  onAnyEvent?: (event: SystemEvent) => void;
}

export function useGateLListener(handlers: GateLEventHandlers, enabled: boolean = true) {
  const eventTypes = [
    'report_generated',
    'insight_detected',
    'anomaly_detected',
  ];

  useEventSubscription({
    event_types: eventTypes,
    enabled,
    onEvent: (event) => {
      switch (event.event_type) {
        case 'report_generated':
          handlers.onReportGenerated?.(event);
          break;
        case 'insight_detected':
          handlers.onInsightDetected?.(event);
          break;
        case 'anomaly_detected':
          handlers.onAnomalyDetected?.(event);
          break;
      }

      handlers.onAnyEvent?.(event);
    },
  });
}
