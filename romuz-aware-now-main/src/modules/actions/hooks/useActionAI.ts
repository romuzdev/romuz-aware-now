/**
 * Action AI Hooks
 * M11: React hooks for AI-powered recommendations
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getAIRecommendations,
  getActionSuggestions,
  getActionRisks,
  getActionOptimizations,
  getActionNextSteps,
  type AnalysisType,
} from '../integration/actions-ai';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { toast } from 'sonner';

/**
 * Hook to get AI recommendations
 */
export function useAIRecommendations(
  actionId: string | null,
  analysisType: AnalysisType,
  enabled: boolean = true
) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['action-ai', actionId, analysisType, tenantId],
    queryFn: () => {
      if (!actionId || !tenantId) {
        throw new Error('Action ID and Tenant ID are required');
      }
      return getAIRecommendations(actionId, analysisType, tenantId);
    },
    enabled: enabled && !!actionId && !!tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook to get action suggestions
 */
export function useActionSuggestions(actionId: string | null, enabled: boolean = true) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['action-ai', 'suggestions', actionId, tenantId],
    queryFn: () => {
      if (!actionId || !tenantId) {
        throw new Error('Action ID and Tenant ID are required');
      }
      return getActionSuggestions(actionId, tenantId);
    },
    enabled: enabled && !!actionId && !!tenantId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

/**
 * Hook to get risk assessment
 */
export function useActionRisks(actionId: string | null, enabled: boolean = true) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['action-ai', 'risks', actionId, tenantId],
    queryFn: () => {
      if (!actionId || !tenantId) {
        throw new Error('Action ID and Tenant ID are required');
      }
      return getActionRisks(actionId, tenantId);
    },
    enabled: enabled && !!actionId && !!tenantId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

/**
 * Hook to get optimization suggestions
 */
export function useActionOptimizations(actionId: string | null, enabled: boolean = true) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['action-ai', 'optimizations', actionId, tenantId],
    queryFn: () => {
      if (!actionId || !tenantId) {
        throw new Error('Action ID and Tenant ID are required');
      }
      return getActionOptimizations(actionId, tenantId);
    },
    enabled: enabled && !!actionId && !!tenantId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

/**
 * Hook to get next steps suggestions
 */
export function useActionNextSteps(actionId: string | null, enabled: boolean = true) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['action-ai', 'next-steps', actionId, tenantId],
    queryFn: () => {
      if (!actionId || !tenantId) {
        throw new Error('Action ID and Tenant ID are required');
      }
      return getActionNextSteps(actionId, tenantId);
    },
    enabled: enabled && !!actionId && !!tenantId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

/**
 * Mutation hook to trigger AI analysis
 */
export function useTriggerAIAnalysis() {
  const { tenantId } = useAppContext();

  return useMutation({
    mutationFn: async ({
      actionId,
      analysisType,
    }: {
      actionId: string;
      analysisType: AnalysisType;
    }) => {
      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }
      return getAIRecommendations(actionId, analysisType, tenantId);
    },
    onSuccess: () => {
      toast.success('تم تحليل الإجراء بنجاح');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'فشل تحليل الإجراء');
    },
  });
}
