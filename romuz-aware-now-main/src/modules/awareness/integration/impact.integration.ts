// Gate-J: Awareness Impact Engine - Integration Layer
import { supabase } from '@/integrations/supabase/client';
import type { ImpactScore, ImpactWeight } from '../types';

/**
 * Fetch all impact scores for a tenant
 */
export async function fetchImpactScores(
  tenantId: string,
  filters?: {
    orgUnitId?: string;
    periodYear?: number;
    periodMonth?: number;
  }
) {
  let query = supabase
    .from('awareness_impact_scores')
    .select('*')
    .eq('tenant_id', tenantId);

  if (filters?.orgUnitId) {
    query = query.eq('org_unit_id', filters.orgUnitId);
  }
  if (filters?.periodYear) {
    query = query.eq('period_year', filters.periodYear);
  }
  if (filters?.periodMonth) {
    query = query.eq('period_month', filters.periodMonth);
  }

  const { data, error } = await query.order('period_year', { ascending: false })
    .order('period_month', { ascending: false });

  if (error) throw error;
  return data?.map(mapImpactScore) || [];
}

/**
 * Fetch impact scores via view (with org unit names when available)
 */
export async function fetchImpactScoresView(
  tenantId: string,
  filters?: {
    orgUnitId?: string;
    periodYear?: number;
    periodMonth?: number;
  }
) {
  let query = supabase
    .from('awareness_impact_scores_view')
    .select('*')
    .eq('tenant_id', tenantId);

  if (filters?.orgUnitId) {
    query = query.eq('org_unit_id', filters.orgUnitId);
  }
  if (filters?.periodYear) {
    query = query.eq('period_year', filters.periodYear);
  }
  if (filters?.periodMonth) {
    query = query.eq('period_month', filters.periodMonth);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Fetch active impact weights for a tenant
 */
export async function fetchActiveImpactWeights(tenantId: string) {
  const { data, error } = await supabase
    .from('awareness_impact_weights')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? mapImpactWeight(data) : null;
}

/**
 * Fetch all impact weights for a tenant
 */
export async function fetchImpactWeights(tenantId: string) {
  const { data, error } = await supabase
    .from('awareness_impact_weights')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('version', { ascending: false });

  if (error) throw error;
  return data?.map(mapImpactWeight) || [];
}

/**
 * Create or update impact weight configuration
 */
export async function upsertImpactWeight(weight: Partial<ImpactWeight>) {
  const payload = {
    tenant_id: weight.tenantId,
    version: weight.version || 1,
    is_active: weight.isActive ?? true,
    engagement_weight: weight.engagementWeight || 0.25,
    completion_weight: weight.completionWeight || 0.25,
    feedback_quality_weight: weight.feedbackQualityWeight || 0.25,
    compliance_linkage_weight: weight.complianceLinkageWeight || 0.25,
    label: weight.label || null,
    notes: weight.notes || null,
  };

  const { data, error } = await supabase
    .from('awareness_impact_weights')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  return mapImpactWeight(data);
}

/**
 * Deactivate all weights for a tenant
 */
export async function deactivateAllWeights(tenantId: string) {
  const { error } = await supabase
    .from('awareness_impact_weights')
    .update({ is_active: false })
    .eq('tenant_id', tenantId);

  if (error) throw error;
}

/**
 * Map raw database row to ImpactScore type
 */
function mapImpactScore(raw: any): ImpactScore {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    orgUnitId: raw.org_unit_id,
    periodYear: raw.period_year,
    periodMonth: raw.period_month,
    engagementScore: parseFloat(raw.engagement_score),
    completionScore: parseFloat(raw.completion_score),
    feedbackQualityScore: parseFloat(raw.feedback_quality_score),
    complianceLinkageScore: parseFloat(raw.compliance_linkage_score),
    impactScore: parseFloat(raw.impact_score),
    riskLevel: raw.risk_level,
    confidenceLevel: parseFloat(raw.confidence_level),
    dataSource: raw.data_source,
    notes: raw.notes,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

/**
 * Map raw database row to ImpactWeight type
 */
function mapImpactWeight(raw: any): ImpactWeight {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    version: raw.version,
    isActive: raw.is_active,
    engagementWeight: parseFloat(raw.engagement_weight),
    completionWeight: parseFloat(raw.completion_weight),
    feedbackQualityWeight: parseFloat(raw.feedback_quality_weight),
    complianceLinkageWeight: parseFloat(raw.compliance_linkage_weight),
    label: raw.label,
    notes: raw.notes,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}
