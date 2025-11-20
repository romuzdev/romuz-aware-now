/**
 * Sync Jobs Hook
 * Gate-M15: React hook for managing integration sync jobs
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { getSyncJobHistory } from '../integration/health-monitor.integration';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to fetch sync job history
 */
export function useSyncJobHistory(connectorId?: string, limit: number = 50) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['sync-job-history', tenantId, connectorId, limit],
    queryFn: () => getSyncJobHistory(tenantId!, connectorId, limit),
    enabled: !!tenantId,
  });
}

/**
 * Hook to trigger manual sync
 */
export function useTriggerSync() {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { connectorId: string; syncType?: string }) => {
      const { data: connector } = await supabase
        .from('integration_connectors')
        .select('type')
        .eq('id', params.connectorId)
        .single();

      if (!connector) throw new Error('Connector not found');

      // Trigger sync based on connector type
      switch (connector.type) {
        case 'google_workspace':
          return await supabase.functions.invoke('google-drive-sync', {
            body: {
              connector_id: params.connectorId,
              sync_mode: params.syncType || 'incremental',
            },
          });
        case 'odoo':
          return await supabase.functions.invoke('odoo-sync', {
            body: {
              connector_id: params.connectorId,
              sync_type: params.syncType || 'both',
            },
          });
        case 'teams':
          return await supabase.functions.invoke('teams-sync', {
            body: {
              connector_id: params.connectorId,
              sync_type: params.syncType || 'both',
            },
          });
        default:
          throw new Error('Sync not supported for this connector type');
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['sync-job-history', tenantId, variables.connectorId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['integration-health'] 
      });
    },
  });
}

/**
 * Hook to update sync frequency
 */
export function useUpdateSyncFrequency() {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { connectorId: string; frequencyMinutes: number }) => {
      const { data, error } = await supabase
        .from('integration_connectors')
        .update({ sync_frequency_minutes: params.frequencyMinutes })
        .eq('id', params.connectorId)
        .eq('tenant_id', tenantId!)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['connectors', tenantId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['connector', tenantId, variables.connectorId] 
      });
    },
  });
}
