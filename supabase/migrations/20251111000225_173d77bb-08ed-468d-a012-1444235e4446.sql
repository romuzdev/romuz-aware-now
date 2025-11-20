-- Gate-I • Part 2C — Fix Materialized View with Embedded KPIs
-- Recreate mv_awareness_campaign_kpis with all KPI formulas

DROP MATERIALIZED VIEW IF EXISTS public.mv_awareness_campaign_kpis CASCADE;

CREATE MATERIALIZED VIEW public.mv_awareness_campaign_kpis AS
SELECT 
  ac.tenant_id,
  ac.id AS campaign_id,
  ac.name AS campaign_name,
  ac.status,
  ac.owner_name,
  ac.start_at,
  ac.end_at,
  
  -- Participant journey metrics (existing - preserved)
  COUNT(DISTINCT cp.id) AS total_participants,
  COUNT(DISTINCT CASE WHEN cp.invited_at IS NOT NULL THEN cp.id END) AS invited_count,
  COUNT(DISTINCT CASE WHEN cp.opened_at IS NOT NULL THEN cp.id END) AS opened_count,
  COUNT(DISTINCT CASE WHEN cp.status = 'in_progress' THEN cp.id END) AS in_progress_count,
  COUNT(DISTINCT CASE WHEN cp.status = 'completed' THEN cp.id END) AS completed_count,
  
  -- Feedback aggregates (existing - preserved)
  COUNT(DISTINCT cf.id) AS feedback_count,
  COALESCE(AVG(cf.score), 0)::NUMERIC(10,2) AS avg_feedback_score,
  
  -- Legacy KPI columns (existing - preserved for backwards compatibility)
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
  
  -- Average time metrics (existing - preserved)
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

-- Recreate unique index for concurrent refresh
CREATE UNIQUE INDEX idx_mv_awareness_campaign_kpis_pk 
  ON public.mv_awareness_campaign_kpis (tenant_id, campaign_id);

COMMENT ON MATERIALIZED VIEW public.mv_awareness_campaign_kpis IS 
  'Pre-aggregated campaign KPIs with embedded rate formulas: engagement_rate, completion_rate, active_participants_rate, feedback_coverage_rate (Part 2C)';

GRANT SELECT ON public.mv_awareness_campaign_kpis TO authenticated;