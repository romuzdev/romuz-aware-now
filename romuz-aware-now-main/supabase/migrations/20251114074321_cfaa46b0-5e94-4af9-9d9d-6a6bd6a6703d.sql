-- ============================================================================
-- Gate-H: D1 Standard Upgrade - Part 1 (Database Schema)
-- ============================================================================
-- Features: Saved Views, Import History, Bulk Operations Audit
-- Compliance: Multi-tenant, RLS, Audit Trail

-- ============================================================
-- 1) Saved Views Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gate_h_action_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  view_name TEXT NOT NULL,
  description_ar TEXT,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_config JSONB,
  is_default BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT gate_h_action_views_tenant_fk 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
  CONSTRAINT gate_h_action_views_unique_name 
    UNIQUE (tenant_id, user_id, view_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gate_h_action_views_tenant 
  ON public.gate_h_action_views(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gate_h_action_views_user 
  ON public.gate_h_action_views(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_gate_h_action_views_shared 
  ON public.gate_h_action_views(tenant_id, is_shared) WHERE is_shared = true;

-- RLS Policies
ALTER TABLE public.gate_h_action_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own and shared views"
  ON public.gate_h_action_views FOR SELECT
  USING (
    tenant_id = app_current_tenant_id() 
    AND (user_id = app_current_user_id() OR is_shared = true)
  );

CREATE POLICY "Users can create own views"
  ON public.gate_h_action_views FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant_id() 
    AND user_id = app_current_user_id()
  );

CREATE POLICY "Users can update own views"
  ON public.gate_h_action_views FOR UPDATE
  USING (
    tenant_id = app_current_tenant_id() 
    AND user_id = app_current_user_id()
  );

CREATE POLICY "Users can delete own views"
  ON public.gate_h_action_views FOR DELETE
  USING (
    tenant_id = app_current_tenant_id() 
    AND user_id = app_current_user_id()
  );

-- Trigger for updated_at
CREATE TRIGGER update_gate_h_action_views_updated_at
  BEFORE UPDATE ON public.gate_h_action_views
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2) Import History Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gate_h_import_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('csv', 'json', 'excel')),
  total_rows INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  errors JSONB,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT gate_h_import_history_tenant_fk 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gate_h_import_history_tenant 
  ON public.gate_h_import_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gate_h_import_history_user 
  ON public.gate_h_import_history(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_gate_h_import_history_status 
  ON public.gate_h_import_history(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_gate_h_import_history_created 
  ON public.gate_h_import_history(tenant_id, created_at DESC);

-- RLS Policies
ALTER TABLE public.gate_h_import_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own import history"
  ON public.gate_h_import_history FOR SELECT
  USING (
    tenant_id = app_current_tenant_id() 
    AND user_id = app_current_user_id()
  );

CREATE POLICY "Users can create import records"
  ON public.gate_h_import_history FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant_id() 
    AND user_id = app_current_user_id()
  );

-- ============================================================
-- 3) Bulk Operations Audit Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gate_h_bulk_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('status_update', 'assign', 'delete', 'tag')),
  action_ids UUID[] NOT NULL,
  operation_data JSONB NOT NULL,
  affected_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'partial')),
  errors JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  
  CONSTRAINT gate_h_bulk_operations_tenant_fk 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gate_h_bulk_operations_tenant 
  ON public.gate_h_bulk_operations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gate_h_bulk_operations_user 
  ON public.gate_h_bulk_operations(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_gate_h_bulk_operations_type 
  ON public.gate_h_bulk_operations(tenant_id, operation_type);
CREATE INDEX IF NOT EXISTS idx_gate_h_bulk_operations_created 
  ON public.gate_h_bulk_operations(tenant_id, created_at DESC);

-- RLS Policies
ALTER TABLE public.gate_h_bulk_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bulk operations"
  ON public.gate_h_bulk_operations FOR SELECT
  USING (tenant_id = app_current_tenant_id());

CREATE POLICY "Users can create bulk operations"
  ON public.gate_h_bulk_operations FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant_id() 
    AND user_id = app_current_user_id()
  );

-- ============================================================
-- 4) Add missing indexes to gate_h.action_items (performance)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_gate_h_action_items_status 
  ON gate_h.action_items(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_gate_h_action_items_priority 
  ON gate_h.action_items(tenant_id, priority);
CREATE INDEX IF NOT EXISTS idx_gate_h_action_items_assignee 
  ON gate_h.action_items(tenant_id, assignee_user_id) WHERE assignee_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gate_h_action_items_due_date 
  ON gate_h.action_items(tenant_id, due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gate_h_action_items_tags 
  ON gate_h.action_items USING GIN(tags) WHERE tags IS NOT NULL;

-- ============================================================
-- 5) Comments
-- ============================================================
COMMENT ON TABLE public.gate_h_action_views IS 'Gate-H: Saved filter views for action items (D1 Standard)';
COMMENT ON TABLE public.gate_h_import_history IS 'Gate-H: Import operation history and audit trail (D1 Standard)';
COMMENT ON TABLE public.gate_h_bulk_operations IS 'Gate-H: Bulk operation audit trail (D1 Standard)';

COMMENT ON COLUMN public.gate_h_action_views.filters IS 'JSONB: {statuses, priorities, assigneeUserId, overdueOnly, tags, source}';
COMMENT ON COLUMN public.gate_h_action_views.sort_config IS 'JSONB: {field, direction}';
COMMENT ON COLUMN public.gate_h_import_history.errors IS 'JSONB: Array of error objects with row numbers and messages';
COMMENT ON COLUMN public.gate_h_bulk_operations.operation_data IS 'JSONB: Operation-specific parameters (e.g., newStatus, assigneeId)';
COMMENT ON COLUMN public.gate_h_bulk_operations.errors IS 'JSONB: Array of failed action IDs with error messages';