/**
 * M25 - Playbook Actions Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getPlaybookActions,
  getActions,
  getMyActions,
  createAction,
  updateActionStatus,
  assignAction,
  addActionEvidence,
  deleteAction,
} from '../integration';
import type { ActionFilters, ActionStatus } from '../types';

const QUERY_KEY = ['success', 'actions'];

export function useActions(filters?: ActionFilters) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get actions
  const { data: actions = [], isLoading } = useQuery({
    queryKey: [...QUERY_KEY, 'list', filters],
    queryFn: () => getActions(filters),
  });

  // Create action
  const createMutation = useMutation({
    mutationFn: createAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: 'تم',
        description: 'تم إنشاء المهمة',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: ActionStatus; notes?: string }) =>
      updateActionStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: 'تم',
        description: 'تم تحديث حالة المهمة',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Assign action
  const assignMutation = useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      assignAction(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: 'تم',
        description: 'تم تعيين المهمة',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete action
  const deleteMutation = useMutation({
    mutationFn: deleteAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: 'تم',
        description: 'تم حذف المهمة',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    actions,
    isLoading,
    create: createMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    assign: assignMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateStatusMutation.isPending,
  };
}

export function usePlaybookActions(playbookId?: string) {
  const { data: actions = [], isLoading } = useQuery({
    queryKey: [...QUERY_KEY, 'playbook', playbookId],
    queryFn: () => (playbookId ? getPlaybookActions(playbookId) : Promise.resolve([])),
    enabled: !!playbookId,
  });

  return { actions, isLoading };
}

export function useMyActions() {
  const { data: actions = [], isLoading } = useQuery({
    queryKey: [...QUERY_KEY, 'my'],
    queryFn: getMyActions,
  });

  return { actions, isLoading };
}
