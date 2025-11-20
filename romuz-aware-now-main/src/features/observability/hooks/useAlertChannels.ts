import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import {
  fetchAlertChannels,
  fetchAlertChannelById,
  createAlertChannel,
  updateAlertChannel,
  deleteAlertChannel,
} from '@/modules/observability/integration';
import type { CreateAlertChannelData } from '@/modules/observability';
import { toast } from 'sonner';
import { useAuditLog } from '@/lib/audit/log-event';

export function useAlertChannels() {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();
  const { logObservability } = useAuditLog();

  const channelsQuery = useQuery({
    queryKey: ['alert-channels', tenantId],
    queryFn: () => fetchAlertChannels(tenantId!),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAlertChannelData) => createAlertChannel(tenantId!, data),
    onSuccess: (channel) => {
      queryClient.invalidateQueries({ queryKey: ['alert-channels', tenantId] });
      logObservability('alert_channel.created', channel.id, { name: channel.name, type: channel.type });
      toast.success('تم إنشاء القناة بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل إنشاء القناة: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAlertChannelData> }) =>
      updateAlertChannel(id, data),
    onSuccess: (channel) => {
      queryClient.invalidateQueries({ queryKey: ['alert-channels', tenantId] });
      logObservability('alert_channel.updated', channel.id, { name: channel.name });
      toast.success('تم تحديث القناة بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل تحديث القناة: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      logObservability('alert_channel.deleted', id);
      return deleteAlertChannel(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-channels', tenantId] });
      toast.success('تم حذف القناة بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل حذف القناة: ${error.message}`);
    },
  });

  return {
    channels: channelsQuery.data ?? [],
    loading: channelsQuery.isLoading,
    error: channelsQuery.error,
    createChannel: createMutation.mutate,
    updateChannel: updateMutation.mutate,
    deleteChannel: deleteMutation.mutate,
    refetch: channelsQuery.refetch,
  };
}

export function useAlertChannelById(id: string | undefined) {
  return useQuery({
    queryKey: ['alert-channel', id],
    queryFn: () => fetchAlertChannelById(id!),
    enabled: !!id,
  });
}
