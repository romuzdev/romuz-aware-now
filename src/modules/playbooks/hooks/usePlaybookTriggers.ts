/**
 * M18 Part 2: Playbook Triggers Hook
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import {
  fetchPlaybookTriggers,
  createPlaybookTrigger,
  updatePlaybookTrigger,
  deletePlaybookTrigger,
} from '@/integrations/supabase/playbooks';

export function usePlaybookTriggers(playbookId: string) {
  const queryClient = useQueryClient();

  // Fetch triggers
  const { data: triggers, isLoading } = useQuery({
    queryKey: ['playbook-triggers', playbookId],
    queryFn: () => fetchPlaybookTriggers(playbookId),
    enabled: !!playbookId,
  });

  // Create trigger mutation
  const createTriggerMutation = useMutation({
    mutationFn: createPlaybookTrigger,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook-triggers', playbookId] });
      toast({
        title: 'تم إنشاء Trigger',
        description: 'تم إنشاء Trigger بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ في إنشاء Trigger',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update trigger mutation
  const updateTriggerMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      updatePlaybookTrigger(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook-triggers', playbookId] });
      toast({
        title: 'تم تحديث Trigger',
        description: 'تم تحديث Trigger بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ في تحديث Trigger',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete trigger mutation
  const deleteTriggerMutation = useMutation({
    mutationFn: deletePlaybookTrigger,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook-triggers', playbookId] });
      toast({
        title: 'تم حذف Trigger',
        description: 'تم حذف Trigger بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ في حذف Trigger',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    triggers: triggers || [],
    isLoading,
    createTrigger: createTriggerMutation.mutateAsync,
    updateTrigger: updateTriggerMutation.mutateAsync,
    deleteTrigger: deleteTriggerMutation.mutateAsync,
  };
}
