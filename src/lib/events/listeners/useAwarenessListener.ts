/**
 * Awareness Impact Module - Real-time Event Listener Hook
 * 
 * استماع للأحداث الواردة من نظام قياس الأثر في الوقت الفعلي
 */

import { useEffect } from 'react';
import { useEventSubscription } from '../useEventBus';
import type { SystemEvent } from '../event.types';

export interface AwarenessEventHandlers {
  onImpactScoreCalculated?: (event: SystemEvent) => void;
  onCalibrationCompleted?: (event: SystemEvent) => void;
  onAnyEvent?: (event: SystemEvent) => void;
}

export function useAwarenessListener(handlers: AwarenessEventHandlers, enabled: boolean = true) {
  const eventTypes = [
    'impact_score_calculated',
    'calibration_completed',
  ];

  useEventSubscription({
    event_types: eventTypes,
    enabled,
    onEvent: (event) => {
      switch (event.event_type) {
        case 'impact_score_calculated':
          handlers.onImpactScoreCalculated?.(event);
          break;
        case 'calibration_completed':
          handlers.onCalibrationCompleted?.(event);
          break;
      }

      handlers.onAnyEvent?.(event);
    },
  });
}
