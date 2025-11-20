/**
 * M14 - Unified KPI Dashboard Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import {
  fetchUnifiedKPIs,
  fetchExecutiveSummary,
  fetchModuleKPIGroups,
  fetchKPIAlerts,
  acknowledgeAlert,
  captureKPISnapshot,
  detectKPIAlerts,
  fetchKPISnapshots,
  calculateHistoricalComparison
} from '../integration/unified-kpis.integration';
import type { UnifiedDashboardFilters, AlertSeverity, KPIModule } from '../types/unified-kpis.types';
import { useToast } from '@/hooks/use-toast';

const UNIFIED_KPI_QUERY_KEY = 'unified-kpis';

/**
 * Fetch all unified KPIs
 */
export function useUnifiedKPIs(filters?: UnifiedDashboardFilters) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: [UNIFIED_KPI_QUERY_KEY, 'all', tenantId, filters],
    queryFn: () => {
      if (!tenantId) throw new Error('Tenant ID is required');
      return fetchUnifiedKPIs(tenantId, filters);
    },
    enabled: !!tenantId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
}

/**
 * Fetch executive summary
 */
export function useExecutiveSummary() {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: [UNIFIED_KPI_QUERY_KEY, 'executive-summary', tenantId],
    queryFn: () => {
      if (!tenantId) throw new Error('Tenant ID is required');
      return fetchExecutiveSummary(tenantId);
    },
    enabled: !!tenantId,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

/**
 * Fetch module KPI groups
 */
export function useModuleKPIGroups() {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: [UNIFIED_KPI_QUERY_KEY, 'module-groups', tenantId],
    queryFn: () => {
      if (!tenantId) throw new Error('Tenant ID is required');
      return fetchModuleKPIGroups(tenantId);
    },
    enabled: !!tenantId,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

/**
 * Fetch KPI alerts
 */
export function useKPIAlerts(filters?: { acknowledged?: boolean; severity?: AlertSeverity[] }) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: [UNIFIED_KPI_QUERY_KEY, 'alerts', tenantId, filters],
    queryFn: () => {
      if (!tenantId) throw new Error('Tenant ID is required');
      return fetchKPIAlerts(tenantId, filters);
    },
    enabled: !!tenantId,
    staleTime: 15 * 1000, // Alerts refresh faster
    refetchInterval: 30 * 1000,
  });
}

/**
 * Acknowledge alert mutation
 */
export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAppContext();

  return useMutation({
    mutationFn: (alertId: string) => {
      if (!user?.id) throw new Error('User ID is required');
      return acknowledgeAlert(alertId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UNIFIED_KPI_QUERY_KEY, 'alerts'] });
      toast({
        title: 'تم الإقرار بالتنبيه',
        description: 'تم الإقرار بالتنبيه بنجاح',
      });
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء الإقرار بالتنبيه',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Capture snapshot mutation
 */
export function useCaptureSnapshot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { tenantId } = useAppContext();

  return useMutation({
    mutationFn: (snapshotDate?: string) => {
      if (!tenantId) throw new Error('Tenant ID is required');
      return captureKPISnapshot(tenantId, snapshotDate);
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: [UNIFIED_KPI_QUERY_KEY, 'snapshots'] });
      toast({
        title: 'تم حفظ اللقطة',
        description: `تم حفظ ${count} مؤشر بنجاح`,
      });
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ اللقطة',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Detect alerts mutation
 */
export function useDetectAlerts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { tenantId } = useAppContext();

  return useMutation({
    mutationFn: () => {
      if (!tenantId) throw new Error('Tenant ID is required');
      return detectKPIAlerts(tenantId);
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: [UNIFIED_KPI_QUERY_KEY, 'alerts'] });
      if (count > 0) {
        toast({
          title: 'تنبيهات جديدة',
          description: `تم اكتشاف ${count} تنبيه جديد`,
        });
      }
    },
  });
}

/**
 * Fetch historical snapshots
 */
export function useKPISnapshots(
  fromDate: string,
  toDate: string,
  module?: KPIModule
) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: [UNIFIED_KPI_QUERY_KEY, 'snapshots', tenantId, fromDate, toDate, module],
    queryFn: () => {
      if (!tenantId) throw new Error('Tenant ID is required');
      return fetchKPISnapshots(tenantId, fromDate, toDate, module);
    },
    enabled: !!tenantId && !!fromDate && !!toDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Calculate historical comparison
 */
export function useHistoricalComparison(periodDays: number = 30) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: [UNIFIED_KPI_QUERY_KEY, 'comparison', tenantId, periodDays],
    queryFn: () => {
      if (!tenantId) throw new Error('Tenant ID is required');
      return calculateHistoricalComparison(tenantId, periodDays);
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
}
