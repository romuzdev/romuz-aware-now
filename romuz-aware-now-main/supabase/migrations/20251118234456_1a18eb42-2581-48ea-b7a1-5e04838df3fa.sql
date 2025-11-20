-- ============================================================================
-- M23 - Backup & Recovery System
-- Migration: Point-in-Time Recovery (PITR) Support
-- Week 3-4: Transaction Logs + Incremental Backups
-- ============================================================================

-- 1. Create Transaction Logs Table
CREATE TABLE IF NOT EXISTS backup_transaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  changed_by UUID,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  backup_job_id UUID REFERENCES backup_jobs(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add Incremental Backup Support to backup_jobs
ALTER TABLE backup_jobs
ADD COLUMN IF NOT EXISTS parent_backup_id UUID REFERENCES backup_jobs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_incremental BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS changes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS base_backup_id UUID REFERENCES backup_jobs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS transaction_log_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS transaction_log_end TIMESTAMPTZ;

-- 3. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_transaction_logs_tenant_id ON backup_transaction_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_table_name ON backup_transaction_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_changed_at ON backup_transaction_logs(changed_at);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_operation ON backup_transaction_logs(operation);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_backup_job_id ON backup_transaction_logs(backup_job_id);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_composite ON backup_transaction_logs(tenant_id, table_name, changed_at);

CREATE INDEX IF NOT EXISTS idx_backup_jobs_parent_id ON backup_jobs(parent_backup_id);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_base_id ON backup_jobs(base_backup_id);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_is_incremental ON backup_jobs(is_incremental);

-- 4. Enable RLS on Transaction Logs
ALTER TABLE backup_transaction_logs ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for Transaction Logs
CREATE POLICY "Users can view their tenant's transaction logs"
ON backup_transaction_logs
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM user_tenants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can insert transaction logs"
ON backup_transaction_logs
FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id 
    FROM user_tenants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their tenant's transaction logs"
ON backup_transaction_logs
FOR DELETE
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM user_tenants 
    WHERE user_id = auth.uid()
  )
);

-- 6. Create Function to Get Transaction Logs for PITR
CREATE OR REPLACE FUNCTION get_transaction_logs_for_pitr(
  p_tenant_id UUID,
  p_target_timestamp TIMESTAMPTZ,
  p_base_backup_timestamp TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  table_name TEXT,
  operation TEXT,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  changed_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.table_name,
    t.operation,
    t.record_id,
    t.old_data,
    t.new_data,
    t.changed_at
  FROM backup_transaction_logs t
  WHERE t.tenant_id = p_tenant_id
    AND t.changed_at <= p_target_timestamp
    AND (p_base_backup_timestamp IS NULL OR t.changed_at > p_base_backup_timestamp)
  ORDER BY t.changed_at ASC;
END;
$$;

-- 7. Create Function to Get Backup Chain
CREATE OR REPLACE FUNCTION get_backup_chain(p_backup_id UUID)
RETURNS TABLE (
  id UUID,
  backup_name TEXT,
  job_type TEXT,
  is_incremental BOOLEAN,
  parent_backup_id UUID,
  created_at TIMESTAMPTZ,
  backup_size_bytes BIGINT,
  chain_level INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE backup_chain AS (
    -- Base case: start with the requested backup
    SELECT 
      b.id,
      b.backup_name,
      b.job_type,
      b.is_incremental,
      b.parent_backup_id,
      b.created_at,
      b.backup_size_bytes,
      0 AS chain_level
    FROM backup_jobs b
    WHERE b.id = p_backup_id
    
    UNION ALL
    
    -- Recursive case: get parent backups
    SELECT 
      b.id,
      b.backup_name,
      b.job_type,
      b.is_incremental,
      b.parent_backup_id,
      b.created_at,
      b.backup_size_bytes,
      bc.chain_level + 1
    FROM backup_jobs b
    INNER JOIN backup_chain bc ON b.id = bc.parent_backup_id
  )
  SELECT * FROM backup_chain
  ORDER BY chain_level DESC;
END;
$$;

-- 8. Create Function to Calculate Recovery Statistics
CREATE OR REPLACE FUNCTION calculate_pitr_stats(
  p_tenant_id UUID,
  p_target_timestamp TIMESTAMPTZ,
  p_base_backup_timestamp TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  total_operations INTEGER,
  insert_count INTEGER,
  update_count INTEGER,
  delete_count INTEGER,
  affected_tables TEXT[],
  earliest_change TIMESTAMPTZ,
  latest_change TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER AS total_operations,
    COUNT(*) FILTER (WHERE operation = 'INSERT')::INTEGER AS insert_count,
    COUNT(*) FILTER (WHERE operation = 'UPDATE')::INTEGER AS update_count,
    COUNT(*) FILTER (WHERE operation = 'DELETE')::INTEGER AS delete_count,
    ARRAY_AGG(DISTINCT table_name) AS affected_tables,
    MIN(changed_at) AS earliest_change,
    MAX(changed_at) AS latest_change
  FROM backup_transaction_logs
  WHERE tenant_id = p_tenant_id
    AND changed_at <= p_target_timestamp
    AND (p_base_backup_timestamp IS NULL OR changed_at > p_base_backup_timestamp);
END;
$$;

-- 9. Add Comments for Documentation
COMMENT ON TABLE backup_transaction_logs IS 'Transaction log for Point-in-Time Recovery (PITR)';
COMMENT ON COLUMN backup_transaction_logs.old_data IS 'Data before the change (for UPDATE/DELETE operations)';
COMMENT ON COLUMN backup_transaction_logs.new_data IS 'Data after the change (for INSERT/UPDATE operations)';
COMMENT ON COLUMN backup_jobs.parent_backup_id IS 'Reference to parent backup for incremental backups';
COMMENT ON COLUMN backup_jobs.base_backup_id IS 'Reference to the base full backup for incremental chain';
COMMENT ON COLUMN backup_jobs.is_incremental IS 'Whether this is an incremental backup';
COMMENT ON COLUMN backup_jobs.changes_count IS 'Number of changes captured in incremental backup';

-- 10. Grant Necessary Permissions
GRANT SELECT ON backup_transaction_logs TO authenticated;
GRANT INSERT ON backup_transaction_logs TO authenticated;
GRANT DELETE ON backup_transaction_logs TO authenticated;
