-- ============================================================================
-- Gate-J Part 4.2: Calibration Data Model
-- ============================================================================
-- Purpose: Define data structures for storing calibration runs, matrices, 
--          and weight adjustment recommendations based on validation results
-- ============================================================================

-- ============================================================================
-- Table 1: awareness_impact_calibration_runs
-- ============================================================================
-- Purpose: Represents a single calibration run for a tenant
-- Stores aggregated metrics from validation results for a specific period/model
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.awareness_impact_calibration_runs (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenant
  tenant_id UUID NOT NULL,
  
  -- Scope & versioning
  model_version INT NOT NULL DEFAULT 1,
  period_start DATE NULL,
  period_end DATE NULL,
  run_label TEXT NULL,
  description TEXT NULL,
  
  -- Aggregated metrics from validations
  sample_size INT NOT NULL DEFAULT 0,
  avg_validation_gap NUMERIC(5,2) NULL,
  max_validation_gap NUMERIC(5,2) NULL,
  min_validation_gap NUMERIC(5,2) NULL,
  correlation_score NUMERIC(5,2) NULL,
  
  -- Overall quality assessment
  overall_status TEXT NULL CHECK (overall_status IN ('good', 'needs_tuning', 'bad', 'experimental')),
  
  -- Lifecycle
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.awareness_impact_calibration_runs IS 
'Gate-J Part 4.2: Stores calibration runs that aggregate validation results for model tuning';

COMMENT ON COLUMN public.awareness_impact_calibration_runs.model_version IS 
'Links to awareness_impact_weights.version - represents the formula/weight version being calibrated';

COMMENT ON COLUMN public.awareness_impact_calibration_runs.sample_size IS 
'Number of validation records (from awareness_impact_validations) included in this calibration';

COMMENT ON COLUMN public.awareness_impact_calibration_runs.correlation_score IS 
'Simplified correlation between predicted impact and actual behavior (v1 pseudo-metric)';

-- Indexes for calibration_runs
CREATE INDEX IF NOT EXISTS idx_calibration_runs_tenant_version 
  ON public.awareness_impact_calibration_runs(tenant_id, model_version);

CREATE INDEX IF NOT EXISTS idx_calibration_runs_tenant_created 
  ON public.awareness_impact_calibration_runs(tenant_id, created_at);

-- RLS Policies for calibration_runs
ALTER TABLE public.awareness_impact_calibration_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view calibration runs in their tenant"
  ON public.awareness_impact_calibration_runs
  FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create calibration runs in their tenant"
  ON public.awareness_impact_calibration_runs
  FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update calibration runs in their tenant"
  ON public.awareness_impact_calibration_runs
  FOR UPDATE
  USING (tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete calibration runs in their tenant"
  ON public.awareness_impact_calibration_runs
  FOR DELETE
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_calibration_runs_updated_at
  BEFORE UPDATE ON public.awareness_impact_calibration_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_awareness_impact_weights_updated_at();

-- ============================================================================
-- Table 2: awareness_impact_calibration_cells
-- ============================================================================
-- Purpose: Stores calibration matrix cells (predicted vs actual buckets)
-- Each row = one combination of predicted impact bucket × actual behavior bucket
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.awareness_impact_calibration_cells (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  calibration_run_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  -- Predicted dimension (from Gate-J impact scores)
  predicted_bucket TEXT NOT NULL CHECK (
    predicted_bucket IN ('very_low_risk', 'low_risk', 'medium_risk', 'high_risk')
  ),
  predicted_score_min NUMERIC(5,2) NULL,
  predicted_score_max NUMERIC(5,2) NULL,
  
  -- Actual dimension (from HR/Compliance metrics)
  actual_bucket TEXT NOT NULL CHECK (
    actual_bucket IN ('very_good_behavior', 'good_behavior', 'average_behavior', 
                     'poor_behavior', 'very_poor_behavior')
  ),
  actual_score_min NUMERIC(5,2) NULL,
  actual_score_max NUMERIC(5,2) NULL,
  
  -- Metrics per cell
  count_samples INT NOT NULL DEFAULT 0,
  avg_predicted_score NUMERIC(5,2) NULL,
  avg_actual_score NUMERIC(5,2) NULL,
  avg_gap NUMERIC(5,2) NULL,
  gap_direction TEXT NULL CHECK (gap_direction IN ('overestimate', 'underestimate', 'balanced')),
  
  -- Quality flags
  is_outlier_bucket BOOLEAN NOT NULL DEFAULT false,
  notes TEXT NULL,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.awareness_impact_calibration_cells IS 
'Gate-J Part 4.2: Matrix cells showing predicted impact vs actual behavior for calibration analysis';

COMMENT ON COLUMN public.awareness_impact_calibration_cells.predicted_bucket IS 
'Risk level bucket derived from computed impact_score (very_low_risk to high_risk)';

COMMENT ON COLUMN public.awareness_impact_calibration_cells.actual_bucket IS 
'Behavior quality bucket derived from HR/Compliance metrics (very_good to very_poor)';

COMMENT ON COLUMN public.awareness_impact_calibration_cells.count_samples IS 
'Number of org-unit-period validation records falling into this matrix cell';

COMMENT ON COLUMN public.awareness_impact_calibration_cells.avg_gap IS 
'Average difference (predicted - actual) for records in this cell';

-- Indexes for calibration_cells
CREATE INDEX IF NOT EXISTS idx_calibration_cells_tenant_run 
  ON public.awareness_impact_calibration_cells(tenant_id, calibration_run_id);

CREATE INDEX IF NOT EXISTS idx_calibration_cells_buckets 
  ON public.awareness_impact_calibration_cells(tenant_id, predicted_bucket, actual_bucket);

-- RLS Policies for calibration_cells
ALTER TABLE public.awareness_impact_calibration_cells ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view calibration cells in their tenant"
  ON public.awareness_impact_calibration_cells
  FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create calibration cells in their tenant"
  ON public.awareness_impact_calibration_cells
  FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update calibration cells in their tenant"
  ON public.awareness_impact_calibration_cells
  FOR UPDATE
  USING (tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete calibration cells in their tenant"
  ON public.awareness_impact_calibration_cells
  FOR DELETE
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_calibration_cells_updated_at
  BEFORE UPDATE ON public.awareness_impact_calibration_cells
  FOR EACH ROW
  EXECUTE FUNCTION public.update_awareness_impact_weights_updated_at();

-- ============================================================================
-- Table 3: awareness_impact_weight_suggestions
-- ============================================================================
-- Purpose: Stores suggested weight adjustments based on calibration results
-- Allows human review/approval before applying to awareness_impact_weights
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.awareness_impact_weight_suggestions (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  tenant_id UUID NOT NULL,
  calibration_run_id UUID NOT NULL,
  
  -- Version tracking
  source_weight_version INT NOT NULL,
  suggested_weight_version INT NOT NULL,
  
  -- Suggested weight values (must sum to 1.00)
  suggested_engagement_weight NUMERIC(5,2) NULL CHECK (
    suggested_engagement_weight >= 0 AND suggested_engagement_weight <= 1
  ),
  suggested_completion_weight NUMERIC(5,2) NULL CHECK (
    suggested_completion_weight >= 0 AND suggested_completion_weight <= 1
  ),
  suggested_feedback_quality_weight NUMERIC(5,2) NULL CHECK (
    suggested_feedback_quality_weight >= 0 AND suggested_feedback_quality_weight <= 1
  ),
  suggested_compliance_linkage_weight NUMERIC(5,2) NULL CHECK (
    suggested_compliance_linkage_weight >= 0 AND suggested_compliance_linkage_weight <= 1
  ),
  
  -- Rationale & approval workflow
  rationale TEXT NULL,
  status TEXT NULL CHECK (status IN ('draft', 'proposed', 'approved', 'rejected', 'applied')),
  approved_by UUID NULL,
  approved_at TIMESTAMPTZ NULL,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.awareness_impact_weight_suggestions IS 
'Gate-J Part 4.2: AI-generated or manual weight adjustment recommendations from calibration analysis';

COMMENT ON COLUMN public.awareness_impact_weight_suggestions.source_weight_version IS 
'The version of weights (from awareness_impact_weights) used during calibration';

COMMENT ON COLUMN public.awareness_impact_weight_suggestions.suggested_weight_version IS 
'Proposed next version number if this suggestion is approved and applied';

COMMENT ON COLUMN public.awareness_impact_weight_suggestions.rationale IS 
'Explanation of why these weight changes are recommended (e.g., systematic overestimation in certain segments)';

COMMENT ON COLUMN public.awareness_impact_weight_suggestions.status IS 
'Workflow state: draft -> proposed -> approved/rejected -> applied';

-- Indexes for weight_suggestions
CREATE INDEX IF NOT EXISTS idx_weight_suggestions_tenant_run 
  ON public.awareness_impact_weight_suggestions(tenant_id, calibration_run_id);

CREATE INDEX IF NOT EXISTS idx_weight_suggestions_tenant_status 
  ON public.awareness_impact_weight_suggestions(tenant_id, status);

-- RLS Policies for weight_suggestions
ALTER TABLE public.awareness_impact_weight_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view weight suggestions in their tenant"
  ON public.awareness_impact_weight_suggestions
  FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create weight suggestions in their tenant"
  ON public.awareness_impact_weight_suggestions
  FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update weight suggestions in their tenant"
  ON public.awareness_impact_weight_suggestions
  FOR UPDATE
  USING (tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete weight suggestions in their tenant"
  ON public.awareness_impact_weight_suggestions
  FOR DELETE
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_weight_suggestions_updated_at
  BEFORE UPDATE ON public.awareness_impact_weight_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_awareness_impact_weights_updated_at();

-- ============================================================================
-- Data Flow Documentation (Comments)
-- ============================================================================

COMMENT ON SCHEMA public IS 
'Gate-J Calibration Data Flow:
1. Validation Stage (Part 4.1): awareness_impact_validations holds per-org-unit comparison results
2. Calibration Stage (Part 4.2 - this schema): 
   - awareness_impact_calibration_runs: Aggregate validation metrics per run
   - awareness_impact_calibration_cells: Matrix of predicted vs actual buckets
   - awareness_impact_weight_suggestions: Recommended weight adjustments
3. Weight Update Stage (Future): Approved suggestions create new awareness_impact_weights rows
4. Recomputation (Part 3): Updated weights trigger new impact score calculations';

-- ============================================================================
-- End of Part 4.2 Migration
-- ============================================================================