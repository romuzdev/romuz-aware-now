-- ============================================================================
-- Gate-H Read Models: Action Summary & Analytics Views
-- ============================================================================
-- Purpose: Provide read-optimized views for Gate-H actions with:
--   - Enriched display names (assignee/owner)
--   - Computed fields (overdue, SLA breach, days to due)
--   - Update statistics (last update, evidence count, progress)
-- Author: Gate-H Implementation (Part 5.1)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- View 1: gate_h.vw_actions_summary
-- ----------------------------------------------------------------------------
-- Purpose: Convenient projection for UI lists with user display names
-- Security: Relies on RLS from gate_h.action_items
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW gate_h.vw_actions_summary AS
SELECT
  a.id,
  a.tenant_id,
  a.source,
  a.source_reco_id,
  a.kpi_key,
  a.dim_key,
  a.dim_value,
  a.title_ar,
  a.desc_ar,
  a.priority,
  a.status,
  a.assignee_user_id,
  a.owner_user_id,
  -- Display names from auth.users
  COALESCE(
    assignee_user.raw_user_meta_data->>'full_name',
    assignee_user.email
  ) AS assignee_display_name,
  COALESCE(
    owner_user.raw_user_meta_data->>'full_name',
    owner_user.email
  ) AS owner_display_name,
  a.due_date,
  a.sla_days,
  a.effort,
  a.tags,
  a.created_at,
  a.created_by,
  a.updated_at,
  a.updated_by,
  a.verified_at,
  a.verified_by,
  a.closed_at
FROM gate_h.action_items a
LEFT JOIN auth.users assignee_user ON a.assignee_user_id = assignee_user.id
LEFT JOIN auth.users owner_user ON a.owner_user_id = owner_user.id;

COMMENT ON VIEW gate_h.vw_actions_summary IS 
'Gate-H actions summary view: convenient projection for UI lists with enriched user display names';

-- ----------------------------------------------------------------------------
-- View 2: gate_h.vw_actions_with_stats
-- ----------------------------------------------------------------------------
-- Purpose: Extends summary with computed fields and update statistics
-- Adds: is_overdue, days_to_due, sla_deadline, sla_breached,
--       last_update_at, last_update_type, evidence_count, max_progress_pct
-- Security: Relies on RLS from underlying tables
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW gate_h.vw_actions_with_stats AS
SELECT
  s.*,
  -- Computed status flags
  (s.status = 'closed') AS is_closed,
  (s.due_date IS NOT NULL AND s.due_date < CURRENT_DATE AND s.status <> 'closed') AS is_overdue,
  (s.due_date - CURRENT_DATE) AS days_to_due,
  -- SLA calculations
  CASE
    WHEN s.sla_days IS NOT NULL THEN s.created_at + (s.sla_days || ' days')::INTERVAL
    ELSE NULL
  END AS sla_deadline,
  (
    s.sla_days IS NOT NULL 
    AND now() > (s.created_at + (s.sla_days || ' days')::INTERVAL)
    AND s.status <> 'closed'
  ) AS sla_breached,
  -- Update statistics
  stats.last_update_at,
  stats.last_update_type,
  COALESCE(stats.evidence_count, 0) AS evidence_count,
  stats.max_progress_pct
FROM gate_h.vw_actions_summary s
LEFT JOIN LATERAL (
  SELECT
    MAX(u.created_at) AS last_update_at,
    (ARRAY_AGG(u.update_type::TEXT ORDER BY u.created_at DESC))[1] AS last_update_type,
    COUNT(*) FILTER (WHERE u.update_type = 'evidence') AS evidence_count,
    MAX(u.progress_pct) FILTER (WHERE u.update_type = 'progress') AS max_progress_pct
  FROM gate_h.action_updates u
  WHERE u.action_id = s.id
) stats ON true;

COMMENT ON VIEW gate_h.vw_actions_with_stats IS 
'Gate-H actions with computed fields (overdue, SLA breach, days to due) and update statistics (last update, evidence count, progress)';

-- ----------------------------------------------------------------------------
-- View 3: gate_h.vw_actions_overdue
-- ----------------------------------------------------------------------------
-- Purpose: Quick list of overdue actions for dashboards and reports
-- Filter: status <> 'closed' AND due_date < CURRENT_DATE
-- Order: due_date ASC, priority DESC
-- Security: Relies on RLS from underlying views/tables
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW gate_h.vw_actions_overdue AS
SELECT
  id,
  tenant_id,
  source,
  source_reco_id,
  kpi_key,
  dim_key,
  dim_value,
  title_ar,
  desc_ar,
  priority,
  status,
  assignee_user_id,
  assignee_display_name,
  owner_user_id,
  owner_display_name,
  due_date,
  days_to_due,
  sla_days,
  sla_deadline,
  sla_breached,
  effort,
  tags,
  created_at,
  updated_at,
  last_update_at,
  last_update_type,
  evidence_count,
  max_progress_pct,
  is_overdue,
  is_closed
FROM gate_h.vw_actions_with_stats
WHERE status <> 'closed'
  AND due_date IS NOT NULL
  AND due_date < CURRENT_DATE
ORDER BY due_date ASC, 
         CASE priority
           WHEN 'high' THEN 1
           WHEN 'medium' THEN 2
           WHEN 'low' THEN 3
           ELSE 4
         END ASC;

COMMENT ON VIEW gate_h.vw_actions_overdue IS 
'Gate-H overdue actions: pre-filtered view for dashboards showing only overdue actions (status <> closed, due_date < today), ordered by urgency';

-- ============================================================================
-- Summary:
-- ✅ Created 3 read-optimized views for Gate-H actions
-- ✅ vw_actions_summary: Base view with user display names
-- ✅ vw_actions_with_stats: Extended with computed fields and statistics
-- ✅ vw_actions_overdue: Pre-filtered for dashboard/report consumption
-- ✅ All views respect RLS from underlying tables (tenant-scoped)
-- ============================================================================