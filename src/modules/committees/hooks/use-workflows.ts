/**
 * D4 Enhancement: Workflows Custom Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  fetchWorkflows,
  fetchWorkflowById,
  fetchAllWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  startWorkflow,
  completeWorkflow,
  cancelWorkflow,
  advanceWorkflow,
  fetchWorkflowStages,
  createWorkflowStage,
  updateWorkflowStage,
  deleteWorkflowStage,
  completeWorkflowStage,
} from '@/modules/committees/integration';
import type { WorkflowFilters } from '@/modules/committees';

/**
 * Fetch workflows for a committee
 */
export function useWorkflows(committeeId: string) {
  return useQuery({
    queryKey: ['workflows', committeeId],
    queryFn: () => fetchWorkflows(committeeId),
    enabled: !!committeeId,
  });
}

/**
 * Fetch single workflow by ID
 */
export function useWorkflow(workflowId: string) {
  return useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: () => fetchWorkflowById(workflowId),
    enabled: !!workflowId,
  });
}

/**
 * Fetch all workflows with filters
 */
export function useAllWorkflows(filters?: WorkflowFilters) {
  return useQuery({
    queryKey: ['workflows', 'all', filters],
    queryFn: () => fetchAllWorkflows(filters),
  });
}

/**
 * Create workflow mutation
 */
export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createWorkflow,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast({
        title: 'تم إنشاء سير العمل',
        description: 'تم إنشاء سير العمل بنجاح',
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
}

/**
 * Update workflow mutation
 */
export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      updateWorkflow(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflow', data.id] });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث سير العمل بنجاح',
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
}

/**
 * Delete workflow mutation
 */
export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف سير العمل بنجاح',
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
}

/**
 * Start workflow mutation
 */
export function useStartWorkflow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: startWorkflow,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflow', data.id] });
      toast({
        title: 'تم البدء',
        description: 'تم بدء سير العمل بنجاح',
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
}

/**
 * Complete workflow mutation
 */
export function useCompleteWorkflow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: completeWorkflow,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflow', data.id] });
      toast({
        title: 'تم الإكمال',
        description: 'تم إكمال سير العمل بنجاح',
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
}

/**
 * Cancel workflow mutation
 */
export function useCancelWorkflow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      cancelWorkflow(id, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflow', data.id] });
      toast({
        title: 'تم الإلغاء',
        description: 'تم إلغاء سير العمل',
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
}

/**
 * Advance workflow mutation
 */
export function useAdvanceWorkflow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: advanceWorkflow,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflow', data.id] });
      toast({
        title: 'تم التقدم',
        description: 'تم الانتقال إلى المرحلة التالية',
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
}

/**
 * Fetch workflow stages
 */
export function useWorkflowStages(workflowId: string) {
  return useQuery({
    queryKey: ['workflow-stages', workflowId],
    queryFn: () => fetchWorkflowStages(workflowId),
    enabled: !!workflowId,
  });
}

/**
 * Create workflow stage mutation
 */
export function useCreateWorkflowStage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createWorkflowStage,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflow-stages', data.workflow_id] });
      toast({
        title: 'تم الإضافة',
        description: 'تم إضافة مرحلة جديدة',
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
}

/**
 * Complete workflow stage mutation
 */
export function useCompleteWorkflowStage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      completeWorkflowStage(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-stages'] });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast({
        title: 'تم الإكمال',
        description: 'تم إكمال المرحلة بنجاح',
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
}
