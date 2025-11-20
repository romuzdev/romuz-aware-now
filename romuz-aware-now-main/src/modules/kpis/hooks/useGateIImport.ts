// Gate-I D1: Import/Export Hook
// React Query hook for importing/exporting KPIs

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  importKPIs, 
  getImportHistory 
} from '@/modules/kpis/integration';
import type { ImportKPIsParams } from '../types';
import { toast } from 'sonner';

const QUERY_KEY = 'gate-i-import-history';

/**
 * Hook to fetch import history
 */
export function useGateIImportHistory(limit: number = 20) {
  return useQuery({
    queryKey: [QUERY_KEY, limit],
    queryFn: () => getImportHistory(limit),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to import KPIs
 */
export function useImportKPIs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ImportKPIsParams) => importKPIs(params),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['gate-i-kpis'] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

      if (result.status === 'completed') {
        if (result.errorCount > 0) {
          toast(`تم استيراد ${result.successCount} من أصل ${result.totalRows} مؤشر`, {
            description: `فشل استيراد ${result.errorCount} مؤشر`,
          });
        } else {
          toast(`تم استيراد ${result.successCount} مؤشر بنجاح`);
        }
      } else {
        toast('فشل الاستيراد', {
          description: 'لم يتم استيراد أي مؤشرات',
        });
      }
    },
    onError: (error: any) => {
      console.error('Error importing KPIs:', error);
      toast('فشل استيراد المؤشرات', {
        description: error.message || 'حدث خطأ أثناء الاستيراد',
      });
    },
  });
}
