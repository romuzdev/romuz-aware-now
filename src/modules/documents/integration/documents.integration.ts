/**
 * Documents Module - Integration Layer
 * 
 * Complete integration layer for documents, attachments, and storage
 */

// Document Storage Operations
export {
  buildDocumentVersionPath,
  uploadDocumentVersion,
  getDocumentVersionDownloadUrl,
  createDocumentVersionWithUpload,
  getDocumentVersions,
  deleteDocumentVersion,
  type UploadDocumentVersionOptions,
  type UploadResult,
  type DocumentVersionDownloadOptions,
  type CreateDocumentVersionParams,
  type DocumentVersionRow,
} from './document-storage';

// Document Data Operations (CRUD)
export {
  fetchDocumentsForTenant,
  fetchDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  bulkUpdateDocumentStatus,
  logDocumentReadAction,
} from './documents-data';

// Attachment Operations
export {
  buildAttachmentPath,
  uploadAttachment,
  getAttachmentDownloadUrl,
  createAttachmentWithUpload,
  getAttachmentsByEntity,
  getAttachmentsByDocument,
  deleteAttachment,
  updateAttachmentMetadata,
  type UploadAttachmentOptions,
  type AttachmentDownloadOptions,
  type CreateAttachmentParams,
  type AttachmentRow,
} from './attachments';
