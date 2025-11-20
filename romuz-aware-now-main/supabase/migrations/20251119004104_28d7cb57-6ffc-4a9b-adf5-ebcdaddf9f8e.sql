-- ============================================================================
-- M23 - Week 7-8: Phase 2A - Fix Functions search_path (Part 1/3)
-- Purpose: Add search_path to all functions to prevent schema confusion attacks
-- Impact: 29 functions identified by linter
-- ============================================================================

-- Fix trigger functions (Part 1: Backup Module)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_backup_schedule()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.schedule_type = 'cron' AND NEW.cron_expression IS NULL THEN
        RAISE EXCEPTION 'cron_expression required for cron schedule type';
    END IF;
    
    IF NEW.schedule_type = 'interval' AND NEW.interval_minutes IS NULL THEN
        RAISE EXCEPTION 'interval_minutes required for interval schedule type';
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_dr_plan_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.next_test_date IS NOT NULL AND NEW.next_test_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'next_test_date cannot be in the past';
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_update_dr_plan_test_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.test_frequency = 'monthly' THEN
        NEW.next_test_date = CURRENT_DATE + INTERVAL '1 month';
    ELSIF NEW.test_frequency = 'quarterly' THEN
        NEW.next_test_date = CURRENT_DATE + INTERVAL '3 months';
    ELSIF NEW.test_frequency = 'semi-annual' THEN
        NEW.next_test_date = CURRENT_DATE + INTERVAL '6 months';
    ELSIF NEW.test_frequency = 'annual' THEN
        NEW.next_test_date = CURRENT_DATE + INTERVAL '1 year';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Fix helper functions
CREATE OR REPLACE FUNCTION public.calculate_health_score(
    p_tenant_id uuid,
    p_days_back integer DEFAULT 30
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
    v_score numeric := 100;
    v_failed_count integer;
    v_total_count integer;
BEGIN
    SELECT 
        COUNT(*) FILTER (WHERE status = 'failed'),
        COUNT(*)
    INTO v_failed_count, v_total_count
    FROM backup_jobs
    WHERE tenant_id = p_tenant_id
    AND created_at >= CURRENT_TIMESTAMP - (p_days_back || ' days')::INTERVAL;
    
    IF v_total_count > 0 THEN
        v_score := v_score - ((v_failed_count::numeric / v_total_count) * 30);
    END IF;
    
    RETURN GREATEST(0, LEAST(100, v_score));
END;
$$;

COMMENT ON FUNCTION public.calculate_health_score(uuid, integer) IS
'Calculate backup health score for a tenant based on success/failure rate';

-- Fix RPC functions
CREATE OR REPLACE FUNCTION public.get_backup_statistics(
    p_tenant_id uuid,
    p_days_back integer DEFAULT 30
)
RETURNS TABLE (
    total_backups bigint,
    successful_backups bigint,
    failed_backups bigint,
    total_size_bytes bigint,
    avg_duration_seconds numeric
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_backups,
        COUNT(*) FILTER (WHERE status = 'completed') as successful_backups,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_backups,
        COALESCE(SUM(backup_size_bytes), 0) as total_size_bytes,
        COALESCE(AVG(duration_seconds), 0) as avg_duration_seconds
    FROM backup_jobs
    WHERE tenant_id = p_tenant_id
    AND created_at >= CURRENT_TIMESTAMP - (p_days_back || ' days')::INTERVAL;
END;
$$;

COMMENT ON FUNCTION public.get_backup_statistics(uuid, integer) IS
'Get backup statistics for a tenant over specified time period';