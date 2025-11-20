/**
 * Committees Module - Types
 */

export interface Committee {
  id: string;
  code: string;
  name: string;
  name_ar?: string;
  charter?: string;
  status: CommitteeStatus;
  tenant_id: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
}

export type CommitteeStatus = 'active' | 'inactive' | 'archived';

export interface CommitteeMember {
  id: string;
  committee_id: string;
  user_id: string;
  role?: string;
  is_voting: boolean;
  start_at?: string;
  end_at?: string;
  created_at: string;
}

export interface CommitteeMeeting {
  id: string;
  committee_id: string;
  title: string;
  scheduled_at?: string;
  location?: string;
  status: MeetingStatus;
  minutes?: string;
  tenant_id: string;
  created_at: string;
}

export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface CommitteeListFilters {
  q?: string;
  status?: CommitteeStatus | 'all';
  page?: number;
  limit?: number;
}
