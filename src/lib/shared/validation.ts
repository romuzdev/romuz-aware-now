// Gate-J Part 4.1: Validation Framework - Supabase Integration

import { supabase } from '@/integrations/supabase/client';
import type { ImpactValidation, ValidationStatus } from '@/modules/awareness';

/**
 * Fetch validation records for a tenant
 */
export async function fetchValidations(
  tenantId: string,
  filters?: {
    orgUnitId?: string;
    periodYear?: number;
    periodMonth?: number;
    validationStatus?: ValidationStatus;
  }
) {
  let query = supabase
    .from('awareness_impact_validations')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.orgUnitId) {
    query = query.eq('org_unit_id', filters.orgUnitId);
  }
  if (filters?.periodYear) {
    query = query.eq('period_year', filters.periodYear);
  }
  if (filters?.periodMonth) {
    query = query.eq('period_month', filters.periodMonth);
  }
  if (filters?.validationStatus) {
    query = query.eq('validation_status', filters.validationStatus);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching validations:', error);
    throw error;
  }

  return (data || []).map(mapValidation);
}

/**
 * Fetch a single validation record
 */
export async function fetchValidationById(id: string) {
  const { data, error } = await supabase
    .from('awareness_impact_validations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching validation:', error);
    throw error;
  }

  return mapValidation(data);
}

/**
 * Upsert a validation record
 */
export async function upsertValidation(
  validation: Partial<ImpactValidation> & {
    tenantId: string;
    orgUnitId: string;
    periodYear: number;
    periodMonth: number;
  }
) {
  const payload = {
    tenant_id: validation.tenantId,
    org_unit_id: validation.orgUnitId,
    period_year: validation.periodYear,
    period_month: validation.periodMonth,
    computed_impact_score: validation.computedImpactScore,
    actual_behavior_score: validation.actualBehaviorScore,
    compliance_alignment_score: validation.complianceAlignmentScore,
    risk_incident_count: validation.riskIncidentCount,
    validation_gap: validation.validationGap,
    validation_status: validation.validationStatus || 'pending',
    confidence_gap: validation.confidenceGap,
    data_source: validation.dataSource || 'Gate-J Validation Engine',
    notes: validation.notes,
  };

  const { data, error } = await supabase
    .from('awareness_impact_validations')
    .upsert(payload, {
      onConflict: 'tenant_id,org_unit_id,period_year,period_month',
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting validation:', error);
    throw error;
  }

  return mapValidation(data);
}

/**
 * Update validation status
 */
export async function updateValidationStatus(
  id: string,
  status: ValidationStatus,
  notes?: string
) {
  const { data, error } = await supabase
    .from('awareness_impact_validations')
    .update({
      validation_status: status,
      notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating validation status:', error);
    throw error;
  }

  return mapValidation(data);
}

/**
 * Delete a validation record
 */
export async function deleteValidation(id: string) {
  const { error } = await supabase
    .from('awareness_impact_validations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting validation:', error);
    throw error;
  }
}

/**
 * Get validation statistics for a tenant
 */
export async function fetchValidationStats(tenantId: string) {
  const { data, error } = await supabase
    .from('awareness_impact_validations')
    .select('validation_status, validation_gap')
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Error fetching validation stats:', error);
    throw error;
  }

  const stats = {
    total: data.length,
    pending: data.filter((v) => v.validation_status === 'pending').length,
    validated: data.filter((v) => v.validation_status === 'validated').length,
    anomaly: data.filter((v) => v.validation_status === 'anomaly').length,
    calibrated: data.filter((v) => v.validation_status === 'calibrated').length,
    avgGap: data.length > 0 
      ? data.reduce((sum, v) => sum + (v.validation_gap || 0), 0) / data.length 
      : 0,
  };

  return stats;
}

/**
 * Map raw database record to ImpactValidation type
 */
function mapValidation(raw: any): ImpactValidation {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    orgUnitId: raw.org_unit_id,
    periodYear: raw.period_year,
    periodMonth: raw.period_month,
    computedImpactScore: parseFloat(raw.computed_impact_score),
    actualBehaviorScore: raw.actual_behavior_score 
      ? parseFloat(raw.actual_behavior_score) 
      : null,
    complianceAlignmentScore: raw.compliance_alignment_score
      ? parseFloat(raw.compliance_alignment_score)
      : null,
    riskIncidentCount: raw.risk_incident_count,
    validationGap: raw.validation_gap ? parseFloat(raw.validation_gap) : null,
    validationStatus: raw.validation_status as ValidationStatus,
    confidenceGap: raw.confidence_gap ? parseFloat(raw.confidence_gap) : null,
    dataSource: raw.data_source,
    notes: raw.notes,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}
