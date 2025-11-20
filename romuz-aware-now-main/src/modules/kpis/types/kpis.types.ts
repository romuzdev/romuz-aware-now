// Gate-I: KPI Catalog Types (Extended with D1 Standard Features)

// =====================================================
// Core KPI Types
// =====================================================

export interface KPI {
  id: string;
  tenantId: string;
  kpiKey: string;
  category: string;
  nameAr: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  unit: string;
  targetValue?: number;
  gateSource?: string;
  formula?: string;
  dataSource?: string;
  collectionFrequency?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// Gate-I D1 Standard: Extended Types
// =====================================================

// Saved Views
export interface KPIView {
  id: string;
  tenantId: string;
  userId: string;
  viewName: string;
  descriptionAr?: string;
  filters: KPIViewFilters;
  sortConfig: KPIViewSortConfig;
  isDefault: boolean;
  isShared: boolean;
  isOwner?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KPIViewFilters {
  category?: string;
  status?: 'active' | 'inactive';
  gateSource?: string;
  minTarget?: number;
  maxTarget?: number;
  search?: string;
}

export interface KPIViewSortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface SaveKPIViewParams {
  viewName: string;
  descriptionAr?: string;
  filters: KPIViewFilters;
  sortConfig: KPIViewSortConfig;
  isDefault?: boolean;
  isShared?: boolean;
}

// Bulk Operations
export interface KPIBulkOperation {
  id: string;
  tenantId: string;
  userId: string;
  operationType: 'activate' | 'deactivate' | 'delete' | 'update_target' | 'export';
  kpiIds: string[];
  operationData: Record<string, any>;
  affectedCount: number;
  errors?: KPIBulkError[];
  status: 'queued' | 'processing' | 'completed' | 'partial' | 'failed';
  createdAt: string;
  completedAt?: string;
}

export interface KPIBulkError {
  kpiId: string;
  error: string;
}

export interface BulkOperationResult {
  operationId: string;
  affectedCount: number;
  status: 'completed' | 'partial' | 'failed';
  errors?: KPIBulkError[];
}

// Import/Export
export interface KPIImportHistory {
  id: string;
  tenantId: string;
  userId: string;
  filename: string;
  format: 'csv' | 'json' | 'excel';
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors?: KPIImportError[];
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export interface KPIImportError {
  row: number;
  field?: string;
  error: string;
}

export interface ImportKPIsParams {
  filename: string;
  format: 'csv' | 'json' | 'excel';
  kpis: Partial<KPI>[];
}

export interface ImportKPIsResult {
  importId: string;
  status: 'processing' | 'completed' | 'failed';
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors?: KPIImportError[];
}

// Realtime
export interface KPIRealtimeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  kpi: KPI;
  userId: string;
  timestamp: string;
}
