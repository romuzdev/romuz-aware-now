import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchMyEnrollments,
  fetchEnrollmentById,
  enrollInCourse,
  updateEnrollmentProgress,
  completeEnrollment,
  fetchCourseEnrollments
} from '../integration';
import { toast } from '@/hooks/use-toast';

export const enrollmentKeys = {
  all: ['enrollments'] as const,
  my: () => [...enrollmentKeys.all, 'my'] as const,
  detail: (id: string) => [...enrollmentKeys.all, 'detail', id] as const,
  byCourse: (courseId: string) => [...enrollmentKeys.all, 'course', courseId] as const,
};

export function useMyEnrollments() {
  return useQuery({
    queryKey: enrollmentKeys.my(),
    queryFn: fetchMyEnrollments,
  });
}

export function useEnrollmentById(id?: string) {
  return useQuery({
    queryKey: enrollmentKeys.detail(id || ''),
    queryFn: () => fetchEnrollmentById(id!),
    enabled: !!id,
  });
}

export function useCourseEnrollments(courseId?: string) {
  return useQuery({
    queryKey: enrollmentKeys.byCourse(courseId || ''),
    queryFn: () => fetchCourseEnrollments(courseId!),
    enabled: !!courseId,
  });
}

export function useEnrollInCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: enrollInCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.my() });
      toast({ title: 'تم التسجيل', description: 'تم تسجيلك في الدورة بنجاح' });
    },
    onError: (error: Error) => {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ enrollmentId, lessonId, status, timeSpent }: {
      enrollmentId: string;
      lessonId: string;
      status: 'not_started' | 'in_progress' | 'completed';
      timeSpent?: number;
    }) => updateEnrollmentProgress(enrollmentId, lessonId, status, timeSpent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all });
    },
  });
}

export function useCompleteEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeEnrollment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.my() });
      toast({ title: 'تهانينا!', description: 'لقد أكملت الدورة بنجاح' });
    },
    onError: (error: Error) => {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    },
  });
}
