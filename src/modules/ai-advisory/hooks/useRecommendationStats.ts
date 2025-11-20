/**
 * M16: AI Advisory Engine - Stats Hook
 */

import { useQuery } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { fetchRecommendationStats } from '../integration/ai-advisory.integration';

export function useRecommendationStats() {
  const { tenantId } = useAppContext();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['ai-recommendation-stats', tenantId],
    queryFn: () => fetchRecommendationStats(tenantId!),
    enabled: !!tenantId,
  });

  return {
    stats,
    isLoading,
    error,
  };
}
