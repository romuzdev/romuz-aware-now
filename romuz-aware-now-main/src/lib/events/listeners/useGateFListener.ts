/**
 * Gate-F: Policies Management - Real-time Event Listener Hook
 * 
 * استماع للأحداث الواردة من نظام إدارة السياسات في الوقت الفعلي
 */

import { useEffect } from 'react';
import { useEventSubscription } from '../useEventBus';
import type { SystemEvent } from '../event.types';

export interface GateFEventHandlers {
  onPolicyCreated?: (event: SystemEvent) => void;
  onPolicyUpdated?: (event: SystemEvent) => void;
  onPolicyPublished?: (event: SystemEvent) => void;
  onPolicyArchived?: (event: SystemEvent) => void;
  onAnyEvent?: (event: SystemEvent) => void;
}

export function useGateFListener(handlers: GateFEventHandlers, enabled: boolean = true) {
  const eventTypes = [
    'policy_created',
    'policy_updated',
    'policy_published',
    'policy_archived',
  ];

  useEventSubscription({
    event_types: eventTypes,
    enabled,
    onEvent: (event) => {
      // استدعاء المعالج المحدد لنوع الحدث
      switch (event.event_type) {
        case 'policy_created':
          handlers.onPolicyCreated?.(event);
          break;
        case 'policy_updated':
          handlers.onPolicyUpdated?.(event);
          break;
        case 'policy_published':
          handlers.onPolicyPublished?.(event);
          break;
        case 'policy_archived':
          handlers.onPolicyArchived?.(event);
          break;
      }

      // استدعاء المعالج العام دائماً
      handlers.onAnyEvent?.(event);
    },
  });
}
