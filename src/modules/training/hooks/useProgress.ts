import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchLessonProgress,
  fetchModuleProgress,
  fetchCourseProgress,
  updateLessonProgress
} from '../integration';

export const progressKeys = {
  all: ['progress'] as const,
  lesson: (enrollmentId: string, lessonId: string) => 
    [...progressKeys.all, 'lesson', enrollmentId, lessonId] as const,
  module: (enrollmentId: string, moduleId: string) => 
    [...progressKeys.all, 'module', enrollmentId, moduleId] as const,
  course: (enrollmentId: string) => 
    [...progressKeys.all, 'course', enrollmentId] as const,
};

export function useLessonProgress(enrollmentId?: string, lessonId?: string) {
  return useQuery({
    queryKey: progressKeys.lesson(enrollmentId || '', lessonId || ''),
    queryFn: () => fetchLessonProgress(enrollmentId!, lessonId!),
    enabled: !!enrollmentId && !!lessonId,
  });
}

export function useModuleProgress(enrollmentId?: string, moduleId?: string) {
  return useQuery({
    queryKey: progressKeys.module(enrollmentId || '', moduleId || ''),
    queryFn: () => fetchModuleProgress(enrollmentId!, moduleId!),
    enabled: !!enrollmentId && !!moduleId,
  });
}

export function useCourseProgress(enrollmentId?: string) {
  return useQuery({
    queryKey: progressKeys.course(enrollmentId || ''),
    queryFn: () => fetchCourseProgress(enrollmentId!),
    enabled: !!enrollmentId,
  });
}

export function useUpdateLessonProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLessonProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressKeys.all });
    },
  });
}
