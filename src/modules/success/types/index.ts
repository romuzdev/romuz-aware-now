/**
 * M25 - Tenant Success Toolkit Types
 */

// ============================================================================
// Wizard Types
// ============================================================================

export interface SetupWizardState {
  id: string;
  tenant_id: string;
  wizard_type: 'initial_setup' | 'module_setup';
  current_step: string;
  completed_steps: string[];
  total_steps: number;
  completion_pct: number;
  is_completed: boolean;
  completed_at?: string;
  wizard_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WizardStep {
  id: string;
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  order: number;
  isCompleted: boolean;
  isActive: boolean;
  component?: React.ComponentType<any>;
}

// ============================================================================
// Health Score Types
// ============================================================================

export type HealthStatus = 'excellent' | 'good' | 'needs_attention' | 'critical';

export interface HealthSnapshot {
  id: string;
  tenant_id: string;
  org_unit_id?: string;
  snapshot_date: string;
  overall_score: number;
  adoption_score: number;
  data_quality_score: number;
  compliance_score: number;
  risk_hygiene_score: number;
  health_status: HealthStatus;
  metrics: Record<string, any>;
  recommendations_count: number;
  critical_issues_count: number;
  created_at: string;
}

export interface HealthDimension {
  key: string;
  name: string;
  nameAr: string;
  score: number;
  status: HealthStatus;
  icon: string;
  color: string;
  metrics: HealthMetric[];
}

export interface HealthMetric {
  key: string;
  label: string;
  labelAr: string;
  value: number | string;
  target?: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
}

// ============================================================================
// Playbook Types
// ============================================================================

export type PlaybookStatus = 'active' | 'paused' | 'completed' | 'cancelled';
export type PlaybookPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Playbook {
  id: string;
  tenant_id: string;
  playbook_key: string;
  title_ar: string;
  title_en?: string;
  description_ar?: string;
  description_en?: string;
  trigger_conditions: Record<string, any>;
  status: PlaybookStatus;
  total_actions: number;
  completed_actions: number;
  progress_pct: number;
  triggered_at: string;
  started_at?: string;
  completed_at?: string;
  due_date?: string;
  expected_impact: Record<string, any>;
  actual_impact: Record<string, any>;
  priority: PlaybookPriority;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Action Types
// ============================================================================

export type ActionType = 'manual_task' | 'auto_config' | 'guidance' | 'reminder';
export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';

export interface PlaybookAction {
  id: string;
  tenant_id: string;
  playbook_id: string;
  sequence_order: number;
  action_type: ActionType;
  title_ar: string;
  title_en?: string;
  description_ar?: string;
  description_en?: string;
  action_config: Record<string, any>;
  status: ActionStatus;
  assigned_to?: string;
  assigned_at?: string;
  completed_by?: string;
  completed_at?: string;
  evidence_urls?: string[];
  completion_notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Nudge Types
// ============================================================================

export type NudgeType = 'reminder' | 'coaching' | 'alert' | 'recommendation';
export type NudgePriority = 'low' | 'normal' | 'high' | 'urgent';
export type DeliveryChannel = 'in_app' | 'email' | 'slack';

export interface Nudge {
  id: string;
  tenant_id: string;
  nudge_type: NudgeType;
  title_ar: string;
  title_en?: string;
  message_ar: string;
  message_en?: string;
  target_user_id?: string;
  target_role?: string;
  priority: NudgePriority;
  delivery_channels: DeliveryChannel[];
  delivered_at?: string;
  is_read: boolean;
  read_at?: string;
  is_dismissed: boolean;
  dismissed_at?: string;
  context_type?: string;
  context_id?: string;
  context_data: Record<string, any>;
  action_url?: string;
  action_label_ar?: string;
  action_label_en?: string;
  created_at: string;
  expires_at?: string;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface SuccessDashboardData {
  wizard: SetupWizardState | null;
  currentHealth: HealthSnapshot | null;
  healthTrend: HealthSnapshot[];
  activePlaybooks: Playbook[];
  recentActions: PlaybookAction[];
  unreadNudges: Nudge[];
  recommendations: Recommendation[];
}

export interface Recommendation {
  id: string;
  type: 'playbook' | 'action' | 'improvement';
  priority: PlaybookPriority;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  actionUrl?: string;
  actionLabel?: string;
  actionLabelAr?: string;
}

// ============================================================================
// Filter Types
// ============================================================================

export interface PlaybookFilters {
  status?: PlaybookStatus[];
  priority?: PlaybookPriority[];
  search?: string;
}

export interface ActionFilters {
  status?: ActionStatus[];
  assigned_to?: string;
  playbook_id?: string;
}

export interface NudgeFilters {
  type?: NudgeType[];
  is_read?: boolean;
  is_dismissed?: boolean;
  priority?: NudgePriority[];
}
