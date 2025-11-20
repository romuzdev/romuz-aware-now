-- ============================================================================
-- Gate-H Export RPCs: Fix Public Wrappers (Remove SECURITY DEFINER)
-- ============================================================================
-- Purpose: Update public wrappers to run with caller privileges (NOT SECURITY DEFINER)
--          to comply with the requirement "should run with caller privileges"
-- ============================================================================

-- Drop and recreate without SECURITY DEFINER
DROP FUNCTION IF EXISTS public.gate_h_export_actions_json(DATE, DATE, TEXT[], TEXT[], UUID, BOOLEAN);
DROP FUNCTION IF EXISTS public.gate_h_export_actions_csv(DATE, DATE, TEXT[], TEXT[], UUID, BOOLEAN);

-- ----------------------------------------------------------------------------
-- Public Wrapper: gate_h_export_actions_json (WITHOUT SECURITY DEFINER)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.gate_h_export_actions_json(
  p_from_date      DATE DEFAULT NULL,
  p_to_date        DATE DEFAULT NULL,
  p_statuses       TEXT[] DEFAULT NULL,
  p_priorities     TEXT[] DEFAULT NULL,
  p_assignee_id    UUID DEFAULT NULL,
  p_overdue_only   BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_statuses_enum gate_h_action_status_enum[];
  v_priorities_enum gate_h_action_priority_enum[];
BEGIN
  -- Convert TEXT[] to enum arrays
  IF p_statuses IS NOT NULL THEN
    SELECT array_agg(s::gate_h_action_status_enum)
    INTO v_statuses_enum
    FROM unnest(p_statuses) s;
  END IF;
  
  IF p_priorities IS NOT NULL THEN
    SELECT array_agg(pr::gate_h_action_priority_enum)
    INTO v_priorities_enum
    FROM unnest(p_priorities) pr;
  END IF;
  
  -- Call gate_h schema function with caller privileges
  RETURN gate_h.export_actions_json(
    p_from_date,
    p_to_date,
    v_statuses_enum,
    v_priorities_enum,
    p_assignee_id,
    p_overdue_only
  );
END;
$$;

COMMENT ON FUNCTION public.gate_h_export_actions_json IS 
'Public wrapper for gate_h.export_actions_json. Runs with caller privileges (NOT SECURITY DEFINER) to ensure tenant isolation via RLS. Call via supabase.rpc("gate_h_export_actions_json", {...})';

-- ----------------------------------------------------------------------------
-- Public Wrapper: gate_h_export_actions_csv (WITHOUT SECURITY DEFINER)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.gate_h_export_actions_csv(
  p_from_date      DATE DEFAULT NULL,
  p_to_date        DATE DEFAULT NULL,
  p_statuses       TEXT[] DEFAULT NULL,
  p_priorities     TEXT[] DEFAULT NULL,
  p_assignee_id    UUID DEFAULT NULL,
  p_overdue_only   BOOLEAN DEFAULT FALSE
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_statuses_enum gate_h_action_status_enum[];
  v_priorities_enum gate_h_action_priority_enum[];
BEGIN
  -- Convert TEXT[] to enum arrays
  IF p_statuses IS NOT NULL THEN
    SELECT array_agg(s::gate_h_action_status_enum)
    INTO v_statuses_enum
    FROM unnest(p_statuses) s;
  END IF;
  
  IF p_priorities IS NOT NULL THEN
    SELECT array_agg(pr::gate_h_action_priority_enum)
    INTO v_priorities_enum
    FROM unnest(p_priorities) pr;
  END IF;
  
  -- Call gate_h schema function with caller privileges
  RETURN gate_h.export_actions_csv(
    p_from_date,
    p_to_date,
    v_statuses_enum,
    v_priorities_enum,
    p_assignee_id,
    p_overdue_only
  );
END;
$$;

COMMENT ON FUNCTION public.gate_h_export_actions_csv IS 
'Public wrapper for gate_h.export_actions_csv. Runs with caller privileges (NOT SECURITY DEFINER) to ensure tenant isolation via RLS. Call via supabase.rpc("gate_h_export_actions_csv", {...})';

-- Grant EXECUTE permission to authenticated users
GRANT EXECUTE ON FUNCTION public.gate_h_export_actions_json(DATE, DATE, TEXT[], TEXT[], UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.gate_h_export_actions_csv(DATE, DATE, TEXT[], TEXT[], UUID, BOOLEAN) TO authenticated;

-- Grant USAGE on gate_h schema to authenticated users (if not already granted)
GRANT USAGE ON SCHEMA gate_h TO authenticated;

-- Grant EXECUTE on gate_h export functions to authenticated users
GRANT EXECUTE ON FUNCTION gate_h.export_actions_json(DATE, DATE, gate_h_action_status_enum[], gate_h_action_priority_enum[], UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION gate_h.export_actions_csv(DATE, DATE, gate_h_action_status_enum[], gate_h_action_priority_enum[], UUID, BOOLEAN) TO authenticated;

-- ============================================================================
-- Summary:
-- ✅ Removed SECURITY DEFINER from public wrappers
-- ✅ Now running with caller privileges (as per Prompt requirement)
-- ✅ Added GRANT statements for authenticated users
-- ✅ RLS on underlying view ensures tenant isolation
-- ✅ RBAC applies through caller privileges
-- ============================================================================