/**
 * Campaigns Module - Analytics Types
 */

export interface CampaignKPI {
  tenant_id: string;
  campaign_id: string;
  campaign_name: string;
  owner_name: string | null;
  start_date: string;
  end_date: string;
  total_participants: number;
  started_count: number;
  completed_count: number;
  avg_score: number | null;
  overdue_count: number;
  completion_rate: number | null;
  started_rate: number | null;
  active_days: number;
}

export interface DailyEngagement {
  tenant_id: string;
  campaign_id: string;
  day: string;
  started_delta: number;
  completed_delta: number;
  avg_score_day: number | null;
}

export interface AwarenessFilters {
  dateRange: '30d' | '90d' | 'this_month' | 'custom';
  dateFrom?: string;
  dateTo?: string;
  owner?: string;
  status?: 'all' | 'not_started' | 'in_progress' | 'completed';
  campaignId?: string;
}

export interface TopBottomCampaign {
  campaign_id: string;
  campaign_name: string;
  owner_name: string | null;
  completion_rate: number | null;
  avg_score: number | null;
  total_participants: number;
}
