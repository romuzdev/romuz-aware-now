import { useQuery } from '@tanstack/react-query';
import { fetchCourses } from '../integration';
import type { CourseFilters } from '../types';

export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (filters?: CourseFilters) => [...courseKeys.lists(), filters] as const,
  details: () => [...courseKeys.all, 'detail'] as const,
  detail: (id: string) => [...courseKeys.details(), id] as const,
  stats: (id: string) => [...courseKeys.detail(id), 'stats'] as const,
};

export function useCourses(filters?: CourseFilters) {
  return useQuery({
    queryKey: courseKeys.list(filters),
    queryFn: () => fetchCourses(filters),
  });
}
