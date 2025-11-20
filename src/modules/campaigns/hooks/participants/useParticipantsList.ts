import { useQuery } from '@tanstack/react-query';
import { fetchParticipants } from '@/modules/campaigns/integration';
import type { ParticipantsFilters } from '@/modules/campaigns';

interface UseParticipantsListParams {
  campaignId: string;
  filters: ParticipantsFilters;
  page: number;
  pageSize: number;
}

export function useParticipantsList({ campaignId, filters, page, pageSize }: UseParticipantsListParams) {
  return useQuery({
    queryKey: ['participants', campaignId, filters, page, pageSize],
    queryFn: () => fetchParticipants(campaignId, filters, page, pageSize),
    enabled: !!campaignId,
  });
}
