// Gate-L: Reports & Analytics Types (D1 Standard Extended)

export interface ReportExport {
  id: string;
  tenantId: string;
  userId: string;
  reportType: string;
  fileFormat: 'csv' | 'json' | 'xlsx';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  batchId?: string;
  totalRows: number;
  sourceViews?: Record<string, any>;
  storageUrl?: string;
  createdAt: string;
  completedAt?: string;
  refreshAt?: string;
  errorMessage?: string;
}

export interface ReportKPIDaily {
  tenantId: string;
  campaignId: string;
  campaignName: string;
  ownerName?: string;
  date: string;
  deliveries: number;
  opens: number;
  clicks: number;
  bounces: number;
  reminders: number;
  openRate: number;
  ctr: number;
  completedCount: number;
  activatedCount: number;
  completionRate: number;
  activationRate: number;
}

export interface ReportKPICTD {
  tenantId: string;
  campaignId: string;
  lastDate: string;
  totalDeliveries: number;
  totalOpens: number;
  totalClicks: number;
  totalBounces: number;
  totalReminders: number;
  totalCompleted: number;
  totalActivated: number;
  avgOpenRate: number;
  avgCtr: number;
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  campaign?: string;
  reportType?: string;
}

export interface ReportExportRequest {
  reportType: 'performance' | 'deliverability' | 'engagement' | 'awareness_campaign_insights' | 'awareness_timeseries';
  fileFormat: 'csv' | 'json' | 'xlsx';
  filters: ReportFilters;
}

// Gate-I: Awareness Campaign Insights Export
export interface AwarenessCampaignInsight {
  tenantId: string;
  campaignId: string;
  campaignName: string;
  ownerName?: string;
  totalParticipants: number;
  engagementRate: number;
  completionRate: number;
  avgFeedbackScore?: number;
  status: string;
  startDate: string;
  endDate: string;
}

// Gate-I: Awareness Timeseries Export
export interface AwarenessTimeseriesData {
  tenantId: string;
  campaignId?: string;
  date: string;
  engagementRate: number;
  completionRate: number;
  activeParticipants: number;
}

// ============================================================================
// Gate-L (Reports) D1 Standard Types
// ============================================================================

/**
 * Report View - Filter and sort configurations
 */
export interface ReportView {
  id: string;
  view_name: string;
  description_ar: string | null;
  filters: ReportFilters;
  sort_config: ReportSortConfig;
  is_default: boolean;
  is_shared: boolean;
  is_owner: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Report Sort Configuration
 */
export interface ReportSortConfig {
  field: 'report_name' | 'report_type' | 'generated_at' | 'created_at';
  direction: 'asc' | 'desc';
}

/**
 * Report Import History Record
 */
export interface ReportImportHistory {
  id: string;
  filename: string;
  format: 'csv' | 'json';
  import_type: 'report_templates' | 'report_schedules';
  total_rows: number;
  success_count: number;
  error_count: number;
  errors: ReportImportError[] | null;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
}

/**
 * Report Import Error Detail
 */
export interface ReportImportError {
  row: number;
  data: any;
  error: string;
}

/**
 * Report Bulk Operation Record
 */
export interface ReportBulkOperation {
  id: string;
  operation_type: 'generate_reports' | 'schedule_reports' | 'delete_reports' | 'export_reports';
  target_count: number;
  affected_count: number;
  status: 'queued' | 'processing' | 'completed' | 'partial' | 'failed';
  created_at: string;
  completed_at: string | null;
}

/**
 * Report Bulk Operation Error Detail
 */
export interface ReportBulkError {
  report_id?: string;
  error: string;
}

/**
 * Report Bulk Operation Result
 */
export interface ReportBulkOperationResult {
  operation_id: string;
  affected_count: number;
  status: 'completed' | 'partial' | 'failed';
  errors: ReportBulkError[] | null;
}

/**
 * Report Schedule Configuration
 */
export interface ReportScheduleConfig {
  reportType?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time?: string;
  day_of_week?: number;
  day_of_month?: number;
  enabled: boolean;
  recipients?: string[];
  filters?: ReportFilters;
}
