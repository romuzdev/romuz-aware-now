/**
 * Analytics Hooks
 * Week 4 - Phase 3
 */

import { useQuery } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import {
  fetchRealtimeMetrics,
  fetchTimeSeriesData,
  analyzeTrends,
  compareMetrics,
  generatePredictiveInsights,
} from '../integration/analytics.integration';
import type { AnalyticsFilters, DateRange } from '../types/analytics.types';

export function useRealtimeMetrics(filters: AnalyticsFilters) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['realtime-metrics', tenantId, filters],
    queryFn: () => fetchRealtimeMetrics(tenantId!, filters),
    enabled: !!tenantId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useTimeSeriesData(metric: string, filters: AnalyticsFilters) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['time-series', tenantId, metric, filters],
    queryFn: () => fetchTimeSeriesData(tenantId!, metric, filters),
    enabled: !!tenantId,
  });
}

export function useTrendAnalysis(metric: string, filters: AnalyticsFilters) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['trend-analysis', tenantId, metric, filters],
    queryFn: () => analyzeTrends(tenantId!, metric, filters),
    enabled: !!tenantId,
  });
}

export function useMetricComparison(
  metric: string,
  currentPeriod: DateRange,
  previousPeriod: DateRange
) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['metric-comparison', tenantId, metric, currentPeriod, previousPeriod],
    queryFn: () =>
      compareMetrics(
        tenantId!,
        metric,
        { start: currentPeriod.start, end: currentPeriod.end },
        { start: previousPeriod.start, end: previousPeriod.end }
      ),
    enabled: !!tenantId,
  });
}

export function usePredictiveInsights(filters: AnalyticsFilters) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['predictive-insights', tenantId, filters],
    queryFn: () => generatePredictiveInsights(tenantId!, filters),
    enabled: !!tenantId,
  });
}
