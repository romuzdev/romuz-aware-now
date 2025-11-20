/**
 * Document Management Module - Event Integration Hook
 * 
 * Integration between Documents module and Event System
 */

import { useCallback } from 'react';
import { useEventBus } from '../useEventBus';
import type { PublishEventParams } from '../event.types';

export function useDocumentEvents() {
  const { publishEvent } = useEventBus();

  /**
   * Document Uploaded Event
   */
  const publishDocumentUploaded = useCallback(async (
    documentId: string,
    documentData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'document_uploaded',
      event_category: 'document',
      source_module: 'document_management',
      entity_type: 'document',
      entity_id: documentId,
      priority: 'low',
      payload: {
        filename: documentData.filename,
        file_type: documentData.file_type,
        file_size_mb: documentData.file_size_mb,
        category: documentData.category,
        uploaded_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Document Approved Event
   */
  const publishDocumentApproved = useCallback(async (
    documentId: string,
    approvalData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'document_approved',
      event_category: 'document',
      source_module: 'document_management',
      entity_type: 'document',
      entity_id: documentId,
      priority: 'medium',
      payload: {
        document_name: approvalData.document_name,
        approved_by: approvalData.approved_by,
        approval_date: new Date().toISOString(),
        approval_note: approvalData.note,
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Document Expired Event
   */
  const publishDocumentExpired = useCallback(async (
    documentId: string,
    documentData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'document_expired',
      event_category: 'document',
      source_module: 'document_management',
      entity_type: 'document',
      entity_id: documentId,
      priority: 'high',
      payload: {
        document_name: documentData.document_name,
        expiry_date: documentData.expiry_date,
        category: documentData.category,
        requires_renewal: documentData.requires_renewal,
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  return {
    publishDocumentUploaded,
    publishDocumentApproved,
    publishDocumentExpired,
  };
}
