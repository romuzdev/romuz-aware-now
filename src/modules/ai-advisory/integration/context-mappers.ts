/**
 * M16: AI Advisory Engine - Context Mappers
 * Enhanced multi-context support for AI recommendations
 */

import { supabase } from '@/integrations/supabase/client';
import type { ContextType } from '../types/ai-advisory.types';

export interface ContextSnapshot {
  entity_id: string;
  entity_type: string;
  key_metrics: Record<string, any>;
  risk_indicators: string[];
  recent_changes: any[];
  related_entities: string[];
}

/**
 * Map different context types to structured snapshots
 */
export async function mapContextToSnapshot(
  contextId: string,
  contextType: ContextType,
  tenantId: string
): Promise<ContextSnapshot> {
  switch (contextType) {
    case 'risk':
      return await mapRiskContext(contextId, tenantId);
    case 'incident':
      return await mapIncidentContext(contextId, tenantId);
    case 'action_plan':
      return await mapActionContext(contextId, tenantId);
    case 'audit':
      return await mapAuditContext(contextId, tenantId);
    case 'campaign':
      return await mapCampaignContext(contextId, tenantId);
    case 'compliance':
      return await mapComplianceContext(contextId, tenantId);
    case 'policy':
      return await mapPolicyContext(contextId, tenantId);
    case 'security_event':
      return await mapSecurityEventContext(contextId, tenantId);
    default:
      return await mapGenericContext(contextId, contextType, tenantId);
  }
}

async function mapRiskContext(riskId: string, tenantId: string): Promise<ContextSnapshot> {
  const { data: risk } = await supabase
    .from('grc_risks')
    .select(`
      *,
      grc_controls!grc_risk_controls(id, title_ar, effectiveness_rating),
      incidents:incidents!incidents_risk_id_fkey(id, title, severity)
    `)
    .eq('id', riskId)
    .eq('tenant_id', tenantId)
    .single();

  if (!risk) throw new Error('Risk not found');

  return {
    entity_id: risk.id,
    entity_type: 'risk',
    key_metrics: {
      likelihood: risk.likelihood,
      impact: risk.impact,
      risk_score: risk.risk_score,
      residual_risk: risk.residual_risk,
      treatment_status: risk.treatment_status,
    },
    risk_indicators: [
      risk.risk_score > 15 ? 'high_risk' : '',
      risk.treatment_status === 'open' ? 'untreated' : '',
      (risk.grc_controls?.length || 0) < 2 ? 'insufficient_controls' : '',
    ].filter(Boolean),
    recent_changes: [],
    related_entities: [
      ...(risk.grc_controls?.map((c: any) => c.id) || []),
      ...(risk.incidents?.map((i: any) => i.id) || []),
    ],
  };
}

async function mapPolicyContext(policyId: string, tenantId: string): Promise<ContextSnapshot> {
  const { data: policy } = await supabase
    .from('policies')
    .select('*')
    .eq('id', policyId)
    .eq('tenant_id', tenantId)
    .single();

  if (!policy) throw new Error('Policy not found');

  return {
    entity_id: policy.id,
    entity_type: 'policy',
    key_metrics: {
      status: policy.status,
      version: policy.version,
      approval_status: policy.approval_status,
      effective_date: policy.effective_date,
      review_date: policy.review_date,
    },
    risk_indicators: [
      policy.status === 'draft' ? 'not_approved' : '',
      policy.review_date && new Date(policy.review_date) < new Date() ? 'needs_review' : '',
    ].filter(Boolean),
    recent_changes: [],
    related_entities: [],
  };
}

async function mapSecurityEventContext(eventId: string, tenantId: string): Promise<ContextSnapshot> {
  return {
    entity_id: eventId,
    entity_type: 'security_event',
    key_metrics: {},
    risk_indicators: [],
    recent_changes: [],
    related_entities: [],
  };
}

async function mapIncidentContext(incidentId: string, tenantId: string): Promise<ContextSnapshot> {
  const { data: incident } = await supabase
    .from('incidents')
    .select(`
      *,
      actions:actions!actions_incident_id_fkey(id, title_ar, status)
    `)
    .eq('id', incidentId)
    .eq('tenant_id', tenantId)
    .single();

  if (!incident) throw new Error('Incident not found');

  return {
    entity_id: incident.id,
    entity_type: 'incident',
    key_metrics: {
      severity: incident.severity,
      status: incident.status,
      category: incident.category,
      impact_level: incident.impact_level,
      detected_at: incident.detected_at,
      resolved_at: incident.resolved_at,
    },
    risk_indicators: [
      incident.severity === 'critical' || incident.severity === 'high' ? 'high_severity' : '',
      incident.status === 'open' ? 'unresolved' : '',
      !incident.root_cause ? 'no_root_cause' : '',
      (incident.actions?.length || 0) === 0 ? 'no_actions' : '',
    ].filter(Boolean),
    recent_changes: [],
    related_entities: incident.actions?.map((a: any) => a.id) || [],
  };
}

async function mapActionContext(actionId: string, tenantId: string): Promise<ContextSnapshot> {
  const { data: action } = await supabase
    .from('actions')
    .select(`
      *,
      action_plan_milestones(id, title_ar, status, planned_date, actual_date)
    `)
    .eq('id', actionId)
    .eq('tenant_id', tenantId)
    .single();

  if (!action) throw new Error('Action not found');

  const milestones = action.action_plan_milestones || [];
  const completedMilestones = milestones.filter((m: any) => m.status === 'completed').length;
  const overdueMilestones = milestones.filter(
    (m: any) => m.status !== 'completed' && new Date(m.planned_date) < new Date()
  ).length;

  return {
    entity_id: action.id,
    entity_type: 'action',
    key_metrics: {
      status: action.status,
      priority: action.priority,
      progress_pct: action.progress_pct,
      due_date: action.due_date,
      completion_rate: milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0,
    },
    risk_indicators: [
      action.status === 'blocked' ? 'blocked' : '',
      overdueMilestones > 0 ? 'overdue_milestones' : '',
      action.due_date && new Date(action.due_date) < new Date() ? 'overdue' : '',
      action.progress_pct < 30 && action.status === 'in_progress' ? 'low_progress' : '',
    ].filter(Boolean),
    recent_changes: [],
    related_entities: milestones.map((m: any) => m.id),
  };
}

async function mapAuditContext(auditId: string, tenantId: string): Promise<ContextSnapshot> {
  const { data: audit } = await supabase
    .from('grc_audits')
    .select(`
      *,
      audit_findings_categories(id, severity, status)
    `)
    .eq('id', auditId)
    .eq('tenant_id', tenantId)
    .single();

  if (!audit) throw new Error('Audit not found');

  const findings = audit.audit_findings_categories || [];
  const criticalFindings = findings.filter((f: any) => f.severity === 'critical').length;
  const openFindings = findings.filter((f: any) => f.status === 'open').length;

  return {
    entity_id: audit.id,
    entity_type: 'audit',
    key_metrics: {
      audit_type: audit.audit_type,
      status: audit.status,
      planned_start: audit.planned_start,
      planned_end: audit.planned_end,
      total_findings: findings.length,
      critical_findings: criticalFindings,
      open_findings: openFindings,
    },
    risk_indicators: [
      criticalFindings > 0 ? 'critical_findings' : '',
      openFindings > 5 ? 'many_open_findings' : '',
      audit.status === 'in_progress' && new Date(audit.planned_end) < new Date() ? 'overdue' : '',
    ].filter(Boolean),
    recent_changes: [],
    related_entities: findings.map((f: any) => f.id),
  };
}

async function mapCampaignContext(campaignId: string, tenantId: string): Promise<ContextSnapshot> {
  const { data: campaign } = await supabase
    .from('awareness_campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('tenant_id', tenantId)
    .single();

  if (!campaign) throw new Error('Campaign not found');

  return {
    entity_id: campaign.id,
    entity_type: 'campaign',
    key_metrics: {
      status: campaign.status,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
    },
    risk_indicators: [
      campaign.status === 'draft' ? 'not_started' : '',
      new Date(campaign.end_date) < new Date() ? 'ended' : '',
    ].filter(Boolean),
    recent_changes: [],
    related_entities: [],
  };
}

async function mapComplianceContext(contextId: string, tenantId: string): Promise<ContextSnapshot> {
  // Generic compliance context mapping
  return {
    entity_id: contextId,
    entity_type: 'compliance',
    key_metrics: {},
    risk_indicators: [],
    recent_changes: [],
    related_entities: [],
  };
}

async function mapGenericContext(
  contextId: string,
  contextType: string,
  tenantId: string
): Promise<ContextSnapshot> {
  return {
    entity_id: contextId,
    entity_type: contextType,
    key_metrics: {},
    risk_indicators: [],
    recent_changes: [],
    related_entities: [],
  };
}

/**
 * Generate enhanced prompt based on context
 */
export function generateEnhancedPrompt(
  contextType: ContextType,
  snapshot: ContextSnapshot,
  requestType: 'suggestion' | 'risk' | 'optimization' | 'decision'
): string {
  const baseContext = `
Context Type: ${contextType}
Entity ID: ${snapshot.entity_id}
Key Metrics: ${JSON.stringify(snapshot.key_metrics, null, 2)}
Risk Indicators: ${snapshot.risk_indicators.join(', ') || 'None'}
`;

  const prompts: Record<typeof requestType, string> = {
    suggestion: `${baseContext}

Based on the above context, provide 3-5 actionable recommendations in Arabic to improve the current situation. Focus on:
1. Addressing identified risk indicators
2. Improving key metrics
3. Best practices for ${contextType} management

Format your response as JSON array of recommendations with: title_ar, description_ar, priority, rationale_ar`,

    risk: `${baseContext}

Analyze potential risks and challenges for this ${contextType}. Provide:
1. Risk assessment based on current metrics
2. Potential impact if not addressed
3. Recommended mitigation strategies

Format your response in Arabic as JSON array with risk details.`,

    optimization: `${baseContext}

Suggest optimization opportunities for this ${contextType}:
1. Efficiency improvements
2. Resource optimization
3. Process enhancements
4. Quick wins

Format your response in Arabic as JSON array with optimization suggestions.`,

    decision: `${baseContext}

Provide decision support for this ${contextType}:
1. Analysis of current situation
2. Available options
3. Pros and cons for each option
4. Recommended decision with justification

Format your response in Arabic as structured decision support.`,
  };

  return prompts[requestType];
}
