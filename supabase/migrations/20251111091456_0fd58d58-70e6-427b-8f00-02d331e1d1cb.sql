-- ============================================================================
-- Gate-H Export RPCs: Public Wrapper Functions
-- ============================================================================
-- Purpose: Expose gate_h export functions via public schema for frontend RPC calls
-- Usage: supabase.rpc('gate_h_export_actions_json', { ... })
--        supabase.rpc('gate_h_export_actions_csv', { ... })
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Public Wrapper: gate_h_export_actions_json
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
SECURITY DEFINER
SET search_path TO 'public', 'gate_h'
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
  
  -- Call gate_h schema function
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
'Public wrapper for gate_h.export_actions_json. Exports Gate-H actions as JSON array with filters. Call via supabase.rpc("gate_h_export_actions_json", {...})';

-- ----------------------------------------------------------------------------
-- Public Wrapper: gate_h_export_actions_csv
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
SECURITY DEFINER
SET search_path TO 'public', 'gate_h'
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
  
  -- Call gate_h schema function
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
'Public wrapper for gate_h.export_actions_csv. Exports Gate-H actions as CSV text with filters. Call via supabase.rpc("gate_h_export_actions_csv", {...})';

-- ============================================================================
-- Summary:
-- ✅ Created public.gate_h_export_actions_json wrapper
-- ✅ Created public.gate_h_export_actions_csv wrapper
-- ✅ Both wrappers convert TEXT[] to enum arrays for compatibility
-- ✅ Both use SECURITY DEFINER with search_path for safety
-- ✅ Frontend can call via: supabase.rpc('gate_h_export_actions_json', {...})
-- ✅ All filters (dates, statuses, priorities, assignee, overdue) preserved
-- ============================================================================