/**
 * Documents Module - Types
 * Unified types from both legacy and new structure
 */

export type DocumentType = 
  | 'policy'
  | 'procedure'
  | 'guideline'
  | 'template'
  | 'report'
  | 'awareness_material'
  | 'other';

export type DocumentStatus = 
  | 'draft'
  | 'review'
  | 'approved'
  | 'published'
  | 'active'
  | 'archived';

// Main document interface (legacy from documents table)
export interface Document {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  doc_type: DocumentType;
  status: DocumentStatus;
  linked_module: string | null;
  linked_entity_id: string | null;
  current_version_id: string | null;
  app_code: string | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// Alternative document interface (from awareness docs)
export interface AwarenessDocument {
  id: string;
  code: string;
  title: string;
  description?: string;
  type: DocumentType;
  status: DocumentStatus;
  version: string;
  file_path?: string;
  tenant_id: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
  published_at?: string;
  archived_at?: string;
}

export interface DocumentVersion {
  id: string;
  tenant_id: string;
  document_id: string;
  version_number: number;
  storage_path: string;
  mime_type: string;
  file_size_bytes: number;
  checksum: string | null;
  uploaded_by: string;
  uploaded_at: string;
  change_summary: string | null;
  is_major: boolean;
  source_version_id: string | null;
}

export interface DocumentAttachment {
  id: string;
  document_id: string;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  created_by?: string;
}

export interface DocumentListFilters {
  q?: string;
  type?: DocumentType | 'all';
  status?: DocumentStatus | 'all';
  page?: number;
  limit?: number;
}

export interface DocumentFilters {
  search: string;
  status: string;
  doc_type: string;
  linked_module?: string;
  date_from?: string;
  date_to?: string;
}
