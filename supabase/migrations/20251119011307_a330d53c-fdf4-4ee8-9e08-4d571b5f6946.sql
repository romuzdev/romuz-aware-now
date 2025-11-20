-- ============================================================================
-- M23 - PITR Data Restoration: Complete Implementation (Fix & Enhancement)
-- Purpose: Fix previous migration issues and complete data restoration logic
-- ============================================================================

-- ============================================================================
-- Part 1: Enhanced Table Restoration with Actual Data Logic
-- ============================================================================

CREATE OR REPLACE FUNCTION public.restore_table_from_snapshot(
    p_snapshot_id uuid,
    p_table_name text,
    p_rollback_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_snapshot_data jsonb;
    v_table_data jsonb;
    v_rows_restored integer := 0;
    v_tenant_id uuid;
    v_row jsonb;
    v_sql text;
    v_columns text[];
    v_column text;
    v_result jsonb;
BEGIN
    -- Get snapshot data and tenant_id
    SELECT snapshot_data, tenant_id
    INTO v_snapshot_data, v_tenant_id
    FROM backup_pitr_snapshots
    WHERE id = p_snapshot_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Snapshot not found'
        );
    END IF;

    -- Extract table data from snapshot
    v_table_data := v_snapshot_data->p_table_name;

    IF v_table_data IS NULL OR jsonb_array_length(v_table_data) = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Table not found in snapshot or no data',
            'table_name', p_table_name
        );
    END IF;

    -- Log restoration start
    UPDATE backup_pitr_rollback_history
    SET 
        restoration_steps = restoration_steps || jsonb_build_object(
            'table', p_table_name,
            'status', 'restoring',
            'started_at', now()
        ),
        current_step = 'restoring_' || p_table_name
    WHERE id = p_rollback_id;

    -- Clear existing tenant data from table
    BEGIN
        v_sql := format('DELETE FROM %I WHERE tenant_id = $1', p_table_name);
        EXECUTE v_sql USING v_tenant_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to clear table % for tenant %: %', p_table_name, v_tenant_id, SQLERRM;
    END;

    -- Restore rows from snapshot
    FOR v_row IN SELECT * FROM jsonb_array_elements(v_table_data)
    LOOP
        BEGIN
            -- Get columns from row
            SELECT array_agg(key ORDER BY key)
            INTO v_columns
            FROM jsonb_object_keys(v_row) AS key;

            -- Build INSERT statement
            v_sql := format(
                'INSERT INTO %I (%s) VALUES (%s)',
                p_table_name,
                array_to_string(v_columns, ', '),
                (
                    SELECT string_agg(
                        format('$1->>%L::%s', col, 
                            CASE 
                                WHEN col IN ('id', 'tenant_id', 'created_by', 'updated_by') THEN 'uuid'
                                WHEN col LIKE '%_at' THEN 'timestamptz'
                                WHEN col LIKE '%_count' OR col LIKE '%_pct' THEN 'integer'
                                ELSE 'text'
                            END
                        ),
                        ', '
                    )
                    FROM unnest(v_columns) AS col
                )
            );

            -- Execute INSERT
            EXECUTE v_sql USING v_row;
            v_rows_restored := v_rows_restored + 1;

        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to restore row in table %: %', p_table_name, SQLERRM;
        END;
    END LOOP;

    -- Update completion
    UPDATE backup_pitr_rollback_history
    SET 
        restoration_steps = restoration_steps || jsonb_build_object(
            'table', p_table_name,
            'status', 'completed',
            'completed_at', now(),
            'rows_restored', v_rows_restored
        ),
        tables_restored = array_append(tables_restored, p_table_name)
    WHERE id = p_rollback_id;

    RETURN jsonb_build_object(
        'success', true,
        'table_name', p_table_name,
        'rows_restored', v_rows_restored
    );
END;
$$;

COMMENT ON FUNCTION public.restore_table_from_snapshot(uuid, text, uuid) IS
'Restore a single table from PITR snapshot with actual row-by-row restoration';

-- ============================================================================
-- Part 2: Topological Sort for Table Dependencies
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_table_restoration_order(
    p_tables text[]
)
RETURNS text[]
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
    v_ordered_tables text[] := ARRAY[]::text[];
    v_remaining_tables text[];
    v_table text;
    v_dependencies text[];
    v_can_restore boolean;
    v_max_iterations integer := 100;
    v_iteration integer := 0;
BEGIN
    v_remaining_tables := p_tables;

    -- Kahn's Algorithm for Topological Sort
    WHILE array_length(v_remaining_tables, 1) > 0 AND v_iteration < v_max_iterations LOOP
        v_iteration := v_iteration + 1;

        FOR v_table IN SELECT unnest(v_remaining_tables)
        LOOP
            -- Get FK dependencies for this table
            SELECT array_agg(DISTINCT ccu.table_name)
            INTO v_dependencies
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu
                ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_name = v_table
            AND tc.table_schema = 'public'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name != v_table
            AND ccu.table_name = ANY(v_remaining_tables);

            -- If no dependencies remain, we can restore this table
            v_can_restore := (v_dependencies IS NULL OR array_length(v_dependencies, 1) = 0);

            IF v_can_restore THEN
                v_ordered_tables := array_append(v_ordered_tables, v_table);
                v_remaining_tables := array_remove(v_remaining_tables, v_table);
            END IF;
        END LOOP;
    END LOOP;

    -- If we have remaining tables after max iterations, there's a circular dependency
    IF array_length(v_remaining_tables, 1) > 0 THEN
        RAISE WARNING 'Circular dependency detected in tables: %', v_remaining_tables;
        -- Append remaining tables anyway
        v_ordered_tables := v_ordered_tables || v_remaining_tables;
    END IF;

    RETURN v_ordered_tables;
END;
$$;

COMMENT ON FUNCTION public.get_table_restoration_order(text[]) IS
'Determine optimal order for table restoration using topological sort (Kahn algorithm)';

-- ============================================================================
-- Part 3: Complete PITR Rollback Execution
-- ============================================================================

CREATE OR REPLACE FUNCTION public.execute_pitr_rollback(
    p_snapshot_id uuid,
    p_tenant_id uuid,
    p_initiated_by text,
    p_reason text,
    p_dry_run boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_snapshot record;
    v_rollback_id uuid;
    v_tables text[];
    v_ordered_tables text[];
    v_table text;
    v_result jsonb;
    v_restoration_results jsonb := '[]'::jsonb;
    v_total_rows_restored integer := 0;
    v_errors integer := 0;
    v_fk_disabled integer := 0;
    v_fk_enabled integer := 0;
BEGIN
    -- Validate snapshot
    SELECT * INTO v_snapshot
    FROM backup_pitr_snapshots
    WHERE id = p_snapshot_id
    AND tenant_id = p_tenant_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Snapshot not found or access denied'
        );
    END IF;

    IF v_snapshot.is_rolled_back THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Snapshot already rolled back'
        );
    END IF;

    IF v_snapshot.expires_at IS NOT NULL AND v_snapshot.expires_at < now() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Snapshot expired'
        );
    END IF;

    -- Get tables to restore
    v_tables := v_snapshot.affected_tables;

    IF v_tables IS NULL OR array_length(v_tables, 1) = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No tables to restore'
        );
    END IF;

    -- Dry run: return preview
    IF p_dry_run THEN
        v_ordered_tables := public.get_table_restoration_order(v_tables);
        
        RETURN jsonb_build_object(
            'success', true,
            'dry_run', true,
            'snapshot_id', p_snapshot_id,
            'tables_to_restore', v_ordered_tables,
            'estimated_rows', (
                SELECT sum(jsonb_array_length(v_snapshot.snapshot_data->table_name))
                FROM unnest(v_ordered_tables) AS table_name
            ),
            'message', 'Dry run completed - no actual restoration performed'
        );
    END IF;

    -- Create rollback history record
    INSERT INTO backup_pitr_rollback_history (
        tenant_id,
        snapshot_id,
        initiated_by,
        reason,
        status,
        rollback_started_at
    ) VALUES (
        p_tenant_id,
        p_snapshot_id,
        p_initiated_by,
        p_reason,
        'in_progress',
        now()
    ) RETURNING id INTO v_rollback_id;

    -- Begin restoration transaction
    BEGIN
        -- Get optimal table order
        v_ordered_tables := public.get_table_restoration_order(v_tables);

        -- Disable FK constraints
        FOREACH v_table IN ARRAY v_ordered_tables
        LOOP
            BEGIN
                v_fk_disabled := v_fk_disabled + public.disable_table_fk_constraints(
                    v_table,
                    v_rollback_id,
                    p_tenant_id
                );
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Failed to disable FK constraints for table %: %', v_table, SQLERRM;
            END;
        END LOOP;

        -- Restore each table
        FOREACH v_table IN ARRAY v_ordered_tables
        LOOP
            BEGIN
                v_result := public.restore_table_from_snapshot(
                    p_snapshot_id,
                    v_table,
                    v_rollback_id
                );

                v_restoration_results := v_restoration_results || v_result;

                IF (v_result->>'success')::boolean THEN
                    v_total_rows_restored := v_total_rows_restored + 
                        COALESCE((v_result->>'rows_restored')::integer, 0);
                ELSE
                    v_errors := v_errors + 1;
                END IF;

            EXCEPTION WHEN OTHERS THEN
                v_errors := v_errors + 1;
                v_restoration_results := v_restoration_results || jsonb_build_object(
                    'success', false,
                    'table_name', v_table,
                    'error', SQLERRM
                );
            END;
        END LOOP;

        -- Re-enable FK constraints
        FOREACH v_table IN ARRAY v_ordered_tables
        LOOP
            BEGIN
                v_fk_enabled := v_fk_enabled + public.re_enable_table_fk_constraints(
                    v_table,
                    v_rollback_id
                );
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Failed to re-enable FK constraints for table %: %', v_table, SQLERRM;
            END;
        END LOOP;

        -- Update rollback history
        UPDATE backup_pitr_rollback_history
        SET 
            rollback_completed_at = now(),
            duration_seconds = EXTRACT(EPOCH FROM (now() - rollback_started_at))::integer,
            status = CASE 
                WHEN v_errors = 0 THEN 'completed'
                WHEN v_errors < array_length(v_ordered_tables, 1) THEN 'partial'
                ELSE 'failed'
            END,
            rows_restored = v_total_rows_restored,
            tables_affected = v_ordered_tables,
            errors_encountered = v_errors,
            current_step = 'completed'
        WHERE id = v_rollback_id;

        -- Mark snapshot as rolled back
        UPDATE backup_pitr_snapshots
        SET 
            is_rolled_back = true,
            rollback_completed_at = now()
        WHERE id = p_snapshot_id;

        RETURN jsonb_build_object(
            'success', v_errors = 0,
            'rollback_id', v_rollback_id,
            'snapshot_id', p_snapshot_id,
            'tables_restored', v_ordered_tables,
            'total_rows_restored', v_total_rows_restored,
            'errors_encountered', v_errors,
            'fk_constraints_disabled', v_fk_disabled,
            'fk_constraints_enabled', v_fk_enabled,
            'restoration_results', v_restoration_results,
            'status', CASE 
                WHEN v_errors = 0 THEN 'completed'
                WHEN v_errors < array_length(v_ordered_tables, 1) THEN 'partial'
                ELSE 'failed'
            END
        );

    EXCEPTION WHEN OTHERS THEN
        -- Rollback failed
        UPDATE backup_pitr_rollback_history
        SET 
            rollback_completed_at = now(),
            duration_seconds = EXTRACT(EPOCH FROM (now() - rollback_started_at))::integer,
            status = 'failed',
            errors_encountered = v_errors + 1,
            error_details = jsonb_build_object(
                'error', SQLERRM,
                'hint', SQLSTATE
            ),
            current_step = 'failed'
        WHERE id = v_rollback_id;

        RETURN jsonb_build_object(
            'success', false,
            'rollback_id', v_rollback_id,
            'error', SQLERRM,
            'sqlstate', SQLSTATE
        );
    END;
END;
$$;

COMMENT ON FUNCTION public.execute_pitr_rollback(uuid, uuid, text, text, boolean) IS
'Execute complete PITR rollback with transaction management and FK handling';

-- ============================================================================
-- Part 4: Performance Indexes
-- ============================================================================

-- Ensure all critical indexes exist
CREATE INDEX IF NOT EXISTS idx_pitr_snapshots_tenant_created 
ON backup_pitr_snapshots(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rollback_history_snapshot_detailed
ON backup_pitr_rollback_history(snapshot_id, status, rollback_started_at DESC);

CREATE INDEX IF NOT EXISTS idx_fk_constraints_cache_lookup
ON backup_fk_constraints_cache(tenant_id, rollback_id, is_disabled);

-- ============================================================================
-- Part 5: Grant Permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.restore_table_from_snapshot(uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_restoration_order(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_pitr_rollback(uuid, uuid, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.disable_table_fk_constraints(text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.re_enable_table_fk_constraints(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_snapshot_integrity(uuid) TO authenticated;