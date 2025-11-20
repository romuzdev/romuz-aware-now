-- Gate-I • Part 2B — Additional Materialized Views for High-Performance Analytics
-- Creates materialized versions of feedback and timeseries views as per specifications

-- =============================================================================
-- 1. Materialized Feedback Insights (for high-traffic feedback dashboards)
-- =============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_awareness_feedback_insights AS
SELECT 
  ac.tenant_id,
  ac.id AS campaign_id,
  ac.name AS campaign_name,
  ac.status AS campaign_status,
  
  -- Feedback metrics
  COUNT(cf.id) AS total_feedback_count,
  COALESCE(AVG(cf.score), 0)::NUMERIC(10,2) AS avg_feedback_score,
  MIN(cf.score) AS min_feedback_score,
  MAX(cf.score) AS max_feedback_score,
  
  -- Score distribution
  COUNT(CASE WHEN cf.score >= 4 THEN 1 END) AS positive_feedback_count,
  COUNT(CASE WHEN cf.score = 3 THEN 1 END) AS neutral_feedback_count,
  COUNT(CASE WHEN cf.score <= 2 THEN 1 END) AS negative_feedback_count,
  
  -- Feedback with comments
  COUNT(CASE WHEN cf.comment IS NOT NULL AND LENGTH(TRIM(cf.comment)) > 0 THEN 1 END) AS feedback_with_comments_count,
  
  -- Timestamps
  MAX(cf.submitted_at) AS last_feedback_at,
  MIN(cf.submitted_at) AS first_feedback_at,
  
  -- Refresh metadata
  now() AS refreshed_at
  
FROM public.awareness_campaigns ac
LEFT JOIN public.campaign_feedback cf 
  ON ac.id = cf.campaign_id 
  AND ac.tenant_id = cf.tenant_id
  
WHERE ac.archived_at IS NULL
  AND ac.is_test = false

GROUP BY 
  ac.tenant_id,
  ac.id,
  ac.name,
  ac.status;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_awareness_feedback_insights_pk 
  ON public.mv_awareness_feedback_insights (tenant_id, campaign_id);

COMMENT ON MATERIALIZED VIEW public.mv_awareness_feedback_insights IS 
  'Pre-aggregated feedback analytics for high-performance sentiment analysis dashboards. Refresh periodically.';

-- =============================================================================
-- 2. Materialized Timeseries (for high-traffic trend dashboards)
-- =============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_awareness_timeseries AS
SELECT 
  ac.tenant_id,
  ac.id AS campaign_id,
  ac.name AS campaign_name,
  
  -- Date bucket (daily aggregation)
  DATE(COALESCE(cp.opened_at, cp.invited_at, cp.created_at)) AS date_bucket,
  
  -- Daily engagement metrics
  COUNT(DISTINCT CASE WHEN cp.opened_at::DATE = DATE(COALESCE(cp.opened_at, cp.invited_at, cp.created_at)) THEN cp.id END) AS daily_opened,
  COUNT(DISTINCT CASE WHEN cp.completed_at::DATE = DATE(COALESCE(cp.opened_at, cp.invited_at, cp.created_at)) THEN cp.id END) AS daily_completed,
  
  -- Cumulative metrics
  COUNT(DISTINCT CASE WHEN cp.opened_at IS NOT NULL THEN cp.id END) AS cumulative_opened,
  COUNT(DISTINCT CASE WHEN cp.completed_at IS NOT NULL THEN cp.id END) AS cumulative_completed,
  
  -- Daily feedback
  COUNT(DISTINCT CASE WHEN cf.submitted_at::DATE = DATE(COALESCE(cp.opened_at, cp.invited_at, cp.created_at)) THEN cf.id END) AS daily_feedback_count,
  COALESCE(AVG(CASE WHEN cf.submitted_at::DATE = DATE(COALESCE(cp.opened_at, cp.invited_at, cp.created_at)) THEN cf.score END), 0)::NUMERIC(10,2) AS daily_avg_feedback_score,
  
  -- Refresh metadata
  now() AS refreshed_at
  
FROM public.awareness_campaigns ac
LEFT JOIN public.campaign_participants cp 
  ON ac.id = cp.campaign_id 
  AND ac.tenant_id = cp.tenant_id
  AND cp.deleted_at IS NULL
LEFT JOIN public.campaign_feedback cf 
  ON cp.id = cf.participant_id 
  AND ac.tenant_id = cf.tenant_id
  
WHERE ac.archived_at IS NULL
  AND ac.is_test = false
  AND (cp.invited_at IS NOT NULL OR cp.opened_at IS NOT NULL OR cp.created_at IS NOT NULL)

GROUP BY 
  ac.tenant_id,
  ac.id,
  ac.name,
  DATE(COALESCE(cp.opened_at, cp.invited_at, cp.created_at));

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_awareness_timeseries_pk 
  ON public.mv_awareness_timeseries (tenant_id, campaign_id, date_bucket);

COMMENT ON MATERIALIZED VIEW public.mv_awareness_timeseries IS 
  'Pre-aggregated daily timeseries data for high-performance trend charts. Refresh periodically.';

-- =============================================================================
-- 3. Update Refresh Function to include new materialized views
-- =============================================================================
CREATE OR REPLACE FUNCTION public.refresh_awareness_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Refresh all awareness materialized views concurrently
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_awareness_campaign_kpis;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_awareness_feedback_insights;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_awareness_timeseries;
END;
$$;

COMMENT ON FUNCTION public.refresh_awareness_views() IS 
  'Refreshes all awareness analytics materialized views. Schedule via cron or edge function.';

-- =============================================================================
-- Grant permissions
-- =============================================================================
GRANT SELECT ON public.mv_awareness_feedback_insights TO authenticated;
GRANT SELECT ON public.mv_awareness_timeseries TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_awareness_views() TO authenticated;