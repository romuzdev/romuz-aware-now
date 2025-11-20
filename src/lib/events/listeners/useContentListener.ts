/**
 * Content Hub Module - Real-time Event Listener Hook
 * 
 * استماع للأحداث الواردة من نظام المحتوى في الوقت الفعلي
 */

import { useEffect } from 'react';
import { useEventSubscription } from '../useEventBus';
import type { SystemEvent } from '../event.types';

export interface ContentEventHandlers {
  onContentPublished?: (event: SystemEvent) => void;
  onContentViewed?: (event: SystemEvent) => void;
  onAnyEvent?: (event: SystemEvent) => void;
}

export function useContentListener(handlers: ContentEventHandlers, enabled: boolean = true) {
  const eventTypes = [
    'content_published',
    'content_viewed',
  ];

  useEventSubscription({
    event_types: eventTypes,
    enabled,
    onEvent: (event) => {
      switch (event.event_type) {
        case 'content_published':
          handlers.onContentPublished?.(event);
          break;
        case 'content_viewed':
          handlers.onContentViewed?.(event);
          break;
      }

      handlers.onAnyEvent?.(event);
    },
  });
}
