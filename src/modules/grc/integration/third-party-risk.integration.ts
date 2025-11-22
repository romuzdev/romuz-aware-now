/**
 * Third-Party Risk Management Integration
 * Supabase integration for third-party vendor risk management
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ThirdPartyVendor = Database['public']['Tables']['grc_third_party_vendors']['Row'];
type ThirdPartyVendorInsert = Database['public']['Tables']['grc_third_party_vendors']['Insert'];
type ThirdPartyVendorUpdate = Database['public']['Tables']['grc_third_party_vendors']['Update'];

type ThirdPartyRiskAssessment = Database['public']['Tables']['grc_third_party_risk_assessments']['Row'];
type ThirdPartyRiskAssessmentInsert = Database['public']['Tables']['grc_third_party_risk_assessments']['Insert'];
type ThirdPartyRiskAssessmentUpdate = Database['public']['Tables']['grc_third_party_risk_assessments']['Update'];

type ThirdPartyDueDiligence = Database['public']['Tables']['grc_third_party_due_diligence']['Row'];
type ThirdPartyDueDiligenceInsert = Database['public']['Tables']['grc_third_party_due_diligence']['Insert'];
type ThirdPartyDueDiligenceUpdate = Database['public']['Tables']['grc_third_party_due_diligence']['Update'];

/**
 * Third-Party Vendor Operations
 */

export async function fetchThirdPartyVendors(tenantId: string): Promise<ThirdPartyVendor[]> {
  const { data, error } = await supabase
    .from('grc_third_party_vendors')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchThirdPartyVendorById(id: string): Promise<ThirdPartyVendor> {
  const { data, error } = await supabase
    .from('grc_third_party_vendors')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createThirdPartyVendor(
  vendor: ThirdPartyVendorInsert
): Promise<ThirdPartyVendor> {
  const { data, error } = await supabase
    .from('grc_third_party_vendors')
    .insert(vendor)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateThirdPartyVendor(
  id: string,
  updates: ThirdPartyVendorUpdate
): Promise<ThirdPartyVendor> {
  const { data, error } = await supabase
    .from('grc_third_party_vendors')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteThirdPartyVendor(id: string): Promise<void> {
  const { error } = await supabase
    .from('grc_third_party_vendors')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Third-Party Risk Assessment Operations
 */

export async function fetchThirdPartyRiskAssessments(
  tenantId: string
): Promise<ThirdPartyRiskAssessment[]> {
  const { data, error } = await supabase
    .from('grc_third_party_risk_assessments')
    .select('*, vendor:grc_third_party_vendors(*)')
    .eq('tenant_id', tenantId)
    .order('assessment_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchThirdPartyRiskAssessmentsByVendor(
  vendorId: string
): Promise<ThirdPartyRiskAssessment[]> {
  const { data, error } = await supabase
    .from('grc_third_party_risk_assessments')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('assessment_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createThirdPartyRiskAssessment(
  assessment: ThirdPartyRiskAssessmentInsert
): Promise<ThirdPartyRiskAssessment> {
  const { data, error } = await supabase
    .from('grc_third_party_risk_assessments')
    .insert(assessment)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateThirdPartyRiskAssessment(
  id: string,
  updates: ThirdPartyRiskAssessmentUpdate
): Promise<ThirdPartyRiskAssessment> {
  const { data, error } = await supabase
    .from('grc_third_party_risk_assessments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteThirdPartyRiskAssessment(id: string): Promise<void> {
  const { error } = await supabase
    .from('grc_third_party_risk_assessments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Third-Party Due Diligence Operations
 */

export async function fetchThirdPartyDueDiligence(
  vendorId: string
): Promise<ThirdPartyDueDiligence[]> {
  const { data, error } = await supabase
    .from('grc_third_party_due_diligence')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createThirdPartyDueDiligence(
  document: ThirdPartyDueDiligenceInsert
): Promise<ThirdPartyDueDiligence> {
  const { data, error } = await supabase
    .from('grc_third_party_due_diligence')
    .insert(document)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateThirdPartyDueDiligence(
  id: string,
  updates: ThirdPartyDueDiligenceUpdate
): Promise<ThirdPartyDueDiligence> {
  const { data, error } = await supabase
    .from('grc_third_party_due_diligence')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteThirdPartyDueDiligence(id: string): Promise<void> {
  const { error } = await supabase
    .from('grc_third_party_due_diligence')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Analytics & Reporting
 */

export interface VendorRiskSummary {
  totalVendors: number;
  activeVendors: number;
  highRiskVendors: number;
  criticalVendors: number;
  averageRiskScore: number;
  expiringSoon: number;
}

export async function fetchVendorRiskSummary(
  tenantId: string
): Promise<VendorRiskSummary> {
  // Fetch all vendors
  const { data: vendors, error: vendorsError } = await supabase
    .from('grc_third_party_vendors')
    .select('*')
    .eq('tenant_id', tenantId);

  if (vendorsError) throw vendorsError;

  // Fetch latest assessments
  const { data: assessments, error: assessmentsError } = await supabase
    .from('grc_third_party_risk_assessments')
    .select('vendor_id, overall_risk_score, risk_rating')
    .eq('tenant_id', tenantId)
    .eq('status', 'completed')
    .order('assessment_date', { ascending: false });

  if (assessmentsError) throw assessmentsError;

  const activeVendors = vendors?.filter((v) => v.status === 'active') || [];
  const highRiskVendors =
    vendors?.filter((v) => v.criticality === 'high').length || 0;
  const criticalVendors =
    vendors?.filter((v) => v.criticality === 'critical').length || 0;

  // Calculate average risk score
  const scores = assessments?.map((a) => a.overall_risk_score || 0) || [];
  const averageRiskScore =
    scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;

  // Count expiring documents
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const { data: expiringDocs, error: expiringError } = await supabase
    .from('grc_third_party_due_diligence')
    .select('id')
    .eq('tenant_id', tenantId)
    .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
    .eq('status', 'valid');

  if (expiringError) throw expiringError;

  return {
    totalVendors: vendors?.length || 0,
    activeVendors: activeVendors.length,
    highRiskVendors,
    criticalVendors,
    averageRiskScore: Math.round(averageRiskScore),
    expiringSoon: expiringDocs?.length || 0,
  };
}
