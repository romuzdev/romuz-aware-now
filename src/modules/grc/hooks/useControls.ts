/**
 * GRC Module - Control Management Hook
 * React Query hook for managing controls and control tests
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchControls,
  fetchControlById,
  createControl,
  updateControl,
  deleteControl,
  fetchControlTests,
  createControlTest,
  updateControlTest,
  deleteControlTest,
  fetchControlStatistics,
  fetchControlTestStatistics,
} from '../integration/controls.integration';
import type {
  Control,
  ControlTest,
  CreateControlInput,
  UpdateControlInput,
  CreateControlTestInput,
  UpdateControlTestInput,
  ControlFilters,
  ControlTestFilters,
} from '../types/control.types';

const CONTROL_QUERY_KEY = 'grc-controls';
const CONTROL_TEST_QUERY_KEY = 'grc-control-tests';

/**
 * Hook: Fetch controls list with filters
 */
export function useControls(filters?: ControlFilters) {
  return useQuery({
    queryKey: [CONTROL_QUERY_KEY, 'list', filters],
    queryFn: () => fetchControls(filters),
  });
}

/**
 * Hook: Fetch single control by ID
 */
export function useControlById(controlId: string | undefined) {
  return useQuery({
    queryKey: [CONTROL_QUERY_KEY, 'detail', controlId],
    queryFn: () => (controlId ? fetchControlById(controlId) : null),
    enabled: !!controlId,
  });
}

/**
 * Hook: Fetch control statistics
 */
export function useControlStatistics() {
  return useQuery({
    queryKey: [CONTROL_QUERY_KEY, 'statistics'],
    queryFn: fetchControlStatistics,
  });
}

/**
 * Hook: Create control mutation
 */
export function useCreateControl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createControl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTROL_QUERY_KEY] });
      toast.success('تم إنشاء الرقابة بنجاح');
    },
    onError: (error: Error) => {
      console.error('Error creating control:', error);
      toast.error('فشل إنشاء الرقابة');
    },
  });
}

/**
 * Hook: Update control mutation
 */
export function useUpdateControl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateControlInput }) =>
      updateControl(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTROL_QUERY_KEY] });
      toast.success('تم تحديث الرقابة بنجاح');
    },
    onError: (error: Error) => {
      console.error('Error updating control:', error);
      toast.error('فشل تحديث الرقابة');
    },
  });
}

/**
 * Hook: Delete control mutation
 */
export function useDeleteControl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteControl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTROL_QUERY_KEY] });
      toast.success('تم حذف الرقابة بنجاح');
    },
    onError: (error: Error) => {
      console.error('Error deleting control:', error);
      toast.error('فشل حذف الرقابة');
    },
  });
}

/**
 * Hook: Fetch control tests list with filters
 */
export function useControlTests(filters?: ControlTestFilters) {
  return useQuery({
    queryKey: [CONTROL_TEST_QUERY_KEY, 'list', filters],
    queryFn: () => fetchControlTests(filters),
  });
}

/**
 * Hook: Fetch control test statistics
 */
export function useControlTestStatistics() {
  return useQuery({
    queryKey: [CONTROL_TEST_QUERY_KEY, 'statistics'],
    queryFn: fetchControlTestStatistics,
  });
}

/**
 * Hook: Create control test mutation
 */
export function useCreateControlTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createControlTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTROL_TEST_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTROL_QUERY_KEY] });
      toast.success('تم إنشاء اختبار الرقابة بنجاح');
    },
    onError: (error: Error) => {
      console.error('Error creating control test:', error);
      toast.error('فشل إنشاء اختبار الرقابة');
    },
  });
}

/**
 * Hook: Update control test mutation
 */
export function useUpdateControlTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateControlTestInput }) =>
      updateControlTest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTROL_TEST_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTROL_QUERY_KEY] });
      toast.success('تم تحديث اختبار الرقابة بنجاح');
    },
    onError: (error: Error) => {
      console.error('Error updating control test:', error);
      toast.error('فشل تحديث اختبار الرقابة');
    },
  });
}

/**
 * Hook: Delete control test mutation
 */
export function useDeleteControlTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteControlTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTROL_TEST_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTROL_QUERY_KEY] });
      toast.success('تم حذف اختبار الرقابة بنجاح');
    },
    onError: (error: Error) => {
      console.error('Error deleting control test:', error);
      toast.error('فشل حذف اختبار الرقابة');
    },
  });
}
