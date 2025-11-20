// Gate-I D1: KPI Views Hook
// React Query hook for managing saved KPI views

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  saveKPIView, 
  listKPIViews, 
  deleteKPIView 
} from '@/modules/kpis/integration';
import type { SaveKPIViewParams } from '../types';
import { toast } from 'sonner';

const QUERY_KEY = 'gate-i-kpi-views';

/**
 * Hook to fetch all KPI views
 */
export function useGateIViews() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: listKPIViews,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to save or update a KPI view
 */
export function useSaveKPIView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: SaveKPIViewParams) => saveKPIView(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast('تم حفظ العرض بنجاح');
    },
    onError: (error: any) => {
      console.error('Error saving KPI view:', error);
      toast('فشل حفظ العرض', {
        description: error.message || 'حدث خطأ أثناء حفظ العرض',
      });
    },
  });
}

/**
 * Hook to delete a KPI view
 */
export function useDeleteKPIView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (viewId: string) => deleteKPIView(viewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast('تم حذف العرض بنجاح');
    },
    onError: (error: any) => {
      console.error('Error deleting KPI view:', error);
      toast('فشل حذف العرض', {
        description: error.message || 'حدث خطأ أثناء حذف العرض',
      });
    },
  });
}
