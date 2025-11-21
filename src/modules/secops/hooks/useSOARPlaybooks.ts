/**
 * SOAR Playbooks Hook
 * M18.5 - SecOps Integration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import {
  fetchSOARPlaybooks,
  fetchSOARPlaybookById,
  createSOARPlaybook,
  updateSOARPlaybook,
  deleteSOARPlaybook,
  activatePlaybook,
  deactivatePlaybook,
  getActivePlaybooksCount,
} from '../integration';
import type { SOARPlaybook, SOARPlaybookFilters } from '../types';
import { toast } from 'sonner';
import { logPlaybookAction } from '@/lib/audit/secops-audit-logger';

export function useSOARPlaybooks(filters?: SOARPlaybookFilters) {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();

  const playbooksQuery = useQuery({
    queryKey: ['soar-playbooks', tenantId, filters],
    queryFn: () => fetchSOARPlaybooks(filters),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: (playbook: Omit<SOARPlaybook, 'id' | 'execution_count' | 'success_count' | 'created_at' | 'updated_at'>) =>
      createSOARPlaybook(playbook),
    onSuccess: (playbook) => {
      queryClient.invalidateQueries({ queryKey: ['soar-playbooks', tenantId] });
      logPlaybookAction(playbook.id, 'create', { name: playbook.playbook_name_ar });
      toast.success('تم إنشاء دليل SOAR بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل إنشاء الدليل: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SOARPlaybook> }) =>
      updateSOARPlaybook(id, updates),
    onSuccess: (playbook) => {
      queryClient.invalidateQueries({ queryKey: ['soar-playbooks', tenantId] });
      logPlaybookAction(playbook.id, 'update');
      toast.success('تم تحديث الدليل بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل التحديث: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      logPlaybookAction(id, 'delete');
      return deleteSOARPlaybook(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soar-playbooks', tenantId] });
      toast.success('تم حذف الدليل بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل الحذف: ${error.message}`);
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => activatePlaybook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soar-playbooks', tenantId] });
      toast.success('تم تفعيل الدليل');
    },
    onError: (error: Error) => {
      toast.error(`فشل التفعيل: ${error.message}`);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivatePlaybook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soar-playbooks', tenantId] });
      toast.success('تم إيقاف الدليل');
    },
    onError: (error: Error) => {
      toast.error(`فشل الإيقاف: ${error.message}`);
    },
  });

  return {
    playbooks: playbooksQuery.data ?? [],
    loading: playbooksQuery.isLoading,
    error: playbooksQuery.error,
    createPlaybook: createMutation.mutate,
    updatePlaybook: updateMutation.mutate,
    deletePlaybook: deleteMutation.mutate,
    activatePlaybook: activateMutation.mutate,
    deactivatePlaybook: deactivateMutation.mutate,
    refetch: playbooksQuery.refetch,
  };
}

export function useSOARPlaybookById(id: string | undefined) {
  return useQuery({
    queryKey: ['soar-playbook', id],
    queryFn: () => fetchSOARPlaybookById(id!),
    enabled: !!id,
  });
}

export function useActivePlaybooksCount() {
  return useQuery({
    queryKey: ['active-playbooks-count'],
    queryFn: getActivePlaybooksCount,
  });
}
