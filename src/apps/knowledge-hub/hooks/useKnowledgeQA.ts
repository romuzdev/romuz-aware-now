/**
 * M17: Knowledge Hub - useKnowledgeQA Hook
 * React hook for Q&A functionality
 */

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { askQuestion, getQAHistory, provideQAFeedback } from '@/integrations/supabase/knowledge-hub';
import { useToast } from '@/core/components/ui/use-toast';

export function useKnowledgeQA() {
  const { toast } = useToast();
  const [currentQA, setCurrentQA] = useState<any>(null);

  // Fetch Q&A history
  const {
    data: history,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['qa-history'],
    queryFn: () => getQAHistory({ limit: 20 }),
  });

  // Ask question mutation
  const askMutation = useMutation({
    mutationFn: async (params: { question: string; language?: 'ar' | 'en' }) => {
      return await askQuestion(params);
    },
    onSuccess: (data) => {
      setCurrentQA(data);
      refetchHistory();
    },
    onError: (error) => {
      console.error('Q&A error:', error);
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء معالجة السؤال',
        variant: 'destructive',
      });
    },
  });

  // Provide feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: async (params: { qaId: string; helpful: boolean; comment?: string }) => {
      return await provideQAFeedback(params.qaId, params.helpful, params.comment);
    },
    onSuccess: () => {
      toast({
        title: 'شكراً لك',
        description: 'تم تسجيل ملاحظاتك بنجاح',
      });
      refetchHistory();
    },
  });

  const handleAskQuestion = (question: string, language: 'ar' | 'en' = 'ar') => {
    askMutation.mutate({ question, language });
  };

  const handleFeedback = (qaId: string, helpful: boolean, comment?: string) => {
    feedbackMutation.mutate({ qaId, helpful, comment });
  };

  return {
    currentQA,
    history: history || [],
    isAsking: askMutation.isPending,
    isLoadingHistory,
    handleAskQuestion,
    handleFeedback,
    clearCurrent: () => setCurrentQA(null),
  };
}
