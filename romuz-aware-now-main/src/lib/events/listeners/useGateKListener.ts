/**
 * Gate-K: Campaigns Management - Real-time Event Listener Hook
 * 
 * استماع للأحداث الواردة من نظام الحملات في الوقت الفعلي
 */

import { useEffect } from 'react';
import { useEventSubscription } from '../useEventBus';
import type { SystemEvent } from '../event.types';

export interface GateKEventHandlers {
  onCampaignCreated?: (event: SystemEvent) => void;
  onCampaignStarted?: (event: SystemEvent) => void;
  onCampaignCompleted?: (event: SystemEvent) => void;
  onParticipantEnrolled?: (event: SystemEvent) => void;
  onAnyEvent?: (event: SystemEvent) => void;
}

export function useGateKListener(handlers: GateKEventHandlers, enabled: boolean = true) {
  const eventTypes = [
    'campaign_created',
    'campaign_started',
    'campaign_completed',
    'participant_enrolled',
  ];

  useEventSubscription({
    event_types: eventTypes,
    enabled,
    onEvent: (event) => {
      switch (event.event_type) {
        case 'campaign_created':
          handlers.onCampaignCreated?.(event);
          break;
        case 'campaign_started':
          handlers.onCampaignStarted?.(event);
          break;
        case 'campaign_completed':
          handlers.onCampaignCompleted?.(event);
          break;
        case 'participant_enrolled':
          handlers.onParticipantEnrolled?.(event);
          break;
      }

      handlers.onAnyEvent?.(event);
    },
  });
}
