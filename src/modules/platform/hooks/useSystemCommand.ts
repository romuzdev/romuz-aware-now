/**
 * M21 - System Command Dashboard Hooks
 * React Query hooks for system metrics and platform alerts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  fetchSystemMetrics,
  recordSystemMetric,
  getAggregatedMetrics,
  fetchPlatformAlerts,
  createPlatformAlert,
  acknowledgePlatformAlert,
  resolvePlatformAlert,
  dismissPlatformAlert,
  getSystemHealth,
  getTenantOverviews,
} from '@/integrations/platform/system-command.integration';
import type { Database } from '@/integrations/supabase/types';

type SystemMetric = Database['public']['Tables']['system_metrics']['Row'];
type SystemMetricInsert = Database['public']['Tables']['system_metrics']['Insert'];
type PlatformAlert = Database['public']['Tables']['platform_alerts']['Row'];
type PlatformAlertInsert = Database['public']['Tables']['platform_alerts']['Insert'];

// Query Keys
export const systemCommandKeys = {
  all: ['system-command'] as const,
  metrics: () => [...systemCommandKeys.all, 'metrics'] as const,
  metricsList: (filters?: any) => [...systemCommandKeys.metrics(), filters] as const,
  aggregatedMetrics: (filters?: any) => [...systemCommandKeys.metrics(), 'aggregated', filters] as const,
  alerts: () => [...systemCommandKeys.all, 'alerts'] as const,
  alertsList: (filters?: any) => [...systemCommandKeys.alerts(), filters] as const,
  health: () => [...systemCommandKeys.all, 'health'] as const,
  tenantOverviews: () => [...systemCommandKeys.all, 'tenant-overviews'] as const,
};

/**
 * Fetch system metrics with optional filters
 */
export function useSystemMetrics(filters?: {
  tenantId?: string;
  metricType?: string;
  severity?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: systemCommandKeys.metricsList(filters),
    queryFn: () => fetchSystemMetrics(filters),
  });
}

/**
 * Record a new system metric
 */
export function useRecordSystemMetric() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      tenant_id: string;
      metric_type: string;
      metric_value: number;
      metric_unit?: string;
      source_component?: string;
      severity?: 'info' | 'warning' | 'critical';
      metadata?: Record<string, any>;
    }) => recordSystemMetric(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemCommandKeys.metrics() });
      toast({
        title: 'تم التسجيل',
        description: 'تم تسجيل المقياس بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Get aggregated metrics
 */
export function useAggregatedMetrics(filters: {
  tenantId?: string;
  metricTypes: string[];
  period: 'hour' | 'day' | 'week' | 'month';
}) {
  return useQuery({
    queryKey: systemCommandKeys.aggregatedMetrics(filters),
    queryFn: () => getAggregatedMetrics(filters),
  });
}

/**
 * Fetch platform alerts with optional filters
 */
export function usePlatformAlerts(filters?: {
  severity?: string;
  status?: string;
  alert_type?: string;
}) {
  return useQuery({
    queryKey: systemCommandKeys.alertsList(filters),
    queryFn: () => fetchPlatformAlerts(filters),
  });
}

/**
 * Create a new platform alert
 */
export function useCreatePlatformAlert() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
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
    }) => createPlatformAlert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemCommandKeys.alerts() });
      toast({
        title: 'تم الإنشاء',
        description: 'تم إنشاء التنبيه بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Acknowledge a platform alert
 */
export function useAcknowledgePlatformAlert() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => acknowledgePlatformAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemCommandKeys.alerts() });
      toast({
        title: 'تم الإقرار',
        description: 'تم الإقرار بالتنبيه',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Resolve a platform alert
 */
export function useResolvePlatformAlert() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => resolvePlatformAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemCommandKeys.alerts() });
      toast({
        title: 'تم الحل',
        description: 'تم حل التنبيه بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Dismiss a platform alert
 */
export function useDismissPlatformAlert() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => dismissPlatformAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemCommandKeys.alerts() });
      toast({
        title: 'تم التجاهل',
        description: 'تم تجاهل التنبيه',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Get overall system health
 */
export function useSystemHealth() {
  return useQuery({
    queryKey: systemCommandKeys.health(),
    queryFn: () => getSystemHealth(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Get tenant overviews
 */
export function useTenantOverviews() {
  return useQuery({
    queryKey: systemCommandKeys.tenantOverviews(),
    queryFn: () => getTenantOverviews(),
    refetchInterval: 60000, // Refetch every minute
  });
}
