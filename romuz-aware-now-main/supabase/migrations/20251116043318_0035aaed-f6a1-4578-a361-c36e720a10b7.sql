-- ============================================
-- GRC Platform - Risk Management Module
-- Week 1: Core Setup & Risk Management
-- ============================================

-- ============================================
-- TABLE: grc_risks
-- Risk Register - Core risk entities
-- ============================================
CREATE TABLE IF NOT EXISTS public.grc_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  
  -- Risk Identification
  risk_code TEXT NOT NULL,
  risk_title TEXT NOT NULL,
  risk_description TEXT,
  risk_category TEXT NOT NULL, -- strategic, operational, financial, compliance, reputational, technology
  risk_owner_id UUID, -- User responsible for the risk
  
  -- Risk Classification
  risk_type TEXT NOT NULL DEFAULT 'threat', -- threat, opportunity
  likelihood_level TEXT NOT NULL DEFAULT 'medium', -- very_low, low, medium, high, very_high
  impact_level TEXT NOT NULL DEFAULT 'medium', -- very_low, low, medium, high, very_high
  
  -- Risk Scoring (1-5 scale)
  likelihood_score INTEGER NOT NULL DEFAULT 3 CHECK (likelihood_score BETWEEN 1 AND 5),
  impact_score INTEGER NOT NULL DEFAULT 3 CHECK (impact_score BETWEEN 1 AND 5),
  inherent_risk_score NUMERIC GENERATED ALWAYS AS (likelihood_score * impact_score) STORED,
  
  -- Current Risk Level (after controls)
  current_likelihood_score INTEGER DEFAULT 3 CHECK (current_likelihood_score BETWEEN 1 AND 5),
  current_impact_score INTEGER DEFAULT 3 CHECK (current_impact_score BETWEEN 1 AND 5),
  residual_risk_score NUMERIC GENERATED ALWAYS AS (
    CASE 
      WHEN current_likelihood_score IS NOT NULL AND current_impact_score IS NOT NULL 
      THEN current_likelihood_score * current_impact_score 
      ELSE NULL 
    END
  ) STORED,
  
  -- Risk Status & Treatment
  risk_status TEXT NOT NULL DEFAULT 'identified', -- identified, assessed, treated, monitored, closed
  treatment_strategy TEXT, -- avoid, mitigate, transfer, accept
  risk_appetite TEXT, -- low, medium, high
  
  -- Related Entities
  related_policy_ids UUID[], -- Links to policies
  related_objective_ids UUID[], -- Links to objectives
  tags TEXT[],
  
  -- Metadata
  identified_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_review_date DATE,
  next_review_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  
  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  
  -- Constraints
  CONSTRAINT unique_risk_code_per_tenant UNIQUE (tenant_id, risk_code)
);

-- Indexes for grc_risks
CREATE INDEX idx_grc_risks_tenant_id ON public.grc_risks(tenant_id);
CREATE INDEX idx_grc_risks_status ON public.grc_risks(risk_status);
CREATE INDEX idx_grc_risks_category ON public.grc_risks(risk_category);
CREATE INDEX idx_grc_risks_owner ON public.grc_risks(risk_owner_id);
CREATE INDEX idx_grc_risks_inherent_score ON public.grc_risks(inherent_risk_score);
CREATE INDEX idx_grc_risks_residual_score ON public.grc_risks(residual_risk_score);
CREATE INDEX idx_grc_risks_next_review ON public.grc_risks(next_review_date);
CREATE INDEX idx_grc_risks_tags ON public.grc_risks USING GIN(tags);

COMMENT ON TABLE public.grc_risks IS 'GRC Risk Register - Core risk entities with inherent and residual risk calculations';

-- ============================================
-- TABLE: grc_risk_assessments
-- Risk Assessment History & Details
-- ============================================
CREATE TABLE IF NOT EXISTS public.grc_risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  risk_id UUID NOT NULL REFERENCES public.grc_risks(id) ON DELETE CASCADE,
  
  -- Assessment Details
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  assessment_type TEXT NOT NULL DEFAULT 'periodic', -- initial, periodic, ad_hoc, incident_triggered
  
  -- Risk Analysis
  likelihood_score INTEGER NOT NULL CHECK (likelihood_score BETWEEN 1 AND 5),
  impact_score INTEGER NOT NULL CHECK (impact_score BETWEEN 1 AND 5),
  risk_score NUMERIC GENERATED ALWAYS AS (likelihood_score * impact_score) STORED,
  risk_level TEXT NOT NULL, -- very_low, low, medium, high, very_high
  
  -- Assessment Context
  assessment_method TEXT, -- qualitative, quantitative, semi_quantitative
  scenario_description TEXT,
  assumptions TEXT,
  limitations TEXT,
  
  -- Participants
  assessed_by UUID NOT NULL, -- User who performed assessment
  reviewed_by UUID, -- User who reviewed assessment
  approved_by UUID, -- User who approved assessment
  approval_date DATE,
  
  -- Assessment Results
  key_findings TEXT,
  recommendations TEXT,
  control_effectiveness_rating TEXT, -- effective, partially_effective, ineffective, not_applicable
  
  -- Status
  assessment_status TEXT NOT NULL DEFAULT 'draft', -- draft, submitted, approved, rejected
  
  -- Metadata
  notes TEXT,
  attachments_json JSONB DEFAULT '[]'::jsonb,
  
  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Indexes for grc_risk_assessments
CREATE INDEX idx_grc_risk_assessments_tenant_id ON public.grc_risk_assessments(tenant_id);
CREATE INDEX idx_grc_risk_assessments_risk_id ON public.grc_risk_assessments(risk_id);
CREATE INDEX idx_grc_risk_assessments_date ON public.grc_risk_assessments(assessment_date);
CREATE INDEX idx_grc_risk_assessments_status ON public.grc_risk_assessments(assessment_status);
CREATE INDEX idx_grc_risk_assessments_level ON public.grc_risk_assessments(risk_level);

COMMENT ON TABLE public.grc_risk_assessments IS 'GRC Risk Assessment History - Tracks risk assessments over time';

-- ============================================
-- TABLE: grc_risk_treatment_plans
-- Risk Treatment Plans & Actions
-- ============================================
CREATE TABLE IF NOT EXISTS public.grc_risk_treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  risk_id UUID NOT NULL REFERENCES public.grc_risks(id) ON DELETE CASCADE,
  
  -- Treatment Plan Details
  plan_title TEXT NOT NULL,
  plan_description TEXT,
  treatment_strategy TEXT NOT NULL, -- avoid, mitigate, transfer, accept
  
  -- Treatment Actions
  actions_json JSONB DEFAULT '[]'::jsonb, -- Array of treatment actions
  -- Each action: {title, description, owner_id, due_date, status, completion_date}
  
  -- Target Risk Level
  target_likelihood_score INTEGER CHECK (target_likelihood_score BETWEEN 1 AND 5),
  target_impact_score INTEGER CHECK (target_impact_score BETWEEN 1 AND 5),
  target_risk_score NUMERIC GENERATED ALWAYS AS (
    CASE 
      WHEN target_likelihood_score IS NOT NULL AND target_impact_score IS NOT NULL 
      THEN target_likelihood_score * target_impact_score 
      ELSE NULL 
    END
  ) STORED,
  
  -- Plan Status & Timeline
  plan_status TEXT NOT NULL DEFAULT 'planned', -- planned, in_progress, completed, cancelled, on_hold
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  start_date DATE,
  due_date DATE,
  completion_date DATE,
  
  -- Resources & Budget
  estimated_cost NUMERIC,
  actual_cost NUMERIC,
  resources_required TEXT,
  
  -- Ownership & Accountability
  plan_owner_id UUID NOT NULL, -- User responsible for plan
  approved_by UUID,
  approval_date DATE,
  
  -- Progress Tracking
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  last_review_date DATE,
  next_review_date DATE,
  
  -- Effectiveness
  effectiveness_rating TEXT, -- not_started, poor, fair, good, excellent
  effectiveness_notes TEXT,
  
  -- Metadata
  notes TEXT,
  attachments_json JSONB DEFAULT '[]'::jsonb,
  
  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Indexes for grc_risk_treatment_plans
CREATE INDEX idx_grc_risk_treatment_plans_tenant_id ON public.grc_risk_treatment_plans(tenant_id);
CREATE INDEX idx_grc_risk_treatment_plans_risk_id ON public.grc_risk_treatment_plans(risk_id);
CREATE INDEX idx_grc_risk_treatment_plans_status ON public.grc_risk_treatment_plans(plan_status);
CREATE INDEX idx_grc_risk_treatment_plans_priority ON public.grc_risk_treatment_plans(priority);
CREATE INDEX idx_grc_risk_treatment_plans_owner ON public.grc_risk_treatment_plans(plan_owner_id);
CREATE INDEX idx_grc_risk_treatment_plans_due_date ON public.grc_risk_treatment_plans(due_date);

COMMENT ON TABLE public.grc_risk_treatment_plans IS 'GRC Risk Treatment Plans - Actions to mitigate risks';

-- ============================================
-- TRIGGERS: Auto-update timestamps
-- ============================================
CREATE TRIGGER update_grc_risks_updated_at
  BEFORE UPDATE ON public.grc_risks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grc_risk_assessments_updated_at
  BEFORE UPDATE ON public.grc_risk_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grc_risk_treatment_plans_updated_at
  BEFORE UPDATE ON public.grc_risk_treatment_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- RLS POLICIES: Row-Level Security
-- ============================================

-- Enable RLS
ALTER TABLE public.grc_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grc_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grc_risk_treatment_plans ENABLE ROW LEVEL SECURITY;

-- grc_risks policies
CREATE POLICY "Users can view risks in their tenant"
  ON public.grc_risks FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create risks in their tenant"
  ON public.grc_risks FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update risks in their tenant"
  ON public.grc_risks FOR UPDATE
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete risks in their tenant"
  ON public.grc_risks FOR DELETE
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- grc_risk_assessments policies
CREATE POLICY "Users can view risk assessments in their tenant"
  ON public.grc_risk_assessments FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create risk assessments in their tenant"
  ON public.grc_risk_assessments FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update risk assessments in their tenant"
  ON public.grc_risk_assessments FOR UPDATE
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete risk assessments in their tenant"
  ON public.grc_risk_assessments FOR DELETE
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- grc_risk_treatment_plans policies
CREATE POLICY "Users can view treatment plans in their tenant"
  ON public.grc_risk_treatment_plans FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create treatment plans in their tenant"
  ON public.grc_risk_treatment_plans FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update treatment plans in their tenant"
  ON public.grc_risk_treatment_plans FOR UPDATE
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete treatment plans in their tenant"
  ON public.grc_risk_treatment_plans FOR DELETE
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function: Get risk level based on score
CREATE OR REPLACE FUNCTION public.get_risk_level(score NUMERIC)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE
    WHEN score <= 4 THEN 'very_low'
    WHEN score <= 8 THEN 'low'
    WHEN score <= 12 THEN 'medium'
    WHEN score <= 16 THEN 'high'
    ELSE 'very_high'
  END;
END;
$$;

COMMENT ON FUNCTION public.get_risk_level IS 'Calculate risk level from risk score (1-25 scale)';

-- Function: Update risk status based on treatment plans
CREATE OR REPLACE FUNCTION public.update_risk_status_from_treatments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If treatment plan is completed, update risk status to 'treated'
  IF NEW.plan_status = 'completed' AND OLD.plan_status != 'completed' THEN
    UPDATE public.grc_risks
    SET 
      risk_status = 'treated',
      current_likelihood_score = NEW.target_likelihood_score,
      current_impact_score = NEW.target_impact_score,
      updated_at = now()
    WHERE id = NEW.risk_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger: Auto-update risk when treatment completed
CREATE TRIGGER trigger_update_risk_status
  AFTER UPDATE ON public.grc_risk_treatment_plans
  FOR EACH ROW
  WHEN (NEW.plan_status = 'completed' AND OLD.plan_status IS DISTINCT FROM 'completed')
  EXECUTE FUNCTION public.update_risk_status_from_treatments();

COMMENT ON TRIGGER trigger_update_risk_status ON public.grc_risk_treatment_plans IS 'Auto-update risk status when treatment plan is completed';