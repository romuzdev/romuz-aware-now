// Gate-J D1: Impact Views Hook
// React Query hook for managing saved impact views

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  saveImpactView, 
  listImpactViews, 
  deleteImpactView 
} from '@/modules/awareness/integration';
import type { SaveImpactViewParams } from '../types';
import { toast } from 'sonner';

const QUERY_KEY = 'gate-j-impact-views';

/**
 * Hook to fetch all impact views
 */
export function useGateJViews() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: listImpactViews,
  });
}

/**
 * Hook to save or update an impact view
 */
export function useSaveImpactView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: SaveImpactViewParams) => saveImpactView(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast('تم حفظ العرض بنجاح');
    },
    onError: (error: any) => {
      console.error('Error saving impact view:', error);
      toast('فشل حفظ العرض', {
        description: error.message || 'حدث خطأ أثناء حفظ العرض',
      });
    },
  });
}

/**
 * Hook to delete an impact view
 */
export function useDeleteImpactView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (viewId: string) => deleteImpactView(viewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast('تم حذف العرض بنجاح');
    },
    onError: (error: any) => {
      console.error('Error deleting impact view:', error);
      toast('فشل حذف العرض', {
        description: error.message || 'حدث خطأ أثناء حذف العرض',
      });
    },
  });
}
