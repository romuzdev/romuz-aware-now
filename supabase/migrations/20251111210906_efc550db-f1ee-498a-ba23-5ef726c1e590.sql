-- Fix role checks in admin settings RPCs to use 'admin' role (matches app_role enum)

-- Update: fn_gate_n_get_admin_settings
CREATE OR REPLACE FUNCTION public.fn_gate_n_get_admin_settings()
 RETURNS TABLE(
  id uuid,
  tenant_id uuid,
  sla_config jsonb,
  feature_flags jsonb,
  limits jsonb,
  notification_channels jsonb,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  created_by uuid,
  updated_by uuid
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get current tenant
  v_tenant_id := get_user_tenant_id(auth.uid());
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Check role (only admin)
  IF NOT app_has_role('admin') THEN
    RAISE EXCEPTION 'PERMISSION_DENIED: Only admin can view admin settings';
  END IF;
  
  -- Return admin_settings for this tenant
  RETURN QUERY
  SELECT 
    a.id,
    a.tenant_id,
    a.sla_config,
    a.feature_flags,
    a.limits,
    a.notification_channels,
    a.created_at,
    a.updated_at,
    a.created_by,
    a.updated_by
  FROM public.admin_settings a
  WHERE a.tenant_id = v_tenant_id;
END;
$function$;

-- Update: fn_gate_n_upsert_admin_settings
CREATE OR REPLACE FUNCTION public.fn_gate_n_upsert_admin_settings(
  p_sla_config jsonb,
  p_feature_flags jsonb,
  p_limits jsonb,
  p_notification_channels jsonb
)
 RETURNS TABLE(
  id uuid,
  tenant_id uuid,
  sla_config jsonb,
  feature_flags jsonb,
  limits jsonb,
  notification_channels jsonb,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  created_by uuid,
  updated_by uuid
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user and tenant
  v_user_id := auth.uid();
  v_tenant_id := get_user_tenant_id(v_user_id);
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  -- Check role (only admin)
  IF NOT app_has_role('admin') THEN
    RAISE EXCEPTION 'PERMISSION_DENIED: Only admin can modify admin settings';
  END IF;
  
  -- Upsert admin_settings
  RETURN QUERY
  INSERT INTO public.admin_settings (
    tenant_id,
    sla_config,
    feature_flags,
    limits,
    notification_channels,
    created_by,
    updated_by
  )
  VALUES (
    v_tenant_id,
    p_sla_config,
    p_feature_flags,
    p_limits,
    p_notification_channels,
    v_user_id,
    v_user_id
  )
  ON CONFLICT (tenant_id)
  DO UPDATE SET
    sla_config = EXCLUDED.sla_config,
    feature_flags = EXCLUDED.feature_flags,
    limits = EXCLUDED.limits,
    notification_channels = EXCLUDED.notification_channels,
    updated_by = v_user_id,
    updated_at = now()
  RETURNING 
    id,
    tenant_id,
    sla_config,
    feature_flags,
    limits,
    notification_channels,
    created_at,
    updated_at,
    created_by,
    updated_by;
END;
$function$;