/**
 * Third-Party Risk Management Hooks
 * React Query hooks for third-party vendor risk management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchThirdPartyVendors,
  fetchThirdPartyVendorById,
  createThirdPartyVendor,
  updateThirdPartyVendor,
  deleteThirdPartyVendor,
  fetchThirdPartyRiskAssessments,
  fetchThirdPartyRiskAssessmentsByVendor,
  createThirdPartyRiskAssessment,
  updateThirdPartyRiskAssessment,
  deleteThirdPartyRiskAssessment,
  fetchThirdPartyDueDiligence,
  createThirdPartyDueDiligence,
  updateThirdPartyDueDiligence,
  deleteThirdPartyDueDiligence,
  fetchVendorRiskSummary,
} from '../integration/third-party-risk.integration';

/**
 * Vendor Hooks
 */

export function useThirdPartyVendors(tenantId: string) {
  return useQuery({
    queryKey: ['third-party-vendors', tenantId],
    queryFn: () => fetchThirdPartyVendors(tenantId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useThirdPartyVendor(id: string) {
  return useQuery({
    queryKey: ['third-party-vendor', id],
    queryFn: () => fetchThirdPartyVendorById(id),
    enabled: !!id,
  });
}

export function useCreateThirdPartyVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createThirdPartyVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['third-party-vendors'] });
      toast.success('تم إنشاء المورد بنجاح');
    },
    onError: (error: Error) => {
      console.error('❌ Create vendor error:', error);
      toast.error(error.message || 'فشل إنشاء المورد');
    },
  });
}

export function useUpdateThirdPartyVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      updateThirdPartyVendor(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['third-party-vendors'] });
      queryClient.invalidateQueries({
        queryKey: ['third-party-vendor', variables.id],
      });
      toast.success('تم تحديث المورد بنجاح');
    },
    onError: (error: Error) => {
      console.error('❌ Update vendor error:', error);
      toast.error(error.message || 'فشل تحديث المورد');
    },
  });
}

export function useDeleteThirdPartyVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteThirdPartyVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['third-party-vendors'] });
      toast.success('تم حذف المورد بنجاح');
    },
    onError: (error: Error) => {
      console.error('❌ Delete vendor error:', error);
      toast.error(error.message || 'فشل حذف المورد');
    },
  });
}

/**
 * Risk Assessment Hooks
 */

export function useThirdPartyRiskAssessments(tenantId: string) {
  return useQuery({
    queryKey: ['third-party-risk-assessments', tenantId],
    queryFn: () => fetchThirdPartyRiskAssessments(tenantId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useThirdPartyRiskAssessmentsByVendor(vendorId: string) {
  return useQuery({
    queryKey: ['third-party-risk-assessments', 'vendor', vendorId],
    queryFn: () => fetchThirdPartyRiskAssessmentsByVendor(vendorId),
    enabled: !!vendorId,
  });
}

export function useCreateThirdPartyRiskAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createThirdPartyRiskAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['third-party-risk-assessments'],
      });
      toast.success('تم إنشاء تقييم المخاطر بنجاح');
    },
    onError: (error: Error) => {
      console.error('❌ Create assessment error:', error);
      toast.error(error.message || 'فشل إنشاء تقييم المخاطر');
    },
  });
}

export function useUpdateThirdPartyRiskAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      updateThirdPartyRiskAssessment(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['third-party-risk-assessments'],
      });
      toast.success('تم تحديث تقييم المخاطر بنجاح');
    },
    onError: (error: Error) => {
      console.error('❌ Update assessment error:', error);
      toast.error(error.message || 'فشل تحديث تقييم المخاطر');
    },
  });
}

export function useDeleteThirdPartyRiskAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteThirdPartyRiskAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['third-party-risk-assessments'],
      });
      toast.success('تم حذف تقييم المخاطر بنجاح');
    },
    onError: (error: Error) => {
      console.error('❌ Delete assessment error:', error);
      toast.error(error.message || 'فشل حذف تقييم المخاطر');
    },
  });
}

/**
 * Due Diligence Hooks
 */

export function useThirdPartyDueDiligence(vendorId: string) {
  return useQuery({
    queryKey: ['third-party-due-diligence', vendorId],
    queryFn: () => fetchThirdPartyDueDiligence(vendorId),
    enabled: !!vendorId,
  });
}

export function useCreateThirdPartyDueDiligence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createThirdPartyDueDiligence,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['third-party-due-diligence'] });
      toast.success('تم إضافة المستند بنجاح');
    },
    onError: (error: Error) => {
      console.error('❌ Create document error:', error);
      toast.error(error.message || 'فشل إضافة المستند');
    },
  });
}

export function useUpdateThirdPartyDueDiligence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      updateThirdPartyDueDiligence(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['third-party-due-diligence'] });
      toast.success('تم تحديث المستند بنجاح');
    },
    onError: (error: Error) => {
      console.error('❌ Update document error:', error);
      toast.error(error.message || 'فشل تحديث المستند');
    },
  });
}

export function useDeleteThirdPartyDueDiligence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteThirdPartyDueDiligence,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['third-party-due-diligence'] });
      toast.success('تم حذف المستند بنجاح');
    },
    onError: (error: Error) => {
      console.error('❌ Delete document error:', error);
      toast.error(error.message || 'فشل حذف المستند');
    },
  });
}

/**
 * Analytics Hooks
 */

export function useVendorRiskSummary(tenantId: string) {
  return useQuery({
    queryKey: ['vendor-risk-summary', tenantId],
    queryFn: () => fetchVendorRiskSummary(tenantId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
