-- Gate-J: Awareness Impact Engine (v1) - Data Schema Definition
-- Part 2: Core Tables and Views for Impact Score Calculation

-- ========================================
-- Table 1: awareness_impact_scores
-- ========================================
-- Purpose: Store computed quarterly/monthly impact scores per tenant and org unit
-- Used by: Gate-J Formula Engine, Gate-J Dashboard, Gate-I Analytics

CREATE TABLE IF NOT EXISTS public.awareness_impact_scores (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenant isolation
  tenant_id UUID NOT NULL,
  
  -- Organizational dimension
  org_unit_id UUID NOT NULL,  -- Links to departments/org_units (FK can be added later)
  
  -- Time dimension
  period_year INT NOT NULL,   -- Example: 2025
  period_month INT NOT NULL,  -- Range: 1-12
  
  -- Input metrics (from Gate-I and other sources)
  engagement_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  completion_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  feedback_quality_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  compliance_linkage_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  
  -- Output metrics (computed by Impact Engine)
  impact_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  risk_level TEXT NULL,  -- Example: 'low', 'medium', 'high', 'critical'
  confidence_level NUMERIC(5,2) NULL,  -- Range: 0-100%
  
  -- Supporting metadata
  data_source TEXT NULL,  -- Example: 'Gate-I aggregate', 'manual adjustment'
  notes TEXT NULL,
  
  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for awareness_impact_scores
CREATE INDEX IF NOT EXISTS idx_awareness_impact_scores_tenant_org_period 
  ON public.awareness_impact_scores(tenant_id, org_unit_id, period_year, period_month);

CREATE INDEX IF NOT EXISTS idx_awareness_impact_scores_tenant_period 
  ON public.awareness_impact_scores(tenant_id, period_year, period_month);

-- Add comment for RLS (to be implemented later)
COMMENT ON TABLE public.awareness_impact_scores IS 
  'Gate-J: Stores computed impact scores per org unit and period. RLS REQUIRED: tenant_id = auth.tenant_id()';

-- ========================================
-- Table 2: awareness_impact_weights
-- ========================================
-- Purpose: Store weight configuration for impact dimensions (allows per-tenant override and versioning)
-- Used by: Gate-J Formula Engine for calculating weighted impact scores

CREATE TABLE IF NOT EXISTS public.awareness_impact_weights (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenant isolation
  tenant_id UUID NOT NULL,
  
  -- Versioning and activation
  version INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Weight columns (typically sum to 1.0 or 100%)
  engagement_weight NUMERIC(5,2) NOT NULL DEFAULT 0.25,
  completion_weight NUMERIC(5,2) NOT NULL DEFAULT 0.25,
  feedback_quality_weight NUMERIC(5,2) NOT NULL DEFAULT 0.25,
  compliance_linkage_weight NUMERIC(5,2) NOT NULL DEFAULT 0.25,
  
  -- Optional helper fields
  label TEXT NULL,  -- Example: 'Default Model v1', 'High-Risk Focus v2'
  notes TEXT NULL,
  
  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for awareness_impact_weights
CREATE INDEX IF NOT EXISTS idx_awareness_impact_weights_tenant_active 
  ON public.awareness_impact_weights(tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_awareness_impact_weights_tenant_version 
  ON public.awareness_impact_weights(tenant_id, version);

-- Add comment for RLS
COMMENT ON TABLE public.awareness_impact_weights IS 
  'Gate-J: Stores weight configurations for impact formula. RLS REQUIRED: tenant_id = auth.tenant_id()';

-- ========================================
-- View: awareness_impact_scores_view
-- ========================================
-- Purpose: Analytics-ready structure for dashboards, heatmaps, and month-over-month comparisons
-- Note: Currently based only on awareness_impact_scores. 
--       Future enhancement: JOIN with org_units/departments table when available

CREATE OR REPLACE VIEW public.awareness_impact_scores_view AS
SELECT 
  -- Core identity
  ais.tenant_id,
  ais.org_unit_id,
  ais.period_year,
  ais.period_month,
  
  -- TODO: Add org unit/department information when table structure is confirmed
  -- Example future join:
  -- ou.name AS org_unit_name,
  -- ou.code AS org_unit_code,
  NULL::TEXT AS org_unit_name,  -- Placeholder for future join
  NULL::TEXT AS org_unit_code,  -- Placeholder for future join
  
  -- Scores
  ais.engagement_score,
  ais.completion_score,
  ais.feedback_quality_score,
  ais.compliance_linkage_score,
  ais.impact_score,
  ais.risk_level,
  ais.confidence_level,
  
  -- Technical/meta
  ais.data_source,
  ais.created_at,
  ais.updated_at
FROM 
  public.awareness_impact_scores ais
-- Future join placeholder:
-- LEFT JOIN public.org_units ou ON ais.org_unit_id = ou.id AND ais.tenant_id = ou.tenant_id
ORDER BY 
  ais.tenant_id, 
  ais.period_year DESC, 
  ais.period_month DESC, 
  ais.org_unit_id;

-- Add comment for the view
COMMENT ON VIEW public.awareness_impact_scores_view IS 
  'Gate-J: Read-only analytics view for Impact Dashboard. Aggregates impact scores with optional org unit metadata.';

-- ========================================
-- Trigger for updated_at timestamp
-- ========================================

-- Trigger for awareness_impact_scores
CREATE OR REPLACE FUNCTION public.update_awareness_impact_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_awareness_impact_scores_updated_at
  BEFORE UPDATE ON public.awareness_impact_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_awareness_impact_scores_updated_at();

-- Trigger for awareness_impact_weights
CREATE OR REPLACE FUNCTION public.update_awareness_impact_weights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_awareness_impact_weights_updated_at
  BEFORE UPDATE ON public.awareness_impact_weights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_awareness_impact_weights_updated_at();