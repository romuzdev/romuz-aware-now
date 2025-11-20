/**
 * Committees & Governance Module - Real-time Event Listener Hook
 * 
 * استماع للأحداث الواردة من نظام اللجان في الوقت الفعلي
 */

import { useEffect } from 'react';
import { useEventSubscription } from '../useEventBus';
import type { SystemEvent } from '../event.types';

export interface CommitteeEventHandlers {
  onMeetingScheduled?: (event: SystemEvent) => void;
  onDecisionMade?: (event: SystemEvent) => void;
  onFollowupCreated?: (event: SystemEvent) => void;
  onAnyEvent?: (event: SystemEvent) => void;
}

export function useCommitteeListener(handlers: CommitteeEventHandlers, enabled: boolean = true) {
  const eventTypes = [
    'meeting_scheduled',
    'decision_made',
    'followup_created',
  ];

  useEventSubscription({
    event_types: eventTypes,
    enabled,
    onEvent: (event) => {
      switch (event.event_type) {
        case 'meeting_scheduled':
          handlers.onMeetingScheduled?.(event);
          break;
        case 'decision_made':
          handlers.onDecisionMade?.(event);
          break;
        case 'followup_created':
          handlers.onFollowupCreated?.(event);
          break;
      }

      handlers.onAnyEvent?.(event);
    },
  });
}
