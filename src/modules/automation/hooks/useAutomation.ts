/**
 * Automation Hooks
 * Week 4 - Phase 4
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import {
  fetchAutomationRules,
  fetchAutomationRuleById,
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  toggleAutomationRule,
  fetchWorkflowExecutions,
  triggerAutomationRule,
  fetchAutomationStats,
} from '../integration/automation.integration';
import type { AutomationRuleFormData } from '../types/automation.types';
import { toast } from 'sonner';

export function useAutomationRules() {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();

  const rulesQuery = useQuery({
    queryKey: ['automation-rules', tenantId],
    queryFn: () => fetchAutomationRules(tenantId!),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: (formData: AutomationRuleFormData) =>
      createAutomationRule(tenantId!, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules', tenantId] });
      toast.success('تم إنشاء قاعدة الأتمتة بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل إنشاء القاعدة: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: Partial<AutomationRuleFormData> }) =>
      updateAutomationRule(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules', tenantId] });
      toast.success('تم تحديث القاعدة بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل تحديث القاعدة: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAutomationRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules', tenantId] });
      toast.success('تم حذف القاعدة بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل حذف القاعدة: ${error.message}`);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      toggleAutomationRule(id, isEnabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules', tenantId] });
      toast.success('تم تحديث حالة القاعدة');
    },
    onError: (error: Error) => {
      toast.error(`فشل تحديث الحالة: ${error.message}`);
    },
  });

  const triggerMutation = useMutation({
    mutationFn: ({ ruleId, triggerData }: { ruleId: string; triggerData?: Record<string, any> }) =>
      triggerAutomationRule(ruleId, triggerData),
    onSuccess: () => {
      toast.success('تم تشغيل القاعدة بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل تشغيل القاعدة: ${error.message}`);
    },
  });

  return {
    rules: rulesQuery.data ?? [],
    loading: rulesQuery.isLoading,
    error: rulesQuery.error,
    createRule: createMutation.mutate,
    updateRule: updateMutation.mutate,
    deleteRule: deleteMutation.mutate,
    toggleRule: toggleMutation.mutate,
    triggerRule: triggerMutation.mutate,
    refetch: rulesQuery.refetch,
  };
}

export function useAutomationRuleById(id: string | undefined) {
  return useQuery({
    queryKey: ['automation-rule', id],
    queryFn: () => fetchAutomationRuleById(id!),
    enabled: !!id,
  });
}

export function useWorkflowExecutions(ruleId?: string) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['workflow-executions', tenantId, ruleId],
    queryFn: () => fetchWorkflowExecutions(tenantId!, ruleId),
    enabled: !!tenantId,
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

export function useAutomationStats() {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['automation-stats', tenantId],
    queryFn: () => fetchAutomationStats(tenantId!),
    enabled: !!tenantId,
  });
}
