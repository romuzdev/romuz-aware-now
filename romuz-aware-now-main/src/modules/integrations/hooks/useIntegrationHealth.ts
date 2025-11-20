/**
 * Integration Health Hook
 * Gate-M15: React hook for monitoring integration health
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import {
  getIntegrationHealthStatus,
  getIntegrationHealthSummary,
  getConnectorHealth,
  getConnectorErrors,
  testConnectorConnection,
} from '../integration/health-monitor.integration';

/**
 * Hook to fetch all connector health status
 */
export function useIntegrationHealth() {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['integration-health', tenantId],
    queryFn: () => getIntegrationHealthStatus(tenantId!),
    enabled: !!tenantId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

/**
 * Hook to fetch health summary
 */
export function useIntegrationHealthSummary() {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['integration-health-summary', tenantId],
    queryFn: () => getIntegrationHealthSummary(tenantId!),
    enabled: !!tenantId,
    refetchInterval: 30000,
  });
}

/**
 * Hook to fetch specific connector health
 */
export function useConnectorHealth(connectorId: string) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['connector-health', tenantId, connectorId],
    queryFn: () => getConnectorHealth(tenantId!, connectorId),
    enabled: !!tenantId && !!connectorId,
    refetchInterval: 30000,
  });
}

/**
 * Hook to fetch connector errors
 */
export function useConnectorErrors(connectorId: string, limit: number = 10) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['connector-errors', tenantId, connectorId, limit],
    queryFn: () => getConnectorErrors(tenantId!, connectorId, limit),
    enabled: !!tenantId && !!connectorId,
  });
}

/**
 * Hook to test connector connection
 */
export function useTestConnectorConnection() {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectorId: string) =>
      testConnectorConnection(tenantId!, connectorId),
    onSuccess: (_, connectorId) => {
      // Invalidate health queries
      queryClient.invalidateQueries({ queryKey: ['integration-health'] });
      queryClient.invalidateQueries({ queryKey: ['connector-health', tenantId, connectorId] });
    },
  });
}
