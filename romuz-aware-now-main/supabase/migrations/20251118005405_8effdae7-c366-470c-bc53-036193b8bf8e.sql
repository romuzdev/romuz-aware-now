
-- ============================================================================
-- M12: Audit Module Enhancement - Part 1: Database Layer
-- Week 5-8: Audit Workflows & Enhanced Finding Management
-- ============================================================================

-- ============================================================================
-- 1. Create audit_workflows table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  audit_id UUID NOT NULL REFERENCES public.grc_audits(id) ON DELETE CASCADE,
  
  -- Workflow Configuration
  workflow_type TEXT NOT NULL CHECK (workflow_type IN ('planning', 'execution', 'reporting', 'followup')),
  current_stage TEXT NOT NULL,
  stage_sequence INTEGER DEFAULT 1,
  total_stages INTEGER DEFAULT 3,
  
  -- Assignment & Ownership
  assigned_to UUID,
  assigned_at TIMESTAMPTZ,
  assigned_by UUID,
  
  -- Dates & Deadlines
  start_date DATE,
  due_date DATE,
  completed_date DATE,
  
  -- Status & Progress
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  progress_pct INTEGER DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  
  -- Metadata
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit Trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- ============================================================================
-- 2. Create Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_audit_workflows_tenant ON public.audit_workflows(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_workflows_audit ON public.audit_workflows(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_workflows_assigned ON public.audit_workflows(assigned_to);
CREATE INDEX IF NOT EXISTS idx_audit_workflows_status ON public.audit_workflows(status);
CREATE INDEX IF NOT EXISTS idx_audit_workflows_type ON public.audit_workflows(workflow_type);
CREATE INDEX IF NOT EXISTS idx_audit_workflows_due_date ON public.audit_workflows(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_workflows_created ON public.audit_workflows(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_workflows_tenant_status ON public.audit_workflows(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_workflows_audit_type ON public.audit_workflows(audit_id, workflow_type);

-- ============================================================================
-- 3. Enable Row Level Security
-- ============================================================================

ALTER TABLE public.audit_workflows ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. Create RLS Policies
-- ============================================================================

-- SELECT Policy: Users can view workflows in their tenant
CREATE POLICY "audit_workflows_select_policy"
  ON public.audit_workflows
  FOR SELECT
  USING (tenant_id = app_current_tenant_id());

-- INSERT Policy: Users can create workflows in their tenant
CREATE POLICY "audit_workflows_insert_policy"
  ON public.audit_workflows
  FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant_id()
    AND created_by = app_current_user_id()
    AND app_has_role('compliance_manager'::text)
  );

-- UPDATE Policy: Assigned users and managers can update
CREATE POLICY "audit_workflows_update_policy"
  ON public.audit_workflows
  FOR UPDATE
  USING (
    tenant_id = app_current_tenant_id()
    AND (
      assigned_to = app_current_user_id()
      OR app_has_role('compliance_manager'::text)
      OR app_has_role('admin'::text)
    )
  )
  WITH CHECK (
    tenant_id = app_current_tenant_id()
  );

-- DELETE Policy: Only compliance managers can delete
CREATE POLICY "audit_workflows_delete_policy"
  ON public.audit_workflows
  FOR DELETE
  USING (
    tenant_id = app_current_tenant_id()
    AND app_has_role('compliance_manager'::text)
  );

-- ============================================================================
-- 5. Create Trigger for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_audit_workflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_audit_workflow_timestamp
  BEFORE UPDATE ON public.audit_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_audit_workflow_updated_at();

-- ============================================================================
-- 6. Create Function to Auto-Log Workflow Changes
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_audit_workflow_change()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_payload JSONB;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    v_action := 'workflow.created';
    v_payload := jsonb_build_object(
      'workflow_type', NEW.workflow_type,
      'current_stage', NEW.current_stage,
      'assigned_to', NEW.assigned_to
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      v_action := 'workflow.status_changed';
      v_payload := jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'workflow_type', NEW.workflow_type
      );
    ELSIF OLD.current_stage != NEW.current_stage THEN
      v_action := 'workflow.stage_changed';
      v_payload := jsonb_build_object(
        'old_stage', OLD.current_stage,
        'new_stage', NEW.current_stage,
        'progress_pct', NEW.progress_pct
      );
    ELSE
      v_action := 'workflow.updated';
      v_payload := jsonb_build_object(
        'workflow_type', NEW.workflow_type,
        'current_stage', NEW.current_stage
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'workflow.deleted';
    v_payload := jsonb_build_object(
      'workflow_type', OLD.workflow_type,
      'status', OLD.status
    );
  END IF;

  -- Insert audit log
  INSERT INTO public.audit_log (
    tenant_id,
    entity_type,
    entity_id,
    action,
    actor,
    payload
  ) VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    'audit_workflow',
    COALESCE(NEW.id, OLD.id),
    v_action,
    COALESCE(NEW.updated_by, NEW.created_by, OLD.updated_by, app_current_user_id()),
    v_payload
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_log_audit_workflow_change
  AFTER INSERT OR UPDATE OR DELETE ON public.audit_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_workflow_change();

-- ============================================================================
-- 7. Add Composite Unique Constraint
-- ============================================================================

-- Ensure only one active workflow of each type per audit
CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_workflows_unique_active
  ON public.audit_workflows(audit_id, workflow_type)
  WHERE status NOT IN ('completed', 'cancelled');

-- ============================================================================
-- 8. Create Helper Function: Get Workflow Progress
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_audit_workflow_progress(p_audit_id UUID)
RETURNS TABLE (
  workflow_type TEXT,
  current_stage TEXT,
  progress_pct INTEGER,
  status TEXT,
  assigned_to UUID,
  due_date DATE,
  is_overdue BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.workflow_type,
    w.current_stage,
    w.progress_pct,
    w.status,
    w.assigned_to,
    w.due_date,
    (w.due_date < CURRENT_DATE AND w.status NOT IN ('completed', 'cancelled')) as is_overdue
  FROM public.audit_workflows w
  WHERE w.audit_id = p_audit_id
  ORDER BY w.workflow_type, w.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- 9. Create Function: Auto-Create Default Workflows
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_default_audit_workflows(p_audit_id UUID)
RETURNS void AS $$
DECLARE
  v_tenant_id UUID;
  v_lead_auditor UUID;
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  -- Get audit details
  SELECT tenant_id, lead_auditor_id, planned_start_date, planned_end_date
  INTO v_tenant_id, v_lead_auditor, v_start_date, v_end_date
  FROM public.grc_audits
  WHERE id = p_audit_id;

  -- Create Planning Workflow
  INSERT INTO public.audit_workflows (
    tenant_id, audit_id, workflow_type, current_stage,
    stage_sequence, total_stages, assigned_to,
    start_date, due_date, status, priority, created_by
  ) VALUES (
    v_tenant_id, p_audit_id, 'planning', 'scope_definition',
    1, 4, v_lead_auditor,
    v_start_date, v_start_date + INTERVAL '7 days', 'pending', 'high',
    app_current_user_id()
  );

  -- Create Execution Workflow
  INSERT INTO public.audit_workflows (
    tenant_id, audit_id, workflow_type, current_stage,
    stage_sequence, total_stages, assigned_to,
    start_date, due_date, status, priority, created_by
  ) VALUES (
    v_tenant_id, p_audit_id, 'execution', 'fieldwork',
    1, 3, v_lead_auditor,
    v_start_date + INTERVAL '7 days', v_end_date - INTERVAL '7 days', 'pending', 'high',
    app_current_user_id()
  );

  -- Create Reporting Workflow
  INSERT INTO public.audit_workflows (
    tenant_id, audit_id, workflow_type, current_stage,
    stage_sequence, total_stages, assigned_to,
    start_date, due_date, status, priority, created_by
  ) VALUES (
    v_tenant_id, p_audit_id, 'reporting', 'draft_preparation',
    1, 3, v_lead_auditor,
    v_end_date - INTERVAL '7 days', v_end_date, 'pending', 'high',
    app_current_user_id()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- 10. Insert Documentation in RLS Intentions
-- ============================================================================

INSERT INTO public._gate_g_rls_intentions (
  table_name,
  policy_intent,
  rbac_roles,
  notes
) VALUES (
  'audit_workflows',
  'Tenant isolation with role-based access control',
  'compliance_manager, admin',
  'M12: Audit workflows are tenant-isolated. compliance_manager can create/delete, assigned users can update their workflows.'
);

-- ============================================================================
-- Migration Complete
-- ============================================================================

COMMENT ON TABLE public.audit_workflows IS 'M12: Manages audit workflow stages and assignments for GRC audit execution';
COMMENT ON FUNCTION public.get_audit_workflow_progress IS 'Returns progress summary for all workflows of an audit';
COMMENT ON FUNCTION public.create_default_audit_workflows IS 'Auto-creates planning, execution, and reporting workflows for new audits';
