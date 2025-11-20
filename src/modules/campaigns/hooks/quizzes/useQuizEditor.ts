import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useTenantUser } from '@/lib/app/get-tenant-user';
import { useCan } from '@/core/rbac';
import {
  fetchQuizByModule,
  upsertQuiz,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  createOption,
  updateOption,
  deleteOption,
} from '@/modules/campaigns/integration/quizzes.integration';
import type {
  QuizFormData,
  QuestionFormData,
  OptionFormData,
} from '@/modules/campaigns';

export function useQuizEditor(moduleId: string) {
  const { toast } = useToast();
  const { tenantId } = useTenantUser();
  const can = useCan();
  const qc = useQueryClient();

  // RBAC check: managers only
  const canManage = can('campaigns.manage');

  const query = useQuery({
    queryKey: ['quiz', moduleId],
    queryFn: () => fetchQuizByModule(moduleId),
    enabled: !!moduleId,
  });

  const upsertMutation = useMutation({
    mutationFn: (formData: QuizFormData) => {
      if (!canManage) throw new Error('Permission denied: managers only');
      if (!tenantId) throw new Error('Tenant ID required');
      return upsertQuiz(tenantId, moduleId, formData);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quiz', moduleId] });
      toast({ title: 'Quiz saved' });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to save quiz',
        description: error.message,
      });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: ({ quizId, formData }: { quizId: string; formData: QuestionFormData }) => {
      if (!canManage) throw new Error('Permission denied: managers only');
      if (!tenantId) throw new Error('Tenant ID required');
      return createQuestion(tenantId, quizId, formData);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quiz', moduleId] });
      toast({ title: 'Question added' });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to add question',
        description: error.message,
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: Partial<QuestionFormData> }) => {
      if (!canManage) throw new Error('Permission denied: managers only');
      return updateQuestion(id, formData);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quiz', moduleId] });
      toast({ title: 'Question updated' });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to update question',
        description: error.message,
      });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (id: string) => {
      if (!canManage) throw new Error('Permission denied: managers only');
      return deleteQuestion(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quiz', moduleId] });
      toast({ title: 'Question deleted' });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to delete question',
        description: error.message,
      });
    },
  });

  const createOptionMutation = useMutation({
    mutationFn: ({ questionId, formData }: { questionId: string; formData: OptionFormData }) => {
      if (!canManage) throw new Error('Permission denied: managers only');
      if (!tenantId) throw new Error('Tenant ID required');
      return createOption(tenantId, questionId, formData);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quiz', moduleId] });
      toast({ title: 'Option added' });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to add option',
        description: error.message,
      });
    },
  });

  const updateOptionMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: Partial<OptionFormData> }) => {
      if (!canManage) throw new Error('Permission denied: managers only');
      return updateOption(id, formData);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quiz', moduleId] });
      toast({ title: 'Option updated' });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to update option',
        description: error.message,
      });
    },
  });

  const deleteOptionMutation = useMutation({
    mutationFn: (id: string) => {
      if (!canManage) throw new Error('Permission denied: managers only');
      return deleteOption(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quiz', moduleId] });
      toast({ title: 'Option deleted' });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to delete option',
        description: error.message,
      });
    },
  });

  return {
    quiz: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    canManage,
    upsertQuiz: upsertMutation.mutateAsync,
    createQuestion: createQuestionMutation.mutateAsync,
    updateQuestion: updateQuestionMutation.mutateAsync,
    deleteQuestion: deleteQuestionMutation.mutateAsync,
    createOption: createOptionMutation.mutateAsync,
    updateOption: updateOptionMutation.mutateAsync,
    deleteOption: deleteOptionMutation.mutateAsync,
    isLoading:
      upsertMutation.isPending ||
      createQuestionMutation.isPending ||
      updateQuestionMutation.isPending ||
      deleteQuestionMutation.isPending ||
      createOptionMutation.isPending ||
      updateOptionMutation.isPending ||
      deleteOptionMutation.isPending,
  };
}
