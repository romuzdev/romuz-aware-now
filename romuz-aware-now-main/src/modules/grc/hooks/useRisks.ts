/**
 * GRC Module - Risk Management Hook
 * React Query hook for managing risks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchRisks,
  fetchRiskById,
  createRisk,
  updateRisk,
  deleteRisk,
  fetchRiskStatistics,
} from '../integration/risks.integration';
import type {
  Risk,
  RiskWithDetails,
  CreateRiskInput,
  UpdateRiskInput,
  RiskFilters,
} from '../types/risk.types';

const QUERY_KEY = 'grc-risks';

/**
 * Hook: Fetch risks list with filters
 */
export function useRisks(filters?: RiskFilters) {
  return useQuery({
    queryKey: [QUERY_KEY, 'list', filters],
    queryFn: () => fetchRisks(filters),
  });
}

/**
 * Hook: Fetch single risk by ID
 */
export function useRiskById(riskId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', riskId],
    queryFn: () => (riskId ? fetchRiskById(riskId) : null),
    enabled: !!riskId,
  });
}

/**
 * Hook: Fetch risk statistics
 */
export function useRiskStatistics() {
  return useQuery({
    queryKey: [QUERY_KEY, 'statistics'],
    queryFn: fetchRiskStatistics,
  });
}

/**
 * Hook: Create risk mutation
 */
export function useCreateRisk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRisk,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('تم إنشاء المخاطرة بنجاح');
    },
    onError: (error: Error) => {
      console.error('Error creating risk:', error);
      toast.error('فشل إنشاء المخاطرة');
    },
  });
}

/**
 * Hook: Update risk mutation
 */
export function useUpdateRisk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRiskInput }) =>
      updateRisk(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('تم تحديث المخاطرة بنجاح');
    },
    onError: (error: Error) => {
      console.error('Error updating risk:', error);
      toast.error('فشل تحديث المخاطرة');
    },
  });
}

/**
 * Hook: Delete risk mutation
 */
export function useDeleteRisk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRisk,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('تم حذف المخاطرة بنجاح');
    },
    onError: (error: Error) => {
      console.error('Error deleting risk:', error);
      toast.error('فشل حذف المخاطرة');
    },
  });
}
