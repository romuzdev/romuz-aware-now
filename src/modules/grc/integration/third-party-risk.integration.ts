/**
 * Third-Party Risk Management Integration
 * Handles all Supabase operations for vendors, risk assessments, and contracts
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Type definitions
type Vendor = Database['public']['Tables']['vendors']['Row'];
type VendorInsert = Database['public']['Tables']['vendors']['Insert'];
type VendorUpdate = Database['public']['Tables']['vendors']['Update'];

type VendorContact = Database['public']['Tables']['vendor_contacts']['Row'];
type VendorContactInsert = Database['public']['Tables']['vendor_contacts']['Insert'];

type VendorRiskAssessment = Database['public']['Tables']['vendor_risk_assessments']['Row'];
type VendorRiskAssessmentInsert = Database['public']['Tables']['vendor_risk_assessments']['Insert'];
type VendorRiskAssessmentUpdate = Database['public']['Tables']['vendor_risk_assessments']['Update'];

type VendorContract = Database['public']['Tables']['vendor_contracts']['Row'];
type VendorContractInsert = Database['public']['Tables']['vendor_contracts']['Insert'];
type VendorContractUpdate = Database['public']['Tables']['vendor_contracts']['Update'];

type VendorSecurityQuestionnaire = Database['public']['Tables']['vendor_security_questionnaires']['Row'];
type VendorSecurityQuestionnaireInsert = Database['public']['Tables']['vendor_security_questionnaires']['Insert'];

type VendorComplianceCheck = Database['public']['Tables']['vendor_compliance_checks']['Row'];
type VendorComplianceCheckInsert = Database['public']['Tables']['vendor_compliance_checks']['Insert'];

type VendorDocument = Database['public']['Tables']['vendor_documents']['Row'];
type VendorDocumentInsert = Database['public']['Tables']['vendor_documents']['Insert'];

// ========== VENDORS ==========

export async function fetchVendors(tenantId: string): Promise<Vendor[]> {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchVendorById(id: string): Promise<Vendor> {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createVendor(
  tenantId: string,
  vendor: Omit<VendorInsert, 'tenant_id'>
): Promise<Vendor> {
  const { data, error } = await supabase
    .from('vendors')
    .insert({ ...vendor, tenant_id: tenantId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateVendor(
  id: string,
  updates: VendorUpdate
): Promise<Vendor> {
  const { data, error } = await supabase
    .from('vendors')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteVendor(id: string): Promise<void> {
  const { error } = await supabase
    .from('vendors')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ========== VENDOR CONTACTS ==========

export async function fetchVendorContacts(vendorId: string): Promise<VendorContact[]> {
  const { data, error } = await supabase
    .from('vendor_contacts')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('is_primary', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createVendorContact(
  tenantId: string,
  contact: Omit<VendorContactInsert, 'tenant_id'>
): Promise<VendorContact> {
  const { data, error } = await supabase
    .from('vendor_contacts')
    .insert({ ...contact, tenant_id: tenantId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteVendorContact(id: string): Promise<void> {
  const { error } = await supabase
    .from('vendor_contacts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ========== RISK ASSESSMENTS ==========

export async function fetchVendorRiskAssessments(
  tenantId: string,
  vendorId?: string
): Promise<VendorRiskAssessment[]> {
  let query = supabase
    .from('vendor_risk_assessments')
    .select('*')
    .eq('tenant_id', tenantId);

  if (vendorId) {
    query = query.eq('vendor_id', vendorId);
  }

  const { data, error } = await query.order('assessment_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchVendorRiskAssessmentById(id: string): Promise<VendorRiskAssessment> {
  const { data, error } = await supabase
    .from('vendor_risk_assessments')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createVendorRiskAssessment(
  tenantId: string,
  assessment: Omit<VendorRiskAssessmentInsert, 'tenant_id'>
): Promise<VendorRiskAssessment> {
  const { data, error } = await supabase
    .from('vendor_risk_assessments')
    .insert({ ...assessment, tenant_id: tenantId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateVendorRiskAssessment(
  id: string,
  updates: VendorRiskAssessmentUpdate
): Promise<VendorRiskAssessment> {
  const { data, error } = await supabase
    .from('vendor_risk_assessments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteVendorRiskAssessment(id: string): Promise<void> {
  const { error } = await supabase
    .from('vendor_risk_assessments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ========== CONTRACTS ==========

export async function fetchVendorContracts(
  tenantId: string,
  vendorId?: string
): Promise<VendorContract[]> {
  let query = supabase
    .from('vendor_contracts')
    .select('*')
    .eq('tenant_id', tenantId);

  if (vendorId) {
    query = query.eq('vendor_id', vendorId);
  }

  const { data, error } = await query.order('start_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchVendorContractById(id: string): Promise<VendorContract> {
  const { data, error } = await supabase
    .from('vendor_contracts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createVendorContract(
  tenantId: string,
  contract: Omit<VendorContractInsert, 'tenant_id'>
): Promise<VendorContract> {
  const { data, error } = await supabase
    .from('vendor_contracts')
    .insert({ ...contract, tenant_id: tenantId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateVendorContract(
  id: string,
  updates: VendorContractUpdate
): Promise<VendorContract> {
  const { data, error } = await supabase
    .from('vendor_contracts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteVendorContract(id: string): Promise<void> {
  const { error } = await supabase
    .from('vendor_contracts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ========== SECURITY QUESTIONNAIRES ==========

export async function fetchVendorSecurityQuestionnaires(
  tenantId: string,
  vendorId?: string
): Promise<VendorSecurityQuestionnaire[]> {
  let query = supabase
    .from('vendor_security_questionnaires')
    .select('*')
    .eq('tenant_id', tenantId);

  if (vendorId) {
    query = query.eq('vendor_id', vendorId);
  }

  const { data, error } = await query.order('submitted_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createVendorSecurityQuestionnaire(
  tenantId: string,
  questionnaire: Omit<VendorSecurityQuestionnaireInsert, 'tenant_id'>
): Promise<VendorSecurityQuestionnaire> {
  const { data, error } = await supabase
    .from('vendor_security_questionnaires')
    .insert({ ...questionnaire, tenant_id: tenantId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ========== COMPLIANCE CHECKS ==========

export async function fetchVendorComplianceChecks(
  tenantId: string,
  vendorId?: string
): Promise<VendorComplianceCheck[]> {
  let query = supabase
    .from('vendor_compliance_checks')
    .select('*')
    .eq('tenant_id', tenantId);

  if (vendorId) {
    query = query.eq('vendor_id', vendorId);
  }

  const { data, error } = await query.order('check_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createVendorComplianceCheck(
  tenantId: string,
  check: Omit<VendorComplianceCheckInsert, 'tenant_id'>
): Promise<VendorComplianceCheck> {
  const { data, error } = await supabase
    .from('vendor_compliance_checks')
    .insert({ ...check, tenant_id: tenantId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ========== DOCUMENTS ==========

export async function fetchVendorDocuments(
  tenantId: string,
  vendorId?: string
): Promise<VendorDocument[]> {
  let query = supabase
    .from('vendor_documents')
    .select('*')
    .eq('tenant_id', tenantId);

  if (vendorId) {
    query = query.eq('vendor_id', vendorId);
  }

  const { data, error } = await query.order('uploaded_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createVendorDocument(
  tenantId: string,
  document: Omit<VendorDocumentInsert, 'tenant_id'>
): Promise<VendorDocument> {
  const { data, error } = await supabase
    .from('vendor_documents')
    .insert({ ...document, tenant_id: tenantId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteVendorDocument(id: string): Promise<void> {
  const { error } = await supabase
    .from('vendor_documents')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
