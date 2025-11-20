-- ============================================================================
-- Week 2: Control Management - Database Schema
-- ============================================================================

-- ============================================================================
-- Table: grc_controls (Control Library)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.grc_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- Control Identification
  control_code TEXT NOT NULL,
  control_title TEXT NOT NULL,
  control_description TEXT,
  control_objective TEXT,
  
  -- Control Classification
  control_type TEXT NOT NULL CHECK (control_type IN ('preventive', 'detective', 'corrective', 'directive')),
  control_category TEXT NOT NULL CHECK (control_category IN ('access_control', 'data_protection', 'physical_security', 'operational', 'technical', 'administrative', 'compliance')),
  control_nature TEXT NOT NULL CHECK (control_nature IN ('manual', 'automated', 'hybrid')),
  
  -- Control Frequency & Effectiveness
  testing_frequency TEXT NOT NULL CHECK (testing_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annually', 'ad_hoc')),
  effectiveness_rating TEXT CHECK (effectiveness_rating IN ('not_tested', 'ineffective', 'partially_effective', 'effective', 'highly_effective')),
  maturity_level TEXT CHECK (maturity_level IN ('initial', 'developing', 'defined', 'managed', 'optimized')),
  
  -- Ownership & Responsibility
  control_owner_id UUID,
  control_operator_id UUID,
  
  -- Framework Mapping
  framework_references JSONB DEFAULT '[]'::jsonb, -- [{framework: 'ISO27001', control_id: 'A.9.1.1'}, ...]
  
  -- Risk Linkage
  linked_risk_ids UUID[],
  
  -- Status & Lifecycle
  control_status TEXT NOT NULL DEFAULT 'draft' CHECK (control_status IN ('draft', 'active', 'inactive', 'retired')),
  implementation_date DATE,
  last_test_date DATE,
  next_test_date DATE,
  
  -- Documentation
  control_procedures TEXT,
  evidence_requirements TEXT[],
  tags TEXT[],
  
  -- Audit Fields
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  
  -- Constraints
  CONSTRAINT grc_controls_tenant_code_unique UNIQUE (tenant_id, control_code)
);

-- RLS Policies for grc_controls
ALTER TABLE public.grc_controls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view controls in their tenant"
  ON public.grc_controls FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create controls in their tenant"
  ON public.grc_controls FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update controls in their tenant"
  ON public.grc_controls FOR UPDATE
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete controls in their tenant"
  ON public.grc_controls FOR DELETE
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Indexes for grc_controls
CREATE INDEX idx_grc_controls_tenant_id ON public.grc_controls(tenant_id);
CREATE INDEX idx_grc_controls_control_code ON public.grc_controls(control_code);
CREATE INDEX idx_grc_controls_control_type ON public.grc_controls(control_type);
CREATE INDEX idx_grc_controls_control_category ON public.grc_controls(control_category);
CREATE INDEX idx_grc_controls_control_status ON public.grc_controls(control_status);
CREATE INDEX idx_grc_controls_effectiveness_rating ON public.grc_controls(effectiveness_rating);
CREATE INDEX idx_grc_controls_control_owner_id ON public.grc_controls(control_owner_id);
CREATE INDEX idx_grc_controls_next_test_date ON public.grc_controls(next_test_date);
CREATE INDEX idx_grc_controls_tags ON public.grc_controls USING gin(tags);
CREATE INDEX idx_grc_controls_linked_risk_ids ON public.grc_controls USING gin(linked_risk_ids);
CREATE INDEX idx_grc_controls_created_at ON public.grc_controls(created_at DESC);
CREATE INDEX idx_grc_controls_updated_at ON public.grc_controls(updated_at DESC);

-- Trigger for grc_controls updated_at
CREATE TRIGGER set_grc_controls_updated_at
  BEFORE UPDATE ON public.grc_controls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Table: grc_control_tests (Control Testing Records)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.grc_control_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  control_id UUID NOT NULL REFERENCES public.grc_controls(id) ON DELETE CASCADE,
  
  -- Test Identification
  test_code TEXT NOT NULL,
  test_title TEXT NOT NULL,
  test_description TEXT,
  
  -- Test Execution
  test_date DATE NOT NULL,
  test_type TEXT NOT NULL CHECK (test_type IN ('design', 'operating_effectiveness', 'compliance', 'walkthrough')),
  test_method TEXT NOT NULL CHECK (test_method IN ('inspection', 'observation', 'inquiry', 'reperformance', 'analytical')),
  
  -- Test Scope
  sample_size INTEGER,
  population_size INTEGER,
  testing_period_start DATE,
  testing_period_end DATE,
  
  -- Test Results
  test_result TEXT NOT NULL CHECK (test_result IN ('passed', 'passed_with_exceptions', 'failed', 'not_applicable')),
  effectiveness_conclusion TEXT CHECK (effectiveness_conclusion IN ('effective', 'partially_effective', 'ineffective', 'not_determined')),
  
  -- Findings & Evidence
  test_findings TEXT,
  exceptions_noted TEXT,
  evidence_collected TEXT[],
  evidence_file_paths TEXT[],
  
  -- Follow-up & Remediation
  requires_remediation BOOLEAN DEFAULT false,
  remediation_plan TEXT,
  remediation_due_date DATE,
  remediation_status TEXT CHECK (remediation_status IN ('not_required', 'planned', 'in_progress', 'completed', 'overdue')),
  
  -- Personnel
  tested_by UUID NOT NULL,
  reviewed_by UUID,
  approved_by UUID,
  
  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  
  -- Constraints
  CONSTRAINT grc_control_tests_tenant_code_unique UNIQUE (tenant_id, test_code)
);

-- RLS Policies for grc_control_tests
ALTER TABLE public.grc_control_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view control tests in their tenant"
  ON public.grc_control_tests FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create control tests in their tenant"
  ON public.grc_control_tests FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update control tests in their tenant"
  ON public.grc_control_tests FOR UPDATE
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete control tests in their tenant"
  ON public.grc_control_tests FOR DELETE
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Indexes for grc_control_tests
CREATE INDEX idx_grc_control_tests_tenant_id ON public.grc_control_tests(tenant_id);
CREATE INDEX idx_grc_control_tests_control_id ON public.grc_control_tests(control_id);
CREATE INDEX idx_grc_control_tests_test_code ON public.grc_control_tests(test_code);
CREATE INDEX idx_grc_control_tests_test_date ON public.grc_control_tests(test_date DESC);
CREATE INDEX idx_grc_control_tests_test_result ON public.grc_control_tests(test_result);
CREATE INDEX idx_grc_control_tests_tested_by ON public.grc_control_tests(tested_by);
CREATE INDEX idx_grc_control_tests_remediation_status ON public.grc_control_tests(remediation_status);
CREATE INDEX idx_grc_control_tests_created_at ON public.grc_control_tests(created_at DESC);

-- Trigger for grc_control_tests updated_at
CREATE TRIGGER set_grc_control_tests_updated_at
  BEFORE UPDATE ON public.grc_control_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Function: Update Control Effectiveness After Test
-- ============================================================================
CREATE OR REPLACE FUNCTION update_control_effectiveness_after_test()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the control's effectiveness rating and last test date
  UPDATE public.grc_controls
  SET 
    effectiveness_rating = CASE 
      WHEN NEW.effectiveness_conclusion = 'effective' THEN 'effective'
      WHEN NEW.effectiveness_conclusion = 'partially_effective' THEN 'partially_effective'
      WHEN NEW.effectiveness_conclusion = 'ineffective' THEN 'ineffective'
      ELSE effectiveness_rating
    END,
    last_test_date = NEW.test_date,
    updated_at = now()
  WHERE id = NEW.control_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update control effectiveness after test insert/update
CREATE TRIGGER trigger_update_control_effectiveness
  AFTER INSERT OR UPDATE ON public.grc_control_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_control_effectiveness_after_test();

COMMENT ON TABLE public.grc_controls IS 'GRC Control Library - stores all internal controls';
COMMENT ON TABLE public.grc_control_tests IS 'GRC Control Tests - records control testing activities and results';