/**
 * D4 - Objectives & KPIs Module: React Query Hooks for KPIs
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  fetchKPIs,
  fetchKPIById,
  createKPI,
  updateKPI,
  deleteKPI,
  fetchKPITargets,
  createKPITarget,
  updateKPITarget,
  deleteKPITarget,
  fetchKPIReadings,
  createKPIReading,
  updateKPIReading,
  deleteKPIReading,
} from '@/modules/objectives/integration';
import type {
  CreateKPIInput,
  UpdateKPIInput,
  KPIFilters,
  CreateKPITargetInput,
  UpdateKPITargetInput,
  CreateKPIReadingInput,
  UpdateKPIReadingInput,
} from '@/modules/objectives';

// Query keys
export const kpiKeys = {
  all: ['kpis'] as const,
  lists: () => [...kpiKeys.all, 'list'] as const,
  list: (filters?: KPIFilters) => [...kpiKeys.lists(), { filters }] as const,
  details: () => [...kpiKeys.all, 'detail'] as const,
  detail: (id: string) => [...kpiKeys.details(), id] as const,
  targets: (kpiId: string) => [...kpiKeys.all, 'targets', kpiId] as const,
  readings: (kpiId: string) => [...kpiKeys.all, 'readings', kpiId] as const,
};

// ============================================================================
// KPIs
// ============================================================================

/**
 * Fetch all KPIs with optional filters
 */
export function useKPIs(filters?: KPIFilters) {
  return useQuery({
    queryKey: kpiKeys.list(filters),
    queryFn: () => fetchKPIs(filters),
    staleTime: 90 * 1000, // 90 seconds
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch single KPI by ID
 */
export function useKPI(id: string) {
  return useQuery({
    queryKey: kpiKeys.detail(id),
    queryFn: () => fetchKPIById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Create new KPI
 */
export function useCreateKPI() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateKPIInput) => createKPI(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kpiKeys.lists() });
      toast({
        title: 'تم إنشاء مؤشر الأداء',
        description: 'تم إنشاء مؤشر الأداء الرئيسي بنجاح',
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
 * Update existing KPI
 */
export function useUpdateKPI() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateKPIInput }) =>
      updateKPI(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: kpiKeys.lists() });
      queryClient.invalidateQueries({ queryKey: kpiKeys.detail(id) });
      toast({
        title: 'تم تحديث مؤشر الأداء',
        description: 'تم تحديث مؤشر الأداء الرئيسي بنجاح',
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
 * Delete KPI
 */
export function useDeleteKPI() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteKPI(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kpiKeys.lists() });
      toast({
        title: 'تم حذف مؤشر الأداء',
        description: 'تم حذف مؤشر الأداء الرئيسي بنجاح',
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

// ============================================================================
// KPI TARGETS
// ============================================================================

/**
 * Fetch all targets for a KPI
 */
export function useKPITargets(kpiId: string) {
  return useQuery({
    queryKey: kpiKeys.targets(kpiId),
    queryFn: () => fetchKPITargets(kpiId),
    enabled: !!kpiId,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000,
  });
}

/**
 * Create new KPI target
 */
export function useCreateKPITarget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateKPITargetInput) => createKPITarget(input),
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: kpiKeys.targets(input.kpi_id) });
      queryClient.invalidateQueries({ queryKey: kpiKeys.detail(input.kpi_id) });
      toast({
        title: 'تم إضافة الهدف',
        description: 'تم إضافة الهدف المستهدف بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ في الإضافة',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update existing KPI target
 */
export function useUpdateKPITarget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, input, kpiId }: { id: string; input: UpdateKPITargetInput; kpiId: string }) =>
      updateKPITarget(id, input),
    onSuccess: (_, { kpiId }) => {
      queryClient.invalidateQueries({ queryKey: kpiKeys.targets(kpiId) });
      queryClient.invalidateQueries({ queryKey: kpiKeys.detail(kpiId) });
      toast({
        title: 'تم تحديث الهدف',
        description: 'تم تحديث الهدف المستهدف بنجاح',
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
 * Delete KPI target
 */
export function useDeleteKPITarget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, kpiId }: { id: string; kpiId: string }) => deleteKPITarget(id),
    onSuccess: (_, { kpiId }) => {
      queryClient.invalidateQueries({ queryKey: kpiKeys.targets(kpiId) });
      queryClient.invalidateQueries({ queryKey: kpiKeys.detail(kpiId) });
      toast({
        title: 'تم حذف الهدف',
        description: 'تم حذف الهدف المستهدف بنجاح',
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

// ============================================================================
// KPI READINGS
// ============================================================================

/**
 * Fetch all readings for a KPI
 */
export function useKPIReadings(kpiId: string) {
  return useQuery({
    queryKey: kpiKeys.readings(kpiId),
    queryFn: () => fetchKPIReadings(kpiId),
    enabled: !!kpiId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000,
  });
}

/**
 * Create new KPI reading
 */
export function useCreateKPIReading() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateKPIReadingInput) => createKPIReading(input),
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: kpiKeys.readings(input.kpi_id) });
      queryClient.invalidateQueries({ queryKey: kpiKeys.detail(input.kpi_id) });
      toast({
        title: 'تم إضافة القراءة',
        description: 'تم إضافة القراءة الفعلية بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ في الإضافة',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update existing KPI reading
 */
export function useUpdateKPIReading() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, input, kpiId }: { id: string; input: UpdateKPIReadingInput; kpiId: string }) =>
      updateKPIReading(id, input),
    onSuccess: (_, { kpiId }) => {
      queryClient.invalidateQueries({ queryKey: kpiKeys.readings(kpiId) });
      queryClient.invalidateQueries({ queryKey: kpiKeys.detail(kpiId) });
      toast({
        title: 'تم تحديث القراءة',
        description: 'تم تحديث القراءة الفعلية بنجاح',
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
 * Delete KPI reading
 */
export function useDeleteKPIReading() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, kpiId }: { id: string; kpiId: string }) => deleteKPIReading(id),
    onSuccess: (_, { kpiId }) => {
      queryClient.invalidateQueries({ queryKey: kpiKeys.readings(kpiId) });
      queryClient.invalidateQueries({ queryKey: kpiKeys.detail(kpiId) });
      toast({
        title: 'تم حذف القراءة',
        description: 'تم حذف القراءة الفعلية بنجاح',
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
