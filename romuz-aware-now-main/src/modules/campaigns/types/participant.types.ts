/**
 * Campaigns Module - Participant Types
 */

export type ParticipantStatus = 'not_started' | 'in_progress' | 'completed';

export interface Participant {
  id: string;
  tenantId: string;
  campaignId: string;
  employeeRef: string;
  status: ParticipantStatus;
  score: number | null;
  completedAt: string | null;
  notes: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantsFilters {
  q: string;
  status: 'all' | ParticipantStatus;
  scoreGte: number | null;
  from: string;
  to: string;
  includeDeleted: boolean;
  sortBy: 'completed_at' | 'score' | 'employee_ref' | 'status';
  sortDir: 'asc' | 'desc';
}

export interface ParticipantUpsert {
  campaignId: string;
  employeeRef: string;
  status?: ParticipantStatus;
  score?: number | null;
  completedAt?: string | null;
  notes?: string | null;
}

export interface ParticipantMetrics {
  total: number;
  started: number;
  completed: number;
  avgScore: number | null;
  overdue: number;
  breakdown: {
    not_started: number;
    in_progress: number;
    completed: number;
  };
}

export interface ParticipantCSVRow {
  employee_ref: string;
  status?: string;
  score?: string;
  completed_at?: string;
  notes?: string;
}

export interface ParticipantImportResult {
  imported: number;
  updated: number;
  errors: Array<{ row: number; message: string }>;
}
