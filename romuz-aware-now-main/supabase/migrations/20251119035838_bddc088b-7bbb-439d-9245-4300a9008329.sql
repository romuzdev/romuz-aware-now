-- M12 - Audit Workflows Enhancement: Advanced Workflow Stages & Findings Categorization
-- Part 1: Database Schema

-- ============================================================================
-- 1. Audit Workflow Stages Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_workflow_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.audit_workflows(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  stage_name_ar TEXT,
  sequence_order INT NOT NULL,
  required_actions JSONB DEFAULT '[]'::jsonb,
  approval_required BOOLEAN DEFAULT false,
  approver_role TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  notes TEXT,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for audit_workflow_stages
CREATE INDEX IF NOT EXISTS idx_audit_workflow_stages_workflow_id ON public.audit_workflow_stages(workflow_id);
CREATE INDEX IF NOT EXISTS idx_audit_workflow_stages_tenant_id ON public.audit_workflow_stages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_workflow_stages_status ON public.audit_workflow_stages(status);
CREATE INDEX IF NOT EXISTS idx_audit_workflow_stages_sequence ON public.audit_workflow_stages(workflow_id, sequence_order);

-- ============================================================================
-- 2. Audit Findings Categories Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_findings_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.grc_audits(id) ON DELETE CASCADE,
  category_code TEXT NOT NULL,
  category_name TEXT NOT NULL,
  category_name_ar TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  finding_ar TEXT NOT NULL,
  finding_en TEXT,
  recommendation_ar TEXT,
  recommendation_en TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'accepted_risk')),
  assigned_to UUID,
  due_date DATE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT,
  evidence_urls TEXT[],
  impact_description TEXT,
  root_cause TEXT,
  control_ref TEXT,
  framework_ref TEXT,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- Indexes for audit_findings_categories
CREATE INDEX IF NOT EXISTS idx_audit_findings_categories_audit_id ON public.audit_findings_categories(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_findings_categories_tenant_id ON public.audit_findings_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_findings_categories_severity ON public.audit_findings_categories(severity);
CREATE INDEX IF NOT EXISTS idx_audit_findings_categories_status ON public.audit_findings_categories(status);
CREATE INDEX IF NOT EXISTS idx_audit_findings_categories_assigned_to ON public.audit_findings_categories(assigned_to);
CREATE INDEX IF NOT EXISTS idx_audit_findings_categories_category ON public.audit_findings_categories(category_code);

-- ============================================================================
-- 3. RLS Policies for audit_workflow_stages
-- ============================================================================
ALTER TABLE public.audit_workflow_stages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view stages for their tenant
CREATE POLICY "Users can view workflow stages for their tenant"
  ON public.audit_workflow_stages
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can create workflow stages for their tenant
CREATE POLICY "Users can create workflow stages for their tenant"
  ON public.audit_workflow_stages
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update workflow stages for their tenant
CREATE POLICY "Users can update workflow stages for their tenant"
  ON public.audit_workflow_stages
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete workflow stages for their tenant
CREATE POLICY "Users can delete workflow stages for their tenant"
  ON public.audit_workflow_stages
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. RLS Policies for audit_findings_categories
-- ============================================================================
ALTER TABLE public.audit_findings_categories ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view findings for their tenant
CREATE POLICY "Users can view audit findings for their tenant"
  ON public.audit_findings_categories
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can create findings for their tenant
CREATE POLICY "Users can create audit findings for their tenant"
  ON public.audit_findings_categories
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update findings for their tenant
CREATE POLICY "Users can update audit findings for their tenant"
  ON public.audit_findings_categories
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete findings for their tenant
CREATE POLICY "Users can delete audit findings for their tenant"
  ON public.audit_findings_categories
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. Updated_at Triggers
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for audit_workflow_stages
DROP TRIGGER IF EXISTS set_updated_at_audit_workflow_stages ON public.audit_workflow_stages;
CREATE TRIGGER set_updated_at_audit_workflow_stages
  BEFORE UPDATE ON public.audit_workflow_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for audit_findings_categories
DROP TRIGGER IF EXISTS set_updated_at_audit_findings_categories ON public.audit_findings_categories;
CREATE TRIGGER set_updated_at_audit_findings_categories
  BEFORE UPDATE ON public.audit_findings_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 6. Helper Functions
-- ============================================================================

-- Function: Get workflow stage progress
CREATE OR REPLACE FUNCTION public.get_workflow_stage_progress(p_workflow_id UUID)
RETURNS TABLE (
  total_stages INT,
  completed_stages INT,
  current_stage TEXT,
  progress_pct NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INT as total_stages,
    COUNT(*) FILTER (WHERE status = 'completed')::INT as completed_stages,
    (SELECT stage_name FROM public.audit_workflow_stages 
     WHERE workflow_id = p_workflow_id AND status = 'in_progress' 
     ORDER BY sequence_order LIMIT 1) as current_stage,
    ROUND((COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / NULLIF(COUNT(*)::NUMERIC, 0)) * 100, 2) as progress_pct
  FROM public.audit_workflow_stages
  WHERE workflow_id = p_workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get findings summary by severity
CREATE OR REPLACE FUNCTION public.get_findings_summary(p_audit_id UUID)
RETURNS TABLE (
  severity TEXT,
  count BIGINT,
  open_count BIGINT,
  resolved_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.severity,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE f.status IN ('open', 'in_progress')) as open_count,
    COUNT(*) FILTER (WHERE f.status = 'resolved') as resolved_count
  FROM public.audit_findings_categories f
  WHERE f.audit_id = p_audit_id
  GROUP BY f.severity
  ORDER BY 
    CASE f.severity
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. Comments for Documentation
-- ============================================================================
COMMENT ON TABLE public.audit_workflow_stages IS 'M12: Detailed stages for audit workflows with approval tracking';
COMMENT ON TABLE public.audit_findings_categories IS 'M12: Categorized audit findings with severity and resolution tracking';

COMMENT ON COLUMN public.audit_workflow_stages.required_actions IS 'JSON array of required actions/tasks for this stage';
COMMENT ON COLUMN public.audit_workflow_stages.approval_required IS 'Whether this stage requires approval before completion';
COMMENT ON COLUMN public.audit_findings_categories.category_code IS 'Standard category code (e.g., AC-01, IA-02)';
COMMENT ON COLUMN public.audit_findings_categories.severity IS 'Finding severity: low, medium, high, critical';
COMMENT ON COLUMN public.audit_findings_categories.status IS 'Finding status: open, in_progress, resolved, accepted_risk';