-- ============================================================================
-- M10: Document Workflow Automation - Database Schema
-- ============================================================================

-- ============================================================================
-- Table: document_workflow_rules
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.document_workflow_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  rule_name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('auto_approval', 'expiration_alert', 'auto_tagging', 'version_alert')),
  
  conditions JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '{}',
  
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  schedule_config JSONB,
  
  priority INTEGER NOT NULL DEFAULT 0,
  execution_order INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  last_executed_at TIMESTAMPTZ,
  execution_count INTEGER NOT NULL DEFAULT 0,
  
  CONSTRAINT unique_tenant_rule_name UNIQUE (tenant_id, rule_name)
);

CREATE INDEX idx_workflow_rules_tenant ON public.document_workflow_rules(tenant_id);
CREATE INDEX idx_workflow_rules_type ON public.document_workflow_rules(rule_type);
CREATE INDEX idx_workflow_rules_enabled ON public.document_workflow_rules(is_enabled) WHERE is_enabled = true;

-- ============================================================================
-- Table: document_workflow_executions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.document_workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES public.document_workflow_rules(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  
  execution_status TEXT NOT NULL CHECK (execution_status IN ('success', 'failed', 'skipped', 'pending')),
  execution_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  execution_completed_at TIMESTAMPTZ,
  execution_duration_ms INTEGER,
  
  actions_performed JSONB,
  error_message TEXT,
  error_details JSONB,
  trigger_event TEXT,
  metadata JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workflow_executions_tenant ON public.document_workflow_executions(tenant_id);
CREATE INDEX idx_workflow_executions_rule ON public.document_workflow_executions(rule_id);
CREATE INDEX idx_workflow_executions_document ON public.document_workflow_executions(document_id);
CREATE INDEX idx_workflow_executions_status ON public.document_workflow_executions(execution_status);
CREATE INDEX idx_workflow_executions_created_at ON public.document_workflow_executions(created_at DESC);

-- ============================================================================
-- RLS Policies
-- ============================================================================
ALTER TABLE public.document_workflow_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_workflow_executions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view and manage workflow rules in their tenant
CREATE POLICY "Authenticated users can access workflow rules"
  ON public.document_workflow_rules
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users can view workflow executions
CREATE POLICY "Authenticated users can view workflow executions"
  ON public.document_workflow_executions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Service role can insert workflow executions
CREATE POLICY "Service can insert workflow executions"
  ON public.document_workflow_executions
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- Triggers
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_workflow_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_workflow_rules_updated_at
  BEFORE UPDATE ON public.document_workflow_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_workflow_rules_updated_at();

-- ============================================================================
-- Maintenance Function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_old_workflow_executions(
  p_tenant_id UUID,
  p_days_to_keep INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.document_workflow_executions
  WHERE tenant_id = p_tenant_id
    AND created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL
    AND execution_status IN ('success', 'skipped');
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;