-- Gate-J Part 4.1: Validation Framework Setup
-- Table: awareness_impact_validations

-- Create validations table
CREATE TABLE IF NOT EXISTS public.awareness_impact_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  org_unit_id UUID NOT NULL,
  period_year INT NOT NULL,
  period_month INT NOT NULL,
  
  -- Reference data
  computed_impact_score NUMERIC(5,2) NOT NULL,
  actual_behavior_score NUMERIC(5,2) NULL,
  compliance_alignment_score NUMERIC(5,2) NULL,
  risk_incident_count INT NULL DEFAULT 0,
  
  -- Validation metrics
  validation_gap NUMERIC(5,2) NULL,
  validation_status TEXT NULL DEFAULT 'pending',
  confidence_gap NUMERIC(5,2) NULL,
  
  -- Meta
  data_source TEXT NULL DEFAULT 'Gate-J Validation Engine',
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_validations_tenant_org_period 
  ON public.awareness_impact_validations(tenant_id, org_unit_id, period_year, period_month);

CREATE INDEX IF NOT EXISTS idx_validations_tenant_status 
  ON public.awareness_impact_validations(tenant_id, validation_status);

CREATE INDEX IF NOT EXISTS idx_validations_created_at 
  ON public.awareness_impact_validations(created_at DESC);

-- Add updated_at trigger
CREATE TRIGGER update_awareness_impact_validations_updated_at
  BEFORE UPDATE ON public.awareness_impact_validations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_awareness_impact_scores_updated_at();

-- Enable RLS
ALTER TABLE public.awareness_impact_validations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Multi-tenant isolation
CREATE POLICY "Users can view validations in their tenant"
  ON public.awareness_impact_validations
  FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create validations in their tenant"
  ON public.awareness_impact_validations
  FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update validations in their tenant"
  ON public.awareness_impact_validations
  FOR UPDATE
  USING (tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete validations in their tenant"
  ON public.awareness_impact_validations
  FOR DELETE
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Add table comment
COMMENT ON TABLE public.awareness_impact_validations IS 
  'Gate-J Part 4: Stores validation results comparing computed impact scores with real organizational metrics';

-- Add column comments
COMMENT ON COLUMN public.awareness_impact_validations.computed_impact_score IS 
  'Impact score from awareness_impact_scores table';
COMMENT ON COLUMN public.awareness_impact_validations.actual_behavior_score IS 
  'Real-world behavioral score from HR/Compliance (0-100)';
COMMENT ON COLUMN public.awareness_impact_validations.validation_gap IS 
  'Absolute difference between computed and actual scores';
COMMENT ON COLUMN public.awareness_impact_validations.validation_status IS 
  'Status: pending, validated, anomaly, calibrated';