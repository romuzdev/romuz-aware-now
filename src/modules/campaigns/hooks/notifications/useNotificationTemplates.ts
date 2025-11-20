// ============================================================================
// Part 13.2: Notification Templates Hook
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useTenantUser } from '@/lib/app/get-tenant-user';
import { useCan } from '@/core/rbac';
import {
  fetchNotificationTemplates,
  upsertNotificationTemplate,
  deleteNotificationTemplate,
} from '@/modules/campaigns/integration/notifications.integration';
import type { NotificationTemplateFormData } from '@/modules/campaigns';

export function useNotificationTemplates() {
  const { toast } = useToast();
  const { tenantId } = useTenantUser();
  const can = useCan();
  const qc = useQueryClient();

  const canManage = can('campaigns.manage');

  const query = useQuery({
    queryKey: ['notification-templates', tenantId],
    queryFn: () => {
      if (!tenantId) throw new Error('Tenant ID required');
      return fetchNotificationTemplates(tenantId);
    },
    enabled: !!tenantId,
  });

  const upsertMutation = useMutation({
    mutationFn: ({
      templateId,
      formData,
    }: {
      templateId: string | null;
      formData: NotificationTemplateFormData;
    }) => {
      if (!canManage) throw new Error('Permission denied: managers only');
      if (!tenantId) throw new Error('Tenant ID required');
      return upsertNotificationTemplate(tenantId, templateId, formData);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notification-templates', tenantId] });
      toast({ title: 'Template saved' });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to save template',
        description: error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (templateId: string) => {
      if (!canManage) throw new Error('Permission denied: managers only');
      return deleteNotificationTemplate(templateId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notification-templates', tenantId] });
      toast({ title: 'Template deleted' });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to delete template',
        description: error.message,
      });
    },
  });

  return {
    templates: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    canManage,
    upsertTemplate: upsertMutation.mutateAsync,
    deleteTemplate: deleteMutation.mutateAsync,
    isLoading: upsertMutation.isPending || deleteMutation.isPending,
  };
}
