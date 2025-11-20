// ============================================================================
// Committees Module - Analytics Types
// D4 Enhancement: Committee Analytics Types
// ============================================================================

export interface CommitteeAnalyticsSnapshot {
  id: string;
  tenant_id: string;
  committee_id?: string;
  snapshot_date: string;
  
  // Meeting metrics
  total_meetings: number;
  completed_meetings: number;
  cancelled_meetings: number;
  avg_attendance_rate?: number;
  avg_meeting_duration_minutes?: number;
  
  // Decision metrics
  total_decisions: number;
  approved_decisions: number;
  rejected_decisions: number;
  pending_decisions: number;
  
  // Followup metrics
  total_followups: number;
  completed_followups: number;
  overdue_followups: number;
  avg_completion_days?: number;
  
  // Workflow metrics
  total_workflows: number;
  completed_workflows: number;
  avg_workflow_duration_days?: number;
  
  // Member metrics
  total_members: number;
  active_members: number;
  
  // Efficiency score (0-100)
  efficiency_score?: number;
  
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // Relations
  committee?: {
    name: string;
    code: string;
    status: string;
  };
}

// Analytics query options
export interface AnalyticsQueryOptions {
  fromDate?: string;
  toDate?: string;
  limit?: number;
}

// Performance summary
export interface CommitteePerformanceSummary {
  committee_id: string;
  committee_name: string;
  
  // Current period metrics
  meetings_held: number;
  decisions_made: number;
  followups_completed: number;
  workflows_completed: number;
  
  // Rates and percentages
  meeting_completion_rate: number;
  decision_rate: number;
  followup_completion_rate: number;
  workflow_efficiency: number;
  
  // Overall efficiency
  efficiency_score: number;
  efficiency_grade: 'A' | 'B' | 'C' | 'D' | 'F';
  
  // Trends (compared to previous period)
  meetings_trend: 'up' | 'down' | 'stable';
  decisions_trend: 'up' | 'down' | 'stable';
  efficiency_trend: 'up' | 'down' | 'stable';
}

// Analytics chart data
export interface AnalyticsChartData {
  date: string;
  meetings: number;
  decisions: number;
  followups: number;
  efficiency_score: number;
}

// Committee ranking
export interface CommitteeRanking {
  rank: number;
  committee_id: string;
  committee_name: string;
  efficiency_score: number;
  total_meetings: number;
  total_decisions: number;
}
