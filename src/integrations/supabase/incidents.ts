/**
 * M18: Incident Response System - Supabase Integration Layer
 * Handles all database operations for incident management
 */

import { supabase } from './client';
import type { Database } from './types';

// Type aliases
type SecurityIncident = Database['public']['Tables']['security_incidents']['Row'];
type SecurityIncidentInsert = Database['public']['Tables']['security_incidents']['Insert'];
type SecurityIncidentUpdate = Database['public']['Tables']['security_incidents']['Update'];

type IncidentTimeline = Database['public']['Tables']['incident_timeline']['Row'];
type IncidentTimelineInsert = Database['public']['Tables']['incident_timeline']['Insert'];

type IncidentResponsePlan = Database['public']['Tables']['incident_response_plans']['Row'];
type IncidentResponsePlanInsert = Database['public']['Tables']['incident_response_plans']['Insert'];
type IncidentResponsePlanUpdate = Database['public']['Tables']['incident_response_plans']['Update'];

type IncidentMetrics = Database['public']['Tables']['incident_metrics']['Row'];

// Helper: Get current tenant ID
async function getCurrentTenantId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  return data?.tenant_id || null;
}

// ========================================
// INCIDENTS CRUD
// ========================================

/**
 * Get all incidents with optional filters
 */
export async function getIncidents(filters?: {
  status?: string;
  severity?: string;
  incidentType?: string;
  assignedTo?: string;
  limit?: number;
}) {
  let query = supabase
    .from('security_incidents')
    .select('*, incident_response_plans(plan_name_ar, plan_name_en)')
    .order('detected_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }
  if (filters?.incidentType) {
    query = query.eq('incident_type', filters.incidentType);
  }
  if (filters?.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

/**
 * Get incident by ID with full details
 */
export async function getIncidentById(id: string) {
  const { data, error } = await supabase
    .from('security_incidents')
    .select(`
      *,
      incident_response_plans(*),
      incident_timeline(*),
      incident_metrics(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a new incident
 */
export async function createIncident(
  input: Omit<SecurityIncidentInsert, 'id' | 'tenant_id' | 'incident_number' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const tenantId = await getCurrentTenantId();
  if (!tenantId) throw new Error('No tenant context');

  // Generate incident number
  const { data: incidentNumber, error: numberError } = await supabase
    .rpc('generate_incident_number', { p_tenant_id: tenantId });

  if (numberError) throw numberError;

  // Create incident
  const { data, error } = await supabase
    .from('security_incidents')
    .insert({
      ...input,
      tenant_id: tenantId,
      incident_number: incidentNumber,
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  // Create initial timeline entry
  await addTimelineEvent({
    incident_id: data.id,
    event_type: 'reported',
    action_ar: `تم الإبلاغ عن الحادث: ${data.title_ar}`,
    action_en: `Incident reported: ${data.title_en || data.title_ar}`,
    actor_id: user.id,
  });

  return data;
}

/**
 * Update an incident
 */
export async function updateIncident(
  id: string,
  updates: SecurityIncidentUpdate
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('security_incidents')
    .update({
      ...updates,
      updated_by: user.id,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Track status changes in timeline
  if (updates.status) {
    await addTimelineEvent({
      incident_id: id,
      event_type: 'status_changed',
      action_ar: `تغيير الحالة إلى: ${updates.status}`,
      action_en: `Status changed to: ${updates.status}`,
      actor_id: user.id,
      new_value: updates.status,
    });
  }

  // Recalculate metrics
  await supabase.rpc('calculate_incident_metrics', { p_incident_id: id });

  return data;
}

/**
 * Acknowledge an incident
 */
export async function acknowledgeIncident(incidentId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  return updateIncident(incidentId, {
    acknowledged_at: new Date().toISOString(),
    acknowledged_by: user.id,
  });
}

/**
 * Assign incident to user
 */
export async function assignIncident(incidentId: string, assignedTo: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('security_incidents')
    .update({
      assigned_to: assignedTo,
      updated_by: user.id,
    })
    .eq('id', incidentId)
    .select()
    .single();

  if (error) throw error;

  await addTimelineEvent({
    incident_id: incidentId,
    event_type: 'assigned',
    action_ar: 'تم تعيين الحادث',
    action_en: 'Incident assigned',
    actor_id: user.id,
    new_value: assignedTo,
  });

  return data;
}

/**
 * Close an incident
 */
export async function closeIncident(
  incidentId: string,
  resolution: {
    root_cause_ar?: string;
    root_cause_en?: string;
    lessons_learned_ar?: string;
    lessons_learned_en?: string;
    recommendations_ar?: string;
    recommendations_en?: string;
  }
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('security_incidents')
    .update({
      status: 'closed',
      closed_at: new Date().toISOString(),
      closed_by: user.id,
      ...resolution,
      updated_by: user.id,
    })
    .eq('id', incidentId)
    .select()
    .single();

  if (error) throw error;

  await addTimelineEvent({
    incident_id: incidentId,
    event_type: 'closed',
    action_ar: 'تم إغلاق الحادث',
    action_en: 'Incident closed',
    actor_id: user.id,
  });

  return data;
}

// ========================================
// TIMELINE OPERATIONS
// ========================================

/**
 * Get timeline for an incident
 */
export async function getIncidentTimeline(incidentId: string) {
  const { data, error } = await supabase
    .from('incident_timeline')
    .select('*')
    .eq('incident_id', incidentId)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Add a timeline event
 */
export async function addTimelineEvent(
  input: Omit<IncidentTimelineInsert, 'id' | 'created_at'>
) {
  const { data, error } = await supabase
    .from('incident_timeline')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Add note to incident
 */
export async function addIncidentNote(
  incidentId: string,
  noteAr: string,
  noteEn?: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  return addTimelineEvent({
    incident_id: incidentId,
    event_type: 'note_added',
    action_ar: noteAr,
    action_en: noteEn,
    actor_id: user.id,
  });
}

// ========================================
// RESPONSE PLANS
// ========================================

/**
 * Get all active response plans
 */
export async function getResponsePlans(incidentType?: string) {
  let query = supabase
    .from('incident_response_plans')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (incidentType) {
    query = query.eq('incident_type', incidentType);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

/**
 * Get response plan by ID
 */
export async function getResponsePlanById(id: string) {
  const { data, error } = await supabase
    .from('incident_response_plans')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a new response plan
 */
export async function createResponsePlan(
  input: Omit<IncidentResponsePlanInsert, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const tenantId = await getCurrentTenantId();
  if (!tenantId) throw new Error('No tenant context');

  const { data, error } = await supabase
    .from('incident_response_plans')
    .insert({
      ...input,
      tenant_id: tenantId,
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a response plan
 */
export async function updateResponsePlan(
  id: string,
  updates: IncidentResponsePlanUpdate
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('incident_response_plans')
    .update({
      ...updates,
      updated_by: user.id,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a response plan
 */
export async function deleteResponsePlan(id: string) {
  const { error } = await supabase
    .from('incident_response_plans')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ========================================
// METRICS & ANALYTICS
// ========================================

/**
 * Get incident metrics
 */
export async function getIncidentMetrics(incidentId: string) {
  const { data, error } = await supabase
    .from('incident_metrics')
    .select('*')
    .eq('incident_id', incidentId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // Ignore not found
  return data;
}

/**
 * Get incident statistics
 */
export async function getIncidentStatistics(params?: {
  startDate?: string;
  endDate?: string;
}) {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) throw new Error('No tenant context');

  let query = supabase
    .from('security_incidents')
    .select('severity, status, incident_type')
    .eq('tenant_id', tenantId);

  if (params?.startDate) {
    query = query.gte('detected_at', params.startDate);
  }
  if (params?.endDate) {
    query = query.lte('detected_at', params.endDate);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Aggregate statistics
  const stats = {
    total: data.length,
    bySeverity: {
      low: data.filter(i => i.severity === 'low').length,
      medium: data.filter(i => i.severity === 'medium').length,
      high: data.filter(i => i.severity === 'high').length,
      critical: data.filter(i => i.severity === 'critical').length,
    },
    byStatus: {
      open: data.filter(i => i.status === 'open').length,
      investigating: data.filter(i => i.status === 'investigating').length,
      contained: data.filter(i => i.status === 'contained').length,
      resolved: data.filter(i => i.status === 'resolved').length,
      closed: data.filter(i => i.status === 'closed').length,
    },
    byType: data.reduce((acc, i) => {
      acc[i.incident_type] = (acc[i.incident_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  return stats;
}

/**
 * Get recent incidents
 */
export async function getRecentIncidents(limit: number = 10) {
  return getIncidents({ limit });
}

/**
 * Search incidents
 */
export async function searchIncidents(query: string) {
  const { data, error } = await supabase
    .from('security_incidents')
    .select('*')
    .or(`title_ar.ilike.%${query}%,title_en.ilike.%${query}%,description_ar.ilike.%${query}%`)
    .order('detected_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data;
}
