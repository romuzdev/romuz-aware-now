import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useTenantUser } from '@/lib/app/get-tenant-user';
import { 
  upsertParticipant, 
  bulkUpdateParticipants, 
  bulkSoftDeleteParticipants,
  bulkUndeleteParticipants 
} from '@/modules/campaigns/integration';
import type { ParticipantUpsert } from '@/modules/campaigns';

export function useParticipantsActions() {
  const { toast } = useToast();
  const { tenantId } = useTenantUser();
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['participants'] });
  };

  const upsertMutation = useMutation({
    mutationFn: (data: ParticipantUpsert) => {
      if (!tenantId) throw new Error('Tenant ID required');
      if (data.score !== null && data.score !== undefined) {
        if (data.score < 0 || data.score > 100) {
          throw new Error('Score must be between 0 and 100');
        }
      }
      return upsertParticipant(tenantId, data);
    },
    onSuccess: (result) => {
      const action = result.action === 'inserted' ? 'added' : 'updated';
      toast({ title: 'Success', description: `Participant ${action}` });
      invalidate();
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, patch }: { ids: string[]; patch: any }) => {
      if (patch.score !== null && patch.score !== undefined) {
        if (patch.score < 0 || patch.score > 100) {
          throw new Error('Score must be between 0 and 100');
        }
      }
      return bulkUpdateParticipants(ids, patch);
    },
    onSuccess: (count) => {
      toast({ title: 'Updated', description: `Updated ${count} participant(s)` });
      invalidate();
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: bulkSoftDeleteParticipants,
    onSuccess: (count) => {
      toast({ title: 'Deleted', description: `Deleted ${count} participant(s)` });
      invalidate();
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
    },
  });

  const bulkUndeleteMutation = useMutation({
    mutationFn: bulkUndeleteParticipants,
    onSuccess: (count) => {
      toast({ title: 'Restored', description: `Restored ${count} participant(s)` });
      invalidate();
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
    },
  });

  return {
    upsert: upsertMutation.mutateAsync,
    bulkUpdate: bulkUpdateMutation.mutateAsync,
    bulkDelete: bulkDeleteMutation.mutateAsync,
    bulkUndelete: bulkUndeleteMutation.mutateAsync,
    isLoading: upsertMutation.isPending || bulkUpdateMutation.isPending || 
                bulkDeleteMutation.isPending || bulkUndeleteMutation.isPending,
  };
}
