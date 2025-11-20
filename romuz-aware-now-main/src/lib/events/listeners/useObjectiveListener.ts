/**
 * Objectives Management Module - Real-time Event Listener Hook
 * 
 * استماع للأحداث الواردة من نظام إدارة الأهداف في الوقت الفعلي
 */

import { useEffect } from 'react';
import { useEventSubscription } from '../useEventBus';
import type { SystemEvent } from '../event.types';

export interface ObjectiveEventHandlers {
  onObjectiveCreated?: (event: SystemEvent) => void;
  onObjectiveProgressUpdated?: (event: SystemEvent) => void;
  onAnyEvent?: (event: SystemEvent) => void;
}

export function useObjectiveListener(handlers: ObjectiveEventHandlers, enabled: boolean = true) {
  const eventTypes = [
    'objective_created',
    'objective_progress_updated',
  ];

  useEventSubscription({
    event_types: eventTypes,
    enabled,
    onEvent: (event) => {
      switch (event.event_type) {
        case 'objective_created':
          handlers.onObjectiveCreated?.(event);
          break;
        case 'objective_progress_updated':
          handlers.onObjectiveProgressUpdated?.(event);
          break;
      }

      handlers.onAnyEvent?.(event);
    },
  });
}
