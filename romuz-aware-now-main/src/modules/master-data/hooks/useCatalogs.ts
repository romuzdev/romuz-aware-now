/**
 * useCatalogs Hook
 * Gate-M: React Query hook for Catalogs management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  fetchCatalogs,
  fetchCatalogById,
  createCatalog,
  updateCatalog,
  publishCatalog,
  archiveCatalog,
  deleteCatalog,
} from '../integration';
import type { CatalogFilters } from '../types';

const QUERY_KEY = 'ref_catalogs';

/**
 * Fetch catalogs list with filters
 */
export function useCatalogs(filters?: CatalogFilters) {
  return useQuery({
    queryKey: [QUERY_KEY, 'list', filters],
    queryFn: () => fetchCatalogs(filters),
  });
}

/**
 * Fetch single catalog by ID
 */
export function useCatalog(id: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', id],
    queryFn: () => fetchCatalogById(id!),
    enabled: !!id,
  });
}

/**
 * Create new catalog
 */
export function useCreateCatalog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createCatalog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'تم الحفظ',
        description: 'تم إنشاء الكتالوج بنجاح',
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
 * Update existing catalog
 */
export function useUpdateCatalog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: any }) =>
      updateCatalog(id, changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث الكتالوج بنجاح',
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

/**
 * Publish catalog
 */
export function usePublishCatalog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: publishCatalog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'تم النشر',
        description: 'تم نشر الكتالوج بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء النشر',
      });
    },
  });
}

/**
 * Archive catalog
 */
export function useArchiveCatalog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: archiveCatalog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'تم الأرشفة',
        description: 'تم أرشفة الكتالوج بنجاح',
      });
    },
  });
}

/**
 * Delete catalog
 */
export function useDeleteCatalog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteCatalog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الكتالوج بنجاح',
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
