/**
 * M14 - Unified KPI Dashboard Types
 */

export type KPIModule = 'risk' | 'compliance' | 'campaign' | 'audit' | 'objective' | 'training';

export interface UnifiedKPI {
  tenant_id: string;
  module: KPIModule;
  kpi_key: string;
  kpi_name: string;
  entity_id: string;
  entity_name: string;
  current_value: number;
  target_value: number;
  status: string;
  last_updated: string;
  metadata: Record<string, any>;
}

export interface KPISnapshot {
  id: string;
  tenant_id: string;
  snapshot_date: string;
  module: KPIModule;
  kpi_key: string;
  kpi_name: string;
  current_value: number;
  target_value: number;
  status: string;
  metadata: Record<string, any>;
  created_at: string;
}

export type AlertType = 'threshold_breach' | 'target_missed' | 'trend_negative' | 'data_stale';
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface KPIAlert {
  id: string;
  tenant_id: string;
  module: KPIModule;
  kpi_key: string;
  kpi_name: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  current_value: number;
  threshold_value: number;
  message: string;
  is_acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

export interface ExecutiveSummary {
  tenant_id: string;
  module: KPIModule;
  total_kpis: number;
  avg_performance: number;
  avg_target: number;
  achievement_rate: number;
  critical_count: number;
  last_update: string;
}

export interface ModuleKPIGroup {
  module: KPIModule;
  moduleName: string;
  moduleIcon: string;
  totalKPIs: number;
  avgPerformance: number;
  avgTarget: number;
  achievementRate: number;
  criticalCount: number;
  kpis: UnifiedKPI[];
}

export interface CrossModuleInsight {
  title: string;
  description: string;
  modules: KPIModule[];
  impact: 'positive' | 'negative' | 'neutral';
  recommendation: string;
}

export interface HistoricalComparison {
  module: KPIModule;
  kpi_key: string;
  current_value: number;
  previous_value: number;
  change_percentage: number;
  change_direction: 'up' | 'down' | 'stable';
}

export interface UnifiedDashboardFilters {
  modules?: KPIModule[];
  severity?: AlertSeverity[];
  dateRange?: {
    from: string;
    to: string;
  };
  status?: string[];
}
