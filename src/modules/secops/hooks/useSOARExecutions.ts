/**
 * SOAR Executions Hook
 * M18.5 - SecOps Integration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import {
  fetchSOARExecutions,
  fetchSOARExecutionById,
  createSOARExecution,
  completeExecution,
  failExecution,
  cancelExecution,
  getRunningExecutionsCount,
  fetchRecentExecutions,
} from '../integration';
import type { SOARExecution, ExecutionStatus } from '../types';
import { toast } from 'sonner';
import { logExecutionAction } from '@/lib/audit/secops-audit-logger';

export function useSOARExecutions(playbookId?: string, status?: ExecutionStatus) {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();

  const executionsQuery = useQuery({
    queryKey: ['soar-executions', tenantId, playbookId, status],
    queryFn: () => fetchSOARExecutions(playbookId, status),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: (execution: Omit<SOARExecution, 'id' | 'started_at' | 'created_at'>) =>
      createSOARExecution(execution),
    onSuccess: (execution) => {
      queryClient.invalidateQueries({ queryKey: ['soar-executions', tenantId] });
      logExecutionAction(execution.id, 'create', { playbook_id: execution.playbook_id });
      toast.success('تم بدء تنفيذ SOAR');
    },
    onError: (error: Error) => {
      toast.error(`فشل بدء التنفيذ: ${error.message}`);
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, result }: { id: string; result: Record<string, any> }) =>
      completeExecution(id, result),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soar-executions', tenantId] });
      toast.success('اكتمل التنفيذ بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل إتمام التنفيذ: ${error.message}`);
    },
  });

  const failMutation = useMutation({
    mutationFn: ({ id, error }: { id: string; error: string }) =>
      failExecution(id, error),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soar-executions', tenantId] });
      toast.error('فشل التنفيذ');
    },
    onError: (error: Error) => {
      toast.error(`خطأ: ${error.message}`);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelExecution(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soar-executions', tenantId] });
      toast.success('تم إلغاء التنفيذ');
    },
    onError: (error: Error) => {
      toast.error(`فشل الإلغاء: ${error.message}`);
    },
  });

  return {
    executions: executionsQuery.data ?? [],
    loading: executionsQuery.isLoading,
    error: executionsQuery.error,
    startExecution: createMutation.mutate,
    completeExecution: completeMutation.mutate,
    failExecution: failMutation.mutate,
    cancelExecution: cancelMutation.mutate,
    refetch: executionsQuery.refetch,
  };
}

export function useSOARExecutionById(id: string | undefined) {
  return useQuery({
    queryKey: ['soar-execution', id],
    queryFn: () => fetchSOARExecutionById(id!),
    enabled: !!id,
  });
}

export function useRunningExecutionsCount() {
  return useQuery({
    queryKey: ['running-executions-count'],
    queryFn: getRunningExecutionsCount,
  });
}

export function useRecentExecutions(limit = 20) {
  return useQuery({
    queryKey: ['recent-executions', limit],
    queryFn: () => fetchRecentExecutions(limit),
  });
}
