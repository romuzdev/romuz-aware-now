// ============================================================================
// Campaigns Module - Modules Types
// ============================================================================

export type ModuleType = 'article' | 'video' | 'link' | 'file';
export type ModuleProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface Module {
  id: string;
  tenantId: string;
  campaignId: string;
  title: string;
  type: ModuleType;
  urlOrRef: string | null;
  content: string | null;
  position: number;
  isRequired: boolean;
  estimatedMinutes: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleProgress {
  id: string;
  tenantId: string;
  campaignId: string;
  moduleId: string;
  participantId: string;
  status: ModuleProgressStatus;
  startedAt: string | null;
  completedAt: string | null;
  lastVisitAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleFormData {
  title: string;
  type: ModuleType;
  urlOrRef?: string;
  content?: string;
  isRequired: boolean;
  estimatedMinutes?: number;
}
