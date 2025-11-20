// ============================================================================
// Gate-E: Observability & Alerts v2 - Integration Layer
// ============================================================================
// Purpose: Supabase integration functions for alert system
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import type {
  AlertChannel,
  AlertPolicy,
  AlertTemplate,
  AlertEvent,
  CampaignKPIDaily,
  CampaignKPICTD,
  CreateAlertChannelData,
  UpdateAlertChannelData,
  CreateAlertPolicyData,
  UpdateAlertPolicyData,
  CreateAlertTemplateData,
  UpdateAlertTemplateData,
  AlertPolicyTarget,
  AlertPolicyChannel,
} from '../types';

// ============================================================================
// Alert Channels CRUD
// ============================================================================

export async function fetchAlertChannels(tenantId: string): Promise<AlertChannel[]> {
  const { data, error } = await supabase
    .from('alert_channels')
    .select('*')
    .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as AlertChannel[];
}

export async function fetchAlertChannelById(id: string): Promise<AlertChannel | null> {
  const { data, error } = await supabase
    .from('alert_channels')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as AlertChannel | null;
}

export async function createAlertChannel(
  tenantId: string,
  channelData: CreateAlertChannelData
): Promise<AlertChannel> {
  const { data, error } = await supabase
    .from('alert_channels')
    .insert({
      tenant_id: tenantId,
      ...channelData,
    })
    .select()
    .single();

  if (error) throw error;
  return data as AlertChannel;
}

export async function updateAlertChannel(
  id: string,
  channelData: Partial<CreateAlertChannelData>
): Promise<AlertChannel> {
  const { data, error } = await supabase
    .from('alert_channels')
    .update(channelData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as AlertChannel;
}

export async function deleteAlertChannel(id: string): Promise<void> {
  const { error } = await supabase
    .from('alert_channels')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================================
// Alert Policies CRUD
// ============================================================================

export async function fetchAlertPolicies(tenantId: string): Promise<AlertPolicy[]> {
  const { data, error } = await supabase
    .from('alert_policies')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as AlertPolicy[];
}

export async function fetchAlertPolicyById(id: string): Promise<AlertPolicy | null> {
  const { data, error } = await supabase
    .from('alert_policies')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as AlertPolicy | null;
}

export async function createAlertPolicy(
  tenantId: string,
  policyData: CreateAlertPolicyData
): Promise<AlertPolicy> {
  const { data, error } = await supabase
    .from('alert_policies')
    .insert({
      tenant_id: tenantId,
      ...policyData,
    })
    .select()
    .single();

  if (error) throw error;
  return data as AlertPolicy;
}

export async function updateAlertPolicy(
  id: string,
  policyData: Partial<CreateAlertPolicyData>
): Promise<AlertPolicy> {
  const { data, error } = await supabase
    .from('alert_policies')
    .update(policyData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as AlertPolicy;
}

export async function deleteAlertPolicy(id: string): Promise<void> {
  const { error } = await supabase
    .from('alert_policies')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================================
// Alert Templates CRUD
// ============================================================================

export async function fetchAlertTemplates(tenantId: string): Promise<AlertTemplate[]> {
  const { data, error } = await supabase
    .from('alert_templates')
    .select('*')
    .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as AlertTemplate[];
}

export async function fetchAlertTemplateById(id: string): Promise<AlertTemplate | null> {
  const { data, error } = await supabase
    .from('alert_templates')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as AlertTemplate | null;
}

export async function createAlertTemplate(
  tenantId: string,
  templateData: CreateAlertTemplateData
): Promise<AlertTemplate> {
  const { data, error } = await supabase
    .from('alert_templates')
    .insert({
      tenant_id: tenantId,
      ...templateData,
    })
    .select()
    .single();

  if (error) throw error;
  return data as AlertTemplate;
}

export async function updateAlertTemplate(
  id: string,
  templateData: Partial<CreateAlertTemplateData>
): Promise<AlertTemplate> {
  const { data, error } = await supabase
    .from('alert_templates')
    .update(templateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as AlertTemplate;
}

export async function deleteAlertTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('alert_templates')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================================
// Alert Events (Read-only for UI)
// ============================================================================

export async function fetchAlertEvents(
  tenantId: string,
  limit: number = 100
): Promise<AlertEvent[]> {
  const { data, error } = await supabase
    .from('alert_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as AlertEvent[];
}

// ============================================================================
// KPI Views (Read-only)
// ============================================================================

export async function fetchCampaignKPIsDaily(
  tenantId: string,
  campaignId?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<CampaignKPIDaily[]> {
  let query = supabase
    .from('mv_campaign_kpis_daily')
    .select('*')
    .eq('tenant_id', tenantId);

  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
  }

  if (dateFrom) {
    query = query.gte('date_r', dateFrom);
  }

  if (dateTo) {
    query = query.lte('date_r', dateTo);
  }

  const { data, error } = await query.order('date_r', { ascending: false });

  if (error) throw error;
  return data as CampaignKPIDaily[];
}

export async function fetchCampaignKPICTD(
  tenantId: string,
  campaignId?: string
): Promise<CampaignKPICTD[]> {
  let query = supabase
    .from('vw_campaign_kpis_ctd')
    .select('*')
    .eq('tenant_id', tenantId);

  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as CampaignKPICTD[];
}

// ============================================================================
// Policy Targets & Channels (Relationships)
// ============================================================================

export async function fetchPolicyTargets(policyId: string): Promise<AlertPolicyTarget[]> {
  const { data, error } = await supabase
    .from('alert_policy_targets')
    .select('*')
    .eq('policy_id', policyId);

  if (error) throw error;
  return data as AlertPolicyTarget[];
}

export async function addPolicyTarget(
  policyId: string,
  tenantId: string,
  campaignId?: string,
  tag?: string
): Promise<AlertPolicyTarget> {
  const { data, error } = await supabase
    .from('alert_policy_targets')
    .insert({
      policy_id: policyId,
      tenant_id: tenantId,
      campaign_id: campaignId,
      tag: tag,
    })
    .select()
    .single();

  if (error) throw error;
  return data as AlertPolicyTarget;
}

export async function removePolicyTarget(targetId: string): Promise<void> {
  const { error } = await supabase
    .from('alert_policy_targets')
    .delete()
    .eq('id', targetId);

  if (error) throw error;
}

export async function fetchPolicyChannels(policyId: string): Promise<AlertPolicyChannel[]> {
  const { data, error } = await supabase
    .from('alert_policy_channels')
    .select('*')
    .eq('policy_id', policyId);

  if (error) throw error;
  return data as AlertPolicyChannel[];
}

export async function addPolicyChannel(
  policyId: string,
  channelId: string,
  tenantId: string,
  subjectPrefix?: string
): Promise<AlertPolicyChannel> {
  const { data, error } = await supabase
    .from('alert_policy_channels')
    .insert({
      policy_id: policyId,
      channel_id: channelId,
      tenant_id: tenantId,
      subject_prefix: subjectPrefix,
    })
    .select()
    .single();

  if (error) throw error;
  return data as AlertPolicyChannel;
}

export async function removePolicyChannel(policyChannelId: string): Promise<void> {
  const { error } = await supabase
    .from('alert_policy_channels')
    .delete()
    .eq('id', policyChannelId);

  if (error) throw error;
}
