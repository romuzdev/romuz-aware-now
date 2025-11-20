-- ============================================================
-- FIX: Make View A match EXACT Prompt specifications
-- ============================================================

DROP VIEW IF EXISTS public.vw_awareness_campaign_kpis CASCADE;

CREATE VIEW public.vw_awareness_campaign_kpis 
WITH (security_invoker = true)
AS
WITH campaign_metrics AS (
  SELECT 
    c.tenant_id,
    c.id AS campaign_id,
    c.name AS campaign_name,
    c.owner_name,
    c.start_date,
    c.end_date,
    
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
    ) AS overdue_count

  FROM public.awareness_campaigns c
  LEFT JOIN public.campaign_participants p 
    ON c.id = p.campaign_id 
    AND c.tenant_id = p.tenant_id
    AND p.deleted_at IS NULL  -- Exclude soft-deleted participants

  LEFT JOIN public.quiz_submissions qs 
    ON p.id = qs.participant_id 
    AND p.tenant_id = qs.tenant_id

  WHERE c.archived_at IS NULL  -- Exclude archived campaigns

  GROUP BY 
    c.tenant_id,
    c.id,
    c.name,
    c.owner_name,
    c.start_date,
    c.end_date
)
SELECT
  tenant_id,
  campaign_id,
  campaign_name,
  owner_name,
  start_date,
  end_date,
  total_participants,
  started_count,
  completed_count,
  avg_score,
  overdue_count,
  
  -- Completion rate: completed_count / NULLIF(total_participants, 0)
  -- Return as percentage, NULL-safe
  completed_count::numeric / NULLIF(total_participants, 0) * 100 AS completion_rate,
  
  -- Started rate: started_count / NULLIF(total_participants, 0)
  started_count::numeric / NULLIF(total_participants, 0) * 100 AS started_rate,
  
  -- Active days: days since start_date
  GREATEST(0, CURRENT_DATE - start_date) AS active_days

FROM campaign_metrics;

GRANT SELECT ON public.vw_awareness_campaign_kpis TO authenticated;

COMMENT ON VIEW public.vw_awareness_campaign_kpis IS 
'Campaign-level KPIs aggregating participants, scores, and completion metrics. Tenant-scoped via base table RLS. Uses NULLIF for safe division in rates.';