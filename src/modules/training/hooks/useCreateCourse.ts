import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCourse } from '../integration';
import { courseKeys } from './useCourses';
import { toast } from '@/hooks/use-toast';

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      toast({
        title: 'تم إنشاء الدورة',
        description: 'تم إنشاء الدورة التدريبية بنجاح',
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
