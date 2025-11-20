/**
 * D4 - Objectives & KPIs Module: React Query Hooks for Objectives
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  fetchObjectives,
  fetchObjectiveById,
  createObjective,
  updateObjective,
  deleteObjective,
} from '@/modules/objectives/integration';
import type {
  CreateObjectiveInput,
  UpdateObjectiveInput,
  ObjectiveFilters,
} from '@/modules/objectives';

// Query keys
export const objectiveKeys = {
  all: ['objectives'] as const,
  lists: () => [...objectiveKeys.all, 'list'] as const,
  list: (filters?: ObjectiveFilters) => [...objectiveKeys.lists(), { filters }] as const,
  details: () => [...objectiveKeys.all, 'detail'] as const,
  detail: (id: string) => [...objectiveKeys.details(), id] as const,
};

/**
 * Fetch all objectives with optional filters
 */
export function useObjectives(filters?: ObjectiveFilters) {
  return useQuery({
    queryKey: objectiveKeys.list(filters),
    queryFn: () => fetchObjectives(filters),
    staleTime: 90 * 1000, // 90 seconds
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch single objective by ID
 */
export function useObjective(id: string) {
  return useQuery({
    queryKey: objectiveKeys.detail(id),
    queryFn: () => fetchObjectiveById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Create new objective
 */
export function useCreateObjective() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateObjectiveInput) => createObjective(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: objectiveKeys.lists() });
      toast({
        title: 'تم إنشاء الهدف',
        description: 'تم إنشاء الهدف الاستراتيجي بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ في الإنشاء',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update existing objective
 */
export function useUpdateObjective() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateObjectiveInput }) =>
      updateObjective(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: objectiveKeys.lists() });
      queryClient.invalidateQueries({ queryKey: objectiveKeys.detail(id) });
      toast({
        title: 'تم تحديث الهدف',
        description: 'تم تحديث الهدف الاستراتيجي بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ في التحديث',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete objective
 */
export function useDeleteObjective() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteObjective(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: objectiveKeys.lists() });
      toast({
        title: 'تم حذف الهدف',
        description: 'تم حذف الهدف الاستراتيجي بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ في الحذف',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
