import { useQuery } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { fetchCampaignKPICTD } from '@/modules/observability/integration';

export function useCampaignKPIs(campaignId?: string) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['campaign-kpis-ctd', tenantId, campaignId],
    queryFn: () => fetchCampaignKPICTD(tenantId!, campaignId),
    enabled: !!tenantId,
  });
}
