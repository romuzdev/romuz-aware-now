/**
 * M25 - Playbooks Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getPlaybooks,
  getActivePlaybooks,
  getPlaybookById,
  createPlaybook,
  updatePlaybookStatus,
  updatePlaybookProgress,
  deletePlaybook,
} from '../integration';
import type { PlaybookFilters, PlaybookStatus } from '../types';

const QUERY_KEY = ['success', 'playbooks'];

export function usePlaybooks(filters?: PlaybookFilters) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get playbooks
  const { data: playbooks = [], isLoading } = useQuery({
    queryKey: [...QUERY_KEY, 'list', filters],
    queryFn: () => getPlaybooks(filters),
  });

  // Create playbook
  const createMutation = useMutation({
    mutationFn: createPlaybook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: 'تم',
        description: 'تم إنشاء خطة التحسين',
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
    mutationFn: ({ id, status }: { id: string; status: PlaybookStatus }) =>
      updatePlaybookStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: 'تم',
        description: 'تم تحديث حالة خطة التحسين',
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

  // Delete playbook
  const deleteMutation = useMutation({
    mutationFn: deletePlaybook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: 'تم',
        description: 'تم حذف خطة التحسين',
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
    playbooks,
    isLoading,
    create: createMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateStatusMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useActivePlaybooks() {
  const { data: playbooks = [], isLoading } = useQuery({
    queryKey: [...QUERY_KEY, 'active'],
    queryFn: getActivePlaybooks,
  });

  return { playbooks, isLoading };
}

export function usePlaybook(id?: string) {
  const { data: playbook, isLoading } = useQuery({
    queryKey: [...QUERY_KEY, 'detail', id],
    queryFn: () => (id ? getPlaybookById(id) : Promise.resolve(null)),
    enabled: !!id,
  });

  return { playbook, isLoading };
}
