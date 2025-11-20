import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCourse } from '../integration';
import { courseKeys } from './useCourses';
import { toast } from '@/hooks/use-toast';

export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الدورة التدريبية بنجاح',
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
