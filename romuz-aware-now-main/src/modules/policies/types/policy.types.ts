/**
 * Policies Module - Types
 */

export type PolicyStatus = "draft" | "active" | "archived";

export interface Policy {
  id: string;
  tenant_id: string;
  code: string;
  title: string;
  owner: string | null;
  status: PolicyStatus;
  category: string | null;
  last_review_date: string | null;
  next_review_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface PolicyListFilters {
  q?: string;
  status?: PolicyStatus | 'all';
  category?: string | 'all';
  page?: number;
  limit?: number;
}

/**
 * Saved Policy View - Filter and sort configurations
 */
export interface PolicyView {
  id: string;
  view_name: string;
  description_ar: string | null;
  filters: PolicyFilters;
  sort_config: PolicySortConfig;
  is_default: boolean;
  is_shared: boolean;
  is_owner: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Policy Filter Configuration
 */
export interface PolicyFilters {
  status?: PolicyStatus[];
  category?: string[];
  owner?: string[];
  dateRange?: {
    field: 'last_review_date' | 'next_review_date' | 'created_at';
    from?: string;
    to?: string;
  };
  search?: string;
}

/**
 * Policy Sort Configuration
 */
export interface PolicySortConfig {
  field: keyof Policy;
  direction: 'asc' | 'desc';
}

/**
 * Policy Import History Record
 */
export interface PolicyImportHistory {
  id: string;
  filename: string;
  format: 'csv' | 'json';
  total_rows: number;
  success_count: number;
  error_count: number;
  errors: PolicyImportError[] | null;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
}

/**
 * Policy Import Error Detail
 */
export interface PolicyImportError {
  row: number;
  data: any;
  error: string;
}

/**
 * Policy Bulk Operation Record
 */
export interface PolicyBulkOperation {
  id: string;
  operation_type: 'status_update' | 'delete' | 'archive';
  policy_count: number;
  affected_count: number;
  errors: PolicyBulkError[] | null;
  status: 'processing' | 'completed' | 'partial' | 'failed';
  created_at: string;
  completed_at: string | null;
}

/**
 * Policy Bulk Operation Error Detail
 */
export interface PolicyBulkError {
  policy_id: string;
  error: string;
}

/**
 * Policy Bulk Operation Result
 */
export interface PolicyBulkOperationResult {
  operation_id: string;
  affected_count: number;
  status: 'completed' | 'partial' | 'failed';
  errors: PolicyBulkError[] | null;
}

/**
 * Policy Import Result
 */
export interface PolicyImportResult {
  import_id: string;
  total_rows: number;
  success_count: number;
  error_count: number;
  errors: PolicyImportError[] | null;
  status: 'completed' | 'failed';
}

/**
 * Policy for Import (Partial data)
 */
export interface PolicyImportData {
  code: string;
  title: string;
  owner?: string;
  status?: PolicyStatus;
  category?: string;
  lastReviewDate?: string;
  nextReviewDate?: string;
}
