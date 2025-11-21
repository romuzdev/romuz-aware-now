/**
 * M17: Knowledge Hub - RAG Hook
 * React hook for RAG-based Q&A functionality
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/core/components/ui/use-toast';
import {
  askQuestion,
  provideQueryFeedback,
  getQueryHistory,
} from '@/integrations/supabase/knowledge-rag';

/**
 * Ask a question and get AI-generated answer
 */
export function useAskQuestion() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: askQuestion,
    onError: (error: any) => {
      toast({
        title: 'خطأ في معالجة السؤال',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Provide feedback on a query result
 */
export function useQueryFeedback() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ queryId, helpful, comment }: { 
      queryId: string; 
      helpful: boolean; 
      comment?: string 
    }) => provideQueryFeedback(queryId, helpful, comment),
    onSuccess: () => {
      toast({
        title: 'شكراً لك',
        description: 'تم تسجيل ملاحظاتك بنجاح',
      });
      queryClient.invalidateQueries({ queryKey: ['query-history'] });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Get query history
 */
export function useQueryHistory(userId?: string, limit = 20) {
  return useQuery({
    queryKey: ['query-history', userId, limit],
    queryFn: () => getQueryHistory({ userId, limit }),
  });
}
