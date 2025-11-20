/**
 * M14 Enhancement - Custom KPI Formulas Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { useToast } from '@/hooks/use-toast';
import {
  fetchCustomKPIFormulas,
  fetchCustomKPIFormula,
  createCustomKPIFormula,
  updateCustomKPIFormula,
  deleteCustomKPIFormula,
  evaluateCustomKPIFormula
} from '../integration/custom-kpi-formulas.integration';
import type {
  CreateCustomKPIFormulaInput,
  UpdateCustomKPIFormulaInput
} from '../types/custom-kpi.types';

const CUSTOM_KPI_QUERY_KEY = 'custom-kpi-formulas';

/**
 * Fetch all custom KPI formulas
 */
export function useCustomKPIFormulas(activeOnly: boolean = false) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: [CUSTOM_KPI_QUERY_KEY, 'list', tenantId, activeOnly],
    queryFn: () => {
      if (!tenantId) throw new Error('Tenant ID is required');
      return fetchCustomKPIFormulas(tenantId, activeOnly);
    },
    enabled: !!tenantId
  });
}

/**
 * Fetch single custom KPI formula
 */
export function useCustomKPIFormula(formulaId: string | null) {
  return useQuery({
    queryKey: [CUSTOM_KPI_QUERY_KEY, 'detail', formulaId],
    queryFn: () => {
      if (!formulaId) throw new Error('Formula ID is required');
      return fetchCustomKPIFormula(formulaId);
    },
    enabled: !!formulaId
  });
}

/**
 * Create custom KPI formula
 */
export function useCreateCustomKPIFormula() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { tenantId, user } = useAppContext();

  return useMutation({
    mutationFn: (input: CreateCustomKPIFormulaInput) => {
      if (!tenantId || !user?.id) throw new Error('Tenant ID and User ID are required');
      return createCustomKPIFormula(tenantId, user.id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CUSTOM_KPI_QUERY_KEY] });
      toast({
        title: 'تم إنشاء المؤشر المخصص',
        description: 'تم حفظ الصيغة بنجاح'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل إنشاء المؤشر المخصص',
        variant: 'destructive'
      });
    }
  });
}

/**
 * Update custom KPI formula
 */
export function useUpdateCustomKPIFormula() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ formulaId, input }: { formulaId: string; input: UpdateCustomKPIFormulaInput }) =>
      updateCustomKPIFormula(formulaId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CUSTOM_KPI_QUERY_KEY] });
      toast({
        title: 'تم تحديث المؤشر',
        description: 'تم تحديث الصيغة بنجاح'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل تحديث المؤشر',
        variant: 'destructive'
      });
    }
  });
}

/**
 * Delete custom KPI formula
 */
export function useDeleteCustomKPIFormula() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (formulaId: string) => deleteCustomKPIFormula(formulaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CUSTOM_KPI_QUERY_KEY] });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف المؤشر المخصص'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل حذف المؤشر',
        variant: 'destructive'
      });
    }
  });
}

/**
 * Evaluate custom KPI formula
 */
export function useEvaluateCustomKPI(formulaId: string | null) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: [CUSTOM_KPI_QUERY_KEY, 'evaluate', formulaId, tenantId],
    queryFn: () => {
      if (!formulaId || !tenantId) throw new Error('Formula ID and Tenant ID are required');
      return evaluateCustomKPIFormula(formulaId, tenantId);
    },
    enabled: !!formulaId && !!tenantId,
    refetchInterval: 60 * 1000 // Refresh every minute
  });
}
