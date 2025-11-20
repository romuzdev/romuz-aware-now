-- ============================================================================
-- Gate-F D1 Standard Upgrade: Part 1 - Tables & Indexes
-- ============================================================================
-- This migration adds D1 Standard capabilities to Gate-F (Policy Management):
-- 1. Saved Policy Views (filtering, sorting, sharing)
-- 2. Import History tracking
-- 3. Bulk Operations tracking

-- ============================================================================
-- Table 1: gate_f_policy_views (Saved Views)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.gate_f_policy_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  view_name TEXT NOT NULL,
  description_ar TEXT,
  filters JSONB DEFAULT '{}'::jsonb,
  sort_config JSONB DEFAULT '{}'::jsonb,
  is_default BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT gate_f_policy_views_tenant_user_name_unique UNIQUE(tenant_id, user_id, view_name)
);

-- Indexes for gate_f_policy_views
CREATE INDEX IF NOT EXISTS idx_gate_f_policy_views_tenant ON public.gate_f_policy_views(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gate_f_policy_views_user ON public.gate_f_policy_views(user_id);
CREATE INDEX IF NOT EXISTS idx_gate_f_policy_views_shared ON public.gate_f_policy_views(tenant_id, is_shared) WHERE is_shared = true;
CREATE INDEX IF NOT EXISTS idx_gate_f_policy_views_default ON public.gate_f_policy_views(tenant_id, user_id, is_default) WHERE is_default = true;

COMMENT ON TABLE public.gate_f_policy_views IS 'Gate-F: Saved policy filter views with sharing capability';

-- RLS for gate_f_policy_views
ALTER TABLE public.gate_f_policy_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own views or shared views in their tenant"
  ON public.gate_f_policy_views FOR SELECT
  USING (
    tenant_id = app_current_tenant_id() 
    AND (user_id = auth.uid() OR is_shared = true)
  );

CREATE POLICY "Users can insert their own views"
  ON public.gate_f_policy_views FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant_id() 
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own views"
  ON public.gate_f_policy_views FOR UPDATE
  USING (
    tenant_id = app_current_tenant_id() 
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can delete their own views"
  ON public.gate_f_policy_views FOR DELETE
  USING (
    tenant_id = app_current_tenant_id() 
    AND user_id = auth.uid()
  );

-- ============================================================================
-- Table 2: gate_f_import_history (Import Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.gate_f_import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('csv', 'json')),
  total_rows INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  errors JSONB,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for gate_f_import_history
CREATE INDEX IF NOT EXISTS idx_gate_f_import_history_tenant ON public.gate_f_import_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gate_f_import_history_user ON public.gate_f_import_history(user_id);
CREATE INDEX IF NOT EXISTS idx_gate_f_import_history_status ON public.gate_f_import_history(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_gate_f_import_history_created ON public.gate_f_import_history(tenant_id, created_at DESC);

COMMENT ON TABLE public.gate_f_import_history IS 'Gate-F: Policy import operation history and error tracking';

-- RLS for gate_f_import_history
ALTER TABLE public.gate_f_import_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own import history"
  ON public.gate_f_import_history FOR SELECT
  USING (
    tenant_id = app_current_tenant_id() 
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can insert their own import history"
  ON public.gate_f_import_history FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant_id() 
    AND user_id = auth.uid()
  );

-- ============================================================================
-- Table 3: gate_f_bulk_operations (Bulk Operations Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.gate_f_bulk_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('status_update', 'delete', 'archive')),
  policy_ids UUID[] NOT NULL,
  operation_data JSONB DEFAULT '{}'::jsonb,
  affected_count INTEGER NOT NULL DEFAULT 0,
  errors JSONB,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'partial', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Indexes for gate_f_bulk_operations
CREATE INDEX IF NOT EXISTS idx_gate_f_bulk_ops_tenant ON public.gate_f_bulk_operations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gate_f_bulk_ops_user ON public.gate_f_bulk_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_gate_f_bulk_ops_type ON public.gate_f_bulk_operations(tenant_id, operation_type);
CREATE INDEX IF NOT EXISTS idx_gate_f_bulk_ops_status ON public.gate_f_bulk_operations(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_gate_f_bulk_ops_created ON public.gate_f_bulk_operations(tenant_id, created_at DESC);

COMMENT ON TABLE public.gate_f_bulk_operations IS 'Gate-F: Bulk policy operation tracking with audit trail';

-- RLS for gate_f_bulk_operations
ALTER TABLE public.gate_f_bulk_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bulk operations"
  ON public.gate_f_bulk_operations FOR SELECT
  USING (
    tenant_id = app_current_tenant_id() 
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can insert their own bulk operations"
  ON public.gate_f_bulk_operations FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant_id() 
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own bulk operations"
  ON public.gate_f_bulk_operations FOR UPDATE
  USING (
    tenant_id = app_current_tenant_id() 
    AND user_id = auth.uid()
  );