/**
 * useMappings Hook
 * Gate-M: React Query hook for Mappings management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  fetchMappings,
  fetchMappingById,
  createMapping,
  updateMapping,
  deleteMapping,
  upsertMapping,
  bulkCreateMappings,
} from '../integration/mappings.integration';
import type { MappingFilters } from '../types';

const QUERY_KEY = 'ref_mappings';

/**
 * Fetch mappings list with filters
 */
export function useMappings(filters?: MappingFilters) {
  return useQuery({
    queryKey: [QUERY_KEY, 'list', filters],
    queryFn: () => fetchMappings(filters),
  });
}

/**
 * Fetch single mapping by ID
 */
export function useMapping(id: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', id],
    queryFn: () => (id ? fetchMappingById(id) : null),
    enabled: !!id,
  });
}

/**
 * Create mapping
 */
export function useCreateMapping() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createMapping,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ الربط بنجاح',
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
 * Update mapping
 */
export function useUpdateMapping() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: any }) =>
      updateMapping(id, changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث الربط بنجاح',
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
 * Delete mapping
 */
export function useDeleteMapping() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteMapping,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الربط بنجاح',
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
 * Upsert mapping (create or update)
 */
export function useUpsertMapping() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      catalogId,
      termId,
      sourceSystem,
      srcCode,
      targetCode,
      notes,
    }: {
      catalogId: string;
      termId: string | null;
      sourceSystem: string;
      srcCode: string;
      targetCode: string;
      notes?: string | null;
    }) => upsertMapping(catalogId, termId, sourceSystem, srcCode, targetCode, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ الربط بنجاح',
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
 * Bulk create mappings
 */
export function useBulkCreateMappings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: bulkCreateMappings,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'تم الحفظ',
        description: `تم حفظ ${result.length} ربط بنجاح`,
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
