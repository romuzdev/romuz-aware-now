/**
 * Alert History Hook
 * Week 4 - Phase 2
 */

import { useQuery } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { fetchAlertEvents } from '@/modules/alerts/integration';

export function useAlertHistory() {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['alert-events', tenantId],
    queryFn: () => fetchAlertEvents(tenantId!),
    enabled: !!tenantId,
  });
}
