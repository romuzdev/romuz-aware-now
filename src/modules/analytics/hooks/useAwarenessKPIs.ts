import { useQuery } from '@tanstack/react-query';
import { fetchCampaignKPIs, aggregateKPIs } from '@/modules/analytics/integration/campaigns.integration';
import type { AwarenessFilters } from '@/modules/campaigns';

export function useAwarenessKPIs(filters: AwarenessFilters) {
  return useQuery({
    queryKey: ['awareness-kpis', filters],
    queryFn: async () => {
      const kpis = await fetchCampaignKPIs({
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        owner: filters.owner,
        campaignId: filters.campaignId,
      });

      // Aggregate metrics
      const aggregated = aggregateKPIs(kpis);

      return {
        campaigns: kpis,
        aggregated,
      };
    },
  });
}
