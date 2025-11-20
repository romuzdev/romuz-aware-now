/**
 * Culture Index Module - Real-time Event Listener Hook
 * 
 * استماع للأحداث الواردة من نظام مؤشر الثقافة في الوقت الفعلي
 */

import { useEffect } from 'react';
import { useEventSubscription } from '../useEventBus';
import type { SystemEvent } from '../event.types';

export interface CultureEventHandlers {
  onSurveyCompleted?: (event: SystemEvent) => void;
  onCultureScoreCalculated?: (event: SystemEvent) => void;
  onAnyEvent?: (event: SystemEvent) => void;
}

export function useCultureListener(handlers: CultureEventHandlers, enabled: boolean = true) {
  const eventTypes = [
    'survey_completed',
    'culture_score_calculated',
  ];

  useEventSubscription({
    event_types: eventTypes,
    enabled,
    onEvent: (event) => {
      switch (event.event_type) {
        case 'survey_completed':
          handlers.onSurveyCompleted?.(event);
          break;
        case 'culture_score_calculated':
          handlers.onCultureScoreCalculated?.(event);
          break;
      }

      handlers.onAnyEvent?.(event);
    },
  });
}
