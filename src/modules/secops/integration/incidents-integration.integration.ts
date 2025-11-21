/**
 * Incidents Integration Layer
 * M18.5 - M18 (Incidents) Integration
 */

import { supabase } from '@/integrations/supabase/client';

export interface Incident {
  id: string;
  tenant_id: string;
  incident_number: string;
  title_ar: string;
  description_ar: string;
  severity: string;
  incident_type: string;
  status: string;
  detected_at: string;
  reported_by: string;
  assigned_to?: string;
  created_at: string;
}

/**
 * Create an incident from a security event
 */
export async function createIncidentFromEvent(
  eventId: string,
  incidentData: Partial<Incident>
): Promise<Incident> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  // Create incident
  const { data: incident, error: incidentError } = await supabase
    .from('security_incidents')
    .insert({
      ...incidentData,
      reported_by: user.id,
      created_by: user.id,
      updated_by: user.id,
      detected_at: new Date().toISOString(),
      reported_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (incidentError) {
    console.error('Failed to create incident:', incidentError);
    throw incidentError;
  }

  // Link event to incident
  const { error: linkError } = await supabase
    .from('security_events')
    .update({ incident_id: incident.id })
    .eq('id', eventId);

  if (linkError) {
    console.error('Failed to link event to incident:', linkError);
  }

  return incident as Incident;
}

/**
 * Fetch incidents related to an event
 */
export async function fetchEventIncident(eventId: string): Promise<Incident | null> {
  // First, get the event to find incident_id
  const { data: event, error: eventError } = await supabase
    .from('security_events')
    .select('incident_id')
    .eq('id', eventId)
    .single();

  if (eventError || !event?.incident_id) {
    return null;
  }

  // Fetch the incident
  const { data: incident, error: incidentError } = await supabase
    .from('security_incidents')
    .select('*')
    .eq('id', event.incident_id)
    .single();

  if (incidentError) {
    console.error('Failed to fetch incident:', incidentError);
    return null;
  }

  return incident as Incident;
}

/**
 * Fetch all events linked to an incident
 */
export async function fetchIncidentEvents(incidentId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('security_events')
    .select('*')
    .eq('incident_id', incidentId)
    .order('detected_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch incident events:', error);
    return [];
  }

  return data || [];
}

/**
 * Unlink an event from an incident
 */
export async function unlinkEventFromIncident(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('security_events')
    .update({ incident_id: null })
    .eq('id', eventId);

  if (error) {
    console.error('Failed to unlink event from incident:', error);
    throw error;
  }
}
