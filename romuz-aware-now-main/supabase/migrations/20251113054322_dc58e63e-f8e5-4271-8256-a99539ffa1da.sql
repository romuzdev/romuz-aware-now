-- Migration: Update auto_link_user_to_default_tenant to also assign employee role
-- Purpose: Extend existing trigger to auto-assign 'employee' role to new users

CREATE OR REPLACE FUNCTION public.auto_link_user_to_default_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_default_tenant_id UUID;
BEGIN
  -- Find default tenant
  SELECT id INTO v_default_tenant_id
  FROM public.tenants
  WHERE is_default = true AND status = 'ACTIVE'
  LIMIT 1;
  
  -- If default tenant exists
  IF v_default_tenant_id IS NOT NULL THEN
    -- 1. Link user to default tenant (existing logic)
    INSERT INTO public.user_tenants (user_id, tenant_id)
    VALUES (NEW.id, v_default_tenant_id)
    ON CONFLICT (user_id, tenant_id) DO NOTHING;
    
    -- 2. NEW: Assign 'employee' role to new user
    INSERT INTO public.user_roles (user_id, role, tenant_id)
    VALUES (NEW.id, 'employee'::app_role, v_default_tenant_id)
    ON CONFLICT (user_id, role, tenant_id) DO NOTHING;
    
    -- 3. Log the automatic role assignment
    INSERT INTO public.audit_log (
      tenant_id,
      actor,
      action,
      entity_type,
      entity_id,
      payload
    )
    VALUES (
      v_default_tenant_id,
      NEW.id,
      'auto_assign_employee_role',
      'user_roles',
      NEW.id,
      jsonb_build_object(
        'role', 'employee',
        'source', 'auto_link_trigger',
        'note', 'Default role assigned on user creation'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update function comment
COMMENT ON FUNCTION public.auto_link_user_to_default_tenant() IS 
'Links new users to default tenant AND assigns employee role automatically. Triggered after user signup.';