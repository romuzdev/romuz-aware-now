/**
 * M18 Part 2: Playbook Management Hook
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { toast } from '@/hooks/use-toast';
import {
  fetchPlaybooks,
  fetchPlaybookWithSteps,
  createPlaybook,
  updatePlaybook,
  deletePlaybook,
  createPlaybookStep,
  updatePlaybookStep,
  deletePlaybookStep,
  fetchPlaybookExecutions,
  fetchExecutionStepLogs,
  fetchPlaybookTemplates,
  calculatePlaybookSuccessRate
} from '@/integrations/supabase/playbooks';
import { logPlaybookAction } from '@/lib/audit/audit-logger';

export function usePlaybookManagement() {
  const { tenantId, user } = useAppContext();
  const queryClient = useQueryClient();

  // Fetch all playbooks
  const { data: playbooks, isLoading: playbooksLoading } = useQuery({
    queryKey: ['playbooks', tenantId],
    queryFn: () => fetchPlaybooks(tenantId!),
    enabled: !!tenantId,
  });

  // Fetch playbook templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['playbook-templates', tenantId],
    queryFn: () => fetchPlaybookTemplates(tenantId!),
    enabled: !!tenantId,
  });

  // Create playbook mutation
  const createPlaybookMutation = useMutation({
    mutationFn: createPlaybook,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['playbooks', tenantId] });
      logPlaybookAction('create', data.id, user?.id || 'system');
      toast({
        title: 'تم إنشاء Playbook بنجاح',
        description: `تم إنشاء Playbook جديد`,
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ في إنشاء Playbook',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update playbook mutation
  const updatePlaybookMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      updatePlaybook(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['playbooks', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['playbook', data.id] });
      logPlaybookAction('update', data.id, user?.id || 'system');
      toast({
        title: 'تم تحديث Playbook',
        description: `تم تحديث Playbook بنجاح`,
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ في تحديث Playbook',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete playbook mutation
  const deletePlaybookMutation = useMutation({
    mutationFn: deletePlaybook,
    onSuccess: (_, playbookId) => {
      queryClient.invalidateQueries({ queryKey: ['playbooks', tenantId] });
      logPlaybookAction('delete', playbookId, user?.id || 'system');
      toast({
        title: 'تم حذف Playbook',
        description: 'تم حذف Playbook بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ في حذف Playbook',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Create step mutation
  const createStepMutation = useMutation({
    mutationFn: createPlaybookStep,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['playbook', data.playbook_id] });
      toast({
        title: 'تم إضافة خطوة',
        description: 'تم إضافة الخطوة إلى Playbook',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ في إضافة الخطوة',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update step mutation
  const updateStepMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      updatePlaybookStep(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['playbook', data.playbook_id] });
      toast({
        title: 'تم تحديث الخطوة',
        description: 'تم تحديث الخطوة بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ في تحديث الخطوة',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete step mutation
  const deleteStepMutation = useMutation({
    mutationFn: deletePlaybookStep,
    onSuccess: () => {
      toast({
        title: 'تم حذف الخطوة',
        description: 'تم حذف الخطوة من Playbook',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ في حذف الخطوة',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    playbooks,
    templates,
    playbooksLoading,
    templatesLoading,
    createPlaybook: createPlaybookMutation.mutateAsync,
    updatePlaybook: updatePlaybookMutation.mutateAsync,
    deletePlaybook: deletePlaybookMutation.mutateAsync,
    createStep: createStepMutation.mutateAsync,
    updateStep: updateStepMutation.mutateAsync,
    deleteStep: deleteStepMutation.mutateAsync,
  };
}

/**
 * Hook for playbook execution monitoring
 */
export function usePlaybookExecution(playbookId: string) {
  const queryClient = useQueryClient();

  // Fetch playbook with steps
  const { data: playbookData, isLoading: playbookLoading } = useQuery({
    queryKey: ['playbook', playbookId],
    queryFn: () => fetchPlaybookWithSteps(playbookId),
    enabled: !!playbookId,
  });

  // Fetch executions
  const { data: executions, isLoading: executionsLoading } = useQuery({
    queryKey: ['playbook-executions', playbookId],
    queryFn: () => fetchPlaybookExecutions(playbookId),
    enabled: !!playbookId,
  });

  // Fetch success rate
  const { data: successRate } = useQuery({
    queryKey: ['playbook-success-rate', playbookId],
    queryFn: () => calculatePlaybookSuccessRate(playbookId),
    enabled: !!playbookId,
  });

  return {
    playbook: playbookData?.playbook,
    steps: playbookData?.steps || [],
    executions: executions || [],
    successRate: successRate || 0,
    isLoading: playbookLoading || executionsLoading,
  };
}

/**
 * Hook for execution step logs
 */
export function useExecutionStepLogs(executionId: string) {
  const { data: stepLogs, isLoading } = useQuery({
    queryKey: ['execution-step-logs', executionId],
    queryFn: () => fetchExecutionStepLogs(executionId),
    enabled: !!executionId,
    refetchInterval: 5000, // Refresh every 5 seconds for real-time monitoring
  });

  return {
    stepLogs: stepLogs || [],
    isLoading,
  };
}
