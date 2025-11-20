import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useTenantUser } from '@/lib/app/get-tenant-user';
import {
  fetchModuleProgress,
  markModuleStarted,
  markModuleCompleted,
  checkCampaignCompletion,
} from '@/modules/campaigns/integration/modules.integration';
import { bulkUpdateParticipants } from '@/modules/campaigns/integration';

export function useModuleProgress(campaignId: string, participantId: string) {
  const { toast } = useToast();
  const { tenantId } = useTenantUser();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['module-progress', participantId],
    queryFn: () => fetchModuleProgress(participantId),
    enabled: !!participantId,
  });

  const markStartedMutation = useMutation({
    mutationFn: (moduleId: string) => {
      if (!tenantId) throw new Error('Tenant ID required');
      return markModuleStarted(tenantId, campaignId, moduleId, participantId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['module-progress', participantId] });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
    },
  });

  const markCompletedMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      if (!tenantId) throw new Error('Tenant ID required');
      await markModuleCompleted(tenantId, campaignId, moduleId, participantId);

      // Check if all required modules are completed
      const allCompleted = await checkCampaignCompletion(campaignId, participantId);

      if (allCompleted) {
        // Update participant status to completed
        await bulkUpdateParticipants([participantId], {
          status: 'completed',
          completed_at: new Date().toISOString(),
        });

        toast({
          title: 'Campaign completed! 🎉',
          description: 'All required modules have been completed.',
        });
      } else {
        toast({ title: 'Module completed' });
      }

      return allCompleted;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['module-progress', participantId] });
      qc.invalidateQueries({ queryKey: ['participants'] });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
    },
  });

  return {
    progress: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    markStarted: markStartedMutation.mutateAsync,
    markCompleted: markCompletedMutation.mutateAsync,
    isLoading: markStartedMutation.isPending || markCompletedMutation.isPending,
  };
}
