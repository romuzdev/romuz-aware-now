// ============================================================================
// Part 13.2: Notifications Queue Hook
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useTenantUser } from '@/lib/app/get-tenant-user';
import { useCan } from '@/core/rbac';
import {
  fetchNotificationQueue,
  fetchNotificationQueueStats,
  fetchNotificationLogs,
  enqueueNotifications,
  sendNowSimulated,
  retryFailedNotification,
  bulkRetryFailed,
} from '@/modules/campaigns/integration/notifications.integration';
import type { EnqueueNotificationPayload } from '@/modules/campaigns';

export function useNotificationsQueue(campaignId: string) {
  const { toast } = useToast();
  const { tenantId } = useTenantUser();
  const can = useCan();
  const qc = useQueryClient();

  const canManage = can('campaigns.manage');

  const queueQuery = useQuery({
    queryKey: ['notification-queue', campaignId],
    queryFn: () => fetchNotificationQueue(campaignId),
    enabled: !!campaignId,
  });

  const statsQuery = useQuery({
    queryKey: ['notification-queue-stats', campaignId],
    queryFn: () => fetchNotificationQueueStats(campaignId),
    enabled: !!campaignId,
  });

  const logsQuery = useQuery({
    queryKey: ['notification-logs', campaignId],
    queryFn: () => fetchNotificationLogs(campaignId),
    enabled: !!campaignId,
  });

  const enqueueMutation = useMutation({
    mutationFn: (payload: EnqueueNotificationPayload) => {
      if (!canManage) throw new Error('Permission denied: managers only');
      if (!tenantId) throw new Error('Tenant ID required');
      return enqueueNotifications(tenantId, payload);
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ['notification-queue', campaignId] });
      qc.invalidateQueries({ queryKey: ['notification-queue-stats', campaignId] });
      toast({ title: `${count} notification(s) enqueued` });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to enqueue notifications',
        description: error.message,
      });
    },
  });

  const sendNowMutation = useMutation({
    mutationFn: (queueItemId: string) => {
      if (!canManage) throw new Error('Permission denied: managers only');
      return sendNowSimulated(queueItemId);
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['notification-queue', campaignId] });
      qc.invalidateQueries({ queryKey: ['notification-queue-stats', campaignId] });
      qc.invalidateQueries({ queryKey: ['notification-logs', campaignId] });
      
      if (result.success) {
        toast({ title: 'Notification sent (simulated)' });
      } else {
        toast({
          variant: 'destructive',
          title: 'Simulated send failed',
          description: result.error || 'Random failure for testing',
        });
      }
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to send notification',
        description: error.message,
      });
    },
  });

  const retryMutation = useMutation({
    mutationFn: (queueItemId: string) => {
      if (!canManage) throw new Error('Permission denied: managers only');
      return retryFailedNotification(queueItemId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notification-queue', campaignId] });
      qc.invalidateQueries({ queryKey: ['notification-queue-stats', campaignId] });
      toast({ title: 'Notification queued for retry' });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to retry notification',
        description: error.message,
      });
    },
  });

  const bulkRetryMutation = useMutation({
    mutationFn: () => {
      if (!canManage) throw new Error('Permission denied: managers only');
      return bulkRetryFailed(campaignId);
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ['notification-queue', campaignId] });
      qc.invalidateQueries({ queryKey: ['notification-queue-stats', campaignId] });
      toast({ title: `${count} failed notification(s) queued for retry` });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to retry notifications',
        description: error.message,
      });
    },
  });

  return {
    queue: queueQuery.data,
    stats: statsQuery.data,
    logs: logsQuery.data,
    loading: queueQuery.isLoading || statsQuery.isLoading || logsQuery.isLoading,
    error: queueQuery.error || statsQuery.error || logsQuery.error,
    refetch: () => {
      queueQuery.refetch();
      statsQuery.refetch();
      logsQuery.refetch();
    },
    canManage,
    enqueue: enqueueMutation.mutateAsync,
    sendNow: sendNowMutation.mutateAsync,
    retry: retryMutation.mutateAsync,
    bulkRetry: bulkRetryMutation.mutateAsync,
    isLoading:
      enqueueMutation.isPending ||
      sendNowMutation.isPending ||
      retryMutation.isPending ||
      bulkRetryMutation.isPending,
  };
}
