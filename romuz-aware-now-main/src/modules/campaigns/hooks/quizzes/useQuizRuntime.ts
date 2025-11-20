import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useTenantUser } from '@/lib/app/get-tenant-user';
import {
  fetchQuizByModule,
  submitQuiz,
  fetchLatestSubmission,
  calculateBestScore,
} from '@/modules/campaigns/integration/quizzes.integration';
import { bulkUpdateParticipants } from '@/modules/campaigns/integration';
import { markModuleCompleted, checkCampaignCompletion } from '@/modules/campaigns/integration/modules.integration';
import type { QuizSubmissionPayload } from '@/modules/campaigns';

export function useQuizRuntime(moduleId: string, participantId: string, campaignId: string) {
  const { toast } = useToast();
  const { tenantId } = useTenantUser();
  const qc = useQueryClient();

  const quizQuery = useQuery({
    queryKey: ['quiz', moduleId],
    queryFn: () => fetchQuizByModule(moduleId),
    enabled: !!moduleId,
  });

  const submissionQuery = useQuery({
    queryKey: ['quiz-submission', moduleId, participantId],
    queryFn: () => fetchLatestSubmission(moduleId, participantId),
    enabled: !!moduleId && !!participantId,
  });

  const submitMutation = useMutation({
    mutationFn: async (payload: QuizSubmissionPayload) => {
      if (!tenantId) throw new Error('Tenant ID required');
      if (!quizQuery.data) throw new Error('Quiz not loaded');

      const result = await submitQuiz(
        tenantId,
        moduleId,
        participantId,
        payload,
        quizQuery.data
      );

      // Calculate best score (latest passed OR highest)
      const bestScore = await calculateBestScore(participantId);

      // Update participant score with best score
      if (bestScore !== null) {
        await bulkUpdateParticipants([participantId], {
          score: bestScore,
        });
      }

      // Mark module completed if passed
      if (result.grading.passed) {
        await markModuleCompleted(tenantId, campaignId, moduleId, participantId);

        // Check if all required modules are completed
        const allCompleted = await checkCampaignCompletion(campaignId, participantId);

        if (allCompleted) {
          await bulkUpdateParticipants([participantId], {
            status: 'completed',
            completed_at: new Date().toISOString(),
          });
        }
      }

      return result;
    },
    onSuccess: async (result) => {
      qc.invalidateQueries({ queryKey: ['quiz-submission', moduleId, participantId] });
      qc.invalidateQueries({ queryKey: ['participants'] });
      qc.invalidateQueries({ queryKey: ['module-progress', participantId] });

      if (result.grading.passed) {
        // Check if all required modules are completed
        const allCompleted = await checkCampaignCompletion(campaignId, participantId);

        if (allCompleted) {
          toast({
            title: 'Campaign completed! 🎉',
            description: `Quiz passed with ${result.grading.score.toFixed(0)}%. All required modules completed!`,
          });
        } else {
          toast({
            title: 'Quiz passed! ✅',
            description: `Score: ${result.grading.score.toFixed(0)}% (${result.grading.correctAnswers}/${result.grading.totalQuestions}). Module completed!`,
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Quiz not passed',
          description: `Score: ${result.grading.score.toFixed(0)}% - Pass score: ${quizQuery.data?.passScore}%`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to submit quiz',
        description: error.message,
      });
    },
  });

  return {
    quiz: quizQuery.data,
    latestSubmission: submissionQuery.data,
    loading: quizQuery.isLoading || submissionQuery.isLoading,
    error: quizQuery.error || submissionQuery.error,
    refetch: () => {
      quizQuery.refetch();
      submissionQuery.refetch();
    },
    submitQuiz: submitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
  };
}
