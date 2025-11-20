// ============================================================================
// Gate-K (Admin Operations) Types - D1 Standard
// ============================================================================

/**
 * System Job View - Filter and sort configurations
 */
export interface JobView {
  id: string;
  view_name: string;
  description_ar: string | null;
  filters: JobFilters;
  sort_config: JobSortConfig;
  is_default: boolean;
  is_shared: boolean;
  is_owner: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Job Filter Configuration
 */
export interface JobFilters {
  job_type?: string[];
  is_enabled?: boolean;
  last_run_status?: string[];
  search?: string;
}

/**
 * Job Sort Configuration
 */
export interface JobSortConfig {
  field: 'job_key' | 'job_type' | 'last_run_at' | 'created_at';
  direction: 'asc' | 'desc';
}

/**
 * Admin Import History Record
 */
export interface AdminImportHistory {
  id: string;
  filename: string;
  format: 'csv' | 'json';
  import_type: 'jobs' | 'settings';
  total_rows: number;
  success_count: number;
  error_count: number;
  errors: AdminImportError[] | null;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
}

/**
 * Admin Import Error Detail
 */
export interface AdminImportError {
  row: number;
  data: any;
  error: string;
}

/**
 * Admin Bulk Operation Record
 */
export interface AdminBulkOperation {
  id: string;
  operation_type: 'enable_jobs' | 'disable_jobs' | 'trigger_jobs' | 'delete_runs';
  target_count: number;
  affected_count: number;
  errors: AdminBulkError[] | null;
  status: 'processing' | 'completed' | 'partial' | 'failed';
  created_at: string;
  completed_at: string | null;
}

/**
 * Admin Bulk Operation Error Detail
 */
export interface AdminBulkError {
  job_id?: string;
  run_id?: string;
  error: string;
}

/**
 * Admin Bulk Operation Result
 */
export interface AdminBulkOperationResult {
  operation_id: string;
  affected_count: number;
  status: 'completed' | 'partial' | 'failed';
  errors: AdminBulkError[] | null;
}
