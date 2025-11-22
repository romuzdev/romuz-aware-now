/**
 * Third-Party Risk Management Hooks
 * React Query hooks for vendor management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { toast } from 'sonner';
import * as thirdPartyRiskIntegration from '../integration/third-party-risk.integration';

// ========== VENDORS ==========

export function useVendors() {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['vendors', tenantId],
    queryFn: () => thirdPartyRiskIntegration.fetchVendors(tenantId),
    enabled: !!tenantId,
  });
}

export function useVendorById(id: string) {
  return useQuery({
    queryKey: ['vendor', id],
    queryFn: () => thirdPartyRiskIntegration.fetchVendorById(id),
    enabled: !!id,
  });
}

export function useCreateVendor() {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vendor: Parameters<typeof thirdPartyRiskIntegration.createVendor>[1]) =>
      thirdPartyRiskIntegration.createVendor(tenantId, vendor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors', tenantId] });
      toast.success('تم إنشاء المورد بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل إنشاء المورد: ${error.message}`);
    },
  });
}

export function useUpdateVendor() {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof thirdPartyRiskIntegration.updateVendor>[1] }) =>
      thirdPartyRiskIntegration.updateVendor(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['vendors', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['vendor', id] });
      toast.success('تم تحديث المورد بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل تحديث المورد: ${error.message}`);
    },
  });
}

export function useDeleteVendor() {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => thirdPartyRiskIntegration.deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors', tenantId] });
      toast.success('تم حذف المورد بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل حذف المورد: ${error.message}`);
    },
  });
}

// ========== VENDOR CONTACTS ==========

export function useVendorContacts(vendorId: string) {
  return useQuery({
    queryKey: ['vendor-contacts', vendorId],
    queryFn: () => thirdPartyRiskIntegration.fetchVendorContacts(vendorId),
    enabled: !!vendorId,
  });
}

export function useCreateVendorContact() {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contact: Parameters<typeof thirdPartyRiskIntegration.createVendorContact>[1]) =>
      thirdPartyRiskIntegration.createVendorContact(tenantId, contact),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-contacts', data.vendor_id] });
      toast.success('تم إضافة جهة الاتصال بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل إضافة جهة الاتصال: ${error.message}`);
    },
  });
}

export function useDeleteVendorContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, vendorId }: { id: string; vendorId: string }) =>
      thirdPartyRiskIntegration.deleteVendorContact(id),
    onSuccess: (_, { vendorId }) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-contacts', vendorId] });
      toast.success('تم حذف جهة الاتصال بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل حذف جهة الاتصال: ${error.message}`);
    },
  });
}

// ========== RISK ASSESSMENTS ==========

export function useVendorRiskAssessments(vendorId?: string) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['vendor-risk-assessments', tenantId, vendorId],
    queryFn: () => thirdPartyRiskIntegration.fetchVendorRiskAssessments(tenantId, vendorId),
    enabled: !!tenantId,
  });
}

export function useVendorRiskAssessmentById(id: string) {
  return useQuery({
    queryKey: ['vendor-risk-assessment', id],
    queryFn: () => thirdPartyRiskIntegration.fetchVendorRiskAssessmentById(id),
    enabled: !!id,
  });
}

export function useCreateVendorRiskAssessment() {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assessment: Parameters<typeof thirdPartyRiskIntegration.createVendorRiskAssessment>[1]) =>
      thirdPartyRiskIntegration.createVendorRiskAssessment(tenantId, assessment),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-risk-assessments', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-risk-assessments', tenantId, data.vendor_id] });
      toast.success('تم إنشاء تقييم المخاطر بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل إنشاء تقييم المخاطر: ${error.message}`);
    },
  });
}

export function useUpdateVendorRiskAssessment() {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof thirdPartyRiskIntegration.updateVendorRiskAssessment>[1] }) =>
      thirdPartyRiskIntegration.updateVendorRiskAssessment(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-risk-assessments', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-risk-assessment', id] });
      toast.success('تم تحديث تقييم المخاطر بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل تحديث تقييم المخاطر: ${error.message}`);
    },
  });
}

export function useDeleteVendorRiskAssessment() {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => thirdPartyRiskIntegration.deleteVendorRiskAssessment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-risk-assessments', tenantId] });
      toast.success('تم حذف تقييم المخاطر بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل حذف تقييم المخاطر: ${error.message}`);
    },
  });
}

// ========== CONTRACTS ==========

export function useVendorContracts(vendorId?: string) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['vendor-contracts', tenantId, vendorId],
    queryFn: () => thirdPartyRiskIntegration.fetchVendorContracts(tenantId, vendorId),
    enabled: !!tenantId,
  });
}

export function useVendorContractById(id: string) {
  return useQuery({
    queryKey: ['vendor-contract', id],
    queryFn: () => thirdPartyRiskIntegration.fetchVendorContractById(id),
    enabled: !!id,
  });
}

export function useCreateVendorContract() {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contract: Parameters<typeof thirdPartyRiskIntegration.createVendorContract>[1]) =>
      thirdPartyRiskIntegration.createVendorContract(tenantId, contract),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-contracts', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-contracts', tenantId, data.vendor_id] });
      toast.success('تم إنشاء العقد بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل إنشاء العقد: ${error.message}`);
    },
  });
}

export function useUpdateVendorContract() {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof thirdPartyRiskIntegration.updateVendorContract>[1] }) =>
      thirdPartyRiskIntegration.updateVendorContract(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-contracts', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-contract', id] });
      toast.success('تم تحديث العقد بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل تحديث العقد: ${error.message}`);
    },
  });
}

export function useDeleteVendorContract() {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => thirdPartyRiskIntegration.deleteVendorContract(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-contracts', tenantId] });
      toast.success('تم حذف العقد بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل حذف العقد: ${error.message}`);
    },
  });
}

// ========== SECURITY QUESTIONNAIRES ==========

export function useVendorSecurityQuestionnaires(vendorId?: string) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['vendor-security-questionnaires', tenantId, vendorId],
    queryFn: () => thirdPartyRiskIntegration.fetchVendorSecurityQuestionnaires(tenantId, vendorId),
    enabled: !!tenantId,
  });
}

export function useCreateVendorSecurityQuestionnaire() {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionnaire: Parameters<typeof thirdPartyRiskIntegration.createVendorSecurityQuestionnaire>[1]) =>
      thirdPartyRiskIntegration.createVendorSecurityQuestionnaire(tenantId, questionnaire),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-security-questionnaires', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-security-questionnaires', tenantId, data.vendor_id] });
      toast.success('تم إنشاء الاستبيان الأمني بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل إنشاء الاستبيان الأمني: ${error.message}`);
    },
  });
}

// ========== COMPLIANCE CHECKS ==========

export function useVendorComplianceChecks(vendorId?: string) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['vendor-compliance-checks', tenantId, vendorId],
    queryFn: () => thirdPartyRiskIntegration.fetchVendorComplianceChecks(tenantId, vendorId),
    enabled: !!tenantId,
  });
}

export function useCreateVendorComplianceCheck() {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (check: Parameters<typeof thirdPartyRiskIntegration.createVendorComplianceCheck>[1]) =>
      thirdPartyRiskIntegration.createVendorComplianceCheck(tenantId, check),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-compliance-checks', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-compliance-checks', tenantId, data.vendor_id] });
      toast.success('تم إنشاء فحص الامتثال بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل إنشاء فحص الامتثال: ${error.message}`);
    },
  });
}

// ========== DOCUMENTS ==========

export function useVendorDocuments(vendorId?: string) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['vendor-documents', tenantId, vendorId],
    queryFn: () => thirdPartyRiskIntegration.fetchVendorDocuments(tenantId, vendorId),
    enabled: !!tenantId,
  });
}

export function useCreateVendorDocument() {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (document: Parameters<typeof thirdPartyRiskIntegration.createVendorDocument>[1]) =>
      thirdPartyRiskIntegration.createVendorDocument(tenantId, document),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-documents', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-documents', tenantId, data.vendor_id] });
      toast.success('تم رفع المستند بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل رفع المستند: ${error.message}`);
    },
  });
}

export function useDeleteVendorDocument() {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, vendorId }: { id: string; vendorId: string }) =>
      thirdPartyRiskIntegration.deleteVendorDocument(id),
    onSuccess: (_, { vendorId }) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-documents', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-documents', tenantId, vendorId] });
      toast.success('تم حذف المستند بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل حذف المستند: ${error.message}`);
    },
  });
}
