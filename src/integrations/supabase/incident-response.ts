/**
 * M18: Incident Response - Integration Layer
 * Enhanced incident management with SLA tracking and linking
 */

import { supabase } from './client';
import type { Database } from './types';

type SecurityIncident = Database['public']['Tables']['security_incidents']['Row'];
type IncidentInsert = Database['public']['Tables']['security_incidents']['Insert'];
type IncidentUpdate = Database['public']['Tables']['security_incidents']['Update'];
type IncidentResponseTeam = Database['public']['Tables']['incident_response_teams']['Row'];
type TimelineEvent = Database['public']['Tables']['incident_timeline_events']['Row'];
type SLAConfig = Database['public']['Tables']['incident_sla_config']['Row'];

/**
 * Fetch all incidents with optional filters
 */
export async function fetchIncidents(filters?: {
  status?: string;
  severity?: string;
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<SecurityIncident[]> {
  let query = supabase
    .from('security_incidents')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }
  if (filters?.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo);
  }
  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Fetch incident by ID
 */
export async function fetchIncidentById(id: string): Promise<SecurityIncident> {
  const { data, error } = await supabase
    .from('security_incidents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create new incident
 */
export async function createIncident(incident: IncidentInsert): Promise<SecurityIncident> {
  const { data, error } = await supabase
    .from('security_incidents')
    .insert(incident)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update incident
 */
export async function updateIncident(
  id: string,
  updates: IncidentUpdate
): Promise<SecurityIncident> {
  const { data, error } = await supabase
    .from('security_incidents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Link events to incident
 */
export async function linkEventsToIncident(
  incidentId: string,
  eventIds: string[]
): Promise<void> {
  const { error } = await supabase
    .from('security_incidents')
    .update({ linked_events: eventIds })
    .eq('id', incidentId);

  if (error) throw error;
}

/**
 * Link risks to incident
 */
export async function linkRisksToIncident(
  incidentId: string,
  riskIds: string[]
): Promise<void> {
  const { error } = await supabase
    .from('security_incidents')
    .update({ linked_risks: riskIds })
    .eq('id', incidentId);

  if (error) throw error;
}

/**
 * Link policies to incident
 */
export async function linkPoliciesToIncident(
  incidentId: string,
  policyIds: string[]
): Promise<void> {
  const { error } = await supabase
    .from('security_incidents')
    .update({ linked_policies: policyIds })
    .eq('id', incidentId);

  if (error) throw error;
}

/**
 * Check SLA breach status
 */
export async function checkSLABreach(incidentId: string): Promise<{
  responseBreached: boolean;
  resolutionBreached: boolean;
  responseMinutesOverdue: number;
  resolutionHoursOverdue: number;
}> {
  const { data, error } = await supabase
    .rpc('check_sla_breach', { p_incident_id: incidentId });

  if (error) throw error;
  
  return {
    responseBreached: data[0].response_breached,
    resolutionBreached: data[0].resolution_breached,
    responseMinutesOverdue: data[0].response_minutes_overdue,
    resolutionHoursOverdue: data[0].resolution_hours_overdue,
  };
}

/**
 * Fetch incident response teams
 */
export async function fetchResponseTeams(): Promise<IncidentResponseTeam[]> {
  const { data, error } = await supabase
    .from('incident_response_teams')
    .select('*')
    .eq('is_active', true)
    .order('name_ar');

  if (error) throw error;
  return data;
}

/**
 * Fetch incident timeline
 */
export async function fetchIncidentTimeline(incidentId: string): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from('incident_timeline_events')
    .select('*')
    .eq('incident_id', incidentId)
    .order('occurred_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Add timeline event
 */
export async function addTimelineEvent(event: Omit<TimelineEvent, 'id' | 'created_at' | 'last_backed_up_at'>): Promise<TimelineEvent> {
  const { data, error } = await supabase
    .from('incident_timeline_events')
    .insert(event)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch SLA configurations
 */
export async function fetchSLAConfigs(): Promise<SLAConfig[]> {
  const { data, error } = await supabase
    .from('incident_sla_config')
    .select('*')
    .eq('is_active', true)
    .order('incident_type', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Fetch incident statistics
 */
export async function fetchIncidentStatistics(): Promise<{
  total: number;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  slaBreached: number;
  avgResolutionTime: number;
}> {
  const { data: incidents, error } = await supabase
    .from('security_incidents')
    .select('*');

  if (error) throw error;

  const stats = {
    total: incidents.length,
    byStatus: {} as Record<string, number>,
    bySeverity: {} as Record<string, number>,
    slaBreached: 0,
    avgResolutionTime: 0,
  };

  incidents.forEach(inc => {
    stats.byStatus[inc.status] = (stats.byStatus[inc.status] || 0) + 1;
    stats.bySeverity[inc.severity] = (stats.bySeverity[inc.severity] || 0) + 1;
  });

  return stats;
}
