// Gate-J: Impact Scores Types (D1 Standard Extended)

// =====================================================
// Core Impact Scores Types
// =====================================================

export interface ImpactScore {
  id: string;
  tenantId: string;
  orgUnitId: string;
  periodYear: number;
  periodMonth: number;
  impactScore: number;
  completionScore: number;
  engagementScore: number;
  feedbackQualityScore: number;
  complianceLinkageScore: number;
  confidenceLevel?: number;
  riskLevel?: string;
  dataSource?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImpactWeight {
  id: string;
  tenantId: string;
  version: number;
  isActive: boolean;
  engagementWeight: number;
  completionWeight: number;
  feedbackQualityWeight: number;
  complianceLinkageWeight: number;
  label?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComputeImpactScoreParams {
  tenantId: string;
  orgUnitId: string;
  periodYear: number;
  periodMonth: number;
}

export interface RecomputeImpactScoresForTenantParams {
  tenantId: string;
  periodYear: number;
  periodMonth: number;
}

export interface InputMetrics {
  engagementScore: number | null;
  completionScore: number | null;
  feedbackQualityScore: number | null;
  complianceLinkageScore: number | null;
}

export interface ComputedImpactResult {
  impactScore: number;
  riskLevel: 'very_low' | 'low' | 'medium' | 'high';
  confidenceLevel: number;
}

// =====================================================
// Gate-J D1 Standard: Extended Types
// =====================================================

// Saved Views
export interface ImpactView {
  id: string;
  tenantId: string;
  userId: string;
  viewName: string;
  descriptionAr?: string;
  filters: ImpactViewFilters;
  sortConfig: ImpactViewSortConfig;
  isDefault: boolean;
  isShared: boolean;
  isOwner?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ImpactViewFilters {
  orgUnit?: string;
  yearFrom?: number;
  yearTo?: number;
  monthFrom?: number;
  monthTo?: number;
  minImpactScore?: number;
  maxImpactScore?: number;
  riskLevel?: string;
  search?: string;
}

export interface ImpactViewSortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface SaveImpactViewParams {
  viewName: string;
  descriptionAr?: string;
  filters: ImpactViewFilters;
  sortConfig: ImpactViewSortConfig;
  isDefault?: boolean;
  isShared?: boolean;
}

// Bulk Operations
export interface ImpactBulkOperation {
  id: string;
  tenantId: string;
  userId: string;
  operationType: 'recalculate' | 'delete' | 'export';
  scoreIds: string[];
  operationData: Record<string, any>;
  affectedCount: number;
  errors?: ImpactBulkError[];
  status: 'queued' | 'processing' | 'completed' | 'partial' | 'failed';
  createdAt: string;
  completedAt?: string;
}

export interface ImpactBulkError {
  scoreId: string;
  error: string;
}

export interface BulkOperationResult {
  operationId: string;
  affectedCount: number;
  status: 'completed' | 'partial' | 'failed';
  errors?: ImpactBulkError[];
}

// Import/Export
export interface ImpactImportHistory {
  id: string;
  tenantId: string;
  userId: string;
  filename: string;
  format: 'csv' | 'json' | 'excel';
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors?: ImpactImportError[];
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export interface ImpactImportError {
  row: number;
  field?: string;
  error: string;
}

export interface ImportImpactScoresParams {
  filename: string;
  format: 'csv' | 'json' | 'excel';
  scores: Partial<ImpactScore>[];
}

export interface ImportImpactScoresResult {
  importId: string;
  status: 'processing' | 'completed' | 'failed';
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors?: ImpactImportError[];
}

// Realtime
export interface ImpactRealtimeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  score: ImpactScore;
  userId: string;
  timestamp: string;
}
