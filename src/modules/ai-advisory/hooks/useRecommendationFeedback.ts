/**
 * M16: AI Advisory Engine - Feedback Hook
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { toast } from 'sonner';
import { provideFeedback } from '../integration/ai-advisory.integration';
import type { FeedbackRequest } from '../types/ai-advisory.types';

export function useRecommendationFeedback() {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();

  const feedbackMutation = useMutation({
    mutationFn: provideFeedback,
    onSuccess: () => {
      toast.success('شكراً لك', {
        description: 'تم حفظ تقييمك وسيساعدنا في تحسين التوصيات',
      });
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations', tenantId] });
    },
    onError: (error: any) => {
      toast.error('فشل في حفظ التقييم', {
        description: error.message,
      });
    },
  });

  return {
    provideFeedback: feedbackMutation.mutate,
    isSubmitting: feedbackMutation.isPending,
  };
}
