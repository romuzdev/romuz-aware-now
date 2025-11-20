import { useMutation, useQueryClient } from '@tanstack/react-query';
import { publishCourse, archiveCourse } from '../integration';
import { courseKeys } from './useCourses';
import { toast } from '@/hooks/use-toast';

export function usePublishCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: publishCourse,
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
      toast({
        title: 'تم النشر',
        description: 'تم نشر الدورة التدريبية بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useArchiveCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveCourse,
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
      toast({
        title: 'تم الأرشفة',
        description: 'تم أرشفة الدورة التدريبية بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
