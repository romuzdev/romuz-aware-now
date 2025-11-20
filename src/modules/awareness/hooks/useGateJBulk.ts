// Gate-J D1: Bulk Operations Hook
// React Query hook for bulk operations on impact scores

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  bulkRecomputeImpactScores, 
  bulkDeleteImpactScores 
} from '@/modules/awareness/integration';
import { toast } from 'sonner';

/**
 * Hook to bulk recompute impact scores
 */
export function useBulkRecomputeImpactScores() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ scoreIds, noteAr }: { scoreIds: string[]; noteAr?: string }) =>
      bulkRecomputeImpactScores(scoreIds, noteAr),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['gate-j-impact-scores'] });

      if (result.status === 'completed') {
        toast(`تم إعادة حساب ${result.affectedCount} نقطة تأثير بنجاح`);
      } else if (result.status === 'partial') {
        toast(`تم إعادة حساب ${result.affectedCount} من أصل ${result.affectedCount + (result.errors?.length || 0)} نقاط`, {
          description: 'بعض النقاط لم يتم إعادة حسابها بسبب أخطاء',
        });
      } else {
        toast('فشل إعادة الحساب', {
          description: 'لم يتم إعادة حساب أي نقاط',
        });
      }
    },
    onError: (error: any) => {
      console.error('Error bulk recomputing scores:', error);
      toast('فشل إعادة حساب نقاط التأثير', {
        description: error.message || 'حدث خطأ أثناء إعادة الحساب',
      });
    },
  });
}

/**
 * Hook to bulk delete impact scores
 */
export function useBulkDeleteImpactScores() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scoreIds: string[]) => bulkDeleteImpactScores(scoreIds),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['gate-j-impact-scores'] });

      if (result.status === 'completed') {
        toast(`تم حذف ${result.affectedCount} نقطة تأثير بنجاح`);
      } else if (result.status === 'partial') {
        toast(`تم حذف ${result.affectedCount} من أصل ${result.affectedCount + (result.errors?.length || 0)} نقاط`, {
          description: 'بعض النقاط لم يتم حذفها بسبب أخطاء',
        });
      } else {
        toast('فشل الحذف', {
          description: 'لم يتم حذف أي نقاط',
        });
      }
    },
    onError: (error: any) => {
      console.error('Error bulk deleting scores:', error);
      toast('فشل حذف نقاط التأثير', {
        description: error.message || 'حدث خطأ أثناء الحذف',
      });
    },
  });
}
