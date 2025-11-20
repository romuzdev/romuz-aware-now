/**
 * Gate-I: KPIs & Metrics - Real-time Event Listener Hook
 * 
 * استماع للأحداث الواردة من نظام المؤشرات في الوقت الفعلي
 */

import { useEffect } from 'react';
import { useEventSubscription } from '../useEventBus';
import type { SystemEvent } from '../event.types';

export interface GateIEventHandlers {
  onKPICreated?: (event: SystemEvent) => void;
  onKPIUpdated?: (event: SystemEvent) => void;
  onKPIThresholdBreach?: (event: SystemEvent) => void;
  onAnyEvent?: (event: SystemEvent) => void;
}

export function useGateIListener(handlers: GateIEventHandlers, enabled: boolean = true) {
  const eventTypes = [
    'kpi_created',
    'kpi_updated',
    'kpi_threshold_breach',
  ];

  useEventSubscription({
    event_types: eventTypes,
    enabled,
    onEvent: (event) => {
      switch (event.event_type) {
        case 'kpi_created':
          handlers.onKPICreated?.(event);
          break;
        case 'kpi_updated':
          handlers.onKPIUpdated?.(event);
          break;
        case 'kpi_threshold_breach':
          handlers.onKPIThresholdBreach?.(event);
          break;
      }

      handlers.onAnyEvent?.(event);
    },
  });
}
