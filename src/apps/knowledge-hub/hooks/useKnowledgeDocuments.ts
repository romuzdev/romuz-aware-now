/**
 * M17: Knowledge Hub - useKnowledgeDocuments Hook
 * React hook for managing knowledge documents
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getKnowledgeDocuments,
  getKnowledgeDocument,
  createKnowledgeDocument,
  updateKnowledgeDocument,
  deleteKnowledgeDocument,
  verifyKnowledgeDocument,
  rateDocument,
  getDocumentStats,
} from '@/integrations/supabase/knowledge-hub';
import { useToast } from '@/core/components/ui/use-toast';
import { KnowledgeFilters } from '../types';

export function useKnowledgeDocuments(filters?: KnowledgeFilters) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch documents with filters
  const {
    data: documents,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['knowledge-documents', filters],
    queryFn: () => getKnowledgeDocuments(filters),
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['knowledge-stats'],
    queryFn: getDocumentStats,
  });

  // Create document mutation
  const createMutation = useMutation({
    mutationFn: createKnowledgeDocument,
    onSuccess: () => {
      toast({
        title: 'تم الحفظ',
        description: 'تم إضافة المستند بنجاح',
      });
      queryClient.invalidateQueries({ queryKey: ['knowledge-documents'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-stats'] });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'فشل إضافة المستند',
        variant: 'destructive',
      });
    },
  });

  // Update document mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      updateKnowledgeDocument(id, updates),
    onSuccess: () => {
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث المستند بنجاح',
      });
      queryClient.invalidateQueries({ queryKey: ['knowledge-documents'] });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'فشل تحديث المستند',
        variant: 'destructive',
      });
    },
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: deleteKnowledgeDocument,
    onSuccess: () => {
      toast({
        title: 'تم الحذف',
        description: 'تم حذف المستند بنجاح',
      });
      queryClient.invalidateQueries({ queryKey: ['knowledge-documents'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-stats'] });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'فشل حذف المستند',
        variant: 'destructive',
      });
    },
  });

  // Verify document mutation
  const verifyMutation = useMutation({
    mutationFn: verifyKnowledgeDocument,
    onSuccess: () => {
      toast({
        title: 'تم التحقق',
        description: 'تم التحقق من المستند بنجاح',
      });
      queryClient.invalidateQueries({ queryKey: ['knowledge-documents'] });
    },
  });

  // Rate document mutation
  const rateMutation = useMutation({
    mutationFn: ({ id, helpful }: { id: string; helpful: boolean }) =>
      rateDocument(id, helpful),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-documents'] });
    },
  });

  return {
    documents: documents || [],
    stats,
    isLoading,
    error,
    refetch,
    createDocument: createMutation.mutate,
    updateDocument: updateMutation.mutate,
    deleteDocument: deleteMutation.mutate,
    verifyDocument: verifyMutation.mutate,
    rateDocument: rateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useKnowledgeDocument(id: string) {
  const { toast } = useToast();

  const { data: document, isLoading, error } = useQuery({
    queryKey: ['knowledge-document', id],
    queryFn: () => getKnowledgeDocument(id),
    enabled: !!id,
  });

  return {
    document,
    isLoading,
    error,
  };
}
