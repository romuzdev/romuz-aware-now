/**
 * M14 - Unified KPI Dashboard Integration Layer
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  UnifiedKPI,
  KPISnapshot,
  KPIAlert,
  ExecutiveSummary,
  ModuleKPIGroup,
  UnifiedDashboardFilters,
  HistoricalComparison,
  KPIModule,
  AlertSeverity
} from '../types/unified-kpis.types';

/**
 * Fetch all unified KPIs across modules
 */
export async function fetchUnifiedKPIs(
  tenantId: string,
  filters?: UnifiedDashboardFilters
): Promise<UnifiedKPI[]> {
  let query = supabase
    .from('vw_unified_kpis')
    .select('*')
    .eq('tenant_id', tenantId);

  if (filters?.modules && filters.modules.length > 0) {
    query = query.in('module', filters.modules);
  }

  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  const { data, error } = await query.order('module').order('kpi_name');

  if (error) throw error;
  return data || [];
}

/**
 * Fetch executive summary
 */
export async function fetchExecutiveSummary(
  tenantId: string
): Promise<ExecutiveSummary[]> {
  const { data, error } = await supabase
    .from('vw_kpi_executive_summary')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('module');

  if (error) throw error;
  return data || [];
}

/**
 * Group KPIs by module
 */
export async function fetchModuleKPIGroups(
  tenantId: string
): Promise<ModuleKPIGroup[]> {
  const [kpis, summary] = await Promise.all([
    fetchUnifiedKPIs(tenantId),
    fetchExecutiveSummary(tenantId)
  ]);

  const moduleInfo: Record<KPIModule, { name: string; icon: string }> = {
    risk: { name: 'المخاطر', icon: 'Shield' },
    compliance: { name: 'الامتثال', icon: 'CheckCircle' },
    campaign: { name: 'الحملات', icon: 'Users' },
    audit: { name: 'التدقيق', icon: 'FileCheck' },
    objective: { name: 'الأهداف', icon: 'Target' },
    training: { name: 'التدريب', icon: 'BookOpen' }
  };

  const groups: ModuleKPIGroup[] = [];
  const moduleKPIs = new Map<KPIModule, UnifiedKPI[]>();

  // Group KPIs by module
  kpis.forEach(kpi => {
    if (!moduleKPIs.has(kpi.module)) {
      moduleKPIs.set(kpi.module, []);
    }
    moduleKPIs.get(kpi.module)!.push(kpi);
  });

  // Create groups
  summary.forEach(s => {
    const info = moduleInfo[s.module];
    const moduleKPIList = moduleKPIs.get(s.module) || [];

    groups.push({
      module: s.module,
      moduleName: info.name,
      moduleIcon: info.icon,
      totalKPIs: s.total_kpis,
      avgPerformance: s.avg_performance,
      avgTarget: s.avg_target,
      achievementRate: s.achievement_rate,
      criticalCount: s.critical_count,
      kpis: moduleKPIList
    });
  });

  return groups;
}

/**
 * Fetch KPI alerts
 */
export async function fetchKPIAlerts(
  tenantId: string,
  filters?: { acknowledged?: boolean; severity?: AlertSeverity[] }
): Promise<KPIAlert[]> {
  let query = supabase
    .from('kpi_alerts')
    .select('*')
    .eq('tenant_id', tenantId);

  if (filters?.acknowledged !== undefined) {
    query = query.eq('is_acknowledged', filters.acknowledged);
  }

  if (filters?.severity && filters.severity.length > 0) {
    query = query.in('severity', filters.severity);
  }

  const { data, error } = await query
    .order('severity', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(
  alertId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('kpi_alerts')
    .update({
      is_acknowledged: true,
      acknowledged_by: userId,
      acknowledged_at: new Date().toISOString()
    })
    .eq('id', alertId);

  if (error) throw error;
}

/**
 * Capture KPI snapshot
 */
export async function captureKPISnapshot(
  tenantId: string,
  snapshotDate?: string
): Promise<number> {
  const { data, error } = await supabase.rpc('capture_kpi_snapshot', {
    p_tenant_id: tenantId,
    p_snapshot_date: snapshotDate || new Date().toISOString().split('T')[0]
  });

  if (error) throw error;
  return data as number;
}

/**
 * Detect KPI alerts
 */
export async function detectKPIAlerts(tenantId: string): Promise<number> {
  const { data, error } = await supabase.rpc('detect_kpi_alerts', {
    p_tenant_id: tenantId
  });

  if (error) throw error;
  return data as number;
}

/**
 * Fetch historical snapshots
 */
export async function fetchKPISnapshots(
  tenantId: string,
  fromDate: string,
  toDate: string,
  module?: KPIModule
): Promise<KPISnapshot[]> {
  let query = supabase
    .from('kpi_snapshots')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('snapshot_date', fromDate)
    .lte('snapshot_date', toDate);

  if (module) {
    query = query.eq('module', module);
  }

  const { data, error } = await query.order('snapshot_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Calculate historical comparison
 */
export async function calculateHistoricalComparison(
  tenantId: string,
  periodDays: number = 30
): Promise<HistoricalComparison[]> {
  const today = new Date();
  const compareDate = new Date(today);
  compareDate.setDate(compareDate.getDate() - periodDays);

  const todayStr = today.toISOString().split('T')[0];
  const compareStr = compareDate.toISOString().split('T')[0];

  const [currentKPIs, historicalSnapshots] = await Promise.all([
    fetchUnifiedKPIs(tenantId),
    fetchKPISnapshots(tenantId, compareStr, compareStr)
  ]);

  const comparisons: HistoricalComparison[] = [];
  const snapshotMap = new Map(
    historicalSnapshots.map(s => [`${s.module}_${s.kpi_key}`, s])
  );

  currentKPIs.forEach(kpi => {
    const key = `${kpi.module}_${kpi.kpi_key}`;
    const snapshot = snapshotMap.get(key);

    if (snapshot) {
      const change = kpi.current_value - snapshot.current_value;
      const changePercentage = snapshot.current_value !== 0
        ? (change / snapshot.current_value) * 100
        : 0;

      comparisons.push({
        module: kpi.module,
        kpi_key: kpi.kpi_key,
        current_value: kpi.current_value,
        previous_value: snapshot.current_value,
        change_percentage: changePercentage,
        change_direction:
          Math.abs(changePercentage) < 1 ? 'stable' :
          changePercentage > 0 ? 'up' : 'down'
      });
    }
  });

  return comparisons;
}
