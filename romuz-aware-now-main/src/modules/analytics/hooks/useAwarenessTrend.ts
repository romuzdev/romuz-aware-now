import { useQuery } from '@tanstack/react-query';
import { fetchDailyEngagement } from '@/modules/analytics/integration/campaigns.integration';
import type { AwarenessFilters } from '@/modules/campaigns';

export function useAwarenessTrend(filters: AwarenessFilters) {
  return useQuery({
    queryKey: ['awareness-trend', filters],
    queryFn: () =>
      fetchDailyEngagement({
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        campaignId: filters.campaignId,
      }),
  });
}
