import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import {
  fetchAlertPolicies,
  fetchAlertPolicyById,
  createAlertPolicy,
  updateAlertPolicy,
  deleteAlertPolicy,
} from '@/modules/observability/integration';
import type { CreateAlertPolicyData } from '@/modules/observability';
import { toast } from 'sonner';
import { useAuditLog } from '@/lib/audit/log-event';

export function useAlertPolicies() {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();
  const { logObservability } = useAuditLog();

  const policiesQuery = useQuery({
    queryKey: ['alert-policies', tenantId],
    queryFn: () => fetchAlertPolicies(tenantId!),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAlertPolicyData) => createAlertPolicy(tenantId!, data),
    onSuccess: (policy) => {
      queryClient.invalidateQueries({ queryKey: ['alert-policies', tenantId] });
      logObservability('alert_policy.created', policy.id, { name: policy.name, metric: policy.metric });
      toast.success('تم إنشاء السياسة بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل إنشاء السياسة: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAlertPolicyData> }) =>
      updateAlertPolicy(id, data as any),
    onSuccess: (policy, { data }) => {
      queryClient.invalidateQueries({ queryKey: ['alert-policies', tenantId] });
      const action = data.is_enabled !== undefined 
        ? (data.is_enabled ? 'alert_policy.enabled' : 'alert_policy.disabled')
        : 'alert_policy.updated';
      logObservability(action, policy.id, { name: policy.name });
      toast.success('تم تحديث السياسة بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل تحديث السياسة: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      logObservability('alert_policy.deleted', id);
      return deleteAlertPolicy(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-policies', tenantId] });
      toast.success('تم حذف السياسة بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل حذف السياسة: ${error.message}`);
    },
  });

  return {
    policies: policiesQuery.data ?? [],
    loading: policiesQuery.isLoading,
    error: policiesQuery.error,
    createPolicy: createMutation.mutate,
    updatePolicy: updateMutation.mutate,
    deletePolicy: deleteMutation.mutate,
    refetch: policiesQuery.refetch,
  };
}

export function useAlertPolicyById(id: string | undefined) {
  return useQuery({
    queryKey: ['alert-policy', id],
    queryFn: () => fetchAlertPolicyById(id!),
    enabled: !!id,
  });
}
