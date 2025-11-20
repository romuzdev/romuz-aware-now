/**
 * M16: AI Advisory Engine - React Hook
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { toast } from 'sonner';
import {
  requestAdvisory,
  fetchRecommendations,
  acceptRecommendation,
  rejectRecommendation,
  implementRecommendation,
} from '../integration/ai-advisory.integration';
import type {
  RecommendationRequest,
  RecommendationFilters,
} from '../types/ai-advisory.types';

export function useAIAdvisory(filters?: RecommendationFilters) {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();

  // Fetch recommendations
  const {
    data: recommendations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['ai-recommendations', tenantId, filters],
    queryFn: () => fetchRecommendations(tenantId!, filters),
    enabled: !!tenantId,
  });

  // Request new recommendation
  const requestMutation = useMutation({
    mutationFn: (request: Omit<RecommendationRequest, 'tenant_id'>) =>
      requestAdvisory({ ...request, tenant_id: tenantId! }),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('تم توليد التوصية بنجاح', {
          description: 'يمكنك الآن مراجعة التوصية الذكية',
        });
        queryClient.invalidateQueries({ queryKey: ['ai-recommendations', tenantId] });
      } else {
        toast.error('فشل في توليد التوصية', {
          description: data.error || 'حدث خطأ غير متوقع',
        });
      }
    },
    onError: (error: any) => {
      toast.error('فشل في توليد التوصية', {
        description: error.message || 'حدث خطأ في الاتصال',
      });
    },
  });

  // Accept recommendation
  const acceptMutation = useMutation({
    mutationFn: acceptRecommendation,
    onSuccess: () => {
      toast.success('تم قبول التوصية');
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations', tenantId] });
    },
    onError: (error: any) => {
      toast.error('فشل في قبول التوصية', {
        description: error.message,
      });
    },
  });

  // Reject recommendation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      rejectRecommendation(id, reason),
    onSuccess: () => {
      toast.success('تم رفض التوصية');
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations', tenantId] });
    },
    onError: (error: any) => {
      toast.error('فشل في رفض التوصية', {
        description: error.message,
      });
    },
  });

  // Implement recommendation
  const implementMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      implementRecommendation(id, notes),
    onSuccess: () => {
      toast.success('تم تنفيذ التوصية');
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations', tenantId] });
    },
    onError: (error: any) => {
      toast.error('فشل في تحديث حالة التوصية', {
        description: error.message,
      });
    },
  });

  return {
    recommendations,
    isLoading,
    error,
    requestRecommendation: requestMutation.mutate,
    isRequesting: requestMutation.isPending,
    acceptRecommendation: acceptMutation.mutate,
    isAccepting: acceptMutation.isPending,
    rejectRecommendation: rejectMutation.mutate,
    isRejecting: rejectMutation.isPending,
    implementRecommendation: implementMutation.mutate,
    isImplementing: implementMutation.isPending,
  };
}
