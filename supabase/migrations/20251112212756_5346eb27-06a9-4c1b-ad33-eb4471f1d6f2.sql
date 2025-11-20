-- Update fn_schedule_tenant_transition to derive tenant from auth context and guard against IDOR
CREATE OR REPLACE FUNCTION public.fn_schedule_tenant_transition(
  p_tenant_id uuid,
  p_from_state text,
  p_to_state text,
  p_scheduled_at timestamptz,
  p_reason text DEFAULT NULL,
  p_condition_check jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_user_id uuid := auth.uid();
  v_tenant_id uuid := get_user_tenant_id(v_user_id);
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;

  -- Prevent cross-tenant attempts
  IF p_tenant_id IS NOT NULL AND p_tenant_id <> v_tenant_id THEN
    RAISE EXCEPTION 'TENANT_MISMATCH';
  END IF;

  INSERT INTO public.tenant_scheduled_transitions (
    tenant_id, from_state, to_state, scheduled_at, reason, status, condition_check, created_by
  ) VALUES (
    v_tenant_id, p_from_state, p_to_state, p_scheduled_at, p_reason, 'pending', COALESCE(p_condition_check, '{}'::jsonb), v_user_id
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;