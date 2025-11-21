/**
 * GRC Audits Integration
 * Supabase integration for audits and audit findings
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  Audit,
  AuditInsert,
  AuditUpdate,
  AuditFilters,
  AuditFinding,
  AuditFindingInsert,
  AuditFindingUpdate,
  AuditFindingFilters,
  AuditStatistics,
} from '../types/audit.types';
import {
  logAuditCreate,
  logAuditRead,
  logAuditUpdate,
  logAuditDelete,
  logFindingAdd,
  logFindingResolve,
} from '@/lib/audit/grc-audit-logger';

// ============================================================================
// Audits
// ============================================================================

export async function getAudits(filters: AuditFilters = {}) {
  let query = supabase
    .from('grc_audits')
    .select('*');

  if (filters.q) {
    query = query.or(`audit_code.ilike.%${filters.q}%,audit_title.ilike.%${filters.q}%,audit_title_ar.ilike.%${filters.q}%`);
  }

  if (filters.audit_type) {
    query = query.eq('audit_type', filters.audit_type);
  }

  if (filters.audit_status) {
    query = query.eq('audit_status', filters.audit_status);
  }

  if (filters.framework_id) {
    query = query.eq('framework_id', filters.framework_id);
  }

  if (filters.lead_auditor_id) {
    query = query.eq('lead_auditor_id', filters.lead_auditor_id);
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
  return data as Audit[];
}

export async function getAuditById(id: string) {
  const { data, error } = await supabase
    .from('grc_audits')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  
  // Log read action
  await logAuditRead(id, {
    audit_code: data.audit_code,
    audit_title: data.audit_title,
  });
  
  return data as Audit;
}

export async function createAudit(audit: AuditInsert) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error('Auth error when creating audit:', authError);
    throw authError;
  }
  const userId = authData.user?.id;

  const { data: tenantRows, error: tenantError } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', userId as string)
    .limit(1);

  if (tenantError) {
    console.error('Error fetching tenant for createAudit:', tenantError);
    throw tenantError;
  }

  const tenantId = tenantRows?.[0]?.tenant_id;
  if (!tenantId) {
    const err = new Error('Tenant context missing. Cannot create audit.');
    console.error(err.message);
    throw err;
  }

  const { data, error } = await supabase
    .from('grc_audits')
    .insert({
      ...audit,
      tenant_id: tenantId,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  
  // Log create action
  await logAuditCreate(data.id, {
    audit_code: data.audit_code,
    audit_title: data.audit_title,
    audit_type: data.audit_type,
  });
  
  return data as Audit;
}

export async function updateAudit(id: string, updates: AuditUpdate) {
  const { data, error } = await supabase
    .from('grc_audits')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  
  // Log update action
  await logAuditUpdate(id, {
    updated_fields: Object.keys(updates),
    audit_status: updates.audit_status,
  });
  
  return data as Audit;
}

export async function deleteAudit(id: string) {
  // Get audit info before deletion
  const { data: auditData } = await supabase
    .from('grc_audits')
    .select('audit_code, audit_title')
    .eq('id', id)
    .single();
  
  const { error } = await supabase
    .from('grc_audits')
    .delete()
    .eq('id', id);

  if (error) throw error;
  
  // Log delete action
  await logAuditDelete(id, {
    audit_code: auditData?.audit_code,
    audit_title: auditData?.audit_title,
  });
}

// ============================================================================
// Audit Findings
// ============================================================================

export async function getAuditFindings(filters: AuditFindingFilters = {}) {
  let query = supabase
    .from('grc_audit_findings')
    .select('*');

  if (filters.q) {
    query = query.or(`finding_code.ilike.%${filters.q}%,finding_title.ilike.%${filters.q}%,finding_title_ar.ilike.%${filters.q}%`);
  }

  if (filters.audit_id) {
    query = query.eq('audit_id', filters.audit_id);
  }

  if (filters.finding_status) {
    query = query.eq('finding_status', filters.finding_status);
  }

  if (filters.severity) {
    query = query.eq('severity', filters.severity);
  }

  if (filters.finding_type) {
    query = query.eq('finding_type', filters.finding_type);
  }

  if (filters.responsible_user_id) {
    query = query.eq('responsible_user_id', filters.responsible_user_id);
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
  return data as AuditFinding[];
}

export async function getAuditFindingById(id: string) {
  const { data, error } = await supabase
    .from('grc_audit_findings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as AuditFinding;
}

export async function createAuditFinding(finding: AuditFindingInsert) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error('Auth error when creating audit finding:', authError);
    throw authError;
  }
  const userId = authData.user?.id;

  const { data: tenantRows, error: tenantError } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', userId as string)
    .limit(1);

  if (tenantError) {
    console.error('Error fetching tenant for createAuditFinding:', tenantError);
    throw tenantError;
  }

  const tenantId = tenantRows?.[0]?.tenant_id;
  if (!tenantId) {
    const err = new Error('Tenant context missing. Cannot create audit finding.');
    console.error(err.message);
    throw err;
  }

  const { data, error } = await supabase
    .from('grc_audit_findings')
    .insert({
      ...finding,
      tenant_id: tenantId,
      identified_by: userId,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  
  // Log finding creation
  await logFindingAdd(data.id, {
    audit_id: data.audit_id,
    finding_code: data.finding_code,
    severity: data.severity,
  });
  
  return data as AuditFinding;
}

export async function updateAuditFinding(id: string, updates: AuditFindingUpdate) {
  const { data, error } = await supabase
    .from('grc_audit_findings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  
  // Log resolution if status changed to resolved
  if (updates.finding_status === 'resolved' || updates.finding_status === 'verified') {
    await logFindingResolve(id, {
      finding_status: updates.finding_status,
    });
  }
  
  return data as AuditFinding;
}

export async function deleteAuditFinding(id: string) {
  const { error } = await supabase
    .from('grc_audit_findings')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================================
// Statistics
// ============================================================================

export async function getAuditStatistics(): Promise<AuditStatistics> {
  const [audits, findings] = await Promise.all([
    supabase.from('grc_audits').select('audit_status, actual_start_date, actual_end_date'),
    supabase.from('grc_audit_findings').select('severity, finding_status, identified_date, actual_closure_date'),
  ]);

  if (audits.error) throw audits.error;
  if (findings.error) throw findings.error;

  const inProgressAudits = audits.data.filter(a => a.audit_status === 'in_progress').length;
  const completedAudits = audits.data.filter(a => a.audit_status === 'closed').length;

  const criticalFindings = findings.data.filter(f => f.severity === 'critical').length;
  const openFindings = findings.data.filter(f => f.finding_status === 'open').length;
  const closedFindings = findings.data.filter(f => f.finding_status === 'closed').length;

  // Calculate average closure days
  const closedWithDates = findings.data.filter(
    f => f.finding_status === 'closed' && f.identified_date && f.actual_closure_date
  );

  let avgClosureDays = 0;
  if (closedWithDates.length > 0) {
    const totalDays = closedWithDates.reduce((sum, f) => {
      const identified = new Date(f.identified_date!).getTime();
      const closed = new Date(f.actual_closure_date!).getTime();
      return sum + Math.ceil((closed - identified) / (1000 * 60 * 60 * 24));
    }, 0);
    avgClosureDays = Math.round(totalDays / closedWithDates.length);
  }

  return {
    total_audits: audits.data.length,
    in_progress_audits: inProgressAudits,
    completed_audits: completedAudits,
    total_findings: findings.data.length,
    critical_findings: criticalFindings,
    open_findings: openFindings,
    closed_findings: closedFindings,
    avg_closure_days: avgClosureDays,
  };
}
