/**
 * Alerts & Notifications Module - Real-time Event Listener Hook
 * 
 * استماع للأحداث الواردة من نظام التنبيهات في الوقت الفعلي
 */

import { useEffect } from 'react';
import { useEventSubscription } from '../useEventBus';
import type { SystemEvent } from '../event.types';

export interface AlertEventHandlers {
  onAlertTriggered?: (event: SystemEvent) => void;
  onAlertAcknowledged?: (event: SystemEvent) => void;
  onAnyEvent?: (event: SystemEvent) => void;
}

export function useAlertListener(handlers: AlertEventHandlers, enabled: boolean = true) {
  const eventTypes = [
    'alert_triggered',
    'alert_acknowledged',
  ];

  useEventSubscription({
    event_types: eventTypes,
    enabled,
    onEvent: (event) => {
      switch (event.event_type) {
        case 'alert_triggered':
          handlers.onAlertTriggered?.(event);
          break;
        case 'alert_acknowledged':
          handlers.onAlertAcknowledged?.(event);
          break;
      }

      handlers.onAnyEvent?.(event);
    },
  });
}
