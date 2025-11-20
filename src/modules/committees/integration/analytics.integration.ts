/**
 * D4 Enhancement: Committee Analytics Integration Layer
 * Analytics operations for committees
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Get current tenant ID
 */
async function getCurrentTenantId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  return data?.tenant_id || null;
}

// ============================================================================
// ANALYTICS SNAPSHOTS
// ============================================================================

/**
 * Fetch analytics snapshots for a committee
 */
export async function fetchCommitteeAnalytics(
  committeeId: string,
  options?: {
    fromDate?: string;
    toDate?: string;
    limit?: number;
  }
) {
  let query = supabase
    .from('committee_analytics_snapshots')
    .select('*')
    .eq('committee_id', committeeId)
    .order('snapshot_date', { ascending: false });

  if (options?.fromDate) {
    query = query.gte('snapshot_date', options.fromDate);
  }
  if (options?.toDate) {
    query = query.lte('snapshot_date', options.toDate);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Fetch latest analytics snapshot
 */
export async function fetchLatestCommitteeAnalytics(committeeId: string) {
  const { data, error } = await supabase
    .from('committee_analytics_snapshots')
    .select('*')
    .eq('committee_id', committeeId)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Fetch analytics for all committees (current tenant)
 */
export async function fetchAllCommitteesAnalytics(options?: {
  date?: string;
  limit?: number;
}) {
  let query = supabase
    .from('committee_analytics_snapshots')
    .select(`
      *,
      committee:committees(name, code, status)
    `)
    .order('efficiency_score', { ascending: false });

  if (options?.date) {
    query = query.eq('snapshot_date', options.date);
  } else {
    // Get latest snapshot for each committee
    query = query.order('snapshot_date', { ascending: false });
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Create or update analytics snapshot
 */
export async function upsertAnalyticsSnapshot(snapshot: any) {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) throw new Error('No tenant context');

  const { data, error } = await supabase
    .from('committee_analytics_snapshots')
    .upsert({
      ...snapshot,
      tenant_id: tenantId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// REAL-TIME ANALYTICS CALCULATION
// ============================================================================

/**
 * Calculate real-time analytics for a committee
 */
export async function calculateCommitteeAnalytics(committeeId: string) {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) throw new Error('No tenant context');

  // Get meetings data
  const { data: meetings, error: meetingsError } = await supabase
    .from('meetings')
    .select('id, status, scheduled_at, actual_duration_minutes')
    .eq('committee_id', committeeId)
    .gte('scheduled_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (meetingsError) throw meetingsError;

  // Get decisions data
  const { data: decisions, error: decisionsError } = await supabase
    .from('decisions')
    .select('id, status, meeting_id')
    .in('meeting_id', meetings?.map(m => m.id) || []);

  if (decisionsError) throw decisionsError;

  // Get followups data
  const { data: followups, error: followupsError } = await supabase
    .from('followups')
    .select('id, status, decision_id, due_at, completed_at')
    .in('decision_id', decisions?.map(d => d.id) || []);

  if (followupsError) throw followupsError;

  // Get workflows data
  const { data: workflows, error: workflowsError } = await supabase
    .from('committee_workflows')
    .select('id, state, started_at, completed_at')
    .eq('committee_id', committeeId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (workflowsError) throw workflowsError;

  // Get members count
  const { count: membersCount, error: membersError } = await supabase
    .from('committee_members')
    .select('*', { count: 'exact', head: true })
    .eq('committee_id', committeeId);

  if (membersError) throw membersError;

  // Calculate metrics
  const totalMeetings = meetings?.length || 0;
  const completedMeetings = meetings?.filter(m => m.status === 'completed').length || 0;
  const cancelledMeetings = meetings?.filter(m => m.status === 'cancelled').length || 0;

  const avgMeetingDuration = meetings && meetings.length > 0
    ? Math.round(
        meetings
          .filter(m => m.actual_duration_minutes)
          .reduce((sum, m) => sum + (m.actual_duration_minutes || 0), 0) / 
        meetings.filter(m => m.actual_duration_minutes).length
      )
    : null;

  const totalDecisions = decisions?.length || 0;
  const approvedDecisions = decisions?.filter(d => d.status === 'approved').length || 0;
  const rejectedDecisions = decisions?.filter(d => d.status === 'rejected').length || 0;
  const pendingDecisions = decisions?.filter(d => d.status === 'pending').length || 0;

  const totalFollowups = followups?.length || 0;
  const completedFollowups = followups?.filter(f => f.status === 'done').length || 0;
  const overdueFollowups = followups?.filter(f => 
    f.status !== 'done' && f.due_at && new Date(f.due_at) < new Date()
  ).length || 0;

  const avgCompletionDays = followups && followups.length > 0
    ? followups
        .filter(f => f.completed_at && f.due_at)
        .reduce((sum, f) => {
          const days = Math.abs(
            (new Date(f.completed_at!).getTime() - new Date(f.due_at!).getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0) / followups.filter(f => f.completed_at && f.due_at).length
    : null;

  const totalWorkflows = workflows?.length || 0;
  const completedWorkflows = workflows?.filter(w => w.state === 'completed').length || 0;

  const avgWorkflowDuration = workflows && workflows.length > 0
    ? workflows
        .filter(w => w.completed_at && w.started_at)
        .reduce((sum, w) => {
          const days = Math.abs(
            (new Date(w.completed_at!).getTime() - new Date(w.started_at!).getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0) / workflows.filter(w => w.completed_at && w.started_at).length
    : null;

  // Calculate efficiency score
  const meetingCompletionRate = totalMeetings > 0 ? (completedMeetings / totalMeetings) * 40 : 0;
  const decisionRate = completedMeetings > 0 ? (totalDecisions / completedMeetings) * 25 : 0;
  const followupCompletionRate = totalFollowups > 0 ? (completedFollowups / totalFollowups) * 20 : 0;
  const workflowEfficiency = totalWorkflows > 0 ? (completedWorkflows / totalWorkflows) * 15 : 0;
  
  const efficiencyScore = Math.round(
    meetingCompletionRate + decisionRate + followupCompletionRate + workflowEfficiency
  );

  // Create snapshot
  const snapshot = {
    committee_id: committeeId,
    snapshot_date: new Date().toISOString().split('T')[0],
    total_meetings: totalMeetings,
    completed_meetings: completedMeetings,
    cancelled_meetings: cancelledMeetings,
    avg_attendance_rate: null, // Would need attendance tracking
    avg_meeting_duration_minutes: avgMeetingDuration,
    total_decisions: totalDecisions,
    approved_decisions: approvedDecisions,
    rejected_decisions: rejectedDecisions,
    pending_decisions: pendingDecisions,
    total_followups: totalFollowups,
    completed_followups: completedFollowups,
    overdue_followups: overdueFollowups,
    avg_completion_days: avgCompletionDays ? Math.round(avgCompletionDays * 100) / 100 : null,
    total_workflows: totalWorkflows,
    completed_workflows: completedWorkflows,
    avg_workflow_duration_days: avgWorkflowDuration ? Math.round(avgWorkflowDuration * 100) / 100 : null,
    total_members: membersCount || 0,
    active_members: membersCount || 0,
    efficiency_score: efficiencyScore,
  };

  return upsertAnalyticsSnapshot(snapshot);
}

/**
 * Get committee performance summary
 */
export async function getCommitteePerformanceSummary(committeeId: string) {
  const latest = await fetchLatestCommitteeAnalytics(committeeId);
  
  if (!latest) {
    // Calculate real-time if no snapshot exists
    return calculateCommitteeAnalytics(committeeId);
  }

  // Check if snapshot is recent (within 24 hours)
  const snapshotAge = Date.now() - new Date(latest.snapshot_date).getTime();
  const oneDayInMs = 24 * 60 * 60 * 1000;

  if (snapshotAge > oneDayInMs) {
    // Recalculate if snapshot is old
    return calculateCommitteeAnalytics(committeeId);
  }

  return latest;
}

/**
 * Get committees ranking by efficiency
 */
export async function getCommitteesRanking(limit: number = 10) {
  const { data, error } = await supabase
    .from('committee_analytics_snapshots')
    .select(`
      *,
      committee:committees(name, code, status)
    `)
    .order('efficiency_score', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Get analytics trends for a committee
 */
export async function getCommitteeAnalyticsTrends(
  committeeId: string,
  days: number = 30
) {
  const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  return fetchCommitteeAnalytics(committeeId, { fromDate });
}
