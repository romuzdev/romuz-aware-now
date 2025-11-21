/**
 * Audit Analytics Integration
 * Advanced analytics functions for GRC Audit Module (M12)
 */

import { supabase } from '@/integrations/supabase/client';

export interface CompletionRateData {
  completed_audits: number;
  total_audits: number;
  completion_rate: number;
}

export interface SeverityDistribution {
  severity: string;
  count: number;
  percentage: number;
}

export interface ClosureTimeData {
  avg_days: number;
  median_days: number;
  min_days: number;
  max_days: number;
}

export interface WorkflowProgress {
  total_stages: number;
  completed_stages: number;
  in_progress_stages: number;
  pending_stages: number;
  progress_percentage: number;
}

/**
 * Get audit completion rate for a date range
 */
export async function getAuditCompletionRate(
  startDate: string,
  endDate: string
): Promise<CompletionRateData> {
  // Get tenant context
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: userTenant } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!userTenant?.tenant_id) throw new Error('No tenant context');

  const { data, error } = await supabase
    .rpc('get_audit_completion_rate', {
      p_tenant_id: userTenant.tenant_id,
      p_start_date: startDate,
      p_end_date: endDate,
    });

  if (error) throw error;
  return data[0] as CompletionRateData;
}

/**
 * Get findings severity distribution
 */
export async function getFindingsSeverityDistribution(
  auditId?: string
): Promise<SeverityDistribution[]> {
  // Get tenant context
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: userTenant } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!userTenant?.tenant_id) throw new Error('No tenant context');

  const { data, error } = await supabase
    .rpc('get_findings_severity_distribution', {
      p_tenant_id: userTenant.tenant_id,
      p_audit_id: auditId || null,
    });

  if (error) throw error;
  return data as SeverityDistribution[];
}

/**
 * Get average finding closure time
 */
export async function getAvgFindingClosureTime(
  auditId?: string
): Promise<ClosureTimeData> {
  // Get tenant context
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: userTenant } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!userTenant?.tenant_id) throw new Error('No tenant context');

  const { data, error } = await supabase
    .rpc('get_avg_finding_closure_time', {
      p_tenant_id: userTenant.tenant_id,
      p_audit_id: auditId || null,
    });

  if (error) throw error;
  return data[0] as ClosureTimeData;
}

/**
 * Get workflow progress summary
 */
export async function getWorkflowProgressSummary(
  workflowId: string
): Promise<WorkflowProgress> {
  const { data, error } = await supabase
    .rpc('get_workflow_progress_summary', {
      p_workflow_id: workflowId,
    });

  if (error) throw error;
  return data[0] as WorkflowProgress;
}

/**
 * Get audit trends over time
 */
export async function getAuditTrends(
  months: number = 6
): Promise<Array<{ month: string; completed: number; in_progress: number }>> {
  // Get tenant context
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: userTenant } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!userTenant?.tenant_id) throw new Error('No tenant context');

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const { data, error } = await supabase
    .from('grc_audits')
    .select('created_at, audit_status')
    .eq('tenant_id', userTenant.tenant_id)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at');

  if (error) throw error;

  // Group by month
  const trends = data.reduce((acc, audit) => {
    const month = new Date(audit.created_at).toLocaleDateString('ar-SA', { 
      year: 'numeric', 
      month: 'short' 
    });
    
    if (!acc[month]) {
      acc[month] = { month, completed: 0, in_progress: 0 };
    }
    
    if (audit.audit_status === 'closed') {
      acc[month].completed++;
    } else if (audit.audit_status === 'in_progress') {
      acc[month].in_progress++;
    }
    
    return acc;
  }, {} as Record<string, any>);

  return Object.values(trends);
}

/**
 * Get compliance gap analysis
 */
export async function getComplianceGaps(): Promise<Array<{
  framework: string;
  total_audits: number;
  compliant: number;
  gaps: number;
  compliance_rate: number;
}>> {
  // Get tenant context
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: userTenant } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!userTenant?.tenant_id) throw new Error('No tenant context');

  const { data: audits, error } = await supabase
    .from('grc_audits')
    .select('framework_id, audit_rating')
    .eq('tenant_id', userTenant.tenant_id);

  if (error) throw error;

  // Group by framework and calculate compliance
  const gapsByFramework = audits.reduce((acc, audit) => {
    const fw = audit.framework_id || 'other';
    
    if (!acc[fw]) {
      acc[fw] = { 
        framework: fw, 
        total_audits: 0, 
        compliant: 0, 
        gaps: 0,
        compliance_rate: 0 
      };
    }
    
    acc[fw].total_audits++;
    
    if (audit.audit_rating === 'satisfactory') {
      acc[fw].compliant++;
    } else {
      acc[fw].gaps++;
    }
    
    return acc;
  }, {} as Record<string, any>);

  // Calculate compliance rate
  Object.values(gapsByFramework).forEach((gap: any) => {
    gap.compliance_rate = gap.total_audits > 0 
      ? Math.round((gap.compliant / gap.total_audits) * 100)
      : 0;
  });

  return Object.values(gapsByFramework);
}
