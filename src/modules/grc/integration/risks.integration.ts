/**
 * GRC Module - Risk Management Integration
 * Supabase integration layer for Risk Register, Assessments, and Treatment Plans
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  Risk,
  RiskAssessment,
  RiskTreatmentPlan,
  RiskWithDetails,
  CreateRiskInput,
  UpdateRiskInput,
  CreateRiskAssessmentInput,
  CreateTreatmentPlanInput,
  RiskFilters,
  RiskStatistics,
} from '../types/risk.types';

/**
 * Fetch all risks for current tenant with optional filters
 */
export async function fetchRisks(filters?: RiskFilters): Promise<Risk[]> {
  let query = supabase
    .from('grc_risks')
    .select('*')
    .order(filters?.sortBy || 'created_at', { ascending: filters?.sortDir === 'asc' });

  // Show only active risks by default unless explicitly overridden
  const isActive = filters?.is_active ?? true;
  query = query.eq('is_active', isActive);

  // Apply filters
  if (filters?.q) {
    query = query.or(`risk_code.ilike.%${filters.q}%,risk_title.ilike.%${filters.q}%,risk_description.ilike.%${filters.q}%`);
  }
  if (filters?.risk_category) {
    query = query.eq('risk_category', filters.risk_category);
  }
  if (filters?.risk_status) {
    query = query.eq('risk_status', filters.risk_status);
  }
  if (filters?.risk_owner_id) {
    query = query.eq('risk_owner_id', filters.risk_owner_id);
  }
  if (filters?.treatment_strategy) {
    query = query.eq('treatment_strategy', filters.treatment_strategy);
  }
  if (filters?.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags);
  }
  if (filters?.from) {
    query = query.gte('identified_date', filters.from);
  }
  if (filters?.to) {
    query = query.lte('identified_date', filters.to);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching risks:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch single risk by ID with details
 */
export async function fetchRiskById(riskId: string): Promise<RiskWithDetails | null> {
  const { data: risk, error: riskError } = await supabase
    .from('grc_risks')
    .select('*')
    .eq('id', riskId)
    .maybeSingle();

  if (riskError) {
    console.error('Error fetching risk:', riskError);
    throw riskError;
  }

  if (!risk) return null;

  // Fetch related assessments
  const { data: assessments } = await supabase
    .from('grc_risk_assessments')
    .select('*')
    .eq('risk_id', riskId)
    .order('assessment_date', { ascending: false });

  // Fetch related treatment plans
  const { data: treatmentPlans } = await supabase
    .from('grc_risk_treatment_plans')
    .select('*')
    .eq('risk_id', riskId)
    .order('created_at', { ascending: false });

  return {
    ...risk,
    risk_level: getRiskLevel(risk.inherent_risk_score),
    current_risk_level: risk.residual_risk_score ? getRiskLevel(risk.residual_risk_score) : undefined,
    assessments: assessments || [],
    treatment_plans: treatmentPlans || [],
    latest_assessment: assessments?.[0],
    active_treatment_plan: treatmentPlans?.find(p => p.plan_status === 'in_progress'),
  } as RiskWithDetails;
}

/**
 * Create new risk
 */
export async function createRisk(input: CreateRiskInput): Promise<Risk> {
  // Ensure we include tenant context to satisfy RLS
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error('Auth error when creating risk:', authError);
    throw authError;
  }
  const userId = authData.user?.id;

  // Fetch current tenant for the authenticated user (first/primary tenant)
  const { data: tenantRows, error: tenantError } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', userId as string)
    .limit(1);

  if (tenantError) {
    console.error('Error fetching tenant for createRisk:', tenantError);
    throw tenantError;
  }

  const tenantId = tenantRows?.[0]?.tenant_id;
  if (!tenantId) {
    const err = new Error('Tenant context missing. Cannot create risk.');
    console.error(err.message);
    throw err;
  }

  const { data, error } = await supabase
    .from('grc_risks')
    .insert({
      ...input,
      tenant_id: tenantId,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating risk:', error);
    throw error;
  }

  return data;
}

/**
 * Update existing risk
 */
export async function updateRisk(riskId: string, input: UpdateRiskInput): Promise<Risk> {
  const { data, error } = await supabase
    .from('grc_risks')
    .update({
      ...input,
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .eq('id', riskId)
    .select()
    .single();

  if (error) {
    console.error('Error updating risk:', error);
    throw error;
  }

  return data;
}

/**
 * Delete risk (soft delete by setting is_active = false)
 */
export async function deleteRisk(riskId: string): Promise<void> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error('Auth error when deleting risk:', authError);
    throw authError;
  }
  const userId = authData.user?.id;

  const { data: tenantRows, error: tenantError } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', userId as string)
    .limit(1);

  if (tenantError) {
    console.error('Error fetching tenant for deleteRisk:', tenantError);
    throw tenantError;
  }

  const tenantId = tenantRows?.[0]?.tenant_id;
  if (!tenantId) {
    const err = new Error('Tenant context missing. Cannot delete risk.');
    console.error(err.message);
    throw err;
  }

  const { data, error } = await supabase
    .from('grc_risks')
    .update({ is_active: false, updated_by: userId })
    .eq('id', riskId)
    .eq('tenant_id', tenantId)
    .select('id, is_active')
    .maybeSingle();

  if (error) {
    console.error('Error deleting risk:', error);
    throw error;
  }

  if (!data || data.is_active !== false) {
    throw new Error('لم يتم حذف المخاطرة: تحقق من الصلاحيات أو وجود السجل');
  }
}

/**
 * Create risk assessment
 */
export async function createRiskAssessment(input: CreateRiskAssessmentInput): Promise<RiskAssessment> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error('Auth error when creating risk assessment:', authError);
    throw authError;
  }
  const userId = authData.user?.id;

  const { data: tenantRows, error: tenantError } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', userId as string)
    .limit(1);

  if (tenantError) {
    console.error('Error fetching tenant for createRiskAssessment:', tenantError);
    throw tenantError;
  }

  const tenantId = tenantRows?.[0]?.tenant_id;
  if (!tenantId) {
    const err = new Error('Tenant context missing. Cannot create risk assessment.');
    console.error(err.message);
    throw err;
  }

  const { data, error } = await supabase
    .from('grc_risk_assessments')
    .insert({
      ...input,
      tenant_id: tenantId,
      assessed_by: userId,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating risk assessment:', error);
    throw error;
  }

  return data;
}

/**
 * Create treatment plan
 */
export async function createTreatmentPlan(input: CreateTreatmentPlanInput): Promise<RiskTreatmentPlan> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error('Auth error when creating treatment plan:', authError);
    throw authError;
  }
  const userId = authData.user?.id;

  const { data: tenantRows, error: tenantError } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', userId as string)
    .limit(1);

  if (tenantError) {
    console.error('Error fetching tenant for createTreatmentPlan:', tenantError);
    throw tenantError;
  }

  const tenantId = tenantRows?.[0]?.tenant_id;
  if (!tenantId) {
    const err = new Error('Tenant context missing. Cannot create treatment plan.');
    console.error(err.message);
    throw err;
  }

  const { data, error } = await supabase
    .from('grc_risk_treatment_plans')
    .insert({
      ...input,
      tenant_id: tenantId,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating treatment plan:', error);
    throw error;
  }

  return data;
}

/**
 * Update treatment plan
 */
export async function updateTreatmentPlan(
  planId: string,
  updates: Partial<RiskTreatmentPlan>
): Promise<RiskTreatmentPlan> {
  const { data, error } = await supabase
    .from('grc_risk_treatment_plans')
    .update({
      ...updates,
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .eq('id', planId)
    .select()
    .single();

  if (error) {
    console.error('Error updating treatment plan:', error);
    throw error;
  }

  return data;
}

/**
 * Fetch risk statistics for dashboard
 */
export async function fetchRiskStatistics(): Promise<RiskStatistics> {
  const { data: risks, error } = await supabase
    .from('grc_risks')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching risk statistics:', error);
    throw error;
  }

  const stats: RiskStatistics = {
    total_risks: risks.length,
    active_risks: risks.filter(r => r.risk_status !== 'closed').length,
    by_status: {
      identified: 0,
      assessed: 0,
      treated: 0,
      monitored: 0,
      closed: 0,
    },
    by_category: {
      strategic: 0,
      operational: 0,
      financial: 0,
      compliance: 0,
      reputational: 0,
      technology: 0,
    },
    by_level: {
      very_low: 0,
      low: 0,
      medium: 0,
      high: 0,
      very_high: 0,
    },
    average_inherent_score: 0,
    average_residual_score: 0,
    risks_needing_review: 0,
    high_critical_risks: 0,
  };

  let totalInherent = 0;
  let totalResidual = 0;
  let residualCount = 0;

  risks.forEach(risk => {
    // Count by status
    if (risk.risk_status in stats.by_status) {
      stats.by_status[risk.risk_status as keyof typeof stats.by_status]++;
    }

    // Count by category
    if (risk.risk_category in stats.by_category) {
      stats.by_category[risk.risk_category as keyof typeof stats.by_category]++;
    }

    // Count by level
    const level = getRiskLevel(risk.inherent_risk_score);
    if (level in stats.by_level) {
      stats.by_level[level as keyof typeof stats.by_level]++;
    }

    // Calculate averages
    totalInherent += risk.inherent_risk_score;
    if (risk.residual_risk_score) {
      totalResidual += risk.residual_risk_score;
      residualCount++;
    }

    // Count high/critical risks
    if (level === 'high' || level === 'very_high') {
      stats.high_critical_risks++;
    }

    // Count risks needing review
    if (risk.next_review_date && new Date(risk.next_review_date) <= new Date()) {
      stats.risks_needing_review++;
    }
  });

  stats.average_inherent_score = risks.length > 0 ? totalInherent / risks.length : 0;
  stats.average_residual_score = residualCount > 0 ? totalResidual / residualCount : 0;

  return stats;
}

/**
 * Helper: Get risk level from score (1-25 scale)
 */
function getRiskLevel(score: number): 'very_low' | 'low' | 'medium' | 'high' | 'very_high' {
  if (score <= 4) return 'very_low';
  if (score <= 8) return 'low';
  if (score <= 12) return 'medium';
  if (score <= 16) return 'high';
  return 'very_high';
}
