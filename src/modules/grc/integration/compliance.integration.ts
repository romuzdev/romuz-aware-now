/**
 * GRC Compliance Integration
 * Supabase integration for compliance frameworks, requirements, and gaps
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  ComplianceFramework,
  ComplianceFrameworkInsert,
  ComplianceFrameworkUpdate,
  ComplianceFrameworkFilters,
  ComplianceRequirement,
  ComplianceRequirementInsert,
  ComplianceRequirementUpdate,
  ComplianceRequirementFilters,
  ComplianceGap,
  ComplianceGapInsert,
  ComplianceGapUpdate,
  ComplianceGapFilters,
  ComplianceStatistics,
} from '../types/compliance.types';

// ============================================================================
// Compliance Frameworks
// ============================================================================

export async function getComplianceFrameworks(filters: ComplianceFrameworkFilters = {}) {
  let query = supabase
    .from('grc_compliance_frameworks')
    .select('*');

  if (filters.q) {
    query = query.or(`framework_code.ilike.%${filters.q}%,framework_name.ilike.%${filters.q}%,framework_name_ar.ilike.%${filters.q}%`);
  }

  if (filters.framework_type) {
    query = query.eq('framework_type', filters.framework_type);
  }

  if (filters.framework_status) {
    query = query.eq('framework_status', filters.framework_status);
  }

  const sortBy = filters.sortBy || 'created_at';
  const sortDir = filters.sortDir || 'desc';
  query = query.order(sortBy, { ascending: sortDir === 'asc' });

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as ComplianceFramework[];
}

export async function getComplianceFrameworkById(id: string) {
  const { data, error } = await supabase
    .from('grc_compliance_frameworks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as ComplianceFramework;
}

export async function createComplianceFramework(framework: ComplianceFrameworkInsert) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error('Auth error when creating compliance framework:', authError);
    throw authError;
  }
  const userId = authData.user?.id;

  const { data: tenantRows, error: tenantError } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', userId as string)
    .limit(1);

  if (tenantError) {
    console.error('Error fetching tenant for createComplianceFramework:', tenantError);
    throw tenantError;
  }

  const tenantId = tenantRows?.[0]?.tenant_id;
  if (!tenantId) {
    const err = new Error('Tenant context missing. Cannot create compliance framework.');
    console.error(err.message);
    throw err;
  }

  const { data, error } = await supabase
    .from('grc_compliance_frameworks')
    .insert({
      ...framework,
      tenant_id: tenantId,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ComplianceFramework;
}

export async function updateComplianceFramework(id: string, updates: ComplianceFrameworkUpdate) {
  const { data, error } = await supabase
    .from('grc_compliance_frameworks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ComplianceFramework;
}

export async function deleteComplianceFramework(id: string) {
  const { error } = await supabase
    .from('grc_compliance_frameworks')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================================
// Compliance Requirements
// ============================================================================

export async function getComplianceRequirements(filters: ComplianceRequirementFilters = {}) {
  let query = supabase
    .from('grc_compliance_requirements')
    .select('*');

  if (filters.q) {
    query = query.or(`requirement_code.ilike.%${filters.q}%,requirement_title.ilike.%${filters.q}%,requirement_title_ar.ilike.%${filters.q}%`);
  }

  if (filters.framework_id) {
    query = query.eq('framework_id', filters.framework_id);
  }

  if (filters.compliance_status) {
    query = query.eq('compliance_status', filters.compliance_status);
  }

  if (filters.priority) {
    query = query.eq('priority', filters.priority);
  }

  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  if (filters.domain) {
    query = query.eq('domain', filters.domain);
  }

  const sortBy = filters.sortBy || 'created_at';
  const sortDir = filters.sortDir || 'desc';
  query = query.order(sortBy, { ascending: sortDir === 'asc' });

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as ComplianceRequirement[];
}

export async function getComplianceRequirementById(id: string) {
  const { data, error } = await supabase
    .from('grc_compliance_requirements')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as ComplianceRequirement;
}

export async function createComplianceRequirement(requirement: ComplianceRequirementInsert) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error('Auth error when creating compliance requirement:', authError);
    throw authError;
  }
  const userId = authData.user?.id;

  const { data: tenantRows, error: tenantError } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', userId as string)
    .limit(1);

  if (tenantError) {
    console.error('Error fetching tenant for createComplianceRequirement:', tenantError);
    throw tenantError;
  }

  const tenantId = tenantRows?.[0]?.tenant_id;
  if (!tenantId) {
    const err = new Error('Tenant context missing. Cannot create compliance requirement.');
    console.error(err.message);
    throw err;
  }

  const { data, error } = await supabase
    .from('grc_compliance_requirements')
    .insert({
      ...requirement,
      tenant_id: tenantId,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ComplianceRequirement;
}

export async function updateComplianceRequirement(id: string, updates: ComplianceRequirementUpdate) {
  const { data, error } = await supabase
    .from('grc_compliance_requirements')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ComplianceRequirement;
}

export async function deleteComplianceRequirement(id: string) {
  const { error } = await supabase
    .from('grc_compliance_requirements')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================================
// Compliance Gaps
// ============================================================================

export async function getComplianceGaps(filters: ComplianceGapFilters = {}) {
  let query = supabase
    .from('grc_compliance_gaps')
    .select('*');

  if (filters.q) {
    query = query.or(`gap_title.ilike.%${filters.q}%,gap_title_ar.ilike.%${filters.q}%,gap_description.ilike.%${filters.q}%`);
  }

  if (filters.requirement_id) {
    query = query.eq('requirement_id', filters.requirement_id);
  }

  if (filters.gap_status) {
    query = query.eq('gap_status', filters.gap_status);
  }

  if (filters.severity) {
    query = query.eq('severity', filters.severity);
  }

  if (filters.gap_type) {
    query = query.eq('gap_type', filters.gap_type);
  }

  const sortBy = filters.sortBy || 'identified_date';
  const sortDir = filters.sortDir || 'desc';
  query = query.order(sortBy, { ascending: sortDir === 'asc' });

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as ComplianceGap[];
}

export async function getComplianceGapById(id: string) {
  const { data, error } = await supabase
    .from('grc_compliance_gaps')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as ComplianceGap;
}

export async function createComplianceGap(gap: ComplianceGapInsert) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error('Auth error when creating compliance gap:', authError);
    throw authError;
  }
  const userId = authData.user?.id;

  const { data: tenantRows, error: tenantError } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', userId as string)
    .limit(1);

  if (tenantError) {
    console.error('Error fetching tenant for createComplianceGap:', tenantError);
    throw tenantError;
  }

  const tenantId = tenantRows?.[0]?.tenant_id;
  if (!tenantId) {
    const err = new Error('Tenant context missing. Cannot create compliance gap.');
    console.error(err.message);
    throw err;
  }

  const { data, error } = await supabase
    .from('grc_compliance_gaps')
    .insert({
      ...gap,
      tenant_id: tenantId,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ComplianceGap;
}

export async function updateComplianceGap(id: string, updates: ComplianceGapUpdate) {
  const { data, error } = await supabase
    .from('grc_compliance_gaps')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ComplianceGap;
}

export async function deleteComplianceGap(id: string) {
  const { error } = await supabase
    .from('grc_compliance_gaps')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================================
// Statistics
// ============================================================================

export async function getComplianceStatistics(): Promise<ComplianceStatistics> {
  const [frameworks, requirements, gaps] = await Promise.all([
    supabase.from('grc_compliance_frameworks').select('framework_status, overall_compliance_score'),
    supabase.from('grc_compliance_requirements').select('compliance_status'),
    supabase.from('grc_compliance_gaps').select('severity, gap_status'),
  ]);

  if (frameworks.error) throw frameworks.error;
  if (requirements.error) throw requirements.error;
  if (gaps.error) throw gaps.error;

  const activeFrameworks = frameworks.data.filter(f => f.framework_status === 'active').length;
  const avgCompliance = frameworks.data.length > 0
    ? frameworks.data.reduce((sum, f) => sum + (f.overall_compliance_score || 0), 0) / frameworks.data.length
    : 0;

  const compliantReqs = requirements.data.filter(r => r.compliance_status === 'compliant').length;
  const nonCompliantReqs = requirements.data.filter(r => r.compliance_status === 'non_compliant').length;

  const criticalGaps = gaps.data.filter(g => g.severity === 'critical').length;
  const openGaps = gaps.data.filter(g => g.gap_status === 'open').length;

  return {
    total_frameworks: frameworks.data.length,
    active_frameworks: activeFrameworks,
    avg_compliance_score: Math.round(avgCompliance * 100) / 100,
    total_requirements: requirements.data.length,
    compliant_requirements: compliantReqs,
    non_compliant_requirements: nonCompliantReqs,
    total_gaps: gaps.data.length,
    critical_gaps: criticalGaps,
    open_gaps: openGaps,
  };
}
