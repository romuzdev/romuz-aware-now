-- ============================================================================
-- Gate-E Closeout: Fix Metric Type + Add Materialized View
-- ============================================================================

-- Step 1: Add export_failure_events to alert_policies metric check constraint
-- First drop the old constraint
ALTER TABLE alert_policies DROP CONSTRAINT IF EXISTS alert_policies_metric_check;

-- Then add new constraint with export_failure_events
ALTER TABLE alert_policies ADD CONSTRAINT alert_policies_metric_check 
CHECK (metric IN ('open_rate', 'click_rate', 'activation_rate', 'completion_rate', 'bounce_rate', 'export_failure_events'));

-- Step 2: Create materialized view for campaign KPIs daily (if not exists)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_campaign_kpis_daily AS
SELECT 
  c.tenant_id,
  c.id as campaign_id,
  to_riyadh_date(p.updated_at) as date_r,
  COUNT(CASE WHEN p.status != 'not_started' THEN 1 END) as invited_count,
  COUNT(CASE WHEN p.status IN ('in_progress', 'completed') THEN 1 END) as opened_count,
  COUNT(CASE WHEN p.status IN ('in_progress', 'completed') THEN 1 END) as clicked_count,
  COUNT(CASE WHEN p.status = 'in_progress' THEN 1 END) as activated_count,
  COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completed_count,
  0 as reminded_count,
  0 as bounced_count,
  CASE 
    WHEN COUNT(*) > 0 THEN 
      (COUNT(CASE WHEN p.status IN ('in_progress', 'completed') THEN 1 END)::numeric / COUNT(*)::numeric * 100)
    ELSE 0 
  END as kpi_open_rate,
  CASE 
    WHEN COUNT(*) > 0 THEN 
      (COUNT(CASE WHEN p.status IN ('in_progress', 'completed') THEN 1 END)::numeric / COUNT(*)::numeric * 100)
    ELSE 0 
  END as kpi_click_rate,
  CASE 
    WHEN COUNT(*) > 0 THEN 
      (COUNT(CASE WHEN p.status = 'in_progress' THEN 1 END)::numeric / COUNT(*)::numeric * 100)
    ELSE 0 
  END as kpi_activation_rate,
  CASE 
    WHEN COUNT(*) > 0 THEN 
      (COUNT(CASE WHEN p.status = 'completed' THEN 1 END)::numeric / COUNT(*)::numeric * 100)
    ELSE 0 
  END as kpi_completion_rate,
  now() as refreshed_at
FROM awareness_campaigns c
LEFT JOIN campaign_participants p ON p.campaign_id = c.id
WHERE c.is_test = false OR c.is_test IS NULL
GROUP BY c.tenant_id, c.id, to_riyadh_date(p.updated_at);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_mv_campaign_kpis_daily_lookup 
ON mv_campaign_kpis_daily(tenant_id, campaign_id, date_r DESC);

COMMENT ON MATERIALIZED VIEW mv_campaign_kpis_daily IS 'Daily campaign KPIs aggregated by Riyadh date for alerting and analytics';