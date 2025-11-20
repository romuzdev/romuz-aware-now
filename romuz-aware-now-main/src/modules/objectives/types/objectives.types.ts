// ============================================================================
// Objectives Module - Type Definitions
// D4 - Objectives & KPIs Module
// ============================================================================

export interface Objective {
  id: string;
  tenant_id: string;
  code: string;
  title: string;
  owner_user_id: string | null;
  horizon: 'annual' | 'quarterly' | 'monthly' | 'custom' | null;
  status: 'active' | 'on_hold' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface KPI {
  id: string;
  tenant_id: string;
  objective_id: string;
  code: string;
  title: string;
  unit: string; // %, number, SAR, hours...
  direction: 'up' | 'down'; // up = higher is better, down = lower is better
  created_at: string;
  updated_at: string;
}

export interface KPITarget {
  id: string;
  kpi_id: string;
  period: string; // YYYYQn / YYYY-MM / custom label
  target_value: number;
  created_at: string;
}

export interface KPIReading {
  id: string;
  kpi_id: string;
  period: string; // YYYYQn / YYYY-MM / custom label
  actual_value: number;
  collected_at: string;
  source: string | null;
  created_at: string;
}

export interface Initiative {
  id: string;
  objective_id: string;
  title: string;
  owner_user_id: string | null;
  start_at: string | null;
  end_at: string | null;
  status: 'planned' | 'in_progress' | 'done' | 'cancelled';
  created_at: string;
  updated_at: string;
}

// Form types for creating/updating
export interface CreateObjectiveInput {
  code: string;
  title: string;
  owner_user_id?: string | null;
  horizon?: 'annual' | 'quarterly' | 'monthly' | 'custom' | null;
  status?: 'active' | 'on_hold' | 'archived';
}

export interface UpdateObjectiveInput {
  code?: string;
  title?: string;
  owner_user_id?: string | null;
  horizon?: 'annual' | 'quarterly' | 'monthly' | 'custom' | null;
  status?: 'active' | 'on_hold' | 'archived';
}

export interface CreateKPIInput {
  objective_id: string;
  code: string;
  title: string;
  unit: string;
  direction: 'up' | 'down';
}

export interface UpdateKPIInput {
  code?: string;
  title?: string;
  unit?: string;
  direction?: 'up' | 'down';
}

export interface CreateKPITargetInput {
  kpi_id: string;
  period: string;
  target_value: number;
}

export interface UpdateKPITargetInput {
  period?: string;
  target_value?: number;
}

export interface CreateKPIReadingInput {
  kpi_id: string;
  period: string;
  actual_value: number;
  collected_at?: string;
  source?: string | null;
}

export interface UpdateKPIReadingInput {
  period?: string;
  actual_value?: number;
  collected_at?: string;
  source?: string | null;
}

export interface CreateInitiativeInput {
  objective_id: string;
  title: string;
  owner_user_id?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  status?: 'planned' | 'in_progress' | 'done' | 'cancelled';
}

export interface UpdateInitiativeInput {
  title?: string;
  owner_user_id?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  status?: 'planned' | 'in_progress' | 'done' | 'cancelled';
}

// Extended types with relationships
export interface ObjectiveWithDetails extends Objective {
  kpis?: KPI[];
  initiatives?: Initiative[];
}

export interface KPIWithDetails extends KPI {
  objective?: Objective;
  targets?: KPITarget[];
  readings?: KPIReading[];
}

// Filter types
export interface ObjectiveFilters {
  status?: 'active' | 'on_hold' | 'archived';
  owner?: string;
  q?: string; // search query
}

export interface KPIFilters {
  objective_id?: string;
  unit?: string;
  direction?: 'up' | 'down';
  q?: string; // search query
}
