-- =====================================================
-- Gate-J D1 Standard Upgrade: Database Layer
-- Part 1: Tables + Indexes + RLS Policies
-- =====================================================

-- ===================
-- 1. gate_j_impact_views (Saved Views)
-- ===================
CREATE TABLE IF NOT EXISTS public.gate_j_impact_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  view_name TEXT NOT NULL,
  description_ar TEXT,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT gate_j_impact_views_unique_name UNIQUE (tenant_id, user_id, view_name),
  CONSTRAINT gate_j_impact_views_filters_check CHECK (jsonb_typeof(filters) = 'object'),
  CONSTRAINT gate_j_impact_views_sort_check CHECK (jsonb_typeof(sort_config) = 'object')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gate_j_impact_views_tenant ON public.gate_j_impact_views(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gate_j_impact_views_user ON public.gate_j_impact_views(user_id);
CREATE INDEX IF NOT EXISTS idx_gate_j_impact_views_default ON public.gate_j_impact_views(tenant_id, user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_gate_j_impact_views_shared ON public.gate_j_impact_views(tenant_id, is_shared) WHERE is_shared = true;

-- RLS
ALTER TABLE public.gate_j_impact_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own views or shared views"
  ON public.gate_j_impact_views
  FOR SELECT
  USING (
    tenant_id = app_current_tenant_id() AND
    (user_id = app_current_user_id() OR is_shared = true)
  );

CREATE POLICY "Users can create their own views"
  ON public.gate_j_impact_views
  FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant_id() AND
    user_id = app_current_user_id()
  );

CREATE POLICY "Users can update their own views"
  ON public.gate_j_impact_views
  FOR UPDATE
  USING (
    tenant_id = app_current_tenant_id() AND
    user_id = app_current_user_id()
  );

CREATE POLICY "Users can delete their own views"
  ON public.gate_j_impact_views
  FOR DELETE
  USING (
    tenant_id = app_current_tenant_id() AND
    user_id = app_current_user_id()
  );

-- ===================
-- 2. gate_j_import_history (Import History)
-- ===================
CREATE TABLE IF NOT EXISTS public.gate_j_import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('csv', 'json', 'excel')),
  total_rows INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  errors JSONB,
  status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT gate_j_import_history_errors_check CHECK (jsonb_typeof(errors) = 'array' OR errors IS NULL)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gate_j_import_history_tenant ON public.gate_j_import_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gate_j_import_history_user ON public.gate_j_import_history(user_id);
CREATE INDEX IF NOT EXISTS idx_gate_j_import_history_created ON public.gate_j_import_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gate_j_import_history_status ON public.gate_j_import_history(tenant_id, status);

-- RLS
ALTER TABLE public.gate_j_import_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own import history"
  ON public.gate_j_import_history
  FOR SELECT
  USING (
    tenant_id = app_current_tenant_id() AND
    user_id = app_current_user_id()
  );

CREATE POLICY "Users can create import records"
  ON public.gate_j_import_history
  FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant_id() AND
    user_id = app_current_user_id()
  );

-- ===================
-- 3. gate_j_bulk_operations (Bulk Operations)
-- ===================
CREATE TABLE IF NOT EXISTS public.gate_j_bulk_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('recompute', 'recalibrate', 'delete', 'export')),
  impact_score_ids UUID[] NOT NULL,
  operation_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  affected_count INTEGER NOT NULL DEFAULT 0,
  errors JSONB,
  status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'partial', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT gate_j_bulk_operations_errors_check CHECK (jsonb_typeof(errors) = 'array' OR errors IS NULL)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gate_j_bulk_operations_tenant ON public.gate_j_bulk_operations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gate_j_bulk_operations_user ON public.gate_j_bulk_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_gate_j_bulk_operations_created ON public.gate_j_bulk_operations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gate_j_bulk_operations_status ON public.gate_j_bulk_operations(tenant_id, status);

-- RLS
ALTER TABLE public.gate_j_bulk_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bulk operations"
  ON public.gate_j_bulk_operations
  FOR SELECT
  USING (
    tenant_id = app_current_tenant_id() AND
    user_id = app_current_user_id()
  );

CREATE POLICY "Users can create bulk operations"
  ON public.gate_j_bulk_operations
  FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant_id() AND
    user_id = app_current_user_id()
  );

CREATE POLICY "System can update bulk operations"
  ON public.gate_j_bulk_operations
  FOR UPDATE
  USING (tenant_id = app_current_tenant_id());

-- =====================================================
-- Comments for Documentation
-- =====================================================
COMMENT ON TABLE public.gate_j_impact_views IS 'Gate-J D1: Saved Views for Impact Score Analysis';
COMMENT ON TABLE public.gate_j_import_history IS 'Gate-J D1: Import History for Impact Scores';
COMMENT ON TABLE public.gate_j_bulk_operations IS 'Gate-J D1: Bulk Operations on Impact Scores';

COMMENT ON COLUMN public.gate_j_impact_views.filters IS 'Filters: {orgUnitId?, periodYear?, periodMonth?, riskLevel?, minScore?, maxScore?}';
COMMENT ON COLUMN public.gate_j_impact_views.sort_config IS 'Sort Config: {field: string, direction: "asc"|"desc"}';
COMMENT ON COLUMN public.gate_j_bulk_operations.operation_data IS 'Operation-specific data (e.g., new weights for recalibrate)';
COMMENT ON COLUMN public.gate_j_bulk_operations.impact_score_ids IS 'Array of impact score IDs to operate on';