/**
 * M20 - Threat Intelligence Integration Layer
 * Handles all threat intelligence operations including feeds, indicators, matches, and MITRE mapping
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// ============================================================================
// TYPES
// ============================================================================

type ThreatFeed = Database['public']['Tables']['threat_intelligence_feeds']['Row'];
type ThreatIndicator = Database['public']['Tables']['threat_indicators']['Row'];
type ThreatMatch = Database['public']['Tables']['threat_matches']['Row'];
type ThreatActor = Database['public']['Tables']['threat_actor_profiles']['Row'];
type MITREMapping = Database['public']['Tables']['mitre_attack_mapping']['Row'];

export interface ThreatFeedFilters {
  isEnabled?: boolean;
  feedType?: string;
  search?: string;
}

export interface ThreatIndicatorFilters {
  indicatorType?: string;
  threatLevel?: string;
  isWhitelisted?: boolean;
  search?: string;
}

export interface ThreatMatchFilters {
  status?: string;
  severity?: string;
  indicatorType?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================================================
// THREAT FEEDS OPERATIONS
// ============================================================================

/**
 * Fetch all threat intelligence feeds with optional filters
 */
export async function fetchThreatFeeds(filters?: ThreatFeedFilters): Promise<ThreatFeed[]> {
  let query = supabase
    .from('threat_intelligence_feeds')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.isEnabled !== undefined) {
    query = query.eq('is_enabled', filters.isEnabled);
  }

  if (filters?.feedType) {
    query = query.eq('feed_type', filters.feedType);
  }

  if (filters?.search) {
    query = query.or(`feed_name.ilike.%${filters.search}%,description_ar.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Threat Intelligence] Failed to fetch feeds:', error);
    throw new Error(`فشل في جلب مصادر التهديدات: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetch a single threat feed by ID
 */
export async function fetchThreatFeedById(feedId: string): Promise<ThreatFeed> {
  const { data, error } = await supabase
    .from('threat_intelligence_feeds')
    .select('*')
    .eq('id', feedId)
    .single();

  if (error) {
    console.error('[Threat Intelligence] Failed to fetch feed:', error);
    throw new Error(`فشل في جلب المصدر: ${error.message}`);
  }

  return data;
}

/**
 * Trigger synchronization for a threat feed
 */
export async function syncThreatFeed(feedId: string): Promise<void> {
  // Call edge function to perform sync
  const { data, error } = await supabase.functions.invoke('threat-feed-sync', {
    body: { feedId }
  });

  if (error) {
    console.error('[Threat Intelligence] Feed sync failed:', error);
    throw new Error(`فشل في مزامنة المصدر: ${error.message}`);
  }

  console.log('[Threat Intelligence] Feed sync initiated:', data);
}

/**
 * Create a new threat feed
 */
export async function createThreatFeed(feed: {
  feed_name: string;
  feed_name_ar?: string;
  feed_url: string;
  feed_type: string;
  vendor?: string;
  feed_config?: Record<string, any>;
  authentication_method?: string;
  sync_frequency_minutes?: number;
  description_ar?: string;
  description_en?: string;
}): Promise<ThreatFeed> {
  const { data, error } = await supabase
    .from('threat_intelligence_feeds')
    .insert(feed)
    .select()
    .single();

  if (error) {
    console.error('[Threat Intelligence] Failed to create feed:', error);
    throw new Error(`فشل في إنشاء المصدر: ${error.message}`);
  }

  return data;
}

/**
 * Update threat feed
 */
export async function updateThreatFeed(
  feedId: string,
  updates: Partial<ThreatFeed>
): Promise<ThreatFeed> {
  const { data, error } = await supabase
    .from('threat_intelligence_feeds')
    .update(updates)
    .eq('id', feedId)
    .select()
    .single();

  if (error) {
    console.error('[Threat Intelligence] Failed to update feed:', error);
    throw new Error(`فشل في تحديث المصدر: ${error.message}`);
  }

  return data;
}

/**
 * Delete threat feed
 */
export async function deleteThreatFeed(feedId: string): Promise<void> {
  const { error } = await supabase
    .from('threat_intelligence_feeds')
    .delete()
    .eq('id', feedId);

  if (error) {
    console.error('[Threat Intelligence] Failed to delete feed:', error);
    throw new Error(`فشل في حذف المصدر: ${error.message}`);
  }
}

// ============================================================================
// THREAT INDICATORS OPERATIONS
// ============================================================================

/**
 * Fetch threat indicators with optional filters
 */
export async function fetchThreatIndicators(
  filters?: ThreatIndicatorFilters,
  limit: number = 100
): Promise<ThreatIndicator[]> {
  let query = supabase
    .from('threat_indicators')
    .select('*')
    .order('last_seen_at', { ascending: false })
    .limit(limit);

  if (filters?.indicatorType) {
    query = query.eq('indicator_type', filters.indicatorType);
  }

  if (filters?.threatLevel) {
    query = query.eq('threat_level', filters.threatLevel);
  }

  if (filters?.isWhitelisted !== undefined) {
    query = query.eq('is_whitelisted', filters.isWhitelisted);
  }

  if (filters?.search) {
    query = query.or(`indicator_value.ilike.%${filters.search}%,description_ar.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Threat Intelligence] Failed to fetch indicators:', error);
    throw new Error(`فشل في جلب المؤشرات: ${error.message}`);
  }

  return data || [];
}

/**
 * Add a new threat indicator
 */
export async function addThreatIndicator(indicator: {
  indicator_type: string;
  indicator_value: string;
  threat_level: string;
  threat_category?: string;
  description_ar?: string;
  description_en?: string;
  feed_id?: string;
  tags?: string[];
}): Promise<ThreatIndicator> {
  // Check if indicator already exists
  const { data: existing } = await supabase
    .from('threat_indicators')
    .select('*')
    .eq('indicator_value', indicator.indicator_value)
    .eq('indicator_type', indicator.indicator_type)
    .maybeSingle();

  if (existing) {
    // Update existing indicator
    const { data, error } = await supabase
      .from('threat_indicators')
      .update({
        last_seen_at: new Date().toISOString(),
        detection_count: (existing.detection_count || 0) + 1,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw new Error(`فشل في تحديث المؤشر: ${error.message}`);
    return data;
  }

  // Create new indicator
  const { data, error } = await supabase
    .from('threat_indicators')
    .insert({
      ...indicator,
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      detection_count: 1,
      match_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('[Threat Intelligence] Failed to add indicator:', error);
    throw new Error(`فشل في إضافة المؤشر: ${error.message}`);
  }

  return data;
}

/**
 * Check if a value matches any threat indicators (IOC matching)
 */
export async function checkIOCMatch(
  value: string,
  type: string
): Promise<ThreatIndicator | null> {
  const { data, error } = await supabase
    .from('threat_indicators')
    .select('*')
    .eq('indicator_type', type)
    .eq('indicator_value', value)
    .eq('is_whitelisted', false)
    .maybeSingle();

  if (error) {
    console.error('[Threat Intelligence] IOC match check failed:', error);
    return null;
  }

  return data;
}

/**
 * Enrich threat indicator with additional intelligence
 */
export async function enrichThreatIndicator(indicatorId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('threat-ioc-enrichment', {
    body: { indicatorId }
  });

  if (error) {
    console.error('[Threat Intelligence] Enrichment failed:', error);
    throw new Error(`فشل في إثراء المؤشر: ${error.message}`);
  }

  console.log('[Threat Intelligence] Indicator enriched:', data);
}

/**
 * Whitelist a threat indicator (mark as false positive)
 */
export async function whitelistThreatIndicator(
  indicatorId: string,
  reason?: string
): Promise<void> {
  const { error } = await supabase
    .from('threat_indicators')
    .update({
      is_whitelisted: true,
      whitelisted_at: new Date().toISOString(),
    })
    .eq('id', indicatorId);

  if (error) {
    console.error('[Threat Intelligence] Failed to whitelist indicator:', error);
    throw new Error(`فشل في إضافة المؤشر للقائمة البيضاء: ${error.message}`);
  }
}

// ============================================================================
// THREAT MATCHES OPERATIONS
// ============================================================================

/**
 * Fetch threat matches with optional filters
 */
export async function fetchThreatMatches(
  filters?: ThreatMatchFilters,
  limit: number = 100
): Promise<ThreatMatch[]> {
  let query = supabase
    .from('threat_matches')
    .select(`
      *,
      indicator:threat_indicators(*)
    `)
    .order('matched_at', { ascending: false })
    .limit(limit);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.severity) {
    query = query.eq('threat_severity', filters.severity);
  }

  if (filters?.indicatorType) {
    query = query.eq('indicator_type', filters.indicatorType);
  }

  if (filters?.dateFrom) {
    query = query.gte('matched_at', filters.dateFrom);
  }

  if (filters?.dateTo) {
    query = query.lte('matched_at', filters.dateTo);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Threat Intelligence] Failed to fetch matches:', error);
    throw new Error(`فشل في جلب التطابقات: ${error.message}`);
  }

  return data || [];
}

/**
 * Confirm a threat match
 */
export async function confirmThreatMatch(
  matchId: string,
  investigationNotes?: string
): Promise<ThreatMatch> {
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('threat_matches')
    .update({
      status: 'confirmed',
      investigated_by: userData?.user?.id,
      investigated_at: new Date().toISOString(),
      investigation_notes: investigationNotes,
    })
    .eq('id', matchId)
    .select()
    .single();

  if (error) {
    console.error('[Threat Intelligence] Failed to confirm match:', error);
    throw new Error(`فشل في تأكيد التطابق: ${error.message}`);
  }

  return data;
}

/**
 * Mark threat match as false positive
 */
export async function markMatchAsFalsePositive(
  matchId: string,
  reason?: string
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('threat_matches')
    .update({
      status: 'false_positive',
      investigated_by: userData?.user?.id,
      investigated_at: new Date().toISOString(),
      investigation_notes: reason,
    })
    .eq('id', matchId);

  if (error) {
    console.error('[Threat Intelligence] Failed to mark as false positive:', error);
    throw new Error(`فشل في تحديد التطابق كإيجابي زائف: ${error.message}`);
  }
}

// ============================================================================
// THREAT ACTOR OPERATIONS
// ============================================================================

/**
 * Fetch threat actor profiles
 */
export async function fetchThreatActors(filters?: {
  actorType?: string;
  activityStatus?: string;
}): Promise<ThreatActor[]> {
  let query = supabase
    .from('threat_actor_profiles')
    .select('*')
    .order('last_observed', { ascending: false, nullsFirst: false });

  if (filters?.actorType) {
    query = query.eq('actor_type', filters.actorType);
  }

  if (filters?.activityStatus) {
    query = query.eq('activity_status', filters.activityStatus);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Threat Intelligence] Failed to fetch threat actors:', error);
    throw new Error(`فشل في جلب ملفات الجهات المهددة: ${error.message}`);
  }

  return data || [];
}

/**
 * Create threat actor profile
 */
export async function createThreatActor(actor: {
  actor_name: string;
  actor_type: string;
  actor_aliases?: string[];
  suspected_country?: string;
  sophistication_level?: string;
  description_ar?: string;
  description_en?: string;
  ttps?: any[];
  known_tools?: string[];
}): Promise<ThreatActor> {
  const { data, error } = await supabase
    .from('threat_actor_profiles')
    .insert({
      ...actor,
      first_observed: new Date().toISOString(),
      last_observed: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[Threat Intelligence] Failed to create threat actor:', error);
    throw new Error(`فشل في إنشاء ملف الجهة المهددة: ${error.message}`);
  }

  return data;
}

// ============================================================================
// MITRE ATT&CK MAPPING OPERATIONS
// ============================================================================

/**
 * Map an entity to MITRE ATT&CK technique
 */
export async function mapThreatToMITRE(mapping: {
  entity_type: string;
  entity_id: string;
  mitre_tactic_id: string;
  mitre_tactic_name: string;
  mitre_technique_id: string;
  mitre_technique_name: string;
  mitre_subtechnique_id?: string;
  mitre_subtechnique_name?: string;
  confidence_score?: number;
  detection_method?: string;
  evidence_description?: string;
}): Promise<MITREMapping> {
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('mitre_attack_mapping')
    .insert({
      ...mapping,
      mapped_by: userData?.user?.id,
    })
    .select()
    .single();

  if (error) {
    console.error('[Threat Intelligence] Failed to create MITRE mapping:', error);
    throw new Error(`فشل في ربط التهديد بإطار MITRE: ${error.message}`);
  }

  return data;
}

/**
 * Fetch MITRE mappings for an entity
 */
export async function fetchMITREMappings(
  entityType: string,
  entityId: string
): Promise<MITREMapping[]> {
  const { data, error } = await supabase
    .from('mitre_attack_mapping')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('mapped_at', { ascending: false });

  if (error) {
    console.error('[Threat Intelligence] Failed to fetch MITRE mappings:', error);
    throw new Error(`فشل في جلب روابط MITRE: ${error.message}`);
  }

  return data || [];
}

/**
 * Confirm MITRE mapping
 */
export async function confirmMITREMapping(mappingId: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('mitre_attack_mapping')
    .update({
      is_confirmed: true,
      confirmed_by: userData?.user?.id,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', mappingId);

  if (error) {
    console.error('[Threat Intelligence] Failed to confirm MITRE mapping:', error);
    throw new Error(`فشل في تأكيد ربط MITRE: ${error.message}`);
  }
}

// ============================================================================
// STATISTICS & DASHBOARD
// ============================================================================

/**
 * Fetch threat intelligence statistics
 */
export async function fetchThreatStats(): Promise<{
  activeFeeds: number;
  totalIndicators: number;
  recentMatches: number;
  criticalThreats: number;
}> {
  const [feedsResult, indicatorsResult, matchesResult, criticalResult] = await Promise.all([
    supabase.from('threat_intelligence_feeds').select('id', { count: 'exact', head: true }).eq('is_enabled', true),
    supabase.from('threat_indicators').select('id', { count: 'exact', head: true }).eq('is_whitelisted', false),
    supabase.from('threat_matches').select('id', { count: 'exact', head: true }).gte('matched_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('threat_indicators').select('id', { count: 'exact', head: true }).eq('threat_level', 'critical').eq('is_whitelisted', false),
  ]);

  return {
    activeFeeds: feedsResult.count || 0,
    totalIndicators: indicatorsResult.count || 0,
    recentMatches: matchesResult.count || 0,
    criticalThreats: criticalResult.count || 0,
  };
}

/**
 * Fetch recent threat matches (for dashboard)
 */
export async function fetchRecentMatches(limit: number = 10): Promise<ThreatMatch[]> {
  const { data, error } = await supabase
    .from('threat_matches')
    .select(`
      *,
      indicator:threat_indicators(indicator_type, indicator_value, threat_level)
    `)
    .order('matched_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Threat Intelligence] Failed to fetch recent matches:', error);
    return [];
  }

  return data || [];
}
