-- ============================================================
-- FIX: Explicitly set SECURITY INVOKER on views
-- This ensures views use the querying user's permissions and RLS
-- rather than bypassing security checks
-- ============================================================

-- Drop and recreate view A with explicit SECURITY INVOKER
DROP VIEW IF EXISTS public.vw_awareness_campaign_kpis CASCADE;

CREATE VIEW public.vw_awareness_campaign_kpis 
WITH (security_invoker = true)
AS
SELECT 
  c.tenant_id,
  c.id AS campaign_id,
  c.name AS campaign_name,
  c.owner_name,
  c.start_date,
  c.end_date,
  c.status AS campaign_status,
  
  -- Total participants (excluding soft-deleted)
  COUNT(p.id) AS total_participants,
  
  -- Started count: in_progress or completed
  COUNT(p.id) FILTER (WHERE p.status IN ('in_progress', 'completed')) AS started_count,
  
  -- Completed count
  COUNT(p.id) FILTER (WHERE p.status = 'completed') AS completed_count,
  
  -- Average score: prioritize quiz submissions, fallback to participant.score
  COALESCE(
    AVG(qs.score) FILTER (WHERE qs.score IS NOT NULL),
    AVG(p.score) FILTER (WHERE p.score IS NOT NULL)
  ) AS avg_score,
  
  -- Overdue count: not completed AND past end_date
  COUNT(p.id) FILTER (
    WHERE p.status != 'completed' 
    AND p.completed_at IS NULL 
    AND c.end_date < CURRENT_DATE
  ) AS overdue_count,
  
  -- Completion rate: completed / total (handle division by zero)
  CASE 
    WHEN COUNT(p.id) > 0 THEN 
      ROUND(
        (COUNT(p.id) FILTER (WHERE p.status = 'completed')::numeric / COUNT(p.id)::numeric) * 100, 
        2
      )
    ELSE 0
  END AS completion_rate,
  
  -- Started rate: started / total
  CASE 
    WHEN COUNT(p.id) > 0 THEN 
      ROUND(
        (COUNT(p.id) FILTER (WHERE p.status IN ('in_progress', 'completed'))::numeric / COUNT(p.id)::numeric) * 100, 
        2
      )
    ELSE 0
  END AS started_rate,
  
  -- Active days: days since start_date
  GREATEST(0, CURRENT_DATE - c.start_date) AS active_days

FROM public.awareness_campaigns c
LEFT JOIN public.campaign_participants p 
  ON c.id = p.campaign_id 
  AND c.tenant_id = p.tenant_id
  AND p.deleted_at IS NULL

LEFT JOIN public.quiz_submissions qs 
  ON p.id = qs.participant_id 
  AND p.tenant_id = qs.tenant_id

WHERE c.archived_at IS NULL

GROUP BY 
  c.tenant_id,
  c.id,
  c.name,
  c.owner_name,
  c.start_date,
  c.end_date,
  c.status;

GRANT SELECT ON public.vw_awareness_campaign_kpis TO authenticated;

COMMENT ON VIEW public.vw_awareness_campaign_kpis IS 
'Campaign-level KPIs. SECURITY INVOKER ensures tenant isolation via base table RLS.';


-- Drop and recreate view B with explicit SECURITY INVOKER
DROP VIEW IF EXISTS public.vw_awareness_daily_engagement CASCADE;

CREATE VIEW public.vw_awareness_daily_engagement
WITH (security_invoker = true)
AS
WITH daily_completed AS (
  SELECT 
    p.tenant_id,
    p.campaign_id,
    p.completed_at::date AS day,
    COUNT(*) AS completed_delta,
    AVG(COALESCE(qs.score, p.score)) AS avg_score_day
  FROM public.campaign_participants p
  LEFT JOIN public.quiz_submissions qs 
    ON p.id = qs.participant_id 
    AND p.tenant_id = qs.tenant_id
  WHERE 
    p.deleted_at IS NULL
    AND p.completed_at IS NOT NULL
  GROUP BY 
    p.tenant_id,
    p.campaign_id,
    p.completed_at::date
),
daily_started AS (
  SELECT 
    mp.tenant_id,
    mp.campaign_id,
    mp.started_at::date AS day,
    COUNT(DISTINCT mp.participant_id) AS started_delta
  FROM public.module_progress mp
  INNER JOIN public.campaign_participants p 
    ON mp.participant_id = p.id 
    AND mp.tenant_id = p.tenant_id
  WHERE 
    mp.started_at IS NOT NULL
    AND p.deleted_at IS NULL
  GROUP BY 
    mp.tenant_id,
    mp.campaign_id,
    mp.started_at::date
)
SELECT 
  COALESCE(dc.tenant_id, ds.tenant_id) AS tenant_id,
  COALESCE(dc.campaign_id, ds.campaign_id) AS campaign_id,
  COALESCE(dc.day, ds.day) AS day,
  COALESCE(ds.started_delta, 0) AS started_delta,
  COALESCE(dc.completed_delta, 0) AS completed_delta,
  dc.avg_score_day
FROM daily_completed dc
FULL OUTER JOIN daily_started ds 
  ON dc.tenant_id = ds.tenant_id 
  AND dc.campaign_id = ds.campaign_id 
  AND dc.day = ds.day
ORDER BY day DESC;

GRANT SELECT ON public.vw_awareness_daily_engagement TO authenticated;

COMMENT ON VIEW public.vw_awareness_daily_engagement IS 
'Daily engagement metrics. SECURITY INVOKER ensures tenant-scoped queries via base RLS.';