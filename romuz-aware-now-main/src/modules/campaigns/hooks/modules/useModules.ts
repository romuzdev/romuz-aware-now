import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useTenantUser } from '@/lib/app/get-tenant-user';
import {
  fetchModules,
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
} from '@/modules/campaigns/integration/modules.integration';
import type { ModuleFormData } from '@/modules/campaigns';

export function useModules(campaignId: string) {
  const { toast } = useToast();
  const { tenantId } = useTenantUser();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['modules', campaignId],
    queryFn: () => fetchModules(campaignId),
    enabled: !!campaignId,
  });

  const createMutation = useMutation({
    mutationFn: (formData: ModuleFormData) => {
      if (!tenantId) throw new Error('Tenant ID required');
      return createModule(tenantId, campaignId, formData);
    },
    onSuccess: () => {
      toast({ title: 'Module created' });
      qc.invalidateQueries({ queryKey: ['modules', campaignId] });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: Partial<ModuleFormData> }) =>
      updateModule(id, formData),
    onSuccess: () => {
      toast({ title: 'Module updated' });
      qc.invalidateQueries({ queryKey: ['modules', campaignId] });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteModule,
    onSuccess: () => {
      toast({ title: 'Module deleted' });
      qc.invalidateQueries({ queryKey: ['modules', campaignId] });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: ({ moduleId, direction }: { moduleId: string; direction: 'up' | 'down' }) =>
      reorderModules(campaignId, moduleId, direction),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['modules', campaignId] });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Failed to reorder', description: error.message });
    },
  });

  return {
    modules: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createModule: createMutation.mutateAsync,
    updateModule: updateMutation.mutateAsync,
    deleteModule: deleteMutation.mutateAsync,
    moveUp: (moduleId: string) => reorderMutation.mutate({ moduleId, direction: 'up' }),
    moveDown: (moduleId: string) => reorderMutation.mutate({ moduleId, direction: 'down' }),
    isLoading:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending ||
      reorderMutation.isPending,
  };
}
