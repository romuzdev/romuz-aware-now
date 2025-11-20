import { useQuery } from '@tanstack/react-query';
import { fetchCourseById } from '../integration';
import { courseKeys } from './useCourses';

export function useCourseById(id?: string) {
  return useQuery({
    queryKey: courseKeys.detail(id || ''),
    queryFn: () => fetchCourseById(id!),
    enabled: !!id,
  });
}
