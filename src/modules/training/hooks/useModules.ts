import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchModulesByCourse, 
  fetchModuleById,
  createModule, 
  updateModule, 
  deleteModule,
  reorderModules 
} from '../integration';
import { toast } from '@/hooks/use-toast';

export const moduleKeys = {
  all: ['modules'] as const,
  byCourse: (courseId: string) => [...moduleKeys.all, 'course', courseId] as const,
  detail: (id: string) => [...moduleKeys.all, 'detail', id] as const,
};

export function useModulesByCourse(courseId?: string) {
  return useQuery({
    queryKey: moduleKeys.byCourse(courseId || ''),
    queryFn: () => fetchModulesByCourse(courseId!),
    enabled: !!courseId,
  });
}

export function useModuleById(id?: string) {
  return useQuery({
    queryKey: moduleKeys.detail(id || ''),
    queryFn: () => fetchModuleById(id!),
    enabled: !!id,
  });
}

export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createModule,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: moduleKeys.byCourse(variables.course_id) });
      toast({ title: 'تم إنشاء الوحدة', description: 'تم إنشاء الوحدة بنجاح' });
    },
    onError: (error: Error) => {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) => updateModule(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: moduleKeys.byCourse(data.course_id) });
      queryClient.invalidateQueries({ queryKey: moduleKeys.detail(data.id) });
      toast({ title: 'تم التحديث', description: 'تم تحديث الوحدة بنجاح' });
    },
    onError: (error: Error) => {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moduleKeys.all });
      toast({ title: 'تم الحذف', description: 'تم حذف الوحدة بنجاح' });
    },
    onError: (error: Error) => {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    },
  });
}

export function useReorderModules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, modules }: { courseId: string; modules: Array<{ id: string; position: number }> }) =>
      reorderModules(courseId, modules),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: moduleKeys.byCourse(variables.courseId) });
      toast({ title: 'تم إعادة الترتيب', description: 'تم إعادة ترتيب الوحدات بنجاح' });
    },
    onError: (error: Error) => {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    },
  });
}
