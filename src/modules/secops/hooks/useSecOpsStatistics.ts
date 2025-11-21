/**
 * SecOps Statistics Hook
 * M18.5 - SecOps Integration
 */

import { useQuery } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { fetchSecOpsStatistics } from '../integration';

export function useSecOpsStatistics() {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['secops-statistics', tenantId],
    queryFn: fetchSecOpsStatistics,
    enabled: !!tenantId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
