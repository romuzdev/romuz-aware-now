/**
 * Authentication Module - Real-time Event Listener Hook
 * 
 * استماع للأحداث الواردة من نظام المصادقة في الوقت الفعلي
 */

import { useEffect } from 'react';
import { useEventSubscription } from '../useEventBus';
import type { SystemEvent } from '../event.types';

export interface AuthEventHandlers {
  onUserLoggedIn?: (event: SystemEvent) => void;
  onUserLoggedOut?: (event: SystemEvent) => void;
  onUserRoleChanged?: (event: SystemEvent) => void;
  onAnyEvent?: (event: SystemEvent) => void;
}

export function useAuthListener(handlers: AuthEventHandlers, enabled: boolean = true) {
  const eventTypes = [
    'user_logged_in',
    'user_logged_out',
    'user_role_changed',
  ];

  useEventSubscription({
    event_types: eventTypes,
    enabled,
    onEvent: (event) => {
      switch (event.event_type) {
        case 'user_logged_in':
          handlers.onUserLoggedIn?.(event);
          break;
        case 'user_logged_out':
          handlers.onUserLoggedOut?.(event);
          break;
        case 'user_role_changed':
          handlers.onUserRoleChanged?.(event);
          break;
      }

      handlers.onAnyEvent?.(event);
    },
  });
}
