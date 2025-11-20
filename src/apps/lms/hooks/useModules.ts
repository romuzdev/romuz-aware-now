/**
 * Modules Hooks
 * 
 * React Query hooks for managing course modules
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchCourseModules,
  createModule,
  updateModule,
  deleteModule,
  type CourseModule,
} from '@/integrations/supabase/lms';

/**
 * Fetch modules for a course
 */
export function useModulesByCourse(courseId?: string) {
  return useQuery({
    queryKey: ['lms-modules', courseId],
    queryFn: () => courseId ? fetchCourseModules(courseId) : [],
    enabled: !!courseId,
  });
}

/**
 * Create a new module
 */
export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<CourseModule, 'id' | 'created_at' | 'updated_at'>) =>
      createModule(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lms-modules', variables.course_id] });
      toast.success('تم إضافة الوحدة بنجاح');
    },
    onError: (error) => {
      console.error('Error creating module:', error);
      toast.error('فشل إضافة الوحدة');
    },
  });
}

/**
 * Update a module
 */
export function useUpdateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CourseModule> }) =>
      updateModule(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lms-modules', data.course_id] });
      toast.success('تم تحديث الوحدة بنجاح');
    },
    onError: (error) => {
      console.error('Error updating module:', error);
      toast.error('فشل تحديث الوحدة');
    },
  });
}

/**
 * Delete a module
 */
export function useDeleteModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lms-modules'] });
      toast.success('تم حذف الوحدة بنجاح');
    },
    onError: (error) => {
      console.error('Error deleting module:', error);
      toast.error('فشل حذف الوحدة');
    },
  });
}
