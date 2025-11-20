/**
 * D4 Enhancement: Committee Analytics Custom Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  fetchCommitteeAnalytics,
  fetchLatestCommitteeAnalytics,
  fetchAllCommitteesAnalytics,
  calculateCommitteeAnalytics,
  getCommitteePerformanceSummary,
  getCommitteesRanking,
  getCommitteeAnalyticsTrends,
} from '@/modules/committees/integration';
import type { AnalyticsQueryOptions } from '@/modules/committees';

/**
 * Fetch analytics for a committee
 */
export function useCommitteeAnalytics(
  committeeId: string,
  options?: AnalyticsQueryOptions
) {
  return useQuery({
    queryKey: ['committee-analytics', committeeId, options],
    queryFn: () => fetchCommitteeAnalytics(committeeId, options),
    enabled: !!committeeId,
  });
}

/**
 * Fetch latest analytics snapshot
 */
export function useLatestCommitteeAnalytics(committeeId: string) {
  return useQuery({
    queryKey: ['committee-analytics-latest', committeeId],
    queryFn: () => fetchLatestCommitteeAnalytics(committeeId),
    enabled: !!committeeId,
  });
}

/**
 * Fetch analytics for all committees
 */
export function useAllCommitteesAnalytics(options?: {
  date?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['committees-analytics', options],
    queryFn: () => fetchAllCommitteesAnalytics(options),
  });
}

/**
 * Get committee performance summary
 */
export function useCommitteePerformance(committeeId: string) {
  return useQuery({
    queryKey: ['committee-performance', committeeId],
    queryFn: () => getCommitteePerformanceSummary(committeeId),
    enabled: !!committeeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get committees ranking
 */
export function useCommitteesRanking(limit: number = 10) {
  return useQuery({
    queryKey: ['committees-ranking', limit],
    queryFn: () => getCommitteesRanking(limit),
  });
}

/**
 * Get analytics trends
 */
export function useCommitteeAnalyticsTrends(
  committeeId: string,
  days: number = 30
) {
  return useQuery({
    queryKey: ['committee-analytics-trends', committeeId, days],
    queryFn: () => getCommitteeAnalyticsTrends(committeeId, days),
    enabled: !!committeeId,
  });
}

/**
 * Calculate analytics mutation
 */
export function useCalculateCommitteeAnalytics() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: calculateCommitteeAnalytics,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['committee-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['committee-performance'] });
      queryClient.invalidateQueries({ queryKey: ['committees-ranking'] });
      toast({
        title: 'تم التحديث',
        description: 'تم حساب مؤشرات الأداء بنجاح',
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
