/**
 * Core Services
 * 
 * Shared services layer for documents, attachments, audit, alerts, etc.
 * 
 * Usage:
 * ```typescript
 * import { documentService, attachmentService } from '@/core/services';
 * ```
 */

import * as documentService from './documentService';
import * as attachmentService from './attachmentService';
import * as validationService from './validationService';
import * as calibrationService from './calibrationService';
import * as impactService from './impactService';
import * as bulkOperationsService from './bulkOperationsService';
import * as importExportService from './importExportService';
import * as auditService from './audit';

// Export service modules
export { 
  documentService, 
  attachmentService,
  validationService,
  calibrationService,
  impactService,
  bulkOperationsService,
  importExportService,
  auditService,
};

// Re-export individual functions for convenience
export {
  listDocuments,
  getDocumentById,
  createDocument,
  uploadDocumentVersion,
  deleteDocument,
} from './documentService';

export {
  listAttachments,
  getAttachmentById,
  uploadAttachment,
  deleteAttachment,
} from './attachmentService';
