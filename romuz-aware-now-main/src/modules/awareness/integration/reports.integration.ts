// Gate-F: Reports & Exports Integration Layer
// Gate-I • Part 4B — Export Integration with Gate-F Reports Engine
import { supabase } from '@/integrations/supabase/client';
import type { 
  ReportExport, 
  ReportKPIDaily, 
  ReportKPICTD, 
  ReportExportRequest,
  AwarenessCampaignInsight,
  AwarenessTimeseriesData
} from '@/modules/analytics';

// Fetch report exports for current tenant
export async function fetchReportExports() {
  const { data, error } = await supabase
    .from('report_exports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  
  return (data ?? []).map(mapReportExport);
}

// Fetch daily KPIs via secure function
export async function fetchReportKPIsDaily(
  campaignId?: string,
  fromDate?: string,
  toDate?: string
): Promise<ReportKPIDaily[]> {
  const { data, error } = await supabase.rpc('get_report_kpis_daily', {
    p_campaign_id: campaignId || null,
    p_from_date: fromDate || null,
    p_to_date: toDate || null,
  });

  if (error) throw new Error(error.message);
  
  return (data ?? []).map(mapReportKPIDaily);
}

// Fetch CTD KPIs via secure function
export async function fetchReportKPIsCTD(campaignId?: string): Promise<ReportKPICTD[]> {
  const { data, error } = await supabase.rpc('get_report_kpis_ctd', {
    p_campaign_id: campaignId || null,
  });

  if (error) throw new Error(error.message);
  
  return (data ?? []).map(mapReportKPICTD);
}

// Create export request
export async function createReportExport(request: ReportExportRequest) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: tenantData } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!tenantData) throw new Error('Tenant not found');

  const { data, error } = await supabase
    .from('report_exports')
    .insert({
      tenant_id: tenantData.tenant_id,
      user_id: user.id,
      report_type: request.reportType,
      file_format: request.fileFormat,
      status: 'pending',
      source_views: request.filters,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  
  return mapReportExport(data);
}

// Delete export
export async function deleteReportExport(exportId: string) {
  const { error } = await supabase
    .from('report_exports')
    .delete()
    .eq('id', exportId);

  if (error) throw new Error(error.message);
}

// Refresh materialized views
export async function refreshReportViews() {
  const { error } = await supabase.rpc('refresh_report_views');
  if (error) throw new Error(error.message);
}

// Gate-I • Part 4B — Fetch Awareness Campaign Insights for Export
export async function fetchAwarenessCampaignInsights(
  campaignId?: string,
  fromDate?: string,
  toDate?: string
): Promise<AwarenessCampaignInsight[]> {
  let query = supabase
    .from('vw_awareness_campaign_insights')
    .select('*');

  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
  }
  if (fromDate) {
    query = query.gte('start_date', fromDate);
  }
  if (toDate) {
    query = query.lte('end_date', toDate);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  
  return (data ?? []).map(mapAwarenessCampaignInsight);
}

// Gate-I • Part 4B — Fetch Awareness Timeseries for Export
export async function fetchAwarenessTimeseries(
  campaignId?: string,
  fromDate?: string,
  toDate?: string
): Promise<AwarenessTimeseriesData[]> {
  let query = supabase
    .from('vw_awareness_timeseries')
    .select('*')
    .order('date', { ascending: true });

  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
  }
  if (fromDate) {
    query = query.gte('date', fromDate);
  }
  if (toDate) {
    query = query.lte('date', toDate);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  
  return (data ?? []).map(mapAwarenessTimeseries);
}

// Mappers
function mapReportExport(raw: any): ReportExport {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    userId: raw.user_id,
    reportType: raw.report_type,
    fileFormat: raw.file_format,
    status: raw.status,
    batchId: raw.batch_id,
    totalRows: raw.total_rows ?? 0,
    sourceViews: raw.source_views,
    storageUrl: raw.storage_url,
    createdAt: raw.created_at,
    completedAt: raw.completed_at,
    refreshAt: raw.refresh_at,
    errorMessage: raw.error_message,
  };
}

function mapReportKPIDaily(raw: any): ReportKPIDaily {
  return {
    tenantId: raw.tenant_id,
    campaignId: raw.campaign_id,
    campaignName: raw.campaign_name,
    ownerName: raw.owner_name,
    date: raw.date,
    deliveries: raw.deliveries,
    opens: raw.opens,
    clicks: raw.clicks,
    bounces: raw.bounces,
    reminders: raw.reminders,
    openRate: raw.open_rate,
    ctr: raw.ctr,
    completedCount: raw.completed_count,
    activatedCount: raw.activated_count,
    completionRate: raw.completion_rate,
    activationRate: raw.activation_rate,
  };
}

function mapReportKPICTD(raw: any): ReportKPICTD {
  return {
    tenantId: raw.tenant_id,
    campaignId: raw.campaign_id,
    lastDate: raw.last_date,
    totalDeliveries: raw.total_deliveries,
    totalOpens: raw.total_opens,
    totalClicks: raw.total_clicks,
    totalBounces: raw.total_bounces,
    totalReminders: raw.total_reminders,
    totalCompleted: raw.total_completed,
    totalActivated: raw.total_activated,
    avgOpenRate: raw.avg_open_rate,
    avgCtr: raw.avg_ctr,
  };
}

// Gate-I • Part 4B — Mappers for Awareness Insights
function mapAwarenessCampaignInsight(raw: any): AwarenessCampaignInsight {
  return {
    tenantId: raw.tenant_id,
    campaignId: raw.campaign_id,
    campaignName: raw.campaign_name,
    ownerName: raw.owner_name,
    totalParticipants: raw.total_participants ?? 0,
    engagementRate: raw.engagement_rate ?? 0,
    completionRate: raw.completion_rate ?? 0,
    avgFeedbackScore: raw.avg_feedback_score,
    status: raw.status,
    startDate: raw.start_date,
    endDate: raw.end_date,
  };
}

function mapAwarenessTimeseries(raw: any): AwarenessTimeseriesData {
  return {
    tenantId: raw.tenant_id,
    campaignId: raw.campaign_id,
    date: raw.date,
    engagementRate: raw.engagement_rate ?? 0,
    completionRate: raw.completion_rate ?? 0,
    activeParticipants: raw.active_participants ?? 0,
  };
}
