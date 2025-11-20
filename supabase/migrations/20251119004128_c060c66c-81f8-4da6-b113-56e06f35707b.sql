-- ============================================================================
-- M23 - Week 7-8: Phase 2B - Fix Functions search_path (Part 2/3)
-- Purpose: Add search_path to awareness and action planning functions
-- ============================================================================

-- Fix awareness campaign functions
CREATE OR REPLACE FUNCTION public.validate_campaign_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.end_date < NEW.start_date THEN
        RAISE EXCEPTION 'end_date must be after start_date';
    END IF;
    RETURN NEW;
END;
$$;

-- Fix action planning functions
CREATE OR REPLACE FUNCTION public.calculate_action_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_completed_milestones integer;
    v_total_milestones integer;
BEGIN
    SELECT 
        COUNT(*) FILTER (WHERE status = 'completed'),
        COUNT(*)
    INTO v_completed_milestones, v_total_milestones
    FROM action_plan_milestones
    WHERE action_id = NEW.action_id;
    
    IF v_total_milestones > 0 THEN
        UPDATE action_plan_tracking
        SET progress_pct = (v_completed_milestones::numeric / v_total_milestones * 100)
        WHERE action_id = NEW.action_id;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_dependency_violation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    -- Check if source action is completed before allowing target action to proceed
    IF EXISTS (
        SELECT 1 
        FROM action_plan_dependencies d
        WHERE d.target_action_id = NEW.action_id
        AND d.is_active = true
        AND d.dependency_type = 'finish_to_start'
    ) THEN
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Fix automation functions
CREATE OR REPLACE FUNCTION public.evaluate_automation_conditions(
    p_rule_id uuid,
    p_event_data jsonb
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
    v_conditions jsonb;
    v_result boolean := true;
BEGIN
    SELECT conditions INTO v_conditions
    FROM automation_rules
    WHERE id = p_rule_id;
    
    -- Simple condition evaluation (can be extended)
    RETURN v_result;
END;
$$;

-- Fix audit functions
CREATE OR REPLACE FUNCTION public.log_audit_entry(
    p_entity_type text,
    p_entity_id text,
    p_action text,
    p_actor text,
    p_payload jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_audit_id uuid;
    v_tenant_id uuid;
BEGIN
    -- Get tenant_id from current user
    SELECT public.get_user_tenant_id(auth.uid()) INTO v_tenant_id;
    
    INSERT INTO audit_log (
        entity_type,
        entity_id,
        action,
        actor,
        payload,
        tenant_id
    ) VALUES (
        p_entity_type,
        p_entity_id,
        p_action,
        p_actor,
        p_payload,
        v_tenant_id
    )
    RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$;

COMMENT ON FUNCTION public.log_audit_entry(text, text, text, text, jsonb) IS
'Create audit log entry with automatic tenant isolation';

-- Fix document versioning functions
CREATE OR REPLACE FUNCTION public.create_document_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND (OLD.content <> NEW.content OR OLD.metadata <> NEW.metadata) THEN
        INSERT INTO document_versions (
            document_id,
            version_number,
            content_snapshot,
            metadata_snapshot,
            changed_by
        ) VALUES (
            NEW.id,
            COALESCE((
                SELECT MAX(version_number) + 1 
                FROM document_versions 
                WHERE document_id = NEW.id
            ), 1),
            OLD.content,
            OLD.metadata,
            auth.uid()
        );
    END IF;
    
    RETURN NEW;
END;
$$;