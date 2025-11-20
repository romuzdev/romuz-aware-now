/**
 * Phishing Simulations Module - Real-time Event Listener Hook
 * 
 * استماع للأحداث الواردة من نظام محاكاة التصيد في الوقت الفعلي
 */

import { useEffect } from 'react';
import { useEventSubscription } from '../useEventBus';
import type { SystemEvent } from '../event.types';

export interface PhishingEventHandlers {
  onSimulationLaunched?: (event: SystemEvent) => void;
  onUserClicked?: (event: SystemEvent) => void;
  onUserReported?: (event: SystemEvent) => void;
  onAnyEvent?: (event: SystemEvent) => void;
}

export function usePhishingListener(handlers: PhishingEventHandlers, enabled: boolean = true) {
  const eventTypes = [
    'simulation_launched',
    'user_clicked',
    'user_reported',
  ];

  useEventSubscription({
    event_types: eventTypes,
    enabled,
    onEvent: (event) => {
      switch (event.event_type) {
        case 'simulation_launched':
          handlers.onSimulationLaunched?.(event);
          break;
        case 'user_clicked':
          handlers.onUserClicked?.(event);
          break;
        case 'user_reported':
          handlers.onUserReported?.(event);
          break;
      }

      handlers.onAnyEvent?.(event);
    },
  });
}
