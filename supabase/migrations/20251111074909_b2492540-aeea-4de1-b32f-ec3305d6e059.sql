-- Part 2.3: Gate-H — Core RPC Functions (Fixed Comments)
-- Implement core workflow functions for action management

-- ============================================================
-- 1) Function: gate_h.create_from_recommendation
-- ============================================================

CREATE OR REPLACE FUNCTION gate_h.create_from_recommendation(
  p_source              TEXT,
  p_source_reco_id      UUID,
  p_kpi_key             TEXT,
  p_dim_key             TEXT,
  p_dim_value           TEXT,
  p_title_ar            TEXT,
  p_desc_ar             TEXT,
  p_priority            gate_h_action_priority_enum DEFAULT 'medium',
  p_due_date            DATE DEFAULT NULL,
  p_sla_days            INTEGER DEFAULT NULL,
  p_assignee_user_id    UUID DEFAULT NULL,
  p_effort              gate_h_action_effort_enum DEFAULT 'M',
  p_tags                TEXT[] DEFAULT '{}'
)
RETURNS gate_h.action_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_current_user_id UUID;
  v_final_sla_days INTEGER;
  v_new_action gate_h.action_items;
BEGIN
  -- Check authorization
  IF NOT (app_has_role('awareness_analyst') OR app_has_role('tenant_admin')) THEN
    RAISE EXCEPTION 'insufficient_privilege: requires awareness_analyst or tenant_admin role';
  END IF;
  
  -- Get current tenant and user
  v_tenant_id := app_current_tenant_id();
  v_current_user_id := app_current_user_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant_required: user must belong to a tenant';
  END IF;
  
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required: user must be authenticated';
  END IF;
  
  -- Validate source
  IF p_source NOT IN ('K', 'I', 'J', 'manual') THEN
    RAISE EXCEPTION 'invalid_source: source must be one of K, I, J, or manual';
  END IF;
  
  -- Auto-lookup SLA days if not provided
  v_final_sla_days := p_sla_days;
  
  IF v_final_sla_days IS NULL THEN
    -- Try KPI-specific rule first
    SELECT default_sla_days INTO v_final_sla_days
    FROM gate_h.action_sla_rules
    WHERE tenant_id = v_tenant_id
      AND kpi_key = p_kpi_key
      AND priority = p_priority
    LIMIT 1;
    
    -- If not found, try global rule for this priority
    IF v_final_sla_days IS NULL THEN
      SELECT default_sla_days INTO v_final_sla_days
      FROM gate_h.action_sla_rules
      WHERE tenant_id = v_tenant_id
        AND kpi_key IS NULL
        AND priority = p_priority
      LIMIT 1;
    END IF;
  END IF;
  
  -- Insert new action
  INSERT INTO gate_h.action_items (
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
    owner_user_id,
    due_date,
    sla_days,
    effort,
    tags,
    created_by,
    updated_by
  ) VALUES (
    v_tenant_id,
    p_source,
    p_source_reco_id,
    p_kpi_key,
    p_dim_key,
    p_dim_value,
    p_title_ar,
    p_desc_ar,
    p_priority,
    'new',
    p_assignee_user_id,
    v_current_user_id, -- creator is owner
    p_due_date,
    v_final_sla_days,
    p_effort,
    p_tags,
    v_current_user_id,
    v_current_user_id
  )
  RETURNING * INTO v_new_action;
  
  RETURN v_new_action;
END;
$$;

COMMENT ON FUNCTION gate_h.create_from_recommendation IS 'Gate-H: Create new action item from Gate-K/I/J recommendation or manual entry. Requires awareness_analyst or tenant_admin role. Auto-assigns SLA from rules if not provided. Creator becomes owner.';

-- ============================================================
-- 2) Function: gate_h.add_update
-- ============================================================

CREATE OR REPLACE FUNCTION gate_h.add_update(
  p_action_id    UUID,
  p_update_type  gate_h_action_update_type_enum,
  p_body_ar      TEXT DEFAULT NULL,
  p_evidence_url TEXT DEFAULT NULL,
  p_new_status   gate_h_action_status_enum DEFAULT NULL,
  p_progress_pct INTEGER DEFAULT NULL
)
RETURNS gate_h.action_updates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_current_user_id UUID;
  v_action gate_h.action_items;
  v_new_update gate_h.action_updates;
BEGIN
  -- Check authorization
  IF NOT (
    app_has_role('awareness_analyst') 
    OR app_has_role('awareness_owner') 
    OR app_has_role('tenant_admin')
  ) THEN
    RAISE EXCEPTION 'insufficient_privilege: requires awareness_analyst, awareness_owner, or tenant_admin role';
  END IF;
  
  -- Get current tenant and user
  v_tenant_id := app_current_tenant_id();
  v_current_user_id := app_current_user_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant_required: user must belong to a tenant';
  END IF;
  
  -- Fetch the action and ensure it belongs to current tenant
  SELECT * INTO v_action
  FROM gate_h.action_items
  WHERE id = p_action_id
    AND tenant_id = v_tenant_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'action_not_found: action % not found or not accessible', p_action_id;
  END IF;
  
  -- Validate update type requirements
  IF p_update_type = 'progress' THEN
    IF p_progress_pct IS NULL OR p_progress_pct < 0 OR p_progress_pct > 100 THEN
      RAISE EXCEPTION 'invalid_progress: progress_pct must be between 0 and 100 for progress updates';
    END IF;
  END IF;
  
  IF p_update_type = 'status_change' AND p_new_status IS NULL THEN
    RAISE EXCEPTION 'invalid_status_change: new_status is required for status_change updates';
  END IF;
  
  -- Insert update record
  INSERT INTO gate_h.action_updates (
    tenant_id,
    action_id,
    update_type,
    body_ar,
    evidence_url,
    new_status,
    progress_pct,
    created_by
  ) VALUES (
    v_action.tenant_id,
    p_action_id,
    p_update_type,
    p_body_ar,
    p_evidence_url,
    p_new_status,
    p_progress_pct,
    v_current_user_id
  )
  RETURNING * INTO v_new_update;
  
  -- If status change is provided, update the parent action
  IF p_new_status IS NOT NULL THEN
    UPDATE gate_h.action_items
    SET 
      status = p_new_status,
      updated_at = now(),
      updated_by = v_current_user_id
    WHERE id = p_action_id;
  END IF;
  
  RETURN v_new_update;
END;
$$;

COMMENT ON FUNCTION gate_h.add_update IS 'Gate-H: Add update/comment/evidence/progress to an action. Requires awareness_analyst, awareness_owner, or tenant_admin role. Automatically updates parent action status if new_status is provided.';

-- ============================================================
-- 3) Function: gate_h.update_status
-- ============================================================

CREATE OR REPLACE FUNCTION gate_h.update_status(
  p_action_id   UUID,
  p_new_status  gate_h_action_status_enum,
  p_note_ar     TEXT DEFAULT NULL
)
RETURNS gate_h.action_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_current_user_id UUID;
  v_action gate_h.action_items;
  v_old_status gate_h_action_status_enum;
  v_updated_action gate_h.action_items;
BEGIN
  -- Check authorization
  IF NOT (
    app_has_role('awareness_analyst') 
    OR app_has_role('awareness_owner') 
    OR app_has_role('tenant_admin')
  ) THEN
    RAISE EXCEPTION 'insufficient_privilege: requires awareness_analyst, awareness_owner, or tenant_admin role';
  END IF;
  
  -- Get current tenant and user
  v_tenant_id := app_current_tenant_id();
  v_current_user_id := app_current_user_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant_required: user must belong to a tenant';
  END IF;
  
  -- Fetch the action
  SELECT * INTO v_action
  FROM gate_h.action_items
  WHERE id = p_action_id
    AND tenant_id = v_tenant_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'action_not_found: action % not found or not accessible', p_action_id;
  END IF;
  
  v_old_status := v_action.status;
  
  -- Validate lifecycle transitions
  IF v_old_status = 'new' THEN
    IF p_new_status NOT IN ('in_progress', 'blocked') THEN
      RAISE EXCEPTION 'invalid_status_transition: from new can only transition to in_progress or blocked, not %', p_new_status;
    END IF;
  ELSIF v_old_status = 'in_progress' THEN
    IF p_new_status NOT IN ('blocked', 'verify') THEN
      RAISE EXCEPTION 'invalid_status_transition: from in_progress can only transition to blocked or verify, not %', p_new_status;
    END IF;
  ELSIF v_old_status = 'blocked' THEN
    IF p_new_status NOT IN ('in_progress') THEN
      RAISE EXCEPTION 'invalid_status_transition: from blocked can only transition to in_progress, not %', p_new_status;
    END IF;
  ELSIF v_old_status = 'verify' THEN
    -- Use verify_and_close function for closing
    RAISE EXCEPTION 'invalid_status_transition: from verify use verify_and_close function to close, or transition to in_progress/blocked';
  ELSIF v_old_status = 'closed' THEN
    RAISE EXCEPTION 'invalid_status_transition: closed actions cannot be reopened';
  END IF;
  
  -- Update the action
  UPDATE gate_h.action_items
  SET 
    status = p_new_status,
    updated_at = now(),
    updated_by = v_current_user_id
  WHERE id = p_action_id
  RETURNING * INTO v_updated_action;
  
  -- Log status change as an update
  INSERT INTO gate_h.action_updates (
    tenant_id,
    action_id,
    update_type,
    body_ar,
    new_status,
    created_by
  ) VALUES (
    v_tenant_id,
    p_action_id,
    'status_change',
    p_note_ar,
    p_new_status,
    v_current_user_id
  );
  
  RETURN v_updated_action;
END;
$$;

COMMENT ON FUNCTION gate_h.update_status IS 'Gate-H: Change action status with lifecycle validation. Enforces valid transitions. Automatically logs status change in action_updates.';

-- ============================================================
-- 4) Function: gate_h.verify_and_close
-- ============================================================

CREATE OR REPLACE FUNCTION gate_h.verify_and_close(
  p_action_id   UUID,
  p_verify_note TEXT DEFAULT NULL
)
RETURNS gate_h.action_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_current_user_id UUID;
  v_action gate_h.action_items;
  v_evidence_count INTEGER;
  v_closed_action gate_h.action_items;
BEGIN
  -- Check authorization (owners and admins can close)
  IF NOT (
    app_has_role('awareness_owner') 
    OR app_has_role('tenant_admin')
    OR app_has_role('awareness_analyst') -- Allow analysts too
  ) THEN
    RAISE EXCEPTION 'insufficient_privilege: requires awareness_owner, awareness_analyst, or tenant_admin role';
  END IF;
  
  -- Get current tenant and user
  v_tenant_id := app_current_tenant_id();
  v_current_user_id := app_current_user_id();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant_required: user must belong to a tenant';
  END IF;
  
  -- Fetch the action
  SELECT * INTO v_action
  FROM gate_h.action_items
  WHERE id = p_action_id
    AND tenant_id = v_tenant_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'action_not_found: action % not found or not accessible', p_action_id;
  END IF;
  
  -- Require action to be in 'verify' status (or optionally 'in_progress')
  IF v_action.status NOT IN ('verify', 'in_progress') THEN
    RAISE EXCEPTION 'invalid_status_for_closure: action must be in verify or in_progress status to close, currently %', v_action.status;
  END IF;
  
  -- Check for at least one evidence update
  SELECT COUNT(*) INTO v_evidence_count
  FROM gate_h.action_updates
  WHERE action_id = p_action_id
    AND update_type = 'evidence';
  
  IF v_evidence_count = 0 THEN
    RAISE EXCEPTION 'cannot_close_without_evidence: action requires at least one evidence update before closure';
  END IF;
  
  -- Update the action to closed
  UPDATE gate_h.action_items
  SET 
    status = 'closed',
    verified_at = now(),
    verified_by = v_current_user_id,
    closed_at = now(),
    updated_at = now(),
    updated_by = v_current_user_id
  WHERE id = p_action_id
  RETURNING * INTO v_closed_action;
  
  -- Log closure as status change update
  INSERT INTO gate_h.action_updates (
    tenant_id,
    action_id,
    update_type,
    body_ar,
    new_status,
    created_by
  ) VALUES (
    v_tenant_id,
    p_action_id,
    'status_change',
    p_verify_note,
    'closed',
    v_current_user_id
  );
  
  RETURN v_closed_action;
END;
$$;

COMMENT ON FUNCTION gate_h.verify_and_close IS 'Gate-H: Close an action with verification. Requires awareness_owner, awareness_analyst, or tenant_admin role. Action must be in verify or in_progress status and have at least one evidence update. Sets verified_at, verified_by, and closed_at timestamps.';

-- ============================================================
-- 5) Function: gate_h.list_actions
-- ============================================================

CREATE OR REPLACE FUNCTION gate_h.list_actions(
  p_statuses           gate_h_action_status_enum[] DEFAULT NULL,
  p_assignee_user_id   UUID DEFAULT NULL,
  p_priority_list      gate_h_action_priority_enum[] DEFAULT NULL,
  p_overdue_only       BOOLEAN DEFAULT FALSE
)
RETURNS SETOF gate_h.action_items
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM gate_h.action_items
  WHERE tenant_id = app_current_tenant_id()
    AND (p_statuses IS NULL OR status = ANY(p_statuses))
    AND (p_assignee_user_id IS NULL OR assignee_user_id = p_assignee_user_id)
    AND (p_priority_list IS NULL OR priority = ANY(p_priority_list))
    AND (
      NOT p_overdue_only
      OR (due_date IS NOT NULL AND due_date < CURRENT_DATE AND status <> 'closed')
    )
  ORDER BY 
    CASE priority
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END,
    due_date NULLS LAST,
    created_at DESC;
$$;

COMMENT ON FUNCTION gate_h.list_actions IS 'Gate-H: Query filtered list of actions for UI (Backlog, Board, Lists). Filters by status, assignee, priority, and overdue flag. Respects RLS policies for tenant isolation and role-based access. Results ordered by priority, due date, then creation date.';

-- ============================================================
-- 6) Function: gate_h.list_updates
-- ============================================================

CREATE OR REPLACE FUNCTION gate_h.list_updates(
  p_action_id UUID
)
RETURNS SETOF gate_h.action_updates
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.*
  FROM gate_h.action_updates u
  JOIN gate_h.action_items a
    ON a.id = u.action_id
  WHERE u.action_id = p_action_id
    AND a.tenant_id = app_current_tenant_id()
  ORDER BY u.created_at ASC;
$$;

COMMENT ON FUNCTION gate_h.list_updates IS 'Gate-H: Return all updates for a given action, ordered chronologically. Ensures action belongs to current tenant via join with action_items. Respects RLS policies for tenant isolation and role-based access.';

-- ============================================================
-- End of Part 2.3: Gate-H Core RPC Functions
-- ============================================================