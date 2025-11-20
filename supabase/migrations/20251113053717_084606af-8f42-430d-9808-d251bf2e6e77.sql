-- Gate-U: Role Management Functions
-- Functions for assigning, removing, and querying user roles

-- 1. Assign role to user
CREATE OR REPLACE FUNCTION public.fn_assign_role(
  p_user_id UUID,
  p_role app_role,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID;
  v_tenant_id UUID;
BEGIN
  -- Get current actor
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;
  
  -- Get tenant (use provided or get from current user)
  v_tenant_id := COALESCE(p_tenant_id, get_user_tenant_id(v_actor_id));
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Check permission (only tenant_admin or super_admin can assign roles)
  IF NOT (has_role(v_actor_id, 'tenant_admin') OR has_role(v_actor_id, 'super_admin')) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED: Only tenant_admin or super_admin can assign roles';
  END IF;
  
  -- Insert role (ignore if already exists)
  INSERT INTO public.user_roles (user_id, role, created_by)
  VALUES (p_user_id, p_role, v_actor_id)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log action to audit_log
  INSERT INTO public.audit_log (
    tenant_id, actor, action, entity_type, entity_id, payload
  )
  VALUES (
    v_tenant_id,
    v_actor_id,
    'role_assigned',
    'user_role',
    p_user_id,
    jsonb_build_object('role', p_role::text, 'assigned_by', v_actor_id)
  );
END;
$$;

-- 2. Remove role from user
CREATE OR REPLACE FUNCTION public.fn_remove_role(
  p_user_id UUID,
  p_role app_role,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID;
  v_tenant_id UUID;
BEGIN
  -- Get current actor
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;
  
  -- Get tenant
  v_tenant_id := COALESCE(p_tenant_id, get_user_tenant_id(v_actor_id));
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Check permission
  IF NOT (has_role(v_actor_id, 'tenant_admin') OR has_role(v_actor_id, 'super_admin')) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED: Only tenant_admin or super_admin can remove roles';
  END IF;
  
  -- Delete role
  DELETE FROM public.user_roles
  WHERE user_id = p_user_id AND role = p_role;
  
  -- Log action
  INSERT INTO public.audit_log (
    tenant_id, actor, action, entity_type, entity_id, payload
  )
  VALUES (
    v_tenant_id,
    v_actor_id,
    'role_removed',
    'user_role',
    p_user_id,
    jsonb_build_object('role', p_role::text, 'removed_by', v_actor_id)
  );
END;
$$;

-- 3. Get users with their roles (for current tenant)
CREATE OR REPLACE FUNCTION public.fn_get_users_with_roles()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  roles TEXT[],
  tenant_id UUID,
  tenant_name TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID;
  v_tenant_id UUID;
BEGIN
  -- Get current actor
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;
  
  -- Get tenant
  v_tenant_id := get_user_tenant_id(v_actor_id);
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Check permission
  IF NOT (has_role(v_actor_id, 'tenant_admin') OR has_role(v_actor_id, 'super_admin')) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED: Only tenant_admin or super_admin can view user roles';
  END IF;
  
  -- Return users with their roles
  RETURN QUERY
  SELECT 
    u.id AS user_id,
    u.email,
    COALESCE(
      ARRAY_AGG(ur.role::TEXT ORDER BY ur.role) FILTER (WHERE ur.role IS NOT NULL),
      ARRAY[]::TEXT[]
    ) AS roles,
    ut.tenant_id,
    t.name AS tenant_name,
    u.created_at
  FROM auth.users u
  LEFT JOIN public.user_tenants ut ON u.id = ut.user_id AND ut.tenant_id = v_tenant_id
  LEFT JOIN public.tenants t ON ut.tenant_id = t.id
  LEFT JOIN public.user_roles ur ON u.id = ur.user_id
  WHERE ut.tenant_id = v_tenant_id
  GROUP BY u.id, u.email, ut.tenant_id, t.name, u.created_at
  ORDER BY u.email;
END;
$$;

-- 4. Get role statistics (count users per role)
CREATE OR REPLACE FUNCTION public.fn_get_role_stats()
RETURNS TABLE(
  role TEXT,
  user_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID;
  v_tenant_id UUID;
BEGIN
  -- Get current actor
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;
  
  -- Get tenant
  v_tenant_id := get_user_tenant_id(v_actor_id);
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Return role stats (only for users in current tenant)
  RETURN QUERY
  SELECT 
    ur.role::TEXT,
    COUNT(DISTINCT ur.user_id) AS user_count
  FROM public.user_roles ur
  INNER JOIN public.user_tenants ut ON ur.user_id = ut.user_id
  WHERE ut.tenant_id = v_tenant_id
  GROUP BY ur.role
  ORDER BY user_count DESC, ur.role;
END;
$$;