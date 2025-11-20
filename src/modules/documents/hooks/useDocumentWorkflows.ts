/**
 * Document Workflows Hook
 * 
 * React Query hooks for managing document workflow automation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import {
  fetchWorkflowRules,
  fetchWorkflowRuleById,
  createWorkflowRule,
  updateWorkflowRule,
  deleteWorkflowRule,
  toggleWorkflowRule,
  executeWorkflowRule,
  checkDocumentExpirations,
  suggestDocumentTags,
  compareDocumentVersions,
  fetchWorkflowExecutions,
  getWorkflowStatistics,
  type WorkflowRule,
  type CreateWorkflowRuleInput,
} from '../integration/workflow-automation.integration';

/**
 * Hook to fetch all workflow rules (optionally filtered by app_code)
 */
export function useWorkflowRules(appCode?: string | null) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['workflow-rules', tenantId, appCode],
    queryFn: () => fetchWorkflowRules(tenantId!, appCode),
    enabled: !!tenantId,
    staleTime: 30_000,
  });
}

/**
 * Hook to fetch a single workflow rule
 */
export function useWorkflowRule(ruleId: string | undefined) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['workflow-rule', tenantId, ruleId],
    queryFn: () => fetchWorkflowRuleById(tenantId!, ruleId!),
    enabled: !!tenantId && !!ruleId,
    staleTime: 30_000,
  });
}

/**
 * Hook to create a new workflow rule
 */
export function useCreateWorkflowRule() {
  const { tenantId, user } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWorkflowRuleInput) => 
      createWorkflowRule(tenantId!, user!.id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-rules', tenantId] });
      toast({
        title: 'تم إنشاء قاعدة التشغيل الآلي',
        description: 'تم إنشاء قاعدة التشغيل الآلي بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'خطأ في إنشاء القاعدة',
        description: error.message,
      });
    },
  });
}

/**
 * Hook to update a workflow rule
 */
export function useUpdateWorkflowRule() {
  const { tenantId, user } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ruleId, updates }: { ruleId: string; updates: Partial<CreateWorkflowRuleInput> }) =>
      updateWorkflowRule(tenantId!, user!.id, ruleId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflow-rules', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['workflow-rule', tenantId, variables.ruleId] });
      toast({
        title: 'تم تحديث القاعدة',
        description: 'تم تحديث قاعدة التشغيل الآلي بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'خطأ في التحديث',
        description: error.message,
      });
    },
  });
}

/**
 * Hook to delete a workflow rule
 */
export function useDeleteWorkflowRule() {
  const { tenantId, user } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ruleId: string) => deleteWorkflowRule(tenantId!, user!.id, ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-rules', tenantId] });
      toast({
        title: 'تم حذف القاعدة',
        description: 'تم حذف قاعدة التشغيل الآلي بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'خطأ في الحذف',
        description: error.message,
      });
    },
  });
}

/**
 * Hook to toggle workflow rule enabled state
 */
export function useToggleWorkflowRule() {
  const { tenantId, user } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ruleId, enabled }: { ruleId: string; enabled: boolean }) =>
      toggleWorkflowRule(tenantId!, user!.id, ruleId, enabled),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflow-rules', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['workflow-rule', tenantId, variables.ruleId] });
      toast({
        title: variables.enabled ? 'تم تفعيل القاعدة' : 'تم تعطيل القاعدة',
        description: variables.enabled ? 'القاعدة الآن نشطة' : 'القاعدة الآن معطلة',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'خطأ في التبديل',
        description: error.message,
      });
    },
  });
}

/**
 * Hook to execute a workflow rule
 */
export function useExecuteWorkflowRule() {
  const { tenantId } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ruleId, documentId }: { ruleId: string; documentId: string }) =>
      executeWorkflowRule(tenantId!, ruleId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-executions', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['documents', tenantId] });
      toast({
        title: 'تم تنفيذ القاعدة',
        description: 'تم تنفيذ القاعدة بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'خطأ في التنفيذ',
        description: error.message,
      });
    },
  });
}

/**
 * Hook to check document expirations
 */
export function useCheckExpirations() {
  const { tenantId } = useAppContext();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => checkDocumentExpirations(tenantId!),
    onSuccess: (data) => {
      toast({
        title: 'تم فحص تواريخ الانتهاء',
        description: `تم إرسال ${data.count} تنبيه`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'خطأ في الفحص',
        description: error.message,
      });
    },
  });
}

/**
 * Hook to get AI tag suggestions
 */
export function useSuggestTags(documentId: string | undefined) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['document-tags-suggestions', tenantId, documentId],
    queryFn: () => suggestDocumentTags(tenantId!, documentId!),
    enabled: !!tenantId && !!documentId,
    staleTime: 300_000, // 5 minutes
  });
}

/**
 * Hook to compare document versions
 */
export function useCompareDocumentVersions() {
  const { tenantId } = useAppContext();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ versionId1, versionId2 }: { versionId1: string; versionId2: string }) =>
      compareDocumentVersions(tenantId!, versionId1, versionId2),
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'خطأ في المقارنة',
        description: error.message,
      });
    },
  });
}

/**
 * Hook to fetch workflow executions
 */
export function useWorkflowExecutions(documentId?: string, ruleId?: string) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['workflow-executions', tenantId, documentId, ruleId],
    queryFn: () => fetchWorkflowExecutions(tenantId!, documentId, ruleId),
    enabled: !!tenantId,
    staleTime: 30_000,
  });
}

/**
 * Hook to get workflow statistics
 */
export function useWorkflowStatistics(ruleId?: string) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['workflow-statistics', tenantId, ruleId],
    queryFn: () => getWorkflowStatistics(tenantId!, ruleId),
    enabled: !!tenantId,
    staleTime: 60_000,
  });
}
