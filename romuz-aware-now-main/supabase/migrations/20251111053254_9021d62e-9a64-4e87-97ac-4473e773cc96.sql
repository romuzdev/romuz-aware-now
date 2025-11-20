-- Part 4.A: RCA (Root Cause Analysis) Base Tables & Contributor Scoring
-- ===========================================================================

-- 1) RCA Configuration Table
-- Defines which dimensions to analyze per KPI/window
CREATE TABLE IF NOT EXISTS public.rca_config (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  kpi_key TEXT NOT NULL,
  trend_window kpi_trend_window NOT NULL,
  dim_keys TEXT[] NOT NULL DEFAULT ARRAY['department','campaign_type','channel'],
  min_sample INTEGER NOT NULL DEFAULT 30,
  top_n INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  UNIQUE (tenant_id, kpi_key, trend_window)
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_rca_config_tenant_kpi 
  ON public.rca_config(tenant_id, kpi_key, trend_window)
  WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.rca_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY rca_config_select_policy ON public.rca_config
  FOR SELECT
  USING (
    tenant_id = app_current_tenant_id()
    OR tenant_id IS NULL  -- Global defaults
  );

CREATE POLICY rca_config_insert_policy ON public.rca_config
  FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant_id()
    AND app_has_role('tenant_admin')
  );

CREATE POLICY rca_config_update_policy ON public.rca_config
  FOR UPDATE
  USING (
    tenant_id = app_current_tenant_id()
    AND app_has_role('tenant_admin')
  )
  WITH CHECK (
    tenant_id = app_current_tenant_id()
    AND app_has_role('tenant_admin')
  );

CREATE POLICY rca_config_delete_policy ON public.rca_config
  FOR DELETE
  USING (
    tenant_id = app_current_tenant_id()
    AND app_has_role('tenant_admin')
  );

-- Trigger for updated_at
CREATE TRIGGER update_rca_config_updated_at
  BEFORE UPDATE ON public.rca_config
  FOR EACH ROW
  EXECUTE FUNCTION update_awareness_campaigns_updated_at();

-- 2) Monthly Dimension Aggregation MV
-- Aggregates kpi_series by month and all dimensions
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_kpi_monthly_dim_agg AS
SELECT
  s.tenant_id,
  s.kpi_key,
  date_trunc('month', s.ts)::date AS month,
  s.trend_window,
  -- Dimensions with NULL handling
  COALESCE(s.dim_department, '__null__') AS dim_department,
  COALESCE(s.dim_campaign_type, '__null__') AS dim_campaign_type,
  COALESCE(s.dim_channel, '__null__') AS dim_channel,
  COALESCE(s.dim_location, '__null__') AS dim_location,
  COALESCE(s.dim_audience_segment, '__null__') AS dim_audience_segment,
  COALESCE(s.dim_content_theme, '__null__') AS dim_content_theme,
  COALESCE(s.dim_device_type, '__null__') AS dim_device_type,
  COALESCE(s.dim_user_role, '__null__') AS dim_user_role,
  -- Aggregations
  AVG(s.value) AS avg_value_dim,
  SUM(s.sample_size) AS sample_sum,
  COUNT(*) AS record_count
FROM public.kpi_series s
WHERE s.value IS NOT NULL
GROUP BY 
  s.tenant_id,
  s.kpi_key,
  date_trunc('month', s.ts)::date,
  s.trend_window,
  s.dim_department,
  s.dim_campaign_type,
  s.dim_channel,
  s.dim_location,
  s.dim_audience_segment,
  s.dim_content_theme,
  s.dim_device_type,
  s.dim_user_role;

-- Create unique index for CONCURRENT refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_kpi_monthly_dim_agg_unique
  ON public.mv_kpi_monthly_dim_agg(
    tenant_id, 
    kpi_key, 
    month, 
    trend_window,
    dim_department,
    dim_campaign_type,
    dim_channel,
    dim_location,
    dim_audience_segment,
    dim_content_theme,
    dim_device_type,
    dim_user_role
  );

-- Additional index for performance
CREATE INDEX IF NOT EXISTS idx_mv_kpi_monthly_dim_agg_lookup
  ON public.mv_kpi_monthly_dim_agg(tenant_id, kpi_key, month, trend_window);

-- 3) RCA Monthly Contributors MV
-- Calculates contribution scores for each dimension slice
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_rca_monthly_contributors AS
WITH overall_delta AS (
  -- Get overall monthly delta from existing MV
  SELECT 
    tenant_id, 
    kpi_key, 
    month, 
    trend_window, 
    avg_value, 
    prev_avg, 
    delta_pct,
    sample_count
  FROM public.mv_kpi_monthly_delta
  WHERE delta_pct IS NOT NULL
),
dim_shares AS (
  -- Calculate share ratio for each dimension slice
  SELECT
    d.tenant_id,
    d.kpi_key,
    d.month,
    d.trend_window,
    d.dim_department,
    d.dim_campaign_type,
    d.dim_channel,
    d.dim_location,
    d.dim_audience_segment,
    d.dim_content_theme,
    d.dim_device_type,
    d.dim_user_role,
    d.avg_value_dim,
    d.sample_sum,
    d.record_count,
    -- Calculate total for share ratio
    SUM(d.avg_value_dim * d.sample_sum) OVER (
      PARTITION BY d.tenant_id, d.kpi_key, d.month, d.trend_window
    ) AS weighted_sum_total,
    SUM(d.sample_sum) OVER (
      PARTITION BY d.tenant_id, d.kpi_key, d.month, d.trend_window
    ) AS total_samples
  FROM public.mv_kpi_monthly_dim_agg d
)
SELECT
  s.tenant_id,
  s.kpi_key,
  s.month,
  s.trend_window,
  -- Dimensions
  s.dim_department,
  s.dim_campaign_type,
  s.dim_channel,
  s.dim_location,
  s.dim_audience_segment,
  s.dim_content_theme,
  s.dim_device_type,
  s.dim_user_role,
  -- Overall metrics
  o.avg_value AS overall_avg_value,
  o.prev_avg AS overall_prev_avg,
  o.delta_pct AS overall_delta_pct,
  o.sample_count AS overall_sample_count,
  -- Dimension metrics
  s.avg_value_dim,
  s.sample_sum AS dim_sample_sum,
  s.record_count AS dim_record_count,
  -- Share calculation
  CASE 
    WHEN s.total_samples IS NULL OR s.total_samples = 0 THEN NULL
    ELSE (s.sample_sum::NUMERIC / s.total_samples::NUMERIC)
  END AS share_ratio,
  -- Contribution score: delta_pct * share_ratio
  -- This shows how much this dimension slice contributed to the overall change
  CASE 
    WHEN o.delta_pct IS NULL THEN NULL
    WHEN s.total_samples IS NULL OR s.total_samples = 0 THEN NULL
    ELSE o.delta_pct * (s.sample_sum::NUMERIC / s.total_samples::NUMERIC)
  END AS contribution_score,
  -- Variance from overall
  CASE
    WHEN o.avg_value IS NULL OR o.avg_value = 0 THEN NULL
    ELSE ((s.avg_value_dim - o.avg_value) / o.avg_value) * 100
  END AS variance_from_overall_pct
FROM dim_shares s
INNER JOIN overall_delta o
  ON o.tenant_id = s.tenant_id 
  AND o.kpi_key = s.kpi_key 
  AND o.month = s.month 
  AND o.trend_window = s.trend_window
WHERE s.sample_sum >= 5;  -- Filter out tiny slices

-- Create unique index for CONCURRENT refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_rca_monthly_contributors_unique
  ON public.mv_rca_monthly_contributors(
    tenant_id,
    kpi_key,
    month,
    trend_window,
    dim_department,
    dim_campaign_type,
    dim_channel,
    dim_location,
    dim_audience_segment,
    dim_content_theme,
    dim_device_type,
    dim_user_role
  );

-- Index for sorting by contribution score (most important contributors)
CREATE INDEX IF NOT EXISTS idx_mv_rca_monthly_contributors_score
  ON public.mv_rca_monthly_contributors(
    tenant_id,
    kpi_key,
    month,
    trend_window,
    contribution_score DESC NULLS LAST
  );

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_mv_rca_monthly_contributors_lookup
  ON public.mv_rca_monthly_contributors(tenant_id, kpi_key, month, trend_window);

-- 4) Update refresh_gate_k_views() to include RCA MVs
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
  
  -- NEW: RCA MVs (must be after mv_kpi_monthly_delta)
  v_start := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_monthly_dim_agg;
  v_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER;
  PERFORM log_refresh('mv_kpi_monthly_dim_agg', v_duration);
  
  v_start := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_rca_monthly_contributors;
  v_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER;
  PERFORM log_refresh('mv_rca_monthly_contributors', v_duration);
  
EXCEPTION
  WHEN OTHERS THEN
    PERFORM log_refresh('refresh_gate_k_views', NULL, 'error', SQLERRM);
    RAISE;
END;
$$;