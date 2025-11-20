/**
 * useSavedViews Hook
 * Gate-M: React Query hook for Saved Views management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  listSavedViews,
  getDefaultView,
  saveSavedView,
  deleteSavedView,
  setDefaultSavedView,
} from '../integration';
import type { SavedEntityType, CreateSavedViewInput } from '../types';

const QUERY_KEY = 'md_saved_views';

/**
 * Fetch saved views for an entity type
 */
export function useSavedViews(entityType?: SavedEntityType) {
  return useQuery({
    queryKey: [QUERY_KEY, 'list', entityType],
    queryFn: () => (entityType ? listSavedViews(entityType) : Promise.resolve([])),
    enabled: !!entityType,
  });
}

/**
 * Fetch default saved view for entity type
 */
export function useDefaultSavedView(entityType?: SavedEntityType) {
  return useQuery({
    queryKey: [QUERY_KEY, 'default', entityType],
    queryFn: () => (entityType ? getDefaultView(entityType) : Promise.resolve(null)),
    enabled: !!entityType,
  });
}

/**
 * Save (create or update) saved view
 */
export function useSaveSavedView() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateSavedViewInput) => saveSavedView(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ العرض بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء الحفظ',
      });
    },
  });
}

/**
 * Delete saved view
 */
export function useDeleteSavedView() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteSavedView,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف العرض بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء الحذف',
      });
    },
  });
}

/**
 * Set default saved view
 */
export function useSetDefaultSavedView() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: setDefaultSavedView,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'تم التحديث',
        description: 'تم تعيين العرض الافتراضي بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء التحديث',
      });
    },
  });
}
