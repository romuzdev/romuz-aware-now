/**
 * Campaign Analytics Integration
 * Legacy support for existing hooks
 */

import { supabase } from '@/integrations/supabase/client';
import type { CampaignKPI, DailyEngagement } from '@/modules/campaigns';

/**
 * Fetch Campaign KPIs from vw_awareness_campaign_kpis
 * Applies tenant-scoped filtering via RLS
 */
export async function fetchCampaignKPIs(filters: {
  dateFrom?: string;
  dateTo?: string;
  owner?: string;
  campaignId?: string;
}) {
  let query = supabase
    .from('vw_awareness_campaign_kpis')
    .select('*')
    .order('completion_rate', { ascending: false, nullsFirst: false });

  // Apply filters
  if (filters.dateFrom) {
    query = query.gte('start_date', filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte('end_date', filters.dateTo);
  }
  if (filters.owner) {
    query = query.ilike('owner_name', `%${filters.owner}%`);
  }
  if (filters.campaignId) {
    query = query.eq('campaign_id', filters.campaignId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as CampaignKPI[];
}

/**
 * Fetch Daily Engagement from vw_awareness_daily_engagement
 * Applies tenant-scoped filtering via RLS
 */
export async function fetchDailyEngagement(filters: {
  dateFrom?: string;
  dateTo?: string;
  campaignId?: string;
}) {
  let query = supabase
    .from('vw_awareness_daily_engagement')
    .select('*')
    .order('day', { ascending: true });

  // Apply filters
  if (filters.dateFrom) {
    query = query.gte('day', filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte('day', filters.dateTo);
  }
  if (filters.campaignId) {
    query = query.eq('campaign_id', filters.campaignId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as DailyEngagement[];
}

/**
 * Aggregate KPIs across all campaigns
 */
export function aggregateKPIs(kpis: CampaignKPI[]) {
  if (kpis.length === 0) {
    return {
      totalParticipants: 0,
      started: 0,
      completed: 0,
      avgScore: null,
      overdue: 0,
      completionRate: null,
    };
  }

  const totalParticipants = kpis.reduce((sum, k) => sum + k.total_participants, 0);
  const started = kpis.reduce((sum, k) => sum + k.started_count, 0);
  const completed = kpis.reduce((sum, k) => sum + k.completed_count, 0);
  const overdue = kpis.reduce((sum, k) => sum + k.overdue_count, 0);

  // Calculate weighted average score
  const totalScoreWeight = kpis.reduce((sum, k) => {
    if (k.avg_score !== null && k.completed_count > 0) {
      return sum + k.avg_score * k.completed_count;
    }
    return sum;
  }, 0);

  const avgScore = completed > 0 ? totalScoreWeight / completed : null;
  const completionRate = totalParticipants > 0 ? (completed / totalParticipants) * 100 : null;

  return {
    totalParticipants,
    started,
    completed,
    avgScore,
    overdue,
    completionRate,
  };
}
