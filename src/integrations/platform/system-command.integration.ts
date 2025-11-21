/**
 * M21 - System Command Dashboard Integration
 * 
 * Provides functions for system metrics, platform alerts, and health monitoring
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// Types
// ============================================================================

export interface SystemMetric {
  id: string;
  tenant_id: string;
  metric_type: string;
  metric_value: number;
  metric_unit: string | null;
  source_component: string | null;
  severity: 'info' | 'warning' | 'critical';
  metadata: Record<string, any>;
  recorded_at: string;
  created_at: string;
}

export interface PlatformAlert {
  id: string;
  tenant_id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string | null;
  source_module: string | null;
  source_entity_type: string | null;
  source_entity_id: string | null;
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  metadata: Record<string, any>;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SystemHealth {
  overall_status: 'healthy' | 'degraded' | 'critical';
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  active_users: number;
  api_response_time: number;
  database_connections: number;
  error_rate: number;
}

export interface TenantOverview {
  tenant_id: string;
  tenant_name: string;
  status: string;
  active_users: number;
  storage_used_gb: number;
  api_calls_today: number;
  alerts_count: number;
  last_activity: string;
}

// ============================================================================
// System Metrics Functions
// ============================================================================

/**
 * Fetch system metrics with filters
 */
export async function fetchSystemMetrics(params: {
  tenantId?: string;
  metricType?: string;
  severity?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}): Promise<SystemMetric[]> {
  let query = supabase
    .from('system_metrics')
    .select('*')
    .order('recorded_at', { ascending: false });

  if (params.tenantId) {
    query = query.eq('tenant_id', params.tenantId);
  }

  if (params.metricType) {
    query = query.eq('metric_type', params.metricType);
  }

  if (params.severity) {
    query = query.eq('severity', params.severity);
  }

  if (params.fromDate) {
    query = query.gte('recorded_at', params.fromDate);
  }

  if (params.toDate) {
    query = query.lte('recorded_at', params.toDate);
  }

  if (params.limit) {
    query = query.limit(params.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching system metrics:', error);
    throw error;
  }

  return data || [];
}

/**
 * Record a new system metric
 */
export async function recordSystemMetric(metric: {
  tenant_id: string;
  metric_type: string;
  metric_value: number;
  metric_unit?: string;
  source_component?: string;
  severity?: 'info' | 'warning' | 'critical';
  metadata?: Record<string, any>;
}): Promise<SystemMetric> {
  const { data, error } = await supabase
    .from('system_metrics')
    .insert({
      ...metric,
      recorded_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error recording system metric:', error);
    throw error;
  }

  return data;
}

/**
 * Get aggregated metrics for dashboard
 */
export async function getAggregatedMetrics(params: {
  tenantId?: string;
  metricTypes: string[];
  period: 'hour' | 'day' | 'week' | 'month';
}): Promise<Record<string, { avg: number; min: number; max: number; current: number }>> {
  const { tenantId, metricTypes, period } = params;

  const periodMap = {
    hour: '1 hour',
    day: '1 day',
    week: '7 days',
    month: '30 days',
  };

  const fromDate = new Date();
  fromDate.setTime(fromDate.getTime() - (periodMap[period] === '1 hour' ? 3600000 : periodMap[period] === '1 day' ? 86400000 : periodMap[period] === '7 days' ? 604800000 : 2592000000));

  const metrics = await fetchSystemMetrics({
    tenantId,
    fromDate: fromDate.toISOString(),
  });

  const result: Record<string, { avg: number; min: number; max: number; current: number }> = {};

  metricTypes.forEach(type => {
    const filtered = metrics.filter(m => m.metric_type === type);
    if (filtered.length > 0) {
      const values = filtered.map(m => m.metric_value);
      result[type] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        current: filtered[0].metric_value,
      };
    }
  });

  return result;
}

// ============================================================================
// Platform Alerts Functions
// ============================================================================

/**
 * Fetch platform alerts with filters
 */
export async function fetchPlatformAlerts(params: {
  tenantId?: string;
  alertType?: string;
  severity?: string;
  status?: string;
  limit?: number;
}): Promise<PlatformAlert[]> {
  let query = supabase
    .from('platform_alerts')
    .select('*')
    .order('created_at', { ascending: false });

  if (params.tenantId) {
    query = query.eq('tenant_id', params.tenantId);
  }

  if (params.alertType) {
    query = query.eq('alert_type', params.alertType);
  }

  if (params.severity) {
    query = query.eq('severity', params.severity);
  }

  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (params.limit) {
    query = query.limit(params.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching platform alerts:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create a new platform alert
 */
export async function createPlatformAlert(alert: {
  tenant_id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description?: string;
  source_module?: string;
  source_entity_type?: string;
  source_entity_id?: string;
  metadata?: Record<string, any>;
  expires_at?: string;
}): Promise<PlatformAlert> {
  const { data, error } = await supabase
    .from('platform_alerts')
    .insert(alert)
    .select()
    .single();

  if (error) {
    console.error('Error creating platform alert:', error);
    throw error;
  }

  return data;
}

/**
 * Acknowledge an alert
 */
export async function acknowledgePlatformAlert(alertId: string): Promise<PlatformAlert> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('platform_alerts')
    .update({
      status: 'acknowledged',
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: user?.id || null,
    })
    .eq('id', alertId)
    .select()
    .single();

  if (error) {
    console.error('Error acknowledging alert:', error);
    throw error;
  }

  return data;
}

/**
 * Resolve an alert
 */
export async function resolvePlatformAlert(
  alertId: string,
  resolutionNotes?: string
): Promise<PlatformAlert> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('platform_alerts')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: user?.id || null,
      resolution_notes: resolutionNotes,
    })
    .eq('id', alertId)
    .select()
    .single();

  if (error) {
    console.error('Error resolving alert:', error);
    throw error;
  }

  return data;
}

/**
 * Dismiss an alert
 */
export async function dismissPlatformAlert(alertId: string): Promise<PlatformAlert> {
  const { data, error } = await supabase
    .from('platform_alerts')
    .update({ status: 'dismissed' })
    .eq('id', alertId)
    .select()
    .single();

  if (error) {
    console.error('Error dismissing alert:', error);
    throw error;
  }

  return data;
}

// ============================================================================
// System Health Functions
// ============================================================================

/**
 * Get current system health snapshot
 */
export async function getSystemHealth(tenantId?: string): Promise<SystemHealth> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 3600000);

  const metrics = await fetchSystemMetrics({
    tenantId,
    fromDate: oneHourAgo.toISOString(),
    limit: 100,
  });

  const getLatestMetric = (type: string) => {
    const filtered = metrics.filter(m => m.metric_type === type);
    return filtered.length > 0 ? filtered[0].metric_value : 0;
  };

  const cpu = getLatestMetric('cpu_usage');
  const memory = getLatestMetric('memory_usage');
  const disk = getLatestMetric('disk_usage');

  let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
  if (cpu > 90 || memory > 90 || disk > 90) {
    overallStatus = 'critical';
  } else if (cpu > 70 || memory > 70 || disk > 70) {
    overallStatus = 'degraded';
  }

  return {
    overall_status: overallStatus,
    cpu_usage: cpu,
    memory_usage: memory,
    disk_usage: disk,
    active_users: getLatestMetric('active_users'),
    api_response_time: getLatestMetric('api_response_time'),
    database_connections: getLatestMetric('database_connections'),
    error_rate: getLatestMetric('error_rate'),
  };
}

/**
 * Get tenant overview for all tenants
 */
export async function getTenantOverviews(): Promise<TenantOverview[]> {
  // Fetch all tenants
  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('id, name, status, updated_at')
    .order('name');

  if (tenantsError) {
    console.error('Error fetching tenants:', tenantsError);
    throw tenantsError;
  }

  // Fetch usage stats for today
  const today = new Date().toISOString().split('T')[0];
  const { data: usageStats } = await supabase
    .from('tenant_usage_stats')
    .select('*')
    .eq('stat_date', today);

  // Fetch active alerts count
  const { data: alerts } = await supabase
    .from('platform_alerts')
    .select('tenant_id')
    .eq('status', 'active');

  const overviews: TenantOverview[] = tenants.map(tenant => {
    const usage = usageStats?.find(s => s.tenant_id === tenant.id);
    const alertsCount = alerts?.filter(a => a.tenant_id === tenant.id).length || 0;

    return {
      tenant_id: tenant.id,
      tenant_name: tenant.name,
      status: tenant.status,
      active_users: usage?.active_users_count || 0,
      storage_used_gb: usage?.total_storage_gb || 0,
      api_calls_today: usage?.api_calls_count || 0,
      alerts_count: alertsCount,
      last_activity: usage?.updated_at || tenant.updated_at || '',
    };
  });

  return overviews;
}
