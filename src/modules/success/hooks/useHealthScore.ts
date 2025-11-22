/**
 * M25 - Health Score Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getCurrentHealthSnapshot,
  getHealthTrend,
  getOrgUnitHealthSnapshots,
  recomputeHealthScore,
} from '../integration';

const QUERY_KEY = ['success', 'health'];

export function useHealthScore() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current health
  const { data: currentHealth, isLoading } = useQuery({
    queryKey: [...QUERY_KEY, 'current'],
    queryFn: getCurrentHealthSnapshot,
  });

  // Get health trend
  const { data: healthTrend = [] } = useQuery({
    queryKey: [...QUERY_KEY, 'trend'],
    queryFn: () => getHealthTrend(30),
  });

  // Recompute health score
  const recomputeMutation = useMutation({
    mutationFn: recomputeHealthScore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: 'تم',
        description: 'تم إعادة حساب نقاط الصحة',
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

  return {
    currentHealth,
    healthTrend,
    isLoading,
    recompute: recomputeMutation.mutate,
    isRecomputing: recomputeMutation.isPending,
  };
}

export function useOrgUnitHealth(orgUnitId?: string) {
  const { data: healthSnapshots = [], isLoading } = useQuery({
    queryKey: [...QUERY_KEY, 'org-unit', orgUnitId],
    queryFn: () => (orgUnitId ? getOrgUnitHealthSnapshots(orgUnitId, 30) : Promise.resolve([])),
    enabled: !!orgUnitId,
  });

  return {
    healthSnapshots,
    isLoading,
  };
}
