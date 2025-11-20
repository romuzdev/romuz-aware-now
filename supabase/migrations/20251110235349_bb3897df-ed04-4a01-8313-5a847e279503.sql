-- Gate-I • Part 2B — Core Analytics Views for Awareness Engine
-- Creates normalized views for awareness campaigns, participants, and feedback analytics

-- =============================================================================
-- 1. Campaign Insights View (comprehensive campaign-level metrics)
-- =============================================================================
CREATE OR REPLACE VIEW public.vw_awareness_campaign_insights AS
SELECT 
  ac.tenant_id,
  ac.id AS campaign_id,
  ac.name AS campaign_name,
  ac.status,
  ac.start_at,
  ac.end_at,
  ac.owner_name,
  
  -- Participant counts by status
  COUNT(DISTINCT cp.id) AS total_targeted_participants,
  COUNT(DISTINCT CASE WHEN cp.invited_at IS NOT NULL THEN cp.id END) AS total_invited_participants,
  COUNT(DISTINCT CASE WHEN cp.opened_at IS NOT NULL THEN cp.id END) AS total_opened,
  COUNT(DISTINCT CASE WHEN cp.status = 'in_progress' THEN cp.id END) AS total_in_progress,
  COUNT(DISTINCT CASE WHEN cp.status = 'completed' THEN cp.id END) AS total_completed,
  
  -- Feedback metrics
  COUNT(DISTINCT cf.id) AS total_feedback_count,
  COALESCE(AVG(cf.score), 0)::NUMERIC(10,2) AS avg_feedback_score,
  
  -- Completion rates
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
  
  -- Timestamps
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
  'Comprehensive campaign-level analytics including participant engagement and feedback metrics';

-- =============================================================================
-- 2. Feedback Insights View (detailed feedback analytics)
-- =============================================================================
CREATE OR REPLACE VIEW public.vw_awareness_feedback_insights AS
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
  MIN(cf.submitted_at) AS first_feedback_at
  
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

COMMENT ON VIEW public.vw_awareness_feedback_insights IS 
  'Detailed feedback analytics per campaign including score distribution and sentiment analysis';

-- =============================================================================
-- 3. Time-Series View (daily engagement trends)
-- =============================================================================
CREATE OR REPLACE VIEW public.vw_awareness_timeseries AS
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
  COALESCE(AVG(CASE WHEN cf.submitted_at::DATE = DATE(COALESCE(cp.opened_at, cp.invited_at, cp.created_at)) THEN cf.score END), 0)::NUMERIC(10,2) AS daily_avg_feedback_score
  
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
  'Daily time-series data for awareness campaign engagement and feedback trends';

-- =============================================================================
-- 4. Materialized View: Campaign KPIs (for high-performance dashboards)
-- =============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_awareness_campaign_kpis AS
SELECT 
  ac.tenant_id,
  ac.id AS campaign_id,
  ac.name AS campaign_name,
  ac.status,
  ac.owner_name,
  ac.start_at,
  ac.end_at,
  
  -- Participant journey metrics
  COUNT(DISTINCT cp.id) AS total_participants,
  COUNT(DISTINCT CASE WHEN cp.invited_at IS NOT NULL THEN cp.id END) AS invited_count,
  COUNT(DISTINCT CASE WHEN cp.opened_at IS NOT NULL THEN cp.id END) AS opened_count,
  COUNT(DISTINCT CASE WHEN cp.status = 'in_progress' THEN cp.id END) AS in_progress_count,
  COUNT(DISTINCT CASE WHEN cp.status = 'completed' THEN cp.id END) AS completed_count,
  
  -- Feedback aggregates
  COUNT(DISTINCT cf.id) AS feedback_count,
  COALESCE(AVG(cf.score), 0)::NUMERIC(10,2) AS avg_feedback_score,
  
  -- Performance KPIs
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN cp.invited_at IS NOT NULL THEN cp.id END) > 0 
    THEN (COUNT(DISTINCT CASE WHEN cp.opened_at IS NOT NULL THEN cp.id END)::NUMERIC / 
          COUNT(DISTINCT CASE WHEN cp.invited_at IS NOT NULL THEN cp.id END)::NUMERIC * 100)::NUMERIC(5,2)
    ELSE 0 
  END AS kpi_open_rate,
  
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN cp.opened_at IS NOT NULL THEN cp.id END) > 0 
    THEN (COUNT(DISTINCT CASE WHEN cp.status = 'in_progress' THEN cp.id END)::NUMERIC / 
          COUNT(DISTINCT CASE WHEN cp.opened_at IS NOT NULL THEN cp.id END)::NUMERIC * 100)::NUMERIC(5,2)
    ELSE 0 
  END AS kpi_activation_rate,
  
  CASE 
    WHEN COUNT(DISTINCT cp.id) > 0 
    THEN (COUNT(DISTINCT CASE WHEN cp.status = 'completed' THEN cp.id END)::NUMERIC / 
          COUNT(DISTINCT cp.id)::NUMERIC * 100)::NUMERIC(5,2)
    ELSE 0 
  END AS kpi_completion_rate,
  
  -- Average time metrics (in hours)
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN cp.opened_at IS NOT NULL AND cp.invited_at IS NOT NULL THEN cp.id END) > 0 
    THEN AVG(EXTRACT(EPOCH FROM (cp.opened_at - cp.invited_at)) / 3600)::NUMERIC(10,2)
    ELSE NULL 
  END AS avg_time_to_open_hours,
  
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN cp.completed_at IS NOT NULL AND cp.opened_at IS NOT NULL THEN cp.id END) > 0 
    THEN AVG(EXTRACT(EPOCH FROM (cp.completed_at - cp.opened_at)) / 3600)::NUMERIC(10,2)
    ELSE NULL 
  END AS avg_time_to_complete_hours,
  
  -- Refresh timestamp
  now() AS refreshed_at
  
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
  ac.owner_name,
  ac.start_at,
  ac.end_at;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_awareness_campaign_kpis_pk 
  ON public.mv_awareness_campaign_kpis (tenant_id, campaign_id);

COMMENT ON MATERIALIZED VIEW public.mv_awareness_campaign_kpis IS 
  'Pre-aggregated campaign KPIs for high-performance dashboard queries. Refresh periodically via scheduled job.';

-- =============================================================================
-- Grant permissions (align with existing RLS patterns)
-- =============================================================================
GRANT SELECT ON public.vw_awareness_campaign_insights TO authenticated;
GRANT SELECT ON public.vw_awareness_feedback_insights TO authenticated;
GRANT SELECT ON public.vw_awareness_timeseries TO authenticated;
GRANT SELECT ON public.mv_awareness_campaign_kpis TO authenticated;