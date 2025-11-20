-- Part 4.C: Recommendations Mapping + Generation
-- ===============================================

-- 1) Recommendation Templates Table
-- Maps KPI/window/dim_key to actionable recommendation templates
CREATE TABLE IF NOT EXISTS public.reco_templates (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  kpi_key TEXT NOT NULL,
  trend_window kpi_trend_window NOT NULL,
  dim_key TEXT NOT NULL,  -- e.g., 'channel', 'department'
  trigger_flag TEXT NOT NULL DEFAULT 'warn',  -- 'warn' or 'alert'
  action_type_code TEXT NOT NULL,  -- Gate-H action type (logical FK)
  title_ar TEXT NOT NULL,
  body_ar TEXT NOT NULL,
  impact_level TEXT NOT NULL DEFAULT 'medium',  -- low/medium/high
  effort_estimate TEXT NOT NULL DEFAULT 'M',  -- S/M/L
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  CONSTRAINT chk_trigger_flag CHECK (trigger_flag IN ('warn', 'alert')),
  CONSTRAINT chk_impact_level CHECK (impact_level IN ('low', 'medium', 'high')),
  CONSTRAINT chk_effort_estimate CHECK (effort_estimate IN ('S', 'M', 'L', 'XL'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reco_templates_lookup
  ON public.reco_templates(tenant_id, kpi_key, trend_window, dim_key)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_reco_templates_trigger
  ON public.reco_templates(tenant_id, trigger_flag)
  WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.reco_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY reco_templates_select_policy ON public.reco_templates
  FOR SELECT
  USING (
    tenant_id = app_current_tenant_id()
    OR tenant_id IS NULL  -- Global templates
  );

CREATE POLICY reco_templates_insert_policy ON public.reco_templates
  FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant_id()
    AND app_has_role('tenant_admin')
  );

CREATE POLICY reco_templates_update_policy ON public.reco_templates
  FOR UPDATE
  USING (
    tenant_id = app_current_tenant_id()
    AND app_has_role('tenant_admin')
  )
  WITH CHECK (
    tenant_id = app_current_tenant_id()
    AND app_has_role('tenant_admin')
  );

CREATE POLICY reco_templates_delete_policy ON public.reco_templates
  FOR DELETE
  USING (
    tenant_id = app_current_tenant_id()
    AND app_has_role('tenant_admin')
  );

-- Trigger for updated_at
CREATE TRIGGER update_reco_templates_updated_at
  BEFORE UPDATE ON public.reco_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_awareness_campaigns_updated_at();

-- 2) Generated Recommendations Table
-- Stores materialized recommendations per month
CREATE TABLE IF NOT EXISTS public.reco_generated (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  kpi_key TEXT NOT NULL,
  month DATE NOT NULL,
  trend_window kpi_trend_window NOT NULL,
  dim_key TEXT NOT NULL,
  dim_value TEXT NOT NULL,
  flag TEXT NOT NULL,  -- from mv_kpi_monthly_flags: ok/warn/alert/no_ref
  title_ar TEXT NOT NULL,
  body_ar TEXT NOT NULL,
  action_type_code TEXT NOT NULL,
  impact_level TEXT NOT NULL,
  effort_estimate TEXT NOT NULL,
  source_ref JSONB NOT NULL,  -- {rnk, delta_pct, contribution_score, ...}
  status TEXT NOT NULL DEFAULT 'pending',  -- pending/reviewed/implemented/dismissed
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, kpi_key, month, trend_window, dim_key, dim_value, action_type_code),
  CONSTRAINT chk_reco_flag CHECK (flag IN ('ok', 'warn', 'alert', 'no_reference', 'insufficient_data')),
  CONSTRAINT chk_reco_status CHECK (status IN ('pending', 'reviewed', 'implemented', 'dismissed'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reco_generated_tenant_month
  ON public.reco_generated(tenant_id, month, trend_window)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_reco_generated_lookup
  ON public.reco_generated(tenant_id, kpi_key, month, trend_window);

CREATE INDEX IF NOT EXISTS idx_reco_generated_status
  ON public.reco_generated(tenant_id, status, created_at DESC);

-- Enable RLS
ALTER TABLE public.reco_generated ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY reco_generated_select_policy ON public.reco_generated
  FOR SELECT
  USING (tenant_id = app_current_tenant_id());

CREATE POLICY reco_generated_insert_policy ON public.reco_generated
  FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant_id()
    AND (app_has_role('tenant_admin') OR auth.role() = 'service_role')
  );

CREATE POLICY reco_generated_update_policy ON public.reco_generated
  FOR UPDATE
  USING (tenant_id = app_current_tenant_id())
  WITH CHECK (tenant_id = app_current_tenant_id());

CREATE POLICY reco_generated_delete_policy ON public.reco_generated
  FOR DELETE
  USING (
    tenant_id = app_current_tenant_id()
    AND app_has_role('tenant_admin')
  );

-- Trigger for updated_at
CREATE TRIGGER update_reco_generated_updated_at
  BEFORE UPDATE ON public.reco_generated
  FOR EACH ROW
  EXECUTE FUNCTION update_awareness_campaigns_updated_at();

-- 3) Recommendation Proposals MV
-- Joins top contributors with flags and templates to propose recommendations
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_reco_proposals AS
SELECT
  r.tenant_id,
  r.kpi_key,
  r.month,
  r.trend_window,
  r.dim_key,
  r.dim_value,
  f.flag,
  r.delta_pct,
  r.contribution_score,
  r.share_ratio,
  r.variance_from_overall_pct,
  t.action_type_code,
  t.title_ar,
  t.body_ar,
  t.impact_level,
  t.effort_estimate,
  t.trigger_flag,
  r.rnk AS contributor_rnk,
  -- Overall ranking for prioritization
  ROW_NUMBER() OVER (
    PARTITION BY r.tenant_id, r.kpi_key, r.month, r.trend_window 
    ORDER BY 
      CASE f.flag 
        WHEN 'alert' THEN 1
        WHEN 'warn' THEN 2
        ELSE 3
      END,
      ABS(r.contribution_score) DESC NULLS LAST,
      r.rnk
  ) AS priority_rnk
FROM public.mv_rca_monthly_top_contributors r
INNER JOIN public.mv_kpi_monthly_flags f
  ON f.tenant_id = r.tenant_id 
  AND f.kpi_key = r.kpi_key 
  AND f.month = r.month 
  AND f.trend_window = r.trend_window
INNER JOIN public.reco_templates t
  ON t.tenant_id = r.tenant_id 
  AND t.kpi_key = r.kpi_key 
  AND t.trend_window = r.trend_window 
  AND t.dim_key = r.dim_key 
  AND t.is_active = true
WHERE 
  -- Match trigger conditions
  (
    (t.trigger_flag = 'alert' AND f.flag = 'alert')
    OR 
    (t.trigger_flag = 'warn' AND f.flag IN ('warn', 'alert'))
  )
  -- Only top contributors
  AND r.rnk <= r.top_n;

-- Create unique index for CONCURRENT refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_reco_proposals_unique
  ON public.mv_reco_proposals(
    tenant_id,
    kpi_key,
    month,
    trend_window,
    dim_key,
    dim_value,
    action_type_code
  );

-- Performance index
CREATE INDEX IF NOT EXISTS idx_mv_reco_proposals_lookup
  ON public.mv_reco_proposals(
    tenant_id, 
    kpi_key, 
    month, 
    trend_window, 
    priority_rnk
  );

-- Index for high-priority recommendations
CREATE INDEX IF NOT EXISTS idx_mv_reco_proposals_priority
  ON public.mv_reco_proposals(tenant_id, month, flag, priority_rnk)
  WHERE flag IN ('alert', 'warn');

-- 4) Function to Generate Recommendations
-- Materializes proposals into reco_generated table
CREATE OR REPLACE FUNCTION public.generate_recommendations(
  p_month DATE DEFAULT NULL,
  p_limit INTEGER DEFAULT 1000
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE 
  v_tenant_id UUID;
  v_inserted_count INTEGER := 0;
BEGIN
  -- Get current tenant
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Insert recommendations from proposals
  WITH src AS (
    SELECT *
    FROM public.mv_reco_proposals
    WHERE tenant_id = v_tenant_id
      AND (p_month IS NULL OR month = p_month)
      AND priority_rnk <= 50  -- Top 50 per KPI/month
    ORDER BY priority_rnk
    LIMIT p_limit
  ),
  inserted AS (
    INSERT INTO public.reco_generated (
      tenant_id,
      kpi_key,
      month,
      trend_window,
      dim_key,
      dim_value,
      flag,
      title_ar,
      body_ar,
      action_type_code,
      impact_level,
      effort_estimate,
      source_ref
    )
    SELECT
      tenant_id,
      kpi_key,
      month,
      trend_window,
      dim_key,
      dim_value,
      flag,
      title_ar,
      body_ar,
      action_type_code,
      impact_level,
      effort_estimate,
      jsonb_build_object(
        'contributor_rnk', contributor_rnk,
        'priority_rnk', priority_rnk,
        'delta_pct', delta_pct,
        'contribution_score', contribution_score,
        'share_ratio', share_ratio,
        'variance_from_overall_pct', variance_from_overall_pct
      ) AS source_ref
    FROM src
    ON CONFLICT (tenant_id, kpi_key, month, trend_window, dim_key, dim_value, action_type_code)
    DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_inserted_count FROM inserted;
  
  RETURN v_inserted_count;
END;
$$;

-- 5) Update refresh_gate_k_views() to include reco_proposals
CREATE OR REPLACE FUNCTION public.refresh_gate_k_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start TIMESTAMPTZ;
  v_duration INTEGER;
BEGIN
  -- Existing MVs
  v_start := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_trends_weekly;
  v_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER;
  PERFORM log_refresh('mv_kpi_trends_weekly', v_duration);
  
  v_start := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_trends_monthly;
  v_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER;
  PERFORM log_refresh('mv_kpi_trends_monthly', v_duration);
  
  v_start := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_trends_quarterly;
  v_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER;
  PERFORM log_refresh('mv_kpi_trends_quarterly', v_duration);
  
  v_start := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_monthly_delta;
  v_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER;
  PERFORM log_refresh('mv_kpi_monthly_delta', v_duration);
  
  v_start := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_monthly_anomalies;
  v_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER;
  PERFORM log_refresh('mv_kpi_monthly_anomalies', v_duration);
  
  v_start := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_monthly_flags;
  v_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER;
  PERFORM log_refresh('mv_kpi_monthly_flags', v_duration);
  
  -- RCA MVs
  v_start := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_monthly_dim_agg;
  v_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER;
  PERFORM log_refresh('mv_kpi_monthly_dim_agg', v_duration);
  
  v_start := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_rca_monthly_contributors;
  v_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER;
  PERFORM log_refresh('mv_rca_monthly_contributors', v_duration);
  
  v_start := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_rca_monthly_top_contributors;
  v_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER;
  PERFORM log_refresh('mv_rca_monthly_top_contributors', v_duration);
  
  -- NEW: Recommendations (Part 4.C)
  v_start := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_reco_proposals;
  v_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER;
  PERFORM log_refresh('mv_reco_proposals', v_duration);
  
EXCEPTION
  WHEN OTHERS THEN
    PERFORM log_refresh('refresh_gate_k_views', NULL, 'error', SQLERRM);
    RAISE;
END;
$$;