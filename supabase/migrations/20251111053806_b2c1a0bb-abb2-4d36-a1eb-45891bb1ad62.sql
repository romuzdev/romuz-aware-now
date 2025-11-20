-- Part 4.B: RCA Output Views - Top Contributors per KPI
-- ==========================================================

-- Materialized View: Top Contributors with Unpivoted Dimensions
-- This view transforms the multi-column dimension structure into rows
-- and ranks contributors by contribution_score
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_rca_monthly_top_contributors AS
WITH cfg AS (
  -- Get active RCA configurations
  SELECT 
    tenant_id, 
    kpi_key, 
    trend_window, 
    dim_keys, 
    min_sample, 
    top_n
  FROM public.rca_config
  WHERE is_active = true
),
base AS (
  -- Join contributors with their configurations
  SELECT 
    c.tenant_id,
    c.kpi_key,
    c.month,
    c.trend_window,
    c.overall_avg_value,
    c.overall_prev_avg,
    c.overall_delta_pct,
    c.dim_department,
    c.dim_campaign_type,
    c.dim_channel,
    c.dim_location,
    c.dim_audience_segment,
    c.dim_content_theme,
    c.dim_device_type,
    c.dim_user_role,
    c.avg_value_dim,
    c.dim_sample_sum,
    c.share_ratio,
    c.contribution_score,
    c.variance_from_overall_pct,
    cfg.dim_keys,
    cfg.min_sample,
    cfg.top_n
  FROM public.mv_rca_monthly_contributors c
  INNER JOIN cfg
    ON cfg.tenant_id = c.tenant_id 
    AND cfg.kpi_key = c.kpi_key 
    AND cfg.trend_window = c.trend_window
  WHERE c.dim_sample_sum >= cfg.min_sample
),
unpivot AS (
  -- Unpivot: Transform dimension columns into rows
  -- Department
  SELECT
    tenant_id, kpi_key, month, trend_window,
    overall_avg_value AS avg_value,
    overall_prev_avg AS prev_avg,
    overall_delta_pct AS delta_pct,
    avg_value_dim,
    dim_sample_sum,
    share_ratio,
    contribution_score,
    variance_from_overall_pct,
    'department'::TEXT AS dim_key,
    dim_department::TEXT AS dim_value,
    min_sample,
    top_n
  FROM base 
  WHERE 'department' = ANY(dim_keys)
  
  UNION ALL
  
  -- Campaign Type
  SELECT
    tenant_id, kpi_key, month, trend_window,
    overall_avg_value, overall_prev_avg, overall_delta_pct,
    avg_value_dim, dim_sample_sum, share_ratio, contribution_score,
    variance_from_overall_pct,
    'campaign_type'::TEXT,
    dim_campaign_type::TEXT,
    min_sample, top_n
  FROM base 
  WHERE 'campaign_type' = ANY(dim_keys)
  
  UNION ALL
  
  -- Channel
  SELECT
    tenant_id, kpi_key, month, trend_window,
    overall_avg_value, overall_prev_avg, overall_delta_pct,
    avg_value_dim, dim_sample_sum, share_ratio, contribution_score,
    variance_from_overall_pct,
    'channel'::TEXT,
    dim_channel::TEXT,
    min_sample, top_n
  FROM base 
  WHERE 'channel' = ANY(dim_keys)
  
  UNION ALL
  
  -- Location
  SELECT
    tenant_id, kpi_key, month, trend_window,
    overall_avg_value, overall_prev_avg, overall_delta_pct,
    avg_value_dim, dim_sample_sum, share_ratio, contribution_score,
    variance_from_overall_pct,
    'location'::TEXT,
    dim_location::TEXT,
    min_sample, top_n
  FROM base 
  WHERE 'location' = ANY(dim_keys)
  
  UNION ALL
  
  -- Audience Segment
  SELECT
    tenant_id, kpi_key, month, trend_window,
    overall_avg_value, overall_prev_avg, overall_delta_pct,
    avg_value_dim, dim_sample_sum, share_ratio, contribution_score,
    variance_from_overall_pct,
    'audience_segment'::TEXT,
    dim_audience_segment::TEXT,
    min_sample, top_n
  FROM base 
  WHERE 'audience_segment' = ANY(dim_keys)
  
  UNION ALL
  
  -- Content Theme
  SELECT
    tenant_id, kpi_key, month, trend_window,
    overall_avg_value, overall_prev_avg, overall_delta_pct,
    avg_value_dim, dim_sample_sum, share_ratio, contribution_score,
    variance_from_overall_pct,
    'content_theme'::TEXT,
    dim_content_theme::TEXT,
    min_sample, top_n
  FROM base 
  WHERE 'content_theme' = ANY(dim_keys)
  
  UNION ALL
  
  -- Device Type
  SELECT
    tenant_id, kpi_key, month, trend_window,
    overall_avg_value, overall_prev_avg, overall_delta_pct,
    avg_value_dim, dim_sample_sum, share_ratio, contribution_score,
    variance_from_overall_pct,
    'device_type'::TEXT,
    dim_device_type::TEXT,
    min_sample, top_n
  FROM base 
  WHERE 'device_type' = ANY(dim_keys)
  
  UNION ALL
  
  -- User Role
  SELECT
    tenant_id, kpi_key, month, trend_window,
    overall_avg_value, overall_prev_avg, overall_delta_pct,
    avg_value_dim, dim_sample_sum, share_ratio, contribution_score,
    variance_from_overall_pct,
    'user_role'::TEXT,
    dim_user_role::TEXT,
    min_sample, top_n
  FROM base 
  WHERE 'user_role' = ANY(dim_keys)
),
filtered AS (
  -- Filter out NULL and '__null__' values
  SELECT *
  FROM unpivot
  WHERE dim_value IS NOT NULL 
    AND dim_value <> '__null__'
    AND contribution_score IS NOT NULL
)
SELECT
  tenant_id,
  kpi_key,
  month,
  trend_window,
  dim_key,
  dim_value,
  avg_value,
  prev_avg,
  delta_pct,
  avg_value_dim,
  dim_sample_sum,
  share_ratio,
  contribution_score,
  variance_from_overall_pct,
  min_sample,
  top_n,
  -- Rank within each partition
  ROW_NUMBER() OVER (
    PARTITION BY tenant_id, kpi_key, month, trend_window, dim_key 
    ORDER BY ABS(contribution_score) DESC NULLS LAST
  ) AS rnk,
  -- Also provide absolute ranking (for both positive and negative contributors)
  CASE 
    WHEN contribution_score > 0 THEN 'positive'
    WHEN contribution_score < 0 THEN 'negative'
    ELSE 'neutral'
  END AS contribution_direction
FROM filtered;

-- Create unique index for CONCURRENT refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_rca_monthly_top_contributors_unique
  ON public.mv_rca_monthly_top_contributors(
    tenant_id,
    kpi_key,
    month,
    trend_window,
    dim_key,
    dim_value
  );

-- Performance index for lookups and filtering by rank
CREATE INDEX IF NOT EXISTS idx_mv_rca_monthly_top_contributors_lookup
  ON public.mv_rca_monthly_top_contributors(
    tenant_id, 
    kpi_key, 
    month, 
    trend_window, 
    dim_key, 
    rnk
  );

-- Index for filtering top N contributors
CREATE INDEX IF NOT EXISTS idx_mv_rca_monthly_top_contributors_top_n
  ON public.mv_rca_monthly_top_contributors(
    tenant_id,
    kpi_key,
    month,
    trend_window,
    dim_key
  )
  WHERE rnk <= 10;  -- Assuming max top_n is 10

-- Update refresh function to include new MV
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
  
  -- RCA MVs (Part 4.A)
  v_start := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_monthly_dim_agg;
  v_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER;
  PERFORM log_refresh('mv_kpi_monthly_dim_agg', v_duration);
  
  v_start := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_rca_monthly_contributors;
  v_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER;
  PERFORM log_refresh('mv_rca_monthly_contributors', v_duration);
  
  -- NEW: RCA Top Contributors (Part 4.B)
  v_start := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_rca_monthly_top_contributors;
  v_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER;
  PERFORM log_refresh('mv_rca_monthly_top_contributors', v_duration);
  
EXCEPTION
  WHEN OTHERS THEN
    PERFORM log_refresh('refresh_gate_k_views', NULL, 'error', SQLERRM);
    RAISE;
END;
$$;