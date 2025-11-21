/**
 * Security Events Integration Layer
 * M18.5 - SecOps Integration
 */

import { supabase } from '@/integrations/supabase/client';
import type { SecurityEvent, SecurityEventFilters } from '../types';
import { logSecurityEventAction } from '@/lib/audit/secops-audit-logger';

/**
 * Fetch security events with filters
 */
export async function fetchSecurityEvents(
  filters?: SecurityEventFilters
): Promise<SecurityEvent[]> {
  let query = supabase
    .from('security_events')
    .select('*')
    .order('event_timestamp', { ascending: false })
    .limit(100);

  if (filters?.severity && filters.severity.length > 0) {
    query = query.in('severity', filters.severity);
  }

  if (filters?.source_system && filters.source_system.length > 0) {
    query = query.in('source_system', filters.source_system);
  }

  if (filters?.is_processed !== undefined) {
    query = query.eq('is_processed', filters.is_processed);
  }

  if (filters?.date_from) {
    query = query.gte('event_timestamp', filters.date_from);
  }

  if (filters?.date_to) {
    query = query.lte('event_timestamp', filters.date_to);
  }

  if (filters?.search) {
    query = query.or(
      `event_type.ilike.%${filters.search}%,raw_log.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as SecurityEvent[];
}

/**
 * Fetch a single security event by ID
 */
export async function fetchSecurityEventById(id: string): Promise<SecurityEvent> {
  const { data, error } = await supabase
    .from('security_events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;

  // Log read action
  await logSecurityEventAction(id, 'read');

  return data as SecurityEvent;
}

/**
 * Create a new security event
 */
export async function createSecurityEvent(
  event: Omit<SecurityEvent, 'id' | 'created_at' | 'updated_at'>
): Promise<SecurityEvent> {
  const { data, error } = await supabase
    .from('security_events')
    .insert(event)
    .select()
    .single();

  if (error) throw error;

  // Log create action
  await logSecurityEventAction(data.id, 'create', {
    event_type: event.event_type,
    severity: event.severity,
    source_system: event.source_system,
  });

  return data as SecurityEvent;
}

/**
 * Update security event (mark as processed, link to incident, etc.)
 */
export async function updateSecurityEvent(
  id: string,
  updates: Partial<SecurityEvent>
): Promise<SecurityEvent> {
  const { data, error } = await supabase
    .from('security_events')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Log update action
  await logSecurityEventAction(id, 'update', updates);

  return data as SecurityEvent;
}

/**
 * Delete security event
 */
export async function deleteSecurityEvent(id: string): Promise<void> {
  const { error } = await supabase.from('security_events').delete().eq('id', id);

  if (error) throw error;

  // Log delete action
  await logSecurityEventAction(id, 'delete');
}

/**
 * Mark event as processed
 */
export async function markEventAsProcessed(
  id: string,
  incidentId?: string
): Promise<void> {
  await updateSecurityEvent(id, {
    is_processed: true,
    incident_id: incidentId,
  });
}

/**
 * Get correlated events
 */
export async function fetchCorrelatedEvents(
  correlationId: string
): Promise<SecurityEvent[]> {
  const { data, error } = await supabase
    .from('security_events')
    .select('*')
    .eq('correlation_id', correlationId)
    .order('event_timestamp', { ascending: false });

  if (error) throw error;
  return data as SecurityEvent[];
}

/**
 * Get events count by severity
 */
export async function getEventCountBySeverity(): Promise<
  Record<string, number>
> {
  const { data, error } = await supabase
    .from('security_events')
    .select('severity');

  if (error) throw error;

  const counts: Record<string, number> = {
    info: 0,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  data.forEach((event) => {
    if (event.severity in counts) {
      counts[event.severity]++;
    }
  });

  return counts;
}

/**
 * Get recent critical events
 */
export async function fetchRecentCriticalEvents(
  limit: number = 10
): Promise<SecurityEvent[]> {
  const { data, error } = await supabase
    .from('security_events')
    .select('*')
    .eq('severity', 'critical')
    .order('event_timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as SecurityEvent[];
}
