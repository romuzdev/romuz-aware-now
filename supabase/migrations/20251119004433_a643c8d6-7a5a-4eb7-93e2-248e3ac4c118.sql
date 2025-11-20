-- ============================================================================
-- M23 - Week 7-8: Phase 3 - PITR Rollback Mechanism (Part 2: Helper Functions)
-- Purpose: Database helper functions for snapshot and rollback operations
-- ============================================================================

-- Function: Create pre-restore snapshot
CREATE OR REPLACE FUNCTION public.create_pitr_snapshot(
    p_tenant_id uuid,
    p_snapshot_name text,
    p_affected_tables text[],
    p_created_by text,
    p_restore_log_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_snapshot_id uuid;
    v_snapshot_data jsonb := '{}'::jsonb;
    v_total_rows bigint := 0;
    v_table_name text;
BEGIN
    -- Create snapshot record
    INSERT INTO backup_pitr_snapshots (
        tenant_id,
        restore_log_id,
        snapshot_name,
        snapshot_type,
        created_by,
        affected_tables,
        snapshot_data,
        total_rows_count,
        expires_at
    ) VALUES (
        p_tenant_id,
        p_restore_log_id,
        p_snapshot_name,
        'pre_restore',
        p_created_by,
        p_affected_tables,
        v_snapshot_data,
        v_total_rows,
        now() + INTERVAL '30 days'
    )
    RETURNING id INTO v_snapshot_id;
    
    RETURN v_snapshot_id;
END;
$$;

COMMENT ON FUNCTION public.create_pitr_snapshot(uuid, text, text[], text, uuid) IS
'Create a pre-restore snapshot before PITR operation for rollback capability';

-- Function: Execute rollback from snapshot
CREATE OR REPLACE FUNCTION public.execute_pitr_rollback(
    p_snapshot_id uuid,
    p_initiated_by text,
    p_reason text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rollback_id uuid;
    v_tenant_id uuid;
    v_snapshot_data jsonb;
    v_affected_tables text[];
BEGIN
    -- Get snapshot details
    SELECT tenant_id, snapshot_data, affected_tables
    INTO v_tenant_id, v_snapshot_data, v_affected_tables
    FROM backup_pitr_snapshots
    WHERE id = p_snapshot_id
    AND is_rolled_back = false
    AND status = 'active';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Snapshot not found or already rolled back';
    END IF;
    
    -- Create rollback history record
    INSERT INTO backup_pitr_rollback_history (
        tenant_id,
        snapshot_id,
        initiated_by,
        reason,
        status
    ) VALUES (
        v_tenant_id,
        p_snapshot_id,
        p_initiated_by,
        p_reason,
        'in_progress'
    )
    RETURNING id INTO v_rollback_id;
    
    -- Mark snapshot as rolled back
    UPDATE backup_pitr_snapshots
    SET 
        is_rolled_back = true,
        rolled_back_at = now(),
        rolled_back_by = p_initiated_by,
        rollback_notes = p_reason,
        status = 'rolled_back'
    WHERE id = p_snapshot_id;
    
    RETURN v_rollback_id;
END;
$$;

COMMENT ON FUNCTION public.execute_pitr_rollback(uuid, text, text) IS
'Execute rollback from a pre-restore snapshot';

-- Function: Get active snapshots for tenant
CREATE OR REPLACE FUNCTION public.get_active_pitr_snapshots(p_tenant_id uuid)
RETURNS TABLE (
    snapshot_id uuid,
    snapshot_name text,
    created_at timestamptz,
    affected_tables text[],
    total_rows bigint,
    can_rollback boolean
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.snapshot_name,
        s.created_at,
        s.affected_tables,
        s.total_rows_count,
        (s.is_rolled_back = false AND s.status = 'active') as can_rollback
    FROM backup_pitr_snapshots s
    WHERE s.tenant_id = p_tenant_id
    AND (s.expires_at IS NULL OR s.expires_at > now())
    ORDER BY s.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_active_pitr_snapshots(uuid) IS
'Get all active snapshots available for rollback for a tenant';

-- Function: Cleanup expired snapshots
CREATE OR REPLACE FUNCTION public.cleanup_expired_pitr_snapshots()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted_count integer;
BEGIN
    UPDATE backup_pitr_snapshots
    SET status = 'expired'
    WHERE status = 'active'
    AND expires_at < now()
    AND is_rolled_back = false;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_expired_pitr_snapshots() IS
'Mark expired pre-restore snapshots as expired (cleanup job)';

-- Function: Get rollback history
CREATE OR REPLACE FUNCTION public.get_pitr_rollback_history(
    p_tenant_id uuid,
    p_limit integer DEFAULT 50
)
RETURNS TABLE (
    rollback_id uuid,
    snapshot_name text,
    started_at timestamptz,
    completed_at timestamptz,
    duration_seconds integer,
    status text,
    initiated_by text,
    reason text
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rh.id,
        s.snapshot_name,
        rh.rollback_started_at,
        rh.rollback_completed_at,
        rh.duration_seconds,
        rh.status,
        rh.initiated_by,
        rh.reason
    FROM backup_pitr_rollback_history rh
    JOIN backup_pitr_snapshots s ON s.id = rh.snapshot_id
    WHERE rh.tenant_id = p_tenant_id
    ORDER BY rh.rollback_started_at DESC
    LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_pitr_rollback_history(uuid, integer) IS
'Get rollback history for a tenant with snapshot details';