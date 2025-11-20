/**
 * D4 - Objectives & KPIs Module: React Query Hooks for Initiatives
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  fetchInitiatives,
  fetchInitiativeById,
  createInitiative,
  updateInitiative,
  deleteInitiative,
} from '@/modules/objectives/integration';
import type {
  CreateInitiativeInput,
  UpdateInitiativeInput,
} from '@/modules/objectives';
import { objectiveKeys } from './use-objectives';

// Query keys
export const initiativeKeys = {
  all: ['initiatives'] as const,
  byObjective: (objectiveId: string) => [...initiativeKeys.all, 'objective', objectiveId] as const,
  detail: (id: string) => [...initiativeKeys.all, 'detail', id] as const,
};

/**
 * Fetch all initiatives for an objective
 */
export function useInitiatives(objectiveId: string) {
  return useQuery({
    queryKey: initiativeKeys.byObjective(objectiveId),
    queryFn: () => fetchInitiatives(objectiveId),
    enabled: !!objectiveId,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000,
  });
}

/**
 * Fetch single initiative by ID
 */
export function useInitiative(id: string) {
  return useQuery({
    queryKey: initiativeKeys.detail(id),
    queryFn: () => fetchInitiativeById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Create new initiative
 */
export function useCreateInitiative() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateInitiativeInput) => createInitiative(input),
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ 
        queryKey: initiativeKeys.byObjective(input.objective_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: objectiveKeys.detail(input.objective_id) 
      });
      toast({
        title: 'تم إنشاء المبادرة',
        description: 'تم إنشاء المبادرة بنجاح',
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
 * Update existing initiative
 */
export function useUpdateInitiative() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, input, objectiveId }: { id: string; input: UpdateInitiativeInput; objectiveId: string }) =>
      updateInitiative(id, input),
    onSuccess: (_, { id, objectiveId }) => {
      queryClient.invalidateQueries({ 
        queryKey: initiativeKeys.byObjective(objectiveId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: initiativeKeys.detail(id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: objectiveKeys.detail(objectiveId) 
      });
      toast({
        title: 'تم تحديث المبادرة',
        description: 'تم تحديث المبادرة بنجاح',
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
 * Delete initiative
 */
export function useDeleteInitiative() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, objectiveId }: { id: string; objectiveId: string }) => deleteInitiative(id),
    onSuccess: (_, { objectiveId }) => {
      queryClient.invalidateQueries({ 
        queryKey: initiativeKeys.byObjective(objectiveId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: objectiveKeys.detail(objectiveId) 
      });
      toast({
        title: 'تم حذف المبادرة',
        description: 'تم حذف المبادرة بنجاح',
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
