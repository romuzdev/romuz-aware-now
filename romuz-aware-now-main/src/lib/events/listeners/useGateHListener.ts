/**
 * Gate-H: Actions/Remediation - Real-time Event Listener Hook
 * 
 * استماع للأحداث الواردة من نظام الإجراءات في الوقت الفعلي
 */

import { useEffect } from 'react';
import { useEventSubscription } from '../useEventBus';
import type { SystemEvent } from '../event.types';

export interface GateHEventHandlers {
  onActionCreated?: (event: SystemEvent) => void;
  onActionAssigned?: (event: SystemEvent) => void;
  onActionCompleted?: (event: SystemEvent) => void;
  onActionOverdue?: (event: SystemEvent) => void;
  onAnyEvent?: (event: SystemEvent) => void;
}

export function useGateHListener(handlers: GateHEventHandlers, enabled: boolean = true) {
  const eventTypes = [
    'action_created',
    'action_assigned',
    'action_completed',
    'action_overdue',
  ];

  useEventSubscription({
    event_types: eventTypes,
    enabled,
    onEvent: (event) => {
      switch (event.event_type) {
        case 'action_created':
          handlers.onActionCreated?.(event);
          break;
        case 'action_assigned':
          handlers.onActionAssigned?.(event);
          break;
        case 'action_completed':
          handlers.onActionCompleted?.(event);
          break;
        case 'action_overdue':
          handlers.onActionOverdue?.(event);
          break;
      }

      handlers.onAnyEvent?.(event);
    },
  });
}
