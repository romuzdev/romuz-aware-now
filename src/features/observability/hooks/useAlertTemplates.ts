import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import {
  fetchAlertTemplates,
  fetchAlertTemplateById,
  createAlertTemplate,
  updateAlertTemplate,
  deleteAlertTemplate,
} from '@/modules/observability/integration';
import type { CreateAlertTemplateData } from '@/modules/observability';
import { toast } from 'sonner';
import { useAuditLog } from '@/lib/audit/log-event';

export function useAlertTemplates() {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();
  const { logObservability } = useAuditLog();

  const templatesQuery = useQuery({
    queryKey: ['alert-templates', tenantId],
    queryFn: () => fetchAlertTemplates(tenantId!),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAlertTemplateData) => createAlertTemplate(tenantId!, data),
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: ['alert-templates', tenantId] });
      logObservability('alert_template.created', template.id, { code: template.code });
      toast.success('تم إنشاء القالب بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل إنشاء القالب: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAlertTemplateData> }) =>
      updateAlertTemplate(id, data as any),
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: ['alert-templates', tenantId] });
      logObservability('alert_template.updated', template.id, { code: template.code });
      toast.success('تم تحديث القالب بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل تحديث القالب: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      logObservability('alert_template.deleted', id);
      return deleteAlertTemplate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-templates', tenantId] });
      toast.success('تم حذف القالب بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل حذف القالب: ${error.message}`);
    },
  });

  return {
    templates: templatesQuery.data ?? [],
    loading: templatesQuery.isLoading,
    error: templatesQuery.error,
    createTemplate: createMutation.mutate,
    updateTemplate: updateMutation.mutate,
    deleteTemplate: deleteMutation.mutate,
    refetch: templatesQuery.refetch,
  };
}

export function useAlertTemplateById(id: string | undefined) {
  return useQuery({
    queryKey: ['alert-template', id],
    queryFn: () => fetchAlertTemplateById(id!),
    enabled: !!id,
  });
}
