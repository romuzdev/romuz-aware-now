/**
 * M18: Incident Response - Integrations Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchIntegrations,
  fetchIntegrationById,
  createIntegration,
  updateIntegration,
  deleteIntegration,
  toggleIntegration,
  verifyIntegration,
  fetchWebhookLogs,
  fetchWebhookLogsByIntegration,
  fetchExternalSources,
  fetchExternalSourcesByIntegration,
  createExternalSource,
  updateExternalSource,
  deleteExternalSource,
  triggerSIEMSync,
  getIntegrationStats,
  type CreateIntegrationInput,
  type UpdateIntegrationInput,
} from '@/integrations/external';

const QUERY_KEYS = {
  integrations: ['incident-integrations'],
  integration: (id: string) => ['incident-integration', id],
  webhookLogs: ['incident-webhook-logs'],
  webhookLogsByIntegration: (id: string) => ['incident-webhook-logs', id],
  externalSources: ['incident-external-sources'],
  externalSourcesByIntegration: (id: string) => ['incident-external-sources', id],
  stats: ['incident-integration-stats'],
};

// ============================================================================
// Integrations
// ============================================================================

export function useIntegrations() {
  return useQuery({
    queryKey: QUERY_KEYS.integrations,
    queryFn: fetchIntegrations,
  });
}

export function useIntegrationById(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.integration(id || ''),
    queryFn: () => (id ? fetchIntegrationById(id) : null),
    enabled: !!id,
  });
}

export function useCreateIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateIntegrationInput) => createIntegration(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.integrations });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
      toast.success('تم إنشاء التكامل بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل إنشاء التكامل', { description: error.message });
    },
  });
}

export function useUpdateIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateIntegrationInput }) =>
      updateIntegration(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.integrations });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.integration(variables.id) });
      toast.success('تم تحديث التكامل بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل تحديث التكامل', { description: error.message });
    },
  });
}

export function useDeleteIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.integrations });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
      toast.success('تم حذف التكامل بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل حذف التكامل', { description: error.message });
    },
  });
}

export function useToggleIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      toggleIntegration(id, is_active),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.integrations });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.integration(variables.id) });
      toast.success(variables.is_active ? 'تم تفعيل التكامل' : 'تم تعطيل التكامل');
    },
    onError: (error: Error) => {
      toast.error('فشل تغيير حالة التكامل', { description: error.message });
    },
  });
}

export function useVerifyIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyIntegration,
    onSuccess: (result, integrationId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.integration(integrationId) });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    },
    onError: (error: Error) => {
      toast.error('فشل التحقق من التكامل', { description: error.message });
    },
  });
}

// ============================================================================
// Webhook Logs
// ============================================================================

export function useWebhookLogs(limit: number = 100) {
  return useQuery({
    queryKey: [...QUERY_KEYS.webhookLogs, limit],
    queryFn: () => fetchWebhookLogs(limit),
  });
}

export function useWebhookLogsByIntegration(integrationId: string | undefined, limit: number = 50) {
  return useQuery({
    queryKey: [...QUERY_KEYS.webhookLogsByIntegration(integrationId || ''), limit],
    queryFn: () => (integrationId ? fetchWebhookLogsByIntegration(integrationId, limit) : []),
    enabled: !!integrationId,
  });
}

// ============================================================================
// External Sources
// ============================================================================

export function useExternalSources() {
  return useQuery({
    queryKey: QUERY_KEYS.externalSources,
    queryFn: fetchExternalSources,
  });
}

export function useExternalSourcesByIntegration(integrationId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.externalSourcesByIntegration(integrationId || ''),
    queryFn: () => (integrationId ? fetchExternalSourcesByIntegration(integrationId) : []),
    enabled: !!integrationId,
  });
}

export function useCreateExternalSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      integrationId,
      input,
    }: {
      integrationId: string;
      input: Parameters<typeof createExternalSource>[1];
    }) => createExternalSource(integrationId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.externalSources });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.externalSourcesByIntegration(variables.integrationId),
      });
      toast.success('تم إضافة المصدر الخارجي');
    },
    onError: (error: Error) => {
      toast.error('فشل إضافة المصدر', { description: error.message });
    },
  });
}

export function useUpdateExternalSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateExternalSource>[1] }) =>
      updateExternalSource(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.externalSources });
      toast.success('تم تحديث المصدر');
    },
    onError: (error: Error) => {
      toast.error('فشل تحديث المصدر', { description: error.message });
    },
  });
}

export function useDeleteExternalSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteExternalSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.externalSources });
      toast.success('تم حذف المصدر');
    },
    onError: (error: Error) => {
      toast.error('فشل حذف المصدر', { description: error.message });
    },
  });
}

// ============================================================================
// SIEM Sync
// ============================================================================

export function useTriggerSIEMSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ integrationId, windowMinutes }: { integrationId: string; windowMinutes?: number }) =>
      triggerSIEMSync(integrationId, windowMinutes),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.integration(variables.integrationId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.webhookLogs });
      toast.success(`تم مزامنة ${result.incidents_created} حادثة من SIEM`);
    },
    onError: (error: Error) => {
      toast.error('فشلت المزامنة', { description: error.message });
    },
  });
}

// ============================================================================
// Statistics
// ============================================================================

export function useIntegrationStats() {
  return useQuery({
    queryKey: QUERY_KEYS.stats,
    queryFn: getIntegrationStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
