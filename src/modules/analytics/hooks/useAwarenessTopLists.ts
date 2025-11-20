import { useMemo } from 'react';
import { useAwarenessKPIs } from './useAwarenessKPIs';
import type { AwarenessFilters, TopBottomCampaign } from '@/modules/campaigns';

export function useAwarenessTopLists(filters: AwarenessFilters) {
  const { data, isLoading, error } = useAwarenessKPIs(filters);

  const lists = useMemo(() => {
    if (!data?.campaigns) {
      return { top: [], bottom: [] };
    }

    const campaigns = data.campaigns.map(
      (c): TopBottomCampaign => ({
        campaign_id: c.campaign_id,
        campaign_name: c.campaign_name,
        owner_name: c.owner_name,
        completion_rate: c.completion_rate,
        avg_score: c.avg_score,
        total_participants: c.total_participants,
      })
    );

    // Sort by completion_rate DESC, then avg_score DESC
    const sorted = [...campaigns].sort((a, b) => {
      const rateA = a.completion_rate ?? -1;
      const rateB = b.completion_rate ?? -1;
      if (rateA !== rateB) return rateB - rateA;

      const scoreA = a.avg_score ?? -1;
      const scoreB = b.avg_score ?? -1;
      return scoreB - scoreA;
    });

    const top = sorted.slice(0, 10);
    const bottom = sorted.slice(-10).reverse();

    return { top, bottom };
  }, [data]);

  return {
    data: lists,
    isLoading,
    error,
  };
}
