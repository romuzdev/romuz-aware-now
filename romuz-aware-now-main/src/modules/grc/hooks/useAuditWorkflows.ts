/**
 * GRC Audit Workflows Hooks
 * M12: React Query hooks for audit workflow management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAuditWorkflows,
  getAuditWorkflowById,
  createAuditWorkflow,
  updateAuditWorkflow,
  deleteAuditWorkflow,
  getWorkflowProgress,
  updateWorkflowStage,
  assignWorkflow,
  completeWorkflow,
  createDefaultWorkflows,
  getWorkflowStatistics,
  getAuditWorkflowsWithDetails,
} from '../integration/audit-workflows.integration';
import {
  generateAuditReport,
  analyzeComplianceGaps,
  trackFindingResolution,
  updateFindingResolution,
  recordFinding,
} from '../integration/audit-reports.integration';
import type {
  AuditWorkflowFilters,
  CreateWorkflowInput,
  UpdateWorkflowInput,
  ReportOptions,
} from '../types/audit-workflow.types';

// ============================================================================
// Audit Workflows Queries
// ============================================================================

export function useAuditWorkflows(filters: AuditWorkflowFilters = {}) {
  return useQuery({
    queryKey: ['grc', 'audit-workflows', filters],
    queryFn: () => getAuditWorkflows(filters),
  });
}

export function useAuditWorkflowById(id: string) {
  return useQuery({
    queryKey: ['grc', 'audit-workflows', id],
    queryFn: () => getAuditWorkflowById(id),
    enabled: !!id,
  });
}

export function useAuditWorkflowsWithDetails(filters: AuditWorkflowFilters = {}) {
  return useQuery({
    queryKey: ['grc', 'audit-workflows-details', filters],
    queryFn: () => getAuditWorkflowsWithDetails(filters),
  });
}

export function useWorkflowProgress(auditId: string) {
  return useQuery({
    queryKey: ['grc', 'audit-workflows', 'progress', auditId],
    queryFn: () => getWorkflowProgress(auditId),
    enabled: !!auditId,
  });
}

export function useWorkflowStatistics(auditId?: string) {
  return useQuery({
    queryKey: ['grc', 'audit-workflows', 'statistics', auditId],
    queryFn: () => getWorkflowStatistics(auditId),
  });
}

// ============================================================================
// Audit Workflows Mutations
// ============================================================================

export function useCreateAuditWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWorkflowInput) => createAuditWorkflow(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grc', 'audit-workflows'] });
      toast.success('تم إنشاء سير العمل بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل إنشاء سير العمل: ${error.message}`);
    },
  });
}

export function useUpdateAuditWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateWorkflowInput) => updateAuditWorkflow(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grc', 'audit-workflows'] });
      toast.success('تم تحديث سير العمل بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل تحديث سير العمل: ${error.message}`);
    },
  });
}

export function useDeleteAuditWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAuditWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grc', 'audit-workflows'] });
      toast.success('تم حذف سير العمل بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل حذف سير العمل: ${error.message}`);
    },
  });
}

export function useUpdateWorkflowStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workflowId, stage, progressPct }: { 
      workflowId: string; 
      stage: string; 
      progressPct?: number 
    }) => updateWorkflowStage(workflowId, stage, progressPct),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grc', 'audit-workflows'] });
      toast.success('تم تحديث مرحلة سير العمل بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل تحديث المرحلة: ${error.message}`);
    },
  });
}

export function useAssignWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workflowId, userId }: { workflowId: string; userId: string }) => 
      assignWorkflow(workflowId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grc', 'audit-workflows'] });
      toast.success('تم تعيين سير العمل بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل تعيين سير العمل: ${error.message}`);
    },
  });
}

export function useCompleteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workflowId, notes }: { workflowId: string; notes?: string }) => 
      completeWorkflow(workflowId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grc', 'audit-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['grc', 'audits'] });
      toast.success('تم إتمام سير العمل بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل إتمام سير العمل: ${error.message}`);
    },
  });
}

export function useCreateDefaultWorkflows() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (auditId: string) => createDefaultWorkflows(auditId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grc', 'audit-workflows'] });
      toast.success('تم إنشاء سير العمل الافتراضي بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل إنشاء سير العمل الافتراضي: ${error.message}`);
    },
  });
}

// ============================================================================
// Report Generation Hooks
// ============================================================================

export function useGenerateAuditReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ auditId, options }: { auditId: string; options: ReportOptions }) => 
      generateAuditReport(auditId, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grc', 'audit-reports'] });
      toast.success('تم إنشاء التقرير بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل إنشاء التقرير: ${error.message}`);
    },
  });
}

export function useComplianceGapAnalysis(auditId: string, frameworkId?: string) {
  return useQuery({
    queryKey: ['grc', 'compliance-gaps', auditId, frameworkId],
    queryFn: () => analyzeComplianceGaps(auditId, frameworkId),
    enabled: !!auditId,
  });
}

// ============================================================================
// Finding Resolution Hooks
// ============================================================================

export function useFindingResolution(findingId: string) {
  return useQuery({
    queryKey: ['grc', 'finding-resolution', findingId],
    queryFn: () => trackFindingResolution(findingId),
    enabled: !!findingId,
  });
}

export function useUpdateFindingResolution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ findingId, resolution }: { findingId: string; resolution: any }) => 
      updateFindingResolution(findingId, resolution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grc', 'audit-findings'] });
      queryClient.invalidateQueries({ queryKey: ['grc', 'finding-resolution'] });
      toast.success('تم تحديث حالة النتيجة بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل تحديث حالة النتيجة: ${error.message}`);
    },
  });
}

export function useRecordFinding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => recordFinding(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grc', 'audit-findings'] });
      queryClient.invalidateQueries({ queryKey: ['grc', 'audits'] });
      toast.success('تم تسجيل النتيجة بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل تسجيل النتيجة: ${error.message}`);
    },
  });
}
