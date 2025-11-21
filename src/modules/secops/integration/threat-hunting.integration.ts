/**
 * Threat Hunting Integration Layer
 * M18.5 - SecOps Enhancement
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  ThreatHuntQuery,
  ThreatHuntResult,
  SecurityEventThreatMatch,
  ThreatHuntDashboard,
  ThreatHuntFilters,
} from '../types/threat-hunting.types';

/**
 * Fetch all threat hunt queries
 */
export async function fetchThreatHuntQueries(
  filters?: ThreatHuntFilters
): Promise<ThreatHuntQuery[]> {
  let query = supabase
    .from('threat_hunt_queries')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.query_type) {
    query = query.eq('query_type', filters.query_type);
  }

  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }

  if (filters?.search) {
    query = query.ilike('query_name', `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch threat hunt queries:', error);
    throw error;
  }

  return (data as ThreatHuntQuery[]) || [];
}

/**
 * Fetch threat hunt query by ID
 */
export async function fetchThreatHuntQueryById(id: string): Promise<ThreatHuntQuery> {
  const { data, error } = await supabase
    .from('threat_hunt_queries')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Failed to fetch threat hunt query:', error);
    throw error;
  }

  return data as ThreatHuntQuery;
}

/**
 * Create a new threat hunt query
 */
export async function createThreatHuntQuery(
  query: Omit<ThreatHuntQuery, 'id' | 'created_at' | 'updated_at' | 'execution_count' | 'results_count'>
): Promise<ThreatHuntQuery> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('threat_hunt_queries')
    .insert({
      ...query,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create threat hunt query:', error);
    throw error;
  }

  return data as ThreatHuntQuery;
}

/**
 * Update threat hunt query
 */
export async function updateThreatHuntQuery(
  id: string,
  updates: Partial<ThreatHuntQuery>
): Promise<ThreatHuntQuery> {
  const { data, error } = await supabase
    .from('threat_hunt_queries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Failed to update threat hunt query:', error);
    throw error;
  }

  return data as ThreatHuntQuery;
}

/**
 * Delete threat hunt query
 */
export async function deleteThreatHuntQuery(id: string): Promise<void> {
  const { error } = await supabase.from('threat_hunt_queries').delete().eq('id', id);

  if (error) {
    console.error('Failed to delete threat hunt query:', error);
    throw error;
  }
}

/**
 * Execute a threat hunt query
 */
export async function executeThreatHuntQuery(queryId: string): Promise<ThreatHuntResult> {
  const { data, error } = await supabase.functions.invoke('threat-hunter', {
    body: { queryId },
  });

  if (error) {
    console.error('Failed to execute threat hunt query:', error);
    throw error;
  }

  return data as ThreatHuntResult;
}

/**
 * Fetch threat hunt results for a query
 */
export async function fetchThreatHuntResults(
  queryId: string,
  limit: number = 10
): Promise<ThreatHuntResult[]> {
  const { data, error } = await supabase
    .from('threat_hunt_results')
    .select('*')
    .eq('query_id', queryId)
    .order('executed_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch threat hunt results:', error);
    throw error;
  }

  return (data as ThreatHuntResult[]) || [];
}

/**
 * Fetch threat matches for an event
 */
export async function fetchEventThreatMatches(
  eventId: string
): Promise<SecurityEventThreatMatch[]> {
  const { data, error } = await supabase
    .from('security_event_threat_matches')
    .select(`
      *,
      threat_indicators (
        indicator_type,
        indicator_value,
        threat_level,
        threat_category,
        description_ar
      )
    `)
    .eq('event_id', eventId);

  if (error) {
    console.error('Failed to fetch event threat matches:', error);
    throw error;
  }

  return (data as SecurityEventThreatMatch[]) || [];
}

/**
 * Confirm a threat match
 */
export async function confirmThreatMatch(
  matchId: string,
  notes?: string
): Promise<SecurityEventThreatMatch> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('security_event_threat_matches')
    .update({
      is_confirmed: true,
      confirmed_by: user.id,
      confirmed_at: new Date().toISOString(),
      notes,
    })
    .eq('id', matchId)
    .select()
    .single();

  if (error) {
    console.error('Failed to confirm threat match:', error);
    throw error;
  }

  return data as SecurityEventThreatMatch;
}

/**
 * Fetch threat hunting dashboard statistics
 */
export async function fetchThreatHuntDashboard(): Promise<ThreatHuntDashboard | null> {
  const { data, error } = await supabase
    .from('vw_threat_hunt_dashboard')
    .select('*')
    .single();

  if (error) {
    console.error('Failed to fetch threat hunt dashboard:', error);
    return null;
  }

  return data as ThreatHuntDashboard;
}
