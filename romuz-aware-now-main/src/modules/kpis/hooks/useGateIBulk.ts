// Gate-I D1: Bulk Operations Hook
// React Query hook for bulk operations on KPIs

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  bulkActivateKPIs, 
  bulkDeactivateKPIs,
  bulkDeleteKPIs 
} from '@/modules/kpis/integration';
import { toast } from 'sonner';

/**
 * Hook to bulk activate KPIs
 */
export function useBulkActivateKPIs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ kpiIds, noteAr }: { kpiIds: string[]; noteAr?: string }) =>
      bulkActivateKPIs(kpiIds, noteAr),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['gate-i-kpis'] });

      if (result.status === 'completed') {
        toast(`تم تفعيل ${result.affectedCount} مؤشر بنجاح`);
      } else if (result.status === 'partial') {
        toast(`تم تفعيل ${result.affectedCount} من أصل ${result.affectedCount + (result.errors?.length || 0)} مؤشرات`, {
          description: 'بعض المؤشرات لم يتم تفعيلها بسبب أخطاء',
        });
      } else {
        toast('فشل التفعيل', {
          description: 'لم يتم تفعيل أي مؤشرات',
        });
      }
    },
    onError: (error: any) => {
      console.error('Error bulk activating KPIs:', error);
      toast('فشل تفعيل المؤشرات', {
        description: error.message || 'حدث خطأ أثناء التفعيل',
      });
    },
  });
}

/**
 * Hook to bulk deactivate KPIs
 */
export function useBulkDeactivateKPIs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ kpiIds, noteAr }: { kpiIds: string[]; noteAr?: string }) =>
      bulkDeactivateKPIs(kpiIds, noteAr),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['gate-i-kpis'] });

      if (result.status === 'completed') {
        toast(`تم إيقاف ${result.affectedCount} مؤشر بنجاح`);
      } else if (result.status === 'partial') {
        toast(`تم إيقاف ${result.affectedCount} من أصل ${result.affectedCount + (result.errors?.length || 0)} مؤشرات`, {
          description: 'بعض المؤشرات لم يتم إيقافها بسبب أخطاء',
        });
      } else {
        toast('فشل الإيقاف', {
          description: 'لم يتم إيقاف أي مؤشرات',
        });
      }
    },
    onError: (error: any) => {
      console.error('Error bulk deactivating KPIs:', error);
      toast('فشل إيقاف المؤشرات', {
        description: error.message || 'حدث خطأ أثناء الإيقاف',
      });
    },
  });
}

/**
 * Hook to bulk delete KPIs
 */
export function useBulkDeleteKPIs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (kpiIds: string[]) => bulkDeleteKPIs(kpiIds),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['gate-i-kpis'] });

      if (result.status === 'completed') {
        toast(`تم حذف ${result.affectedCount} مؤشر بنجاح`);
      } else if (result.status === 'partial') {
        toast(`تم حذف ${result.affectedCount} من أصل ${result.affectedCount + (result.errors?.length || 0)} مؤشرات`, {
          description: 'بعض المؤشرات لم يتم حذفها بسبب أخطاء',
        });
      } else {
        toast('فشل الحذف', {
          description: 'لم يتم حذف أي مؤشرات',
        });
      }
    },
    onError: (error: any) => {
      console.error('Error bulk deleting KPIs:', error);
      toast('فشل حذف المؤشرات', {
        description: error.message || 'حدث خطأ أثناء الحذف',
      });
    },
  });
}
