-- Part 5.B: Quarterly Insights Snapshot + Generation RPCs
-- Gate-K: Strategic Initiatives Generation System

-- ============================================================================
-- 1) Quarterly Insights Snapshot Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.quarterly_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  year SMALLINT NOT NULL,
  quarter SMALLINT NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  quarter_start DATE NOT NULL,
  kpis_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  top_initiatives JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE (tenant_id, year, quarter)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quarterly_insights_tenant_year_quarter
  ON public.quarterly_insights(tenant_id, year DESC, quarter DESC);

CREATE INDEX IF NOT EXISTS idx_quarterly_insights_quarter_start
  ON public.quarterly_insights(tenant_id, quarter_start DESC);

COMMENT ON TABLE public.quarterly_insights IS 'Gate-K: Quarterly strategic insights snapshot with top initiatives and KPI summaries';
COMMENT ON COLUMN public.quarterly_insights.kpis_summary IS 'JSONB: {kpi_key: {quarter_avg_value, quarter_delta_avg, status}}';
COMMENT ON COLUMN public.quarterly_insights.top_initiatives IS 'JSONB: [{rank, kpi_key, dim_key, dim_value, action_type_code, priority_score, title_ar, body_ar}]';

-- ============================================================================
-- 2) RLS Policies for quarterly_insights
-- ============================================================================
ALTER TABLE public.quarterly_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY quarterly_insights_tenant_isolation_select
  ON public.quarterly_insights
  FOR SELECT
  USING (tenant_id = app_current_tenant_id());

CREATE POLICY quarterly_insights_tenant_isolation_insert
  ON public.quarterly_insights
  FOR INSERT
  WITH CHECK (tenant_id = app_current_tenant_id() AND auth.uid() IS NOT NULL);

CREATE POLICY quarterly_insights_tenant_isolation_update
  ON public.quarterly_insights
  FOR UPDATE
  USING (tenant_id = app_current_tenant_id())
  WITH CHECK (tenant_id = app_current_tenant_id());

CREATE POLICY quarterly_insights_tenant_isolation_delete
  ON public.quarterly_insights
  FOR DELETE
  USING (tenant_id = app_current_tenant_id() AND app_has_role('tenant_admin'));

-- ============================================================================
-- 3) RPC: Generate Quarterly Insights (Idempotent)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_quarterly_insights(
  p_year SMALLINT,
  p_quarter SMALLINT,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  year SMALLINT,
  quarter SMALLINT,
  created BOOLEAN,
  initiatives_count INTEGER,
  kpis_count INTEGER
) AS $$
DECLARE
  v_tenant_id UUID;
  v_quarter_start DATE;
  v_inserted_count INTEGER := 0;
  v_initiatives_count INTEGER := 0;
  v_kpis_count INTEGER := 0;
BEGIN
  -- Get current tenant
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED: User not associated with any tenant';
  END IF;

  -- Calculate quarter start date
  v_quarter_start := make_date(p_year, ((p_quarter - 1) * 3) + 1, 1);

  -- Generate insights
  WITH kpi_rollup AS (
    SELECT
      kpi_key,
      quarter_avg_value,
      quarter_delta_avg,
      CASE
        WHEN has_alert = true THEN 'alert'
        WHEN has_warn_or_alert = true THEN 'warn'
        ELSE 'ok'
      END AS status
    FROM public.mv_kpi_quarterly_rollup
    WHERE tenant_id = v_tenant_id
      AND quarter_start = v_quarter_start
  ),
  kpis_json AS (
    SELECT
      jsonb_object_agg(
        kpi_key,
        jsonb_build_object(
          'quarter_avg_value', quarter_avg_value,
          'quarter_delta_avg', quarter_delta_avg,
          'status', status
        )
      ) AS kpis_summary,
      COUNT(*) AS kpis_count
    FROM kpi_rollup
  ),
  top_candidates AS (
    SELECT
      kpi_key,
      dim_key,
      dim_value,
      action_type_code,
      title_ar,
      body_ar,
      priority_score,
      ROW_NUMBER() OVER (ORDER BY priority_score DESC NULLS LAST) AS initiative_rank
    FROM public.mv_quarterly_initiative_candidates
    WHERE tenant_id = v_tenant_id
      AND quarter_start = v_quarter_start
      AND action_type_code IS NOT NULL
    ORDER BY priority_score DESC NULLS LAST
    LIMIT p_limit
  ),
  initiatives_json AS (
    SELECT
      jsonb_agg(
        jsonb_build_object(
          'rank', initiative_rank,
          'kpi_key', kpi_key,
          'dim_key', dim_key,
          'dim_value', dim_value,
          'action_type_code', action_type_code,
          'title_ar', title_ar,
          'body_ar', body_ar,
          'priority_score', priority_score
        ) ORDER BY initiative_rank
      ) AS top_initiatives,
      COUNT(*) AS initiatives_count
    FROM top_candidates
  ),
  insert_result AS (
    INSERT INTO public.quarterly_insights (
      tenant_id,
      year,
      quarter,
      quarter_start,
      kpis_summary,
      top_initiatives,
      created_by
    )
    SELECT
      v_tenant_id,
      p_year,
      p_quarter,
      v_quarter_start,
      COALESCE((SELECT kpis_summary FROM kpis_json), '{}'::jsonb),
      COALESCE((SELECT top_initiatives FROM initiatives_json), '[]'::jsonb),
      auth.uid()
    ON CONFLICT (tenant_id, year, quarter)
    DO UPDATE SET
      kpis_summary = EXCLUDED.kpis_summary,
      top_initiatives = EXCLUDED.top_initiatives,
      updated_at = now()
    RETURNING 1
  )
  SELECT
    COUNT(*) INTO v_inserted_count
  FROM insert_result;

  -- Get counts
  SELECT kpis_count INTO v_kpis_count FROM kpis_json;
  SELECT initiatives_count INTO v_initiatives_count FROM initiatives_json;

  -- Return result
  RETURN QUERY
  SELECT
    p_year,
    p_quarter,
    v_inserted_count > 0,
    COALESCE(v_initiatives_count, 0),
    COALESCE(v_kpis_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.generate_quarterly_insights IS 'Gate-K: Generate quarterly insights snapshot with top initiatives (idempotent)';

-- ============================================================================
-- 4) RPC: Get Quarterly Insights (Read-Only)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_quarterly_insights(
  p_year SMALLINT DEFAULT NULL,
  p_quarter SMALLINT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  year SMALLINT,
  quarter SMALLINT,
  quarter_start DATE,
  kpis_summary JSONB,
  top_initiatives JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID
) AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get current tenant
  v_tenant_id := app_current_tenant_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED: User not associated with any tenant';
  END IF;

  -- Return filtered insights
  RETURN QUERY
  SELECT
    qi.id,
    qi.tenant_id,
    qi.year,
    qi.quarter,
    qi.quarter_start,
    qi.kpis_summary,
    qi.top_initiatives,
    qi.created_at,
    qi.updated_at,
    qi.created_by
  FROM public.quarterly_insights qi
  WHERE qi.tenant_id = v_tenant_id
    AND (p_year IS NULL OR qi.year = p_year)
    AND (p_quarter IS NULL OR qi.quarter = p_quarter)
  ORDER BY qi.year DESC, qi.quarter DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_quarterly_insights IS 'Gate-K: Fetch quarterly insights snapshots with optional filters';