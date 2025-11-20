/**
 * GRC Compliance Hooks
 * React Query hooks for compliance management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getComplianceFrameworks,
  getComplianceFrameworkById,
  createComplianceFramework,
  updateComplianceFramework,
  deleteComplianceFramework,
  getComplianceRequirements,
  getComplianceRequirementById,
  createComplianceRequirement,
  updateComplianceRequirement,
  deleteComplianceRequirement,
  getComplianceGaps,
  getComplianceGapById,
  createComplianceGap,
  updateComplianceGap,
  deleteComplianceGap,
  getComplianceStatistics,
} from '../integration/compliance.integration';
import type {
  ComplianceFrameworkFilters,
  ComplianceFrameworkInsert,
  ComplianceFrameworkUpdate,
  ComplianceRequirementFilters,
  ComplianceRequirementInsert,
  ComplianceRequirementUpdate,
  ComplianceGapFilters,
  ComplianceGapInsert,
  ComplianceGapUpdate,
} from '../types/compliance.types';

// ============================================================================
// Compliance Frameworks
// ============================================================================

export function useComplianceFrameworks(filters: ComplianceFrameworkFilters = {}) {
  return useQuery({
    queryKey: ['grc', 'compliance', 'frameworks', filters],
    queryFn: () => getComplianceFrameworks(filters),
  });
}

export function useComplianceFrameworkById(id: string) {
  return useQuery({
    queryKey: ['grc', 'compliance', 'frameworks', id],
    queryFn: () => getComplianceFrameworkById(id),
    enabled: !!id,
  });
}

export function useCreateComplianceFramework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ComplianceFrameworkInsert) => createComplianceFramework(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grc', 'compliance', 'frameworks'] });
      toast.success('تم إنشاء الإطار بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل إنشاء الإطار: ${error.message}`);
    },
  });
}

export function useUpdateComplianceFramework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ComplianceFrameworkUpdate }) =>
      updateComplianceFramework(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grc', 'compliance', 'frameworks'] });
      toast.success('تم تحديث الإطار بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل تحديث الإطار: ${error.message}`);
    },
  });
}

export function useDeleteComplianceFramework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteComplianceFramework(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grc', 'compliance', 'frameworks'] });
      toast.success('تم حذف الإطار بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل حذف الإطار: ${error.message}`);
    },
  });
}

// ============================================================================
// Compliance Requirements
// ============================================================================

export function useComplianceRequirements(filters: ComplianceRequirementFilters = {}) {
  return useQuery({
    queryKey: ['grc', 'compliance', 'requirements', filters],
    queryFn: () => getComplianceRequirements(filters),
  });
}

export function useComplianceRequirementById(id: string) {
  return useQuery({
    queryKey: ['grc', 'compliance', 'requirements', id],
    queryFn: () => getComplianceRequirementById(id),
    enabled: !!id,
  });
}

export function useCreateComplianceRequirement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ComplianceRequirementInsert) => createComplianceRequirement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grc', 'compliance', 'requirements'] });
      queryClient.invalidateQueries({ queryKey: ['grc', 'compliance', 'frameworks'] });
      toast.success('تم إنشاء المتطلب بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل إنشاء المتطلب: ${error.message}`);
    },
  });
}

export function useUpdateComplianceRequirement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ComplianceRequirementUpdate }) =>
      updateComplianceRequirement(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grc', 'compliance', 'requirements'] });
      queryClient.invalidateQueries({ queryKey: ['grc', 'compliance', 'frameworks'] });
      toast.success('تم تحديث المتطلب بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل تحديث المتطلب: ${error.message}`);
    },
  });
}

export function useDeleteComplianceRequirement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteComplianceRequirement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grc', 'compliance', 'requirements'] });
      queryClient.invalidateQueries({ queryKey: ['grc', 'compliance', 'frameworks'] });
      toast.success('تم حذف المتطلب بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل حذف المتطلب: ${error.message}`);
    },
  });
}

// ============================================================================
// Compliance Gaps
// ============================================================================

export function useComplianceGaps(filters: ComplianceGapFilters = {}) {
  return useQuery({
    queryKey: ['grc', 'compliance', 'gaps', filters],
    queryFn: () => getComplianceGaps(filters),
  });
}

export function useComplianceGapById(id: string) {
  return useQuery({
    queryKey: ['grc', 'compliance', 'gaps', id],
    queryFn: () => getComplianceGapById(id),
    enabled: !!id,
  });
}

export function useCreateComplianceGap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ComplianceGapInsert) => createComplianceGap(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grc', 'compliance', 'gaps'] });
      toast.success('تم إنشاء فجوة الامتثال بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل إنشاء فجوة الامتثال: ${error.message}`);
    },
  });
}

export function useUpdateComplianceGap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ComplianceGapUpdate }) =>
      updateComplianceGap(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grc', 'compliance', 'gaps'] });
      toast.success('تم تحديث فجوة الامتثال بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل تحديث فجوة الامتثال: ${error.message}`);
    },
  });
}

export function useDeleteComplianceGap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteComplianceGap(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grc', 'compliance', 'gaps'] });
      toast.success('تم حذف فجوة الامتثال بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل حذف فجوة الامتثال: ${error.message}`);
    },
  });
}

// ============================================================================
// Statistics
// ============================================================================

export function useComplianceStatistics() {
  return useQuery({
    queryKey: ['grc', 'compliance', 'statistics'],
    queryFn: getComplianceStatistics,
  });
}
