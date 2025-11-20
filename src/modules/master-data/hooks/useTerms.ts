/**
 * useTerms Hook
 * Gate-M: React Query hook for Terms management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  fetchTerms,
  fetchTermById,
  createTerm,
  updateTerm,
  deleteTerm,
  reorderTerms,
  bulkSetTermsActive,
  importTermsCSV,
  exportTerms,
} from '../integration';
import type { TermFilters } from '../types';

const QUERY_KEY = 'ref_terms';

/**
 * Fetch terms list with filters
 */
export function useTerms(filters?: TermFilters) {
  return useQuery({
    queryKey: [QUERY_KEY, 'list', filters],
    queryFn: () => fetchTerms(filters),
  });
}

/**
 * Fetch single term by ID
 */
export function useTerm(id: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', id],
    queryFn: () => fetchTermById(id!),
    enabled: !!id,
  });
}

/**
 * Create new term
 */
export function useCreateTerm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createTerm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'تم الحفظ',
        description: 'تم إنشاء المصطلح بنجاح',
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
 * Update existing term
 */
export function useUpdateTerm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: any }) =>
      updateTerm(id, changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث المصطلح بنجاح',
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
 * Delete term
 */
export function useDeleteTerm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteTerm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف المصطلح بنجاح',
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
 * Reorder terms
 */
export function useReorderTerms() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: reorderTerms,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'تم إعادة الترتيب',
        description: 'تم تحديث الترتيب بنجاح',
      });
    },
  });
}

/**
 * Bulk set terms active/inactive
 */
export function useBulkSetTermsActive() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ termIds, active }: { termIds: string[]; active: boolean }) =>
      bulkSetTermsActive(termIds, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث حالة المصطلحات بنجاح',
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
 * Import terms from CSV
 */
export function useImportTermsCSV() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      catalogId,
      rows,
    }: {
      catalogId: string;
      rows: Array<{
        code: string;
        label_ar: string;
        label_en: string;
        parent_code?: string;
        sort_order?: number;
        active?: boolean;
        attrs?: Record<string, any>;
      }>;
    }) => importTermsCSV({ catalogId, rows }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: 'تم الاستيراد',
        description: `تم استيراد ${result.inserted || 0} مصطلح جديد، وتحديث ${result.updated || 0} مصطلح`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء الاستيراد',
      });
    },
  });
}

/**
 * Export terms to CSV
 */
export function useExportTerms() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      catalogId,
      includeInactive = false,
    }: {
      catalogId: string;
      includeInactive?: boolean;
    }) => exportTerms(catalogId, includeInactive),
    onSuccess: () => {
      toast({
        title: 'تم التصدير',
        description: 'تم تصدير المصطلحات بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء التصدير',
      });
    },
  });
}

