/**
 * Courses Hooks
 * 
 * React Query hooks for managing courses
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { toast } from 'sonner';
import {
  fetchCourses,
  fetchCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  type Course,
} from '@/integrations/supabase/lms';

/**
 * Fetch all courses
 */
export function useCourses() {
  return useQuery({
    queryKey: ['lms-courses'],
    queryFn: fetchCourses,
  });
}

/**
 * Fetch a single course by ID
 */
export function useCourseById(courseId?: string) {
  return useQuery({
    queryKey: ['lms-course', courseId],
    queryFn: () => courseId ? fetchCourseById(courseId) : null,
    enabled: !!courseId,
  });
}

/**
 * Create a new course
 */
export function useCreateCourse() {
  const queryClient = useQueryClient();
  const { tenantId, user } = useAppContext();

  return useMutation({
    mutationFn: (input: Omit<Course, 'id' | 'created_at' | 'updated_at' | 'tenant_id' | 'created_by'>) => {
      if (!tenantId || !user) throw new Error('User not authenticated');
      
      return createCourse({
        ...input,
        tenant_id: tenantId,
        created_by: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lms-courses'] });
      toast.success('تم إنشاء الدورة بنجاح');
    },
    onError: (error) => {
      console.error('Error creating course:', error);
      toast.error('فشل إنشاء الدورة');
    },
  });
}

/**
 * Update a course
 */
export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Course> }) =>
      updateCourse(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lms-courses'] });
      queryClient.invalidateQueries({ queryKey: ['lms-course', variables.id] });
      toast.success('تم تحديث الدورة بنجاح');
    },
    onError: (error) => {
      console.error('Error updating course:', error);
      toast.error('فشل تحديث الدورة');
    },
  });
}

/**
 * Delete a course
 */
export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lms-courses'] });
      toast.success('تم حذف الدورة بنجاح');
    },
    onError: (error) => {
      console.error('Error deleting course:', error);
      toast.error('فشل حذف الدورة');
    },
  });
}
