/**
 * GRC Reporting Types
 * Types for advanced reporting and analytics
 */

import type { Risk } from './risk.types';
import type { Control } from './control.types';

/**
 * Report Types
 */
export type ReportType = 
  | 'risk_summary'
  | 'risk_heat_map'
  | 'control_effectiveness'
  | 'treatment_progress'
  | 'risk_trends'
  | 'compliance_status'
  | 'executive_summary';

/**
 * Export Formats
 */
export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';

/**
 * Report Configuration
 */
export interface ReportConfig {
  type: ReportType;
  title: string;
  description?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  filters?: {
    categories?: string[];
    statuses?: string[];
    priorities?: string[];
    owners?: string[];
  };
  groupBy?: 'category' | 'status' | 'owner' | 'priority';
  includeCharts?: boolean;
  includeDetails?: boolean;
}

/**
 * Report Data Structure
 */
export interface ReportData {
  id: string;
  type: ReportType;
  title: string;
  generatedAt: string;
  generatedBy: string;
  config: ReportConfig;
  data: {
    summary: ReportSummary;
    details?: ReportDetails;
    charts?: ReportChart[];
  };
  metadata: {
    totalRecords: number;
    filteredRecords: number;
    executionTime: number;
  };
}

/**
 * Report Summary
 */
export interface ReportSummary {
  totalRisks: number;
  criticalRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  risksByStatus: Record<string, number>;
  risksByCategory: Record<string, number>;
  controlEffectiveness: {
    effective: number;
    partiallyEffective: number;
    ineffective: number;
    notTested: number;
  };
  treatmentProgress: {
    planned: number;
    inProgress: number;
    completed: number;
  };
}

/**
 * Report Details
 */
export interface ReportDetails {
  risks?: Risk[];
  controls?: Control[];
  trends?: TrendData[];
}

/**
 * Trend Data
 */
export interface TrendData {
  period: string;
  value: number;
  change?: number;
  changePercent?: number;
}

/**
 * Report Chart
 */
export interface ReportChart {
  type: 'bar' | 'line' | 'pie' | 'heatmap' | 'area';
  title: string;
  data: ChartData[];
  xAxis?: string;
  yAxis?: string;
}

/**
 * Chart Data
 */
export interface ChartData {
  label: string;
  value: number;
  color?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Heat Map Data
 */
export interface HeatMapData {
  likelihood: number;
  impact: number;
  count: number;
  risks: Array<{
    id: string;
    title: string;
    score: number;
  }>;
}

/**
 * Export Options
 */
export interface ExportOptions {
  format: ExportFormat;
  fileName?: string;
  includeCharts?: boolean;
  includeDetails?: boolean;
  includeRawData?: boolean;
  compression?: boolean;
}

/**
 * Report Template
 */
export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  type: ReportType;
  config: ReportConfig;
  isDefault?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Scheduled Report
 */
export interface ScheduledReport {
  id: string;
  templateId: string;
  schedule: string; // Cron expression
  recipients: string[];
  format: ExportFormat;
  isEnabled: boolean;
  lastRunAt?: string;
  nextRunAt: string;
}

/**
 * Risk Trend Analysis
 */
export interface RiskTrendAnalysis {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  data: Array<{
    date: string;
    totalRisks: number;
    criticalRisks: number;
    highRisks: number;
    avgInherentScore: number;
    avgResidualScore: number;
  }>;
  insights: {
    trend: 'increasing' | 'decreasing' | 'stable';
    percentChange: number;
    recommendations: string[];
  };
}

/**
 * Control Performance Report
 */
export interface ControlPerformanceReport {
  totalControls: number;
  testedControls: number;
  effectiveRate: number;
  testingCoverage: number;
  overdue: number;
  byType: Record<string, {
    total: number;
    effective: number;
    ineffective: number;
  }>;
  byCategory: Record<string, {
    total: number;
    effectiveRate: number;
  }>;
  trends: Array<{
    month: string;
    effectiveRate: number;
    testCount: number;
  }>;
}

/**
 * Executive Summary Report
 */
export interface ExecutiveSummaryReport {
  period: string;
  overview: {
    totalRisks: number;
    criticalIssues: number;
    riskReductionRate: number;
    controlEffectiveness: number;
  };
  topRisks: Array<{
    id: string;
    title: string;
    score: number;
    status: string;
    owner: string;
  }>;
  keyActions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    deadline: string;
    responsible: string;
  }>;
  trends: {
    riskTrend: 'improving' | 'stable' | 'worsening';
    complianceScore: number;
    riskExposure: number;
  };
  recommendations: string[];
}
