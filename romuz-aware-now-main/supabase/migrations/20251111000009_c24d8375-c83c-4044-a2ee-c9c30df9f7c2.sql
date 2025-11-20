-- Gate-I • Part 2C — Embedded KPI formulas in analytics views (Fixed)
-- Adds computed engagement, completion, and feedback coverage rates directly in views

-- =============================================================================
-- 1. DROP and RECREATE Campaign Insights View with Embedded KPI Formulas
-- =============================================================================
DROP VIEW IF EXISTS public.vw_awareness_campaign_insights;

CREATE VIEW public.vw_awareness_campaign_insights AS
SELECT 
  ac.tenant_id,
  ac.id AS campaign_id,
  ac.name AS campaign_name,
  ac.status,
  ac.start_at,
  ac.end_at,
  ac.owner_name,
  
  -- Participant counts by status (existing columns - preserved)
  COUNT(DISTINCT cp.id) AS total_targeted_participants,
  COUNT(DISTINCT CASE WHEN cp.invited_at IS NOT NULL THEN cp.id END) AS total_invited_participants,
  COUNT(DISTINCT CASE WHEN cp.opened_at IS NOT NULL THEN cp.id END) AS total_opened,
  COUNT(DISTINCT CASE WHEN cp.status = 'in_progress' THEN cp.id END) AS total_in_progress,
  COUNT(DISTINCT CASE WHEN cp.status = 'completed' THEN cp.id END) AS total_completed,
  
  -- Feedback metrics (existing columns - preserved)
  COUNT(DISTINCT cf.id) AS total_feedback_count,
  COALESCE(AVG(cf.score), 0)::NUMERIC(10,2) AS avg_feedback_score,
  
  -- Legacy percentage columns (existing - preserved for backwards compatibility)
  CASE 
    WHEN COUNT(DISTINCT cp.id) > 0 
    THEN (COUNT(DISTINCT CASE WHEN cp.status = 'completed' THEN cp.id END)::NUMERIC / COUNT(DISTINCT cp.id)::NUMERIC * 100)::NUMERIC(5,2)
    ELSE 0 
  END AS completion_rate_pct,
  
  CASE 
    WHEN COUNT(DISTINCT cp.id) > 0 
    THEN (COUNT(DISTINCT CASE WHEN cp.opened_at IS NOT NULL THEN cp.id END)::NUMERIC / COUNT(DISTINCT cp.id)::NUMERIC * 100)::NUMERIC(5,2)
    ELSE 0 
  END AS open_rate_pct,
  
  -- ========== NEW KPI FORMULAS (Part 2C) ==========
  
  -- 1. Engagement Rate: opened / invited (0.0 - 1.0)
  (COUNT(DISTINCT CASE WHEN cp.opened_at IS NOT NULL THEN cp.id END)::NUMERIC / 
   NULLIF(COUNT(DISTINCT CASE WHEN cp.invited_at IS NOT NULL THEN cp.id END)::NUMERIC, 0))::NUMERIC(10,4) AS engagement_rate,
  
  -- 2. Completion Rate: completed / opened (0.0 - 1.0)
  (COUNT(DISTINCT CASE WHEN cp.status = 'completed' THEN cp.id END)::NUMERIC / 
   NULLIF(COUNT(DISTINCT CASE WHEN cp.opened_at IS NOT NULL THEN cp.id END)::NUMERIC, 0))::NUMERIC(10,4) AS completion_rate,
  
  -- 3. Active Participants Rate: (in_progress + completed) / invited (0.0 - 1.0)
  ((COUNT(DISTINCT CASE WHEN cp.status = 'in_progress' THEN cp.id END) + 
    COUNT(DISTINCT CASE WHEN cp.status = 'completed' THEN cp.id END))::NUMERIC / 
   NULLIF(COUNT(DISTINCT CASE WHEN cp.invited_at IS NOT NULL THEN cp.id END)::NUMERIC, 0))::NUMERIC(10,4) AS active_participants_rate,
  
  -- 4. Feedback Coverage Rate: feedback_count / completed (0.0 - 1.0+)
  (COUNT(DISTINCT cf.id)::NUMERIC / 
   NULLIF(COUNT(DISTINCT CASE WHEN cp.status = 'completed' THEN cp.id END)::NUMERIC, 0))::NUMERIC(10,4) AS feedback_coverage_rate,
  
  -- Timestamps (existing - preserved)
  ac.created_at,
  ac.updated_at
  
FROM public.awareness_campaigns ac
LEFT JOIN public.campaign_participants cp 
  ON ac.id = cp.campaign_id 
  AND ac.tenant_id = cp.tenant_id
  AND cp.deleted_at IS NULL
LEFT JOIN public.campaign_feedback cf 
  ON ac.id = cf.campaign_id 
  AND ac.tenant_id = cf.tenant_id
  
WHERE ac.archived_at IS NULL
  AND ac.is_test = false

GROUP BY 
  ac.tenant_id,
  ac.id,
  ac.name,
  ac.status,
  ac.start_at,
  ac.end_at,
  ac.owner_name,
  ac.created_at,
  ac.updated_at;

COMMENT ON VIEW public.vw_awareness_campaign_insights IS 
  'Campaign analytics with embedded KPI formulas: engagement_rate, completion_rate, active_participants_rate, feedback_coverage_rate (Part 2C)';

GRANT SELECT ON public.vw_awareness_campaign_insights TO authenticated;

-- =============================================================================
-- 2. Update Timeseries View with Future-Ready Structure
-- =============================================================================
DROP VIEW IF EXISTS public.vw_awareness_timeseries;

CREATE VIEW public.vw_awareness_timeseries AS
SELECT 
  ac.tenant_id,
  ac.id AS campaign_id,
  ac.name AS campaign_name,
  
  -- Date bucket (daily aggregation)
  DATE(COALESCE(cp.opened_at, cp.invited_at, cp.created_at)) AS date_bucket,
  
  -- Daily engagement metrics (existing - preserved)
  COUNT(DISTINCT CASE WHEN cp.opened_at::DATE = DATE(COALESCE(cp.opened_at, cp.invited_at, cp.created_at)) THEN cp.id END) AS daily_opened,
  COUNT(DISTINCT CASE WHEN cp.completed_at::DATE = DATE(COALESCE(cp.opened_at, cp.invited_at, cp.created_at)) THEN cp.id END) AS daily_completed,
  
  -- Cumulative metrics (existing - preserved)
  COUNT(DISTINCT CASE WHEN cp.opened_at IS NOT NULL THEN cp.id END) AS cumulative_opened,
  COUNT(DISTINCT CASE WHEN cp.completed_at IS NOT NULL THEN cp.id END) AS cumulative_completed,
  
  -- Daily feedback (existing - preserved)
  COUNT(DISTINCT CASE WHEN cf.submitted_at::DATE = DATE(COALESCE(cp.opened_at, cp.invited_at, cp.created_at)) THEN cf.id END) AS daily_feedback_count,
  COALESCE(AVG(CASE WHEN cf.submitted_at::DATE = DATE(COALESCE(cp.opened_at, cp.invited_at, cp.created_at)) THEN cf.score END), 0)::NUMERIC(10,2) AS daily_avg_feedback_score
  
  -- TODO (Part 2C - Future Enhancement): Add daily rate calculations
  -- daily_engagement_rate = daily_opened / NULLIF(daily_invited, 0)
  -- daily_completion_rate = daily_completed / NULLIF(daily_opened, 0)
  -- Requires tracking daily_invited_count for accurate daily rate calculations
  
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
  DATE(COALESCE(cp.opened_at, cp.invited_at, cp.created_at))

ORDER BY 
  ac.tenant_id,
  ac.id,
  date_bucket;

COMMENT ON VIEW public.vw_awareness_timeseries IS 
  'Daily time-series data. Future: will include daily_engagement_rate, daily_completion_rate (Part 2C TODO)';

GRANT SELECT ON public.vw_awareness_timeseries TO authenticated;

-- =============================================================================
-- 3. Update Refresh Function documentation
-- =============================================================================
COMMENT ON FUNCTION public.refresh_awareness_views() IS 
  'Refreshes all awareness materialized views including Part 2C KPI formulas. Schedule via cron or edge function.';