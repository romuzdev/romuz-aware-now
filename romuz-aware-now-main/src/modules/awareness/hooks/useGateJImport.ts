// Gate-J D1: Import/Export Hook
// React Query hook for importing/exporting impact scores

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  importImpactScores, 
  getImpactImportHistory as getImportHistory 
} from '@/modules/awareness/integration';
import type { ImportImpactScoresParams } from '../types';
import { toast } from 'sonner';

const QUERY_KEY = 'gate-j-import-history';

/**
 * Hook to fetch import history
 */
export function useGateJImportHistory(limit: number = 20) {
  return useQuery({
    queryKey: [QUERY_KEY, limit],
    queryFn: () => getImportHistory(limit),
  });
}

/**
 * Hook to import impact scores
 */
export function useImportImpactScores() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ImportImpactScoresParams) => importImpactScores(params),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['gate-j-impact-scores'] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

      if (result.status === 'completed') {
        if (result.errorCount > 0) {
          toast(`تم استيراد ${result.successCount} من أصل ${result.totalRows} سجل`, {
            description: `فشل استيراد ${result.errorCount} سجل`,
          });
        } else {
          toast(`تم استيراد ${result.successCount} سجل بنجاح`);
        }
      } else {
        toast('فشل الاستيراد', {
          description: 'لم يتم استيراد أي سجلات',
        });
      }
    },
    onError: (error: any) => {
      console.error('Error importing scores:', error);
      toast('فشل استيراد نقاط التأثير', {
        description: error.message || 'حدث خطأ أثناء الاستيراد',
      });
    },
  });
}
