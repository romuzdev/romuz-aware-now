/**
 * M14 Enhancement - Custom KPI Formulas Types
 */

export interface CustomKPIFormula {
  id: string;
  tenant_id: string;
  created_by: string;
  kpi_name: string;
  kpi_name_ar: string | null;
  description: string | null;
  formula: string;
  variables: Record<string, string>;
  unit: string | null;
  target_value: number | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomKPIFormulaInput {
  kpi_name: string;
  kpi_name_ar?: string;
  description?: string;
  formula: string;
  variables: Record<string, string>;
  unit?: string;
  target_value?: number;
  category?: string;
}

export interface UpdateCustomKPIFormulaInput {
  kpi_name?: string;
  kpi_name_ar?: string;
  description?: string;
  formula?: string;
  variables?: Record<string, string>;
  unit?: string;
  target_value?: number;
  category?: string;
  is_active?: boolean;
}

export interface FormulaVariable {
  name: string;
  label: string;
  source: string;
  description?: string;
  example?: string;
}

export interface DashboardLayout {
  id: string;
  tenant_id: string;
  user_id: string;
  layout_name: string;
  widgets: DashboardWidget[];
  grid_layout: 'grid' | 'list';
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  visible: boolean;
  order: number;
  size?: 'small' | 'medium' | 'large';
  config?: Record<string, any>;
}

export type WidgetType =
  | 'executive-summary'
  | 'alerts'
  | 'historical-chart'
  | 'real-time'
  | 'custom-kpi'
  | 'cross-module-insights'
  | 'detailed-alerts';

export interface SaveLayoutInput {
  layout_name?: string;
  widgets: DashboardWidget[];
  grid_layout: 'grid' | 'list';
  is_default?: boolean;
}
