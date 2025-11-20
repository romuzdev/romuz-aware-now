/**
 * GRC Audits Hooks
 * React Query hooks for audit management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAudits,
  getAuditById,
  createAudit,
  updateAudit,
  deleteAudit,
  getAuditFindings,
  getAuditFindingById,
  createAuditFinding,
  updateAuditFinding,
  deleteAuditFinding,
  getAuditStatistics,
} from '../integration/audits.integration';
import type {
  AuditFilters,
  AuditInsert,
  AuditUpdate,
  AuditFindingFilters,
  AuditFindingInsert,
  AuditFindingUpdate,
} from '../types/audit.types';

// ============================================================================
// Audits
// ============================================================================

export function useAudits(filters: AuditFilters = {}) {
  return useQuery({
    queryKey: ['grc', 'audits', filters],
    queryFn: () => getAudits(filters),
  });
}

export function useAuditById(id: string) {
  return useQuery({
    queryKey: ['grc', 'audits', id],
    queryFn: () => getAuditById(id),
    enabled: !!id,
  });
}

export function useCreateAudit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AuditInsert) => createAudit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grc', 'audits'] });
      toast.success('تم إنشاء التدقيق بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل إنشاء التدقيق: ${error.message}`);
    },
  });
}

export function useUpdateAudit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: AuditUpdate }) =>
      updateAudit(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grc', 'audits'] });
      toast.success('تم تحديث التدقيق بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل تحديث التدقيق: ${error.message}`);
    },
  });
}

export function useDeleteAudit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAudit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grc', 'audits'] });
      toast.success('تم حذف التدقيق بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل حذف التدقيق: ${error.message}`);
    },
  });
}

// ============================================================================
// Audit Findings
// ============================================================================

export function useAuditFindings(filters: AuditFindingFilters = {}) {
  return useQuery({
    queryKey: ['grc', 'audit-findings', filters],
    queryFn: () => getAuditFindings(filters),
  });
}

export function useAuditFindingById(id: string) {
  return useQuery({
    queryKey: ['grc', 'audit-findings', id],
    queryFn: () => getAuditFindingById(id),
    enabled: !!id,
  });
}

export function useCreateAuditFinding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AuditFindingInsert) => createAuditFinding(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grc', 'audit-findings'] });
      queryClient.invalidateQueries({ queryKey: ['grc', 'audits'] });
      toast.success('تم إنشاء نتيجة التدقيق بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل إنشاء نتيجة التدقيق: ${error.message}`);
    },
  });
}

export function useUpdateAuditFinding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: AuditFindingUpdate }) =>
      updateAuditFinding(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grc', 'audit-findings'] });
      queryClient.invalidateQueries({ queryKey: ['grc', 'audits'] });
      toast.success('تم تحديث نتيجة التدقيق بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل تحديث نتيجة التدقيق: ${error.message}`);
    },
  });
}

export function useDeleteAuditFinding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAuditFinding(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grc', 'audit-findings'] });
      queryClient.invalidateQueries({ queryKey: ['grc', 'audits'] });
      toast.success('تم حذف نتيجة التدقيق بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل حذف نتيجة التدقيق: ${error.message}`);
    },
  });
}

// ============================================================================
// Statistics
// ============================================================================

export function useAuditStatistics() {
  return useQuery({
    queryKey: ['grc', 'audits', 'statistics'],
    queryFn: getAuditStatistics,
  });
}
