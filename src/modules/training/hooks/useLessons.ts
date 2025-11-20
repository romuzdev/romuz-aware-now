import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchLessonsByModule, 
  fetchLessonById,
  createLesson, 
  updateLesson, 
  deleteLesson,
  reorderLessons 
} from '../integration';
import { toast } from '@/hooks/use-toast';

export const lessonKeys = {
  all: ['lessons'] as const,
  byModule: (moduleId: string) => [...lessonKeys.all, 'module', moduleId] as const,
  detail: (id: string) => [...lessonKeys.all, 'detail', id] as const,
};

export function useLessonsByModule(moduleId?: string) {
  return useQuery({
    queryKey: lessonKeys.byModule(moduleId || ''),
    queryFn: () => fetchLessonsByModule(moduleId!),
    enabled: !!moduleId,
  });
}

export function useLessonById(id?: string) {
  return useQuery({
    queryKey: lessonKeys.detail(id || ''),
    queryFn: () => fetchLessonById(id!),
    enabled: !!id,
  });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLesson,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.byModule(variables.module_id) });
      toast({ title: 'تم إنشاء الدرس', description: 'تم إنشاء الدرس بنجاح' });
    },
    onError: (error: Error) => {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) => updateLesson(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.byModule(data.module_id) });
      queryClient.invalidateQueries({ queryKey: lessonKeys.detail(data.id) });
      toast({ title: 'تم التحديث', description: 'تم تحديث الدرس بنجاح' });
    },
    onError: (error: Error) => {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLesson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.all });
      toast({ title: 'تم الحذف', description: 'تم حذف الدرس بنجاح' });
    },
    onError: (error: Error) => {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    },
  });
}

export function useReorderLessons() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ moduleId, lessons }: { moduleId: string; lessons: Array<{ id: string; position: number }> }) =>
      reorderLessons(moduleId, lessons),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.byModule(variables.moduleId) });
      toast({ title: 'تم إعادة الترتيب', description: 'تم إعادة ترتيب الدروس بنجاح' });
    },
    onError: (error: Error) => {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    },
  });
}
