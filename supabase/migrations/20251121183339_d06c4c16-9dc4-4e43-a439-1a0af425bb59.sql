-- ============================================================================
-- M12 - Audit Module Enhancement - Database Improvements
-- Part 1: Transaction Logging, Backup Metadata, RLS Enhancement
-- Date: 2025-11-21
-- ============================================================================

-- ============================================================================
-- 1. Add Backup Metadata Columns
-- ============================================================================

-- Add last_backed_up_at to grc_audits
ALTER TABLE grc_audits 
ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN grc_audits.last_backed_up_at IS 
'Timestamp of the last successful backup for this audit record';

-- Add last_backed_up_at to audit_workflows
ALTER TABLE audit_workflows 
ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN audit_workflows.last_backed_up_at IS 
'Timestamp of the last successful backup for this workflow record';

-- Add last_backed_up_at to audit_findings_categories
ALTER TABLE audit_findings_categories 
ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN audit_findings_categories.last_backed_up_at IS 
'Timestamp of the last successful backup for this finding record';

-- Add last_backed_up_at to grc_audit_findings
ALTER TABLE grc_audit_findings 
ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN grc_audit_findings.last_backed_up_at IS 
'Timestamp of the last successful backup for this finding record';

-- ============================================================================
-- 2. Create Indexes for Backup Metadata
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_grc_audits_last_backed_up 
ON grc_audits(tenant_id, last_backed_up_at) 
WHERE last_backed_up_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_workflows_last_backed_up 
ON audit_workflows(tenant_id, last_backed_up_at) 
WHERE last_backed_up_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_findings_categories_last_backed_up 
ON audit_findings_categories(tenant_id, last_backed_up_at) 
WHERE last_backed_up_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_grc_audit_findings_last_backed_up 
ON grc_audit_findings(tenant_id, last_backed_up_at) 
WHERE last_backed_up_at IS NOT NULL;

-- ============================================================================
-- 3. Enable Transaction Logging Triggers
-- ============================================================================

-- Note: Assumes log_table_changes() function exists from M23 Backup module
-- If not, these triggers will need to be enabled after M23 completion

-- Trigger for grc_audits
DROP TRIGGER IF EXISTS grc_audits_audit_trigger ON grc_audits;
CREATE TRIGGER grc_audits_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON grc_audits
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- Trigger for audit_workflows
DROP TRIGGER IF EXISTS audit_workflows_audit_trigger ON audit_workflows;
CREATE TRIGGER audit_workflows_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON audit_workflows
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- Trigger for audit_workflow_stages
DROP TRIGGER IF EXISTS audit_workflow_stages_audit_trigger ON audit_workflow_stages;
CREATE TRIGGER audit_workflow_stages_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON audit_workflow_stages
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- Trigger for audit_findings_categories
DROP TRIGGER IF EXISTS audit_findings_categories_audit_trigger ON audit_findings_categories;
CREATE TRIGGER audit_findings_categories_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON audit_findings_categories
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- Trigger for grc_audit_findings
DROP TRIGGER IF EXISTS grc_audit_findings_audit_trigger ON grc_audit_findings;
CREATE TRIGGER grc_audit_findings_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON grc_audit_findings
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- ============================================================================
-- 4. Enhanced Analytics Helper Functions
-- ============================================================================

-- Function: Get audit completion rate by timeframe
CREATE OR REPLACE FUNCTION get_audit_completion_rate(
  p_tenant_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  completed_audits BIGINT,
  total_audits BIGINT,
  completion_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE audit_status = 'closed') as completed_audits,
    COUNT(*) as total_audits,
    ROUND(
      (COUNT(*) FILTER (WHERE audit_status = 'closed')::NUMERIC / 
       NULLIF(COUNT(*), 0)::NUMERIC) * 100, 
      2
    ) as completion_rate
  FROM grc_audits
  WHERE tenant_id = p_tenant_id
    AND created_at BETWEEN p_start_date AND p_end_date;
END;
$$;

-- Function: Get findings severity distribution
CREATE OR REPLACE FUNCTION get_findings_severity_distribution(
  p_tenant_id UUID,
  p_audit_id UUID DEFAULT NULL
)
RETURNS TABLE (
  severity TEXT,
  count BIGINT,
  percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH severity_counts AS (
    SELECT 
      afc.severity,
      COUNT(*) as cnt
    FROM audit_findings_categories afc
    WHERE afc.tenant_id = p_tenant_id
      AND (p_audit_id IS NULL OR afc.audit_id = p_audit_id)
    GROUP BY afc.severity
  ),
  total_count AS (
    SELECT SUM(cnt) as total FROM severity_counts
  )
  SELECT 
    sc.severity,
    sc.cnt as count,
    ROUND((sc.cnt::NUMERIC / NULLIF(tc.total, 0)::NUMERIC) * 100, 2) as percentage
  FROM severity_counts sc
  CROSS JOIN total_count tc
  ORDER BY 
    CASE sc.severity
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
      ELSE 5
    END;
END;
$$;

-- Function: Get average finding closure time
CREATE OR REPLACE FUNCTION get_avg_finding_closure_time(
  p_tenant_id UUID,
  p_audit_id UUID DEFAULT NULL
)
RETURNS TABLE (
  avg_days NUMERIC,
  median_days NUMERIC,
  min_days INTEGER,
  max_days INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH closure_times AS (
    SELECT 
      EXTRACT(EPOCH FROM (resolved_at - created_at)) / 86400 as days
    FROM audit_findings_categories
    WHERE tenant_id = p_tenant_id
      AND (p_audit_id IS NULL OR audit_id = p_audit_id)
      AND resolved_at IS NOT NULL
      AND status = 'resolved'
  )
  SELECT 
    ROUND(AVG(days), 2) as avg_days,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days), 2) as median_days,
    FLOOR(MIN(days))::INTEGER as min_days,
    CEIL(MAX(days))::INTEGER as max_days
  FROM closure_times;
END;
$$;

-- Function: Get workflow progress summary
CREATE OR REPLACE FUNCTION get_workflow_progress_summary(
  p_workflow_id UUID
)
RETURNS TABLE (
  total_stages INTEGER,
  completed_stages INTEGER,
  in_progress_stages INTEGER,
  pending_stages INTEGER,
  progress_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_stages,
    COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed_stages,
    COUNT(*) FILTER (WHERE status = 'in_progress')::INTEGER as in_progress_stages,
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending_stages,
    ROUND(
      (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / 
       NULLIF(COUNT(*), 0)::NUMERIC) * 100,
      2
    ) as progress_percentage
  FROM audit_workflow_stages
  WHERE workflow_id = p_workflow_id;
END;
$$;

-- ============================================================================
-- 5. Performance Indexes for Analytics
-- ============================================================================

-- Indexes for faster audit queries
CREATE INDEX IF NOT EXISTS idx_grc_audits_status_dates 
ON grc_audits(tenant_id, audit_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_grc_audits_type_status 
ON grc_audits(tenant_id, audit_type, audit_status);

-- Indexes for workflow queries
CREATE INDEX IF NOT EXISTS idx_audit_workflows_status 
ON audit_workflows(tenant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_workflow_stages_status 
ON audit_workflow_stages(workflow_id, status, sequence_order);

-- Indexes for findings queries
CREATE INDEX IF NOT EXISTS idx_audit_findings_severity_status 
ON audit_findings_categories(tenant_id, severity, status);

CREATE INDEX IF NOT EXISTS idx_audit_findings_audit_severity 
ON audit_findings_categories(audit_id, severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_findings_dates 
ON audit_findings_categories(tenant_id, created_at DESC, resolved_at);

-- ============================================================================
-- 6. Add Comments for Documentation
-- ============================================================================

COMMENT ON FUNCTION get_audit_completion_rate IS 
'Calculate audit completion rate for a tenant within a date range';

COMMENT ON FUNCTION get_findings_severity_distribution IS 
'Get the distribution of findings by severity level';

COMMENT ON FUNCTION get_avg_finding_closure_time IS 
'Calculate average, median, min, and max time to close findings';

COMMENT ON FUNCTION get_workflow_progress_summary IS 
'Get a summary of workflow stage completion status';

-- ============================================================================
-- Migration Complete
-- ============================================================================