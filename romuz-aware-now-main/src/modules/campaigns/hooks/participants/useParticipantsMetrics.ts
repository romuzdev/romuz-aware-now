import { useQuery } from '@tanstack/react-query';
import { fetchParticipantsMetrics } from '@/modules/campaigns/integration';

export function useParticipantsMetrics(campaignId: string, campaignEndDate?: string | null) {
  return useQuery({
    queryKey: ['participants-metrics', campaignId],
    queryFn: () => fetchParticipantsMetrics(campaignId, campaignEndDate),
    enabled: !!campaignId,
  });
}
