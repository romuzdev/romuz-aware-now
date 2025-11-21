/**
 * M20 - Threat Intelligence Types
 * Type definitions for threat intelligence, IOCs, and threat matching
 */

// ============================================================
// Enums
// ============================================================

export type FeedType = 'ioc' | 'vulnerability' | 'threat_actor' | 'malware' | 'advisory';

export type IndicatorType = 'ip' | 'domain' | 'url' | 'file_hash' | 'email' | 'vulnerability_id';

export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';

export type MatchedEntityType = 'log' | 'alert' | 'incident' | 'network_event' | 'file_scan';

export type InvestigationStatus = 'pending' | 'investigating' | 'confirmed' | 'false_positive' | 'resolved';

export type FetchStatus = 'success' | 'failed' | 'pending';

// ============================================================
// Core Types
// ============================================================

export interface ThreatIntelligenceFeed {
  id: string;
  tenant_id: string;
  feed_name: string;
  feed_name_ar: string;
  feed_type: FeedType;
  source_url: string | null;
  source_provider: string | null;
  api_key_configured: boolean;
  sync_interval_hours: number;
  last_fetched_at: string | null;
  last_fetch_status: FetchStatus | null;
  last_error_message: string | null;
  total_indicators_fetched: number;
  is_active: boolean;
  config: Record<string, any>;
  last_backed_up_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface ThreatIndicator {
  id: string;
  tenant_id: string;
  feed_id: string | null;
  indicator_type: IndicatorType;
  indicator_value: string;
  threat_level: ThreatLevel;
  threat_category: string | null;
  description_ar: string | null;
  description_en: string | null;
  tags: string[];
  first_seen_at: string;
  last_seen_at: string;
  detection_count: number;
  match_count: number;
  is_whitelisted: boolean;
  whitelisted_at: string | null;
  whitelisted_by: string | null;
  whitelist_reason: string | null;
  confidence_score: number | null;
  metadata: Record<string, any>;
  last_backed_up_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ThreatMatch {
  id: string;
  tenant_id: string;
  indicator_id: string;
  matched_entity_type: MatchedEntityType;
  matched_entity_id: string | null;
  matched_value: string;
  matched_at: string;
  severity: ThreatLevel;
  action_taken: string | null;
  action_taken_at: string | null;
  action_taken_by: string | null;
  is_false_positive: boolean;
  false_positive_marked_at: string | null;
  false_positive_marked_by: string | null;
  false_positive_reason: string | null;
  investigation_status: InvestigationStatus;
  investigation_notes: string | null;
  metadata: Record<string, any>;
  last_backed_up_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Extended Types (with relations)
// ============================================================

export interface ThreatIndicatorWithFeed extends ThreatIndicator {
  feed?: ThreatIntelligenceFeed;
}

export interface ThreatMatchWithIndicator extends ThreatMatch {
  indicator?: ThreatIndicatorWithFeed;
}

// ============================================================
// Statistics & Analytics
// ============================================================

export interface ThreatStatistics {
  total_indicators: number;
  critical_indicators: number;
  high_indicators: number;
  total_matches: number;
  recent_matches_24h: number;
  false_positives: number;
  active_feeds: number;
}

export interface ThreatTrends {
  date: string;
  indicators_added: number;
  matches_found: number;
  critical_matches: number;
}

export interface ThreatLevelDistribution {
  level: ThreatLevel;
  count: number;
  percentage: number;
}

export interface IndicatorTypeDistribution {
  type: IndicatorType;
  count: number;
  percentage: number;
}

// ============================================================
// Request/Response Types
// ============================================================

export interface CreateFeedRequest {
  feed_name: string;
  feed_name_ar: string;
  feed_type: FeedType;
  source_url?: string;
  source_provider?: string;
  sync_interval_hours?: number;
  config?: Record<string, any>;
}

export interface UpdateFeedRequest {
  feed_name?: string;
  feed_name_ar?: string;
  source_url?: string;
  sync_interval_hours?: number;
  is_active?: boolean;
  config?: Record<string, any>;
}

export interface CreateIndicatorRequest {
  feed_id?: string;
  indicator_type: IndicatorType;
  indicator_value: string;
  threat_level: ThreatLevel;
  threat_category?: string;
  description_ar?: string;
  description_en?: string;
  tags?: string[];
  confidence_score?: number;
  metadata?: Record<string, any>;
}

export interface UpdateIndicatorRequest {
  threat_level?: ThreatLevel;
  threat_category?: string;
  description_ar?: string;
  description_en?: string;
  tags?: string[];
  is_whitelisted?: boolean;
  whitelist_reason?: string;
  metadata?: Record<string, any>;
}

export interface CreateMatchRequest {
  indicator_id: string;
  matched_entity_type: MatchedEntityType;
  matched_entity_id?: string;
  matched_value: string;
  severity: ThreatLevel;
  action_taken?: string;
  metadata?: Record<string, any>;
}

export interface UpdateMatchRequest {
  investigation_status?: InvestigationStatus;
  investigation_notes?: string;
  is_false_positive?: boolean;
  false_positive_reason?: string;
  action_taken?: string;
}

export interface SyncFeedRequest {
  feed_id: string;
  force?: boolean;
}

export interface SyncFeedResponse {
  success: boolean;
  feed_id: string;
  indicators_added: number;
  indicators_updated: number;
  errors?: string[];
}

export interface BulkImportIndicatorsRequest {
  indicators: CreateIndicatorRequest[];
  feed_id?: string;
}

export interface BulkImportIndicatorsResponse {
  success: boolean;
  imported: number;
  failed: number;
  errors?: Array<{ indicator: string; error: string }>;
}

// ============================================================
// Filter Types
// ============================================================

export interface FeedFilters {
  feed_type?: FeedType;
  is_active?: boolean;
  source_provider?: string;
  search?: string;
}

export interface IndicatorFilters {
  indicator_type?: IndicatorType;
  threat_level?: ThreatLevel;
  is_whitelisted?: boolean;
  feed_id?: string;
  tags?: string[];
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface MatchFilters {
  indicator_id?: string;
  matched_entity_type?: MatchedEntityType;
  severity?: ThreatLevel;
  investigation_status?: InvestigationStatus;
  is_false_positive?: boolean;
  date_from?: string;
  date_to?: string;
}

// ============================================================
// UI Helper Types
// ============================================================

export interface ThreatLevelBadgeProps {
  level: ThreatLevel;
  showLabel?: boolean;
}

export interface IndicatorTypeBadgeProps {
  type: IndicatorType;
  showLabel?: boolean;
}

export interface FeedStatusBadgeProps {
  status: FetchStatus;
  showLabel?: boolean;
}

// ============================================================
// Validation Schemas (for zod)
// ============================================================

export const VALID_FEED_TYPES: FeedType[] = [
  'ioc',
  'vulnerability',
  'threat_actor',
  'malware',
  'advisory',
];

export const VALID_INDICATOR_TYPES: IndicatorType[] = [
  'ip',
  'domain',
  'url',
  'file_hash',
  'email',
  'vulnerability_id',
];

export const VALID_THREAT_LEVELS: ThreatLevel[] = [
  'low',
  'medium',
  'high',
  'critical',
];

export const VALID_INVESTIGATION_STATUSES: InvestigationStatus[] = [
  'pending',
  'investigating',
  'confirmed',
  'false_positive',
  'resolved',
];
