/**
 * System Events Integration Layer
 * 
 * All Supabase system_events table operations
 * Following project guidelines: NO direct supabase calls in components
 */

import { supabase } from './client';
import type { SystemEvent } from '@/lib/events/event.types';

/**
 * List system events with optional filters
 */
export async function listSystemEvents(filters?: {
  category?: string;
  priority?: string;
  status?: string;
  eventType?: string;
  sourceModule?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  let query = supabase
    .from('system_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(filters?.limit || 100);
  
  if (filters?.category) {
    query = query.eq('event_category', filters.category);
  }
  
  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }
  
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters?.eventType) {
    query = query.eq('event_type', filters.eventType);
  }
  
  if (filters?.sourceModule) {
    query = query.eq('source_module', filters.sourceModule);
  }
  
  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate.toISOString());
  }
  
  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate.toISOString());
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  // Map event_category to category for consistency with SystemEvent type
  return (data || []).map(event => ({
    ...event,
    category: event.event_category,
  })) as SystemEvent[];
}

/**
 * Get a single system event by ID
 */
export async function getSystemEvent(id: string) {
  const { data, error } = await supabase
    .from('system_events')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  
  return {
    ...data,
    category: data.event_category,
  } as SystemEvent;
}

/**
 * Get event statistics for dashboard
 */
export async function getEventStatistics() {
  const { data: events, error } = await supabase
    .from('system_events')
    .select('event_category, priority, status, created_at, processed_at');
  
  if (error) throw error;
  
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const total = events.length;
  const pending = events.filter(e => e.status === 'pending').length;
  const processed = events.filter(e => e.processed_at !== null).length;
  const critical = events.filter(e => e.priority === 'critical').length;
  
  // Events per hour (last 24 hours)
  const eventsLast24h = events.filter(
    e => new Date(e.created_at) >= last24h
  );
  const eventsPerHour = (eventsLast24h.length / 24).toFixed(1);
  
  // By category
  const byCategory: Record<string, number> = {};
  events.forEach(e => {
    byCategory[e.event_category] = (byCategory[e.event_category] || 0) + 1;
  });
  
  // By priority
  const byPriority: Record<string, number> = {};
  events.forEach(e => {
    if (e.priority) {
      byPriority[e.priority] = (byPriority[e.priority] || 0) + 1;
    }
  });
  
  return {
    total,
    pending,
    processed,
    critical,
    eventsPerHour,
    byCategory,
    byPriority,
  };
}

/**
 * Mark event as processed
 */
export async function markEventProcessed(id: string, result?: any) {
  const { error } = await supabase
    .from('system_events')
    .update({
      status: 'processed',
      processed_at: new Date().toISOString(),
      metadata: result ? { processing_result: result } : undefined,
    })
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

/**
 * Mark event as failed
 */
export async function markEventFailed(id: string, errorMessage: string) {
  const { error } = await supabase
    .from('system_events')
    .update({
      status: 'failed',
      metadata: { error: errorMessage },
    })
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

/**
 * Get events by entity
 */
export async function getEventsByEntity(entityType: string, entityId: string) {
  const { data, error } = await supabase
    .from('system_events')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return (data || []).map(event => ({
    ...event,
    category: event.event_category,
  })) as SystemEvent[];
}

/**
 * Get recent events (last N events)
 */
export async function getRecentEvents(limit: number = 50) {
  return listSystemEvents({ limit });
}
