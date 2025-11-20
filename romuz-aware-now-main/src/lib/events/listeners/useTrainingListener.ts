/**
 * Training/LMS Module - Real-time Event Listener Hook
 * 
 * استماع للأحداث الواردة من نظام التدريب في الوقت الفعلي
 */

import { useEffect } from 'react';
import { useEventSubscription } from '../useEventBus';
import type { SystemEvent } from '../event.types';

export interface TrainingEventHandlers {
  onCourseCreated?: (event: SystemEvent) => void;
  onEnrollmentCreated?: (event: SystemEvent) => void;
  onProgressUpdated?: (event: SystemEvent) => void;
  onCertificateIssued?: (event: SystemEvent) => void;
  onAnyEvent?: (event: SystemEvent) => void;
}

export function useTrainingListener(handlers: TrainingEventHandlers, enabled: boolean = true) {
  const eventTypes = [
    'course_created',
    'enrollment_created',
    'progress_updated',
    'certificate_issued',
  ];

  useEventSubscription({
    event_types: eventTypes,
    enabled,
    onEvent: (event) => {
      switch (event.event_type) {
        case 'course_created':
          handlers.onCourseCreated?.(event);
          break;
        case 'enrollment_created':
          handlers.onEnrollmentCreated?.(event);
          break;
        case 'progress_updated':
          handlers.onProgressUpdated?.(event);
          break;
        case 'certificate_issued':
          handlers.onCertificateIssued?.(event);
          break;
      }

      handlers.onAnyEvent?.(event);
    },
  });
}
