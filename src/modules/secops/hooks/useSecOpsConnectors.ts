/**
 * SecOps Connectors Hook
 * M18.5 - SecOps Integration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import {
  fetchSecOpsConnectors,
  fetchSecOpsConnectorById,
  createSecOpsConnector,
  updateSecOpsConnector,
  deleteSecOpsConnector,
  updateConnectorSyncStatus,
  fetchConnectorSyncLogs,
} from '../integration';
import type { SecOpsConnector, ConnectorFilters } from '../types';
import { toast } from 'sonner';
import { logConnectorAction } from '@/lib/audit/secops-audit-logger';

export function useSecOpsConnectors(filters?: ConnectorFilters) {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();

  const connectorsQuery = useQuery({
    queryKey: ['secops-connectors', tenantId, filters],
    queryFn: () => fetchSecOpsConnectors(filters),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: (connector: Omit<SecOpsConnector, 'id' | 'created_at' | 'updated_at'>) =>
      createSecOpsConnector(connector),
    onSuccess: (connector) => {
      queryClient.invalidateQueries({ queryKey: ['secops-connectors', tenantId] });
      logConnectorAction(connector.id, 'create', { name: connector.name_ar, type: connector.connector_type });
      toast.success('تم إنشاء الموصل بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل إنشاء الموصل: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SecOpsConnector> }) =>
      updateSecOpsConnector(id, updates),
    onSuccess: (connector) => {
      queryClient.invalidateQueries({ queryKey: ['secops-connectors', tenantId] });
      logConnectorAction(connector.id, 'update');
      toast.success('تم تحديث الموصل بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل التحديث: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      logConnectorAction(id, 'delete');
      return deleteSecOpsConnector(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secops-connectors', tenantId] });
      toast.success('تم حذف الموصل بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل الحذف: ${error.message}`);
    },
  });

  const syncStatusMutation = useMutation({
    mutationFn: ({ id, status, error }: { id: string; status: 'success' | 'error' | 'syncing' | 'idle'; error?: string }) => {
      logConnectorAction(id, 'sync', { status, error: error || '' });
      return updateConnectorSyncStatus(id, status, undefined, error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secops-connectors', tenantId] });
    },
    onError: (error: Error) => {
      toast.error(`فشل تحديث حالة المزامنة: ${error.message}`);
    },
  });

  return {
    connectors: connectorsQuery.data ?? [],
    loading: connectorsQuery.isLoading,
    error: connectorsQuery.error,
    createConnector: createMutation.mutate,
    updateConnector: updateMutation.mutate,
    deleteConnector: deleteMutation.mutate,
    updateSyncStatus: syncStatusMutation.mutate,
    refetch: connectorsQuery.refetch,
  };
}

export function useSecOpsConnectorById(id: string | undefined) {
  return useQuery({
    queryKey: ['secops-connector', id],
    queryFn: () => fetchSecOpsConnectorById(id!),
    enabled: !!id,
  });
}

export function useConnectorSyncLogs(connectorId: string, limit = 50) {
  return useQuery({
    queryKey: ['connector-sync-logs', connectorId, limit],
    queryFn: () => fetchConnectorSyncLogs(connectorId, limit),
    enabled: !!connectorId,
  });
}
