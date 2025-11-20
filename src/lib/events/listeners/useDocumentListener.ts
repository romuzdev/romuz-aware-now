/**
 * Document Management Module - Real-time Event Listener Hook
 * 
 * استماع للأحداث الواردة من نظام إدارة الوثائق في الوقت الفعلي
 */

import { useEffect } from 'react';
import { useEventSubscription } from '../useEventBus';
import type { SystemEvent } from '../event.types';

export interface DocumentEventHandlers {
  onDocumentUploaded?: (event: SystemEvent) => void;
  onDocumentApproved?: (event: SystemEvent) => void;
  onDocumentExpired?: (event: SystemEvent) => void;
  onAnyEvent?: (event: SystemEvent) => void;
}

export function useDocumentListener(handlers: DocumentEventHandlers, enabled: boolean = true) {
  const eventTypes = [
    'document_uploaded',
    'document_approved',
    'document_expired',
  ];

  useEventSubscription({
    event_types: eventTypes,
    enabled,
    onEvent: (event) => {
      switch (event.event_type) {
        case 'document_uploaded':
          handlers.onDocumentUploaded?.(event);
          break;
        case 'document_approved':
          handlers.onDocumentApproved?.(event);
          break;
        case 'document_expired':
          handlers.onDocumentExpired?.(event);
          break;
      }

      handlers.onAnyEvent?.(event);
    },
  });
}
