import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchAssessmentsByCourse,
  fetchAssessmentById,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  fetchAssessmentQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  submitAssessment,
  fetchAssessmentAttempts,
  fetchAttemptById
} from '../integration';
import { toast } from '@/hooks/use-toast';

export const assessmentKeys = {
  all: ['assessments'] as const,
  byCourse: (courseId: string) => [...assessmentKeys.all, 'course', courseId] as const,
  detail: (id: string) => [...assessmentKeys.all, 'detail', id] as const,
  questions: (assessmentId: string) => [...assessmentKeys.all, 'questions', assessmentId] as const,
  attempts: (assessmentId: string) => [...assessmentKeys.all, 'attempts', assessmentId] as const,
  attemptDetail: (attemptId: string) => [...assessmentKeys.all, 'attempt', attemptId] as const,
};

export function useAssessmentsByCourse(courseId?: string) {
  return useQuery({
    queryKey: assessmentKeys.byCourse(courseId || ''),
    queryFn: () => fetchAssessmentsByCourse(courseId!),
    enabled: !!courseId,
  });
}

export function useAssessmentById(id?: string) {
  return useQuery({
    queryKey: assessmentKeys.detail(id || ''),
    queryFn: () => fetchAssessmentById(id!),
    enabled: !!id,
  });
}

export function useAssessmentQuestions(assessmentId?: string) {
  return useQuery({
    queryKey: assessmentKeys.questions(assessmentId || ''),
    queryFn: () => fetchAssessmentQuestions(assessmentId!),
    enabled: !!assessmentId,
  });
}

export function useAssessmentAttempts(assessmentId?: string) {
  return useQuery({
    queryKey: assessmentKeys.attempts(assessmentId || ''),
    queryFn: () => fetchAssessmentAttempts(assessmentId!),
    enabled: !!assessmentId,
  });
}

export function useAttemptById(attemptId?: string) {
  return useQuery({
    queryKey: assessmentKeys.attemptDetail(attemptId || ''),
    queryFn: () => fetchAttemptById(attemptId!),
    enabled: !!attemptId,
  });
}

export function useCreateAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAssessment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.byCourse(variables.course_id) });
      toast({ title: 'تم الإنشاء', description: 'تم إنشاء الاختبار بنجاح' });
    },
    onError: (error: Error) => {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) => updateAssessment(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.byCourse(data.course_id) });
      queryClient.invalidateQueries({ queryKey: assessmentKeys.detail(data.id) });
      toast({ title: 'تم التحديث', description: 'تم تحديث الاختبار بنجاح' });
    },
    onError: (error: Error) => {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.all });
      toast({ title: 'تم الحذف', description: 'تم حذف الاختبار بنجاح' });
    },
    onError: (error: Error) => {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    },
  });
}

export function useAddQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addQuestion,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.questions(variables.assessment_id) });
      toast({ title: 'تم الإضافة', description: 'تم إضافة السؤال بنجاح' });
    },
    onError: (error: Error) => {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) => updateQuestion(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.questions(data.assessment_id) });
      toast({ title: 'تم التحديث', description: 'تم تحديث السؤال بنجاح' });
    },
    onError: (error: Error) => {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.all });
      toast({ title: 'تم الحذف', description: 'تم حذف السؤال بنجاح' });
    },
    onError: (error: Error) => {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    },
  });
}

export function useSubmitAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.all });
      toast({ 
        title: 'تم التسليم', 
        description: 'تم تسليم الاختبار بنجاح. جاري تقييم إجاباتك...' 
      });
    },
    onError: (error: Error) => {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    },
  });
}
