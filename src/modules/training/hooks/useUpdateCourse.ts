import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCourse } from '../integration';
import { courseKeys } from './useCourses';
import { toast } from '@/hooks/use-toast';

export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) => 
      updateCourse(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(variables.id) });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث الدورة التدريبية بنجاح',
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
