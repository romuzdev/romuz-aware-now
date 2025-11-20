-- ============================================================================
-- Gate-H Part 3.3: Public RPC Wrappers for TypeScript Integration
-- Purpose: Expose gate_h schema functions to public schema for Supabase client
-- ============================================================================

-- ============================================================
-- 1) Public Wrapper: gate_h_create_from_recommendation
-- ============================================================
CREATE OR REPLACE FUNCTION public.gate_h_create_from_recommendation(
  p_source              TEXT,
  p_source_reco_id      UUID DEFAULT NULL,
  p_kpi_key             TEXT DEFAULT NULL,
  p_dim_key             TEXT DEFAULT NULL,
  p_dim_value           TEXT DEFAULT NULL,
  p_title_ar            TEXT DEFAULT NULL,
  p_desc_ar             TEXT DEFAULT NULL,
  p_priority            TEXT DEFAULT 'medium',
  p_due_date            DATE DEFAULT NULL,
  p_sla_days            INT DEFAULT NULL,
  p_assignee_user_id    UUID DEFAULT NULL,
  p_effort              TEXT DEFAULT NULL,
  p_tags                TEXT[] DEFAULT '{}'
)
RETURNS SETOF gate_h.action_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, gate_h
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM gate_h.create_from_recommendation(
    p_source,
    p_source_reco_id,
    p_kpi_key,
    p_dim_key,
    p_dim_value,
    p_title_ar,
    p_desc_ar,
    p_priority::gate_h_action_priority_enum,
    p_due_date,
    p_sla_days,
    p_assignee_user_id,
    p_effort::gate_h_action_effort_enum,
    p_tags
  );
END;
$$;

COMMENT ON FUNCTION public.gate_h_create_from_recommendation IS
'Public wrapper for gate_h.create_from_recommendation - Creates action from Gate-K/J recommendation';

-- ============================================================
-- 2) Public Wrapper: gate_h_add_update
-- ============================================================
CREATE OR REPLACE FUNCTION public.gate_h_add_update(
  p_action_id    UUID,
  p_update_type  TEXT,
  p_body_ar      TEXT DEFAULT NULL,
  p_evidence_url TEXT DEFAULT NULL,
  p_new_status   TEXT DEFAULT NULL,
  p_progress_pct INT DEFAULT NULL
)
RETURNS SETOF gate_h.action_updates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, gate_h
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM gate_h.add_update(
    p_action_id,
    p_update_type::gate_h_action_update_type_enum,
    p_body_ar,
    p_evidence_url,
    p_new_status::gate_h_action_status_enum,
    p_progress_pct
  );
END;
$$;

COMMENT ON FUNCTION public.gate_h_add_update IS
'Public wrapper for gate_h.add_update - Adds update (comment/progress/evidence) to action';

-- ============================================================
-- 3) Public Wrapper: gate_h_update_status
-- ============================================================
CREATE OR REPLACE FUNCTION public.gate_h_update_status(
  p_action_id   UUID,
  p_new_status  TEXT,
  p_note_ar     TEXT DEFAULT NULL
)
RETURNS SETOF gate_h.action_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, gate_h
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM gate_h.update_status(
    p_action_id,
    p_new_status::gate_h_action_status_enum,
    p_note_ar
  );
END;
$$;

COMMENT ON FUNCTION public.gate_h_update_status IS
'Public wrapper for gate_h.update_status - Updates action status with optional note';

-- ============================================================
-- 4) Public Wrapper: gate_h_verify_and_close
-- ============================================================
CREATE OR REPLACE FUNCTION public.gate_h_verify_and_close(
  p_action_id   UUID,
  p_verify_note TEXT DEFAULT NULL
)
RETURNS SETOF gate_h.action_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, gate_h
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM gate_h.verify_and_close(
    p_action_id,
    p_verify_note
  );
END;
$$;

COMMENT ON FUNCTION public.gate_h_verify_and_close IS
'Public wrapper for gate_h.verify_and_close - Verifies evidence and closes action';

-- ============================================================
-- 5) Public Wrapper: gate_h_list_actions
-- ============================================================
CREATE OR REPLACE FUNCTION public.gate_h_list_actions(
  p_statuses           TEXT[] DEFAULT NULL,
  p_assignee_user_id   UUID DEFAULT NULL,
  p_priority_list      TEXT[] DEFAULT NULL,
  p_overdue_only       BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
  id                  UUID,
  tenant_id           UUID,
  source              TEXT,
  source_reco_id      UUID,
  kpi_key             TEXT,
  dim_key             TEXT,
  dim_value           TEXT,
  title_ar            TEXT,
  desc_ar             TEXT,
  priority            TEXT,
  status              TEXT,
  effort              TEXT,
  sla_days            INT,
  due_date            DATE,
  owner_user_id       UUID,
  assignee_user_id    UUID,
  verified_by         UUID,
  verified_at         TIMESTAMPTZ,
  closed_at           TIMESTAMPTZ,
  tags                TEXT[],
  created_at          TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ,
  created_by          UUID,
  updated_by          UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, gate_h
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
  
  IF p_priority_list IS NOT NULL THEN
    SELECT array_agg(pr::gate_h_action_priority_enum)
    INTO v_priorities_enum
    FROM unnest(p_priority_list) pr;
  END IF;
  
  RETURN QUERY
  SELECT
    ai.id,
    ai.tenant_id,
    ai.source::TEXT,
    ai.source_reco_id,
    ai.kpi_key,
    ai.dim_key,
    ai.dim_value,
    ai.title_ar,
    ai.desc_ar,
    ai.priority::TEXT,
    ai.status::TEXT,
    ai.effort::TEXT,
    ai.sla_days,
    ai.due_date,
    ai.owner_user_id,
    ai.assignee_user_id,
    ai.verified_by,
    ai.verified_at,
    ai.closed_at,
    ai.tags,
    ai.created_at,
    ai.updated_at,
    ai.created_by,
    ai.updated_by
  FROM gate_h.list_actions(
    v_statuses_enum,
    p_assignee_user_id,
    v_priorities_enum,
    p_overdue_only
  ) ai;
END;
$$;

COMMENT ON FUNCTION public.gate_h_list_actions IS
'Public wrapper for gate_h.list_actions - Lists actions with filters for current tenant';

-- ============================================================
-- 6) Public Wrapper: gate_h_list_updates
-- ============================================================
CREATE OR REPLACE FUNCTION public.gate_h_list_updates(
  p_action_id UUID
)
RETURNS TABLE(
  id            UUID,
  tenant_id     UUID,
  action_id     UUID,
  update_type   TEXT,
  body_ar       TEXT,
  evidence_url  TEXT,
  new_status    TEXT,
  progress_pct  INT,
  created_at    TIMESTAMPTZ,
  created_by    UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, gate_h
AS $$
BEGIN
  RETURN QUERY
  SELECT
    au.id,
    au.tenant_id,
    au.action_id,
    au.update_type::TEXT,
    au.body_ar,
    au.evidence_url,
    au.new_status::TEXT,
    au.progress_pct,
    au.created_at,
    au.created_by
  FROM gate_h.list_updates(p_action_id) au;
END;
$$;

COMMENT ON FUNCTION public.gate_h_list_updates IS
'Public wrapper for gate_h.list_updates - Lists all updates for a specific action';

-- ============================================================
-- 7) Public Wrapper: gate_h_seed_demo_actions
-- ============================================================
CREATE OR REPLACE FUNCTION public.gate_h_seed_demo_actions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, gate_h
AS $$
BEGIN
  PERFORM gate_h.seed_demo_actions();
END;
$$;

COMMENT ON FUNCTION public.gate_h_seed_demo_actions IS
'Public wrapper for gate_h.seed_demo_actions - Seeds demo actions for current tenant (Dev/UAT only)';

-- ============================================================
-- 8) Public Wrapper: gate_h_has_demo_actions
-- ============================================================
CREATE OR REPLACE FUNCTION public.gate_h_has_demo_actions()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, gate_h
AS $$
BEGIN
  RETURN gate_h.has_demo_actions();
END;
$$;

COMMENT ON FUNCTION public.gate_h_has_demo_actions IS
'Public wrapper for gate_h.has_demo_actions - Checks if demo actions exist for current tenant';

-- ============================================================
-- Grant Execute Permissions
-- ============================================================
GRANT EXECUTE ON FUNCTION public.gate_h_create_from_recommendation TO authenticated;
GRANT EXECUTE ON FUNCTION public.gate_h_add_update TO authenticated;
GRANT EXECUTE ON FUNCTION public.gate_h_update_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.gate_h_verify_and_close TO authenticated;
GRANT EXECUTE ON FUNCTION public.gate_h_list_actions TO authenticated;
GRANT EXECUTE ON FUNCTION public.gate_h_list_updates TO authenticated;
GRANT EXECUTE ON FUNCTION public.gate_h_seed_demo_actions TO authenticated;
GRANT EXECUTE ON FUNCTION public.gate_h_has_demo_actions TO authenticated;