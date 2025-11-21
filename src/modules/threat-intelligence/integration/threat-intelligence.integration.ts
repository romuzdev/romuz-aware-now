/**
 * M20 - Threat Intelligence Integration Layer
 * Handles all Supabase interactions for threat intelligence
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  ThreatIntelligenceFeed,
  ThreatIndicator,
  ThreatMatch,
  ThreatIndicatorWithFeed,
  ThreatMatchWithIndicator,
  ThreatStatistics,
  CreateFeedRequest,
  UpdateFeedRequest,
  CreateIndicatorRequest,
  UpdateIndicatorRequest,
  CreateMatchRequest,
  UpdateMatchRequest,
  FeedFilters,
  IndicatorFilters,
  MatchFilters,
} from '../types/threat-intelligence.types';

// ============================================================
// Threat Intelligence Feeds
// ============================================================

/**
 * Fetch all threat intelligence feeds for current tenant
 */
export async function fetchThreatFeeds(
  tenantId: string,
  filters?: FeedFilters
): Promise<ThreatIntelligenceFeed[]> {
  let query = supabase
    .from('threat_intelligence_feeds')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters?.feed_type) {
    query = query.eq('feed_type', filters.feed_type);
  }

  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }

  if (filters?.source_provider) {
    query = query.eq('source_provider', filters.source_provider);
  }

  if (filters?.search) {
    query = query.or(`feed_name.ilike.%${filters.search}%,feed_name_ar.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching threat feeds:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch single threat intelligence feed by ID
 */
export async function fetchThreatFeedById(
  feedId: string
): Promise<ThreatIntelligenceFeed | null> {
  const { data, error } = await supabase
    .from('threat_intelligence_feeds')
    .select('*')
    .eq('id', feedId)
    .single();

  if (error) {
    console.error('Error fetching threat feed:', error);
    throw error;
  }

  return data;
}

/**
 * Create new threat intelligence feed
 */
export async function createThreatFeed(
  tenantId: string,
  userId: string,
  request: CreateFeedRequest
): Promise<ThreatIntelligenceFeed> {
  const { data, error } = await supabase
    .from('threat_intelligence_feeds')
    .insert({
      tenant_id: tenantId,
      created_by: userId,
      updated_by: userId,
      ...request,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating threat feed:', error);
    throw error;
  }

  return data;
}

/**
 * Update threat intelligence feed
 */
export async function updateThreatFeed(
  feedId: string,
  userId: string,
  request: UpdateFeedRequest
): Promise<ThreatIntelligenceFeed> {
  const { data, error } = await supabase
    .from('threat_intelligence_feeds')
    .update({
      ...request,
      updated_by: userId,
    })
    .eq('id', feedId)
    .select()
    .single();

  if (error) {
    console.error('Error updating threat feed:', error);
    throw error;
  }

  return data;
}

/**
 * Delete threat intelligence feed
 */
export async function deleteThreatFeed(feedId: string): Promise<void> {
  const { error } = await supabase
    .from('threat_intelligence_feeds')
    .delete()
    .eq('id', feedId);

  if (error) {
    console.error('Error deleting threat feed:', error);
    throw error;
  }
}

// ============================================================
// Threat Indicators (IOCs)
// ============================================================

/**
 * Fetch threat indicators with optional filters
 */
export async function fetchThreatIndicators(
  tenantId: string,
  filters?: IndicatorFilters
): Promise<ThreatIndicatorWithFeed[]> {
  let query = supabase
    .from('threat_indicators')
    .select(`
      *,
      feed:threat_intelligence_feeds(*)
    `)
    .eq('tenant_id', tenantId)
    .order('last_seen_at', { ascending: false });

  if (filters?.indicator_type) {
    query = query.eq('indicator_type', filters.indicator_type);
  }

  if (filters?.threat_level) {
    query = query.eq('threat_level', filters.threat_level);
  }

  if (filters?.is_whitelisted !== undefined) {
    query = query.eq('is_whitelisted', filters.is_whitelisted);
  }

  if (filters?.feed_id) {
    query = query.eq('feed_id', filters.feed_id);
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags);
  }

  if (filters?.search) {
    query = query.or(`indicator_value.ilike.%${filters.search}%,description_ar.ilike.%${filters.search}%,description_en.ilike.%${filters.search}%`);
  }

  if (filters?.date_from) {
    query = query.gte('first_seen_at', filters.date_from);
  }

  if (filters?.date_to) {
    query = query.lte('first_seen_at', filters.date_to);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching threat indicators:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch single threat indicator by ID
 */
export async function fetchThreatIndicatorById(
  indicatorId: string
): Promise<ThreatIndicatorWithFeed | null> {
  const { data, error } = await supabase
    .from('threat_indicators')
    .select(`
      *,
      feed:threat_intelligence_feeds(*)
    `)
    .eq('id', indicatorId)
    .single();

  if (error) {
    console.error('Error fetching threat indicator:', error);
    throw error;
  }

  return data;
}

/**
 * Create new threat indicator
 */
export async function createThreatIndicator(
  tenantId: string,
  request: CreateIndicatorRequest
): Promise<ThreatIndicator> {
  const { data, error } = await supabase
    .from('threat_indicators')
    .insert({
      tenant_id: tenantId,
      ...request,
      tags: request.tags || [],
      metadata: request.metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating threat indicator:', error);
    throw error;
  }

  return data;
}

/**
 * Update threat indicator
 */
export async function updateThreatIndicator(
  indicatorId: string,
  userId: string,
  request: UpdateIndicatorRequest
): Promise<ThreatIndicator> {
  const updates: any = { ...request };

  // If whitelisting, add metadata
  if (request.is_whitelisted !== undefined) {
    if (request.is_whitelisted) {
      updates.whitelisted_at = new Date().toISOString();
      updates.whitelisted_by = userId;
    } else {
      updates.whitelisted_at = null;
      updates.whitelisted_by = null;
      updates.whitelist_reason = null;
    }
  }

  const { data, error } = await supabase
    .from('threat_indicators')
    .update(updates)
    .eq('id', indicatorId)
    .select()
    .single();

  if (error) {
    console.error('Error updating threat indicator:', error);
    throw error;
  }

  return data;
}

/**
 * Delete threat indicator
 */
export async function deleteThreatIndicator(indicatorId: string): Promise<void> {
  const { error } = await supabase
    .from('threat_indicators')
    .delete()
    .eq('id', indicatorId);

  if (error) {
    console.error('Error deleting threat indicator:', error);
    throw error;
  }
}

/**
 * Bulk create threat indicators
 */
export async function bulkCreateThreatIndicators(
  tenantId: string,
  indicators: CreateIndicatorRequest[]
): Promise<{ imported: number; failed: number; errors: any[] }> {
  const results = {
    imported: 0,
    failed: 0,
    errors: [] as any[],
  };

  for (const indicator of indicators) {
    try {
      await createThreatIndicator(tenantId, indicator);
      results.imported++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        indicator: indicator.indicator_value,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

// ============================================================
// Threat Matches
// ============================================================

/**
 * Fetch threat matches with optional filters
 */
export async function fetchThreatMatches(
  tenantId: string,
  filters?: MatchFilters
): Promise<ThreatMatchWithIndicator[]> {
  let query = supabase
    .from('threat_matches')
    .select(`
      *,
      indicator:threat_indicators!threat_matches_indicator_id_fkey(
        *,
        feed:threat_intelligence_feeds(*)
      )
    `)
    .eq('tenant_id', tenantId)
    .order('matched_at', { ascending: false });

  if (filters?.indicator_id) {
    query = query.eq('indicator_id', filters.indicator_id);
  }

  if (filters?.matched_entity_type) {
    query = query.eq('matched_entity_type', filters.matched_entity_type);
  }

  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }

  if (filters?.investigation_status) {
    query = query.eq('investigation_status', filters.investigation_status);
  }

  if (filters?.is_false_positive !== undefined) {
    query = query.eq('is_false_positive', filters.is_false_positive);
  }

  if (filters?.date_from) {
    query = query.gte('matched_at', filters.date_from);
  }

  if (filters?.date_to) {
    query = query.lte('matched_at', filters.date_to);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching threat matches:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch single threat match by ID
 */
export async function fetchThreatMatchById(
  matchId: string
): Promise<ThreatMatchWithIndicator | null> {
  const { data, error } = await supabase
    .from('threat_matches')
    .select(`
      *,
      indicator:threat_indicators!threat_matches_indicator_id_fkey(
        *,
        feed:threat_intelligence_feeds(*)
      )
    `)
    .eq('id', matchId)
    .single();

  if (error) {
    console.error('Error fetching threat match:', error);
    throw error;
  }

  return data;
}

/**
 * Create new threat match
 */
export async function createThreatMatch(
  tenantId: string,
  request: CreateMatchRequest
): Promise<ThreatMatch> {
  const { data, error } = await supabase
    .from('threat_matches')
    .insert({
      tenant_id: tenantId,
      ...request,
      metadata: request.metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating threat match:', error);
    throw error;
  }

  // Increment indicator match count
  await supabase.rpc('increment_indicator_match_count', {
    p_indicator_id: request.indicator_id,
  });

  return data;
}

/**
 * Update threat match
 */
export async function updateThreatMatch(
  matchId: string,
  userId: string,
  request: UpdateMatchRequest
): Promise<ThreatMatch> {
  const updates: any = { ...request };

  // If marking as false positive, add metadata
  if (request.is_false_positive !== undefined) {
    if (request.is_false_positive) {
      updates.false_positive_marked_at = new Date().toISOString();
      updates.false_positive_marked_by = userId;
    } else {
      updates.false_positive_marked_at = null;
      updates.false_positive_marked_by = null;
      updates.false_positive_reason = null;
    }
  }

  const { data, error } = await supabase
    .from('threat_matches')
    .update(updates)
    .eq('id', matchId)
    .select()
    .single();

  if (error) {
    console.error('Error updating threat match:', error);
    throw error;
  }

  return data;
}

/**
 * Delete threat match
 */
export async function deleteThreatMatch(matchId: string): Promise<void> {
  const { error } = await supabase
    .from('threat_matches')
    .delete()
    .eq('id', matchId);

  if (error) {
    console.error('Error deleting threat match:', error);
    throw error;
  }
}

// ============================================================
// Statistics & Analytics
// ============================================================

/**
 * Fetch threat intelligence statistics
 */
export async function fetchThreatStatistics(
  tenantId: string
): Promise<ThreatStatistics> {
  const { data, error } = await supabase.rpc('get_threat_statistics', {
    p_tenant_id: tenantId,
  });

  if (error) {
    console.error('Error fetching threat statistics:', error);
    throw error;
  }

  return data[0] || {
    total_indicators: 0,
    critical_indicators: 0,
    high_indicators: 0,
    total_matches: 0,
    recent_matches_24h: 0,
    false_positives: 0,
    active_feeds: 0,
  };
}

/**
 * Search for indicator by value
 */
export async function searchIndicatorByValue(
  tenantId: string,
  value: string
): Promise<ThreatIndicator | null> {
  const { data, error } = await supabase
    .from('threat_indicators')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('indicator_value', value)
    .eq('is_whitelisted', false)
    .maybeSingle();

  if (error) {
    console.error('Error searching indicator:', error);
    throw error;
  }

  return data;
}
