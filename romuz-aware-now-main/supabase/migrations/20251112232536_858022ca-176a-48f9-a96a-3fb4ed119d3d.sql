-- Gate-P: Add is_default column to tenants table
-- This allows marking one tenant as the default for new user registrations

-- Add is_default column
ALTER TABLE public.tenants 
ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT false;

-- Create unique partial index to ensure only one default tenant
CREATE UNIQUE INDEX tenants_single_default_idx 
ON public.tenants (is_default) 
WHERE is_default = true;

-- Create function to set default tenant (ensures only one default)
CREATE OR REPLACE FUNCTION public.set_default_tenant(p_tenant_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove default from all tenants
  UPDATE public.tenants SET is_default = false WHERE is_default = true;
  
  -- Set new default
  UPDATE public.tenants SET is_default = true WHERE id = p_tenant_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.set_default_tenant TO authenticated;

-- Create function to auto-link new users to default tenant
CREATE OR REPLACE FUNCTION public.auto_link_user_to_default_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_default_tenant_id UUID;
BEGIN
  -- Find default tenant
  SELECT id INTO v_default_tenant_id
  FROM public.tenants
  WHERE is_default = true AND status = 'ACTIVE'
  LIMIT 1;
  
  -- If default tenant exists, link user to it
  IF v_default_tenant_id IS NOT NULL THEN
    INSERT INTO public.user_tenants (user_id, tenant_id)
    VALUES (NEW.id, v_default_tenant_id)
    ON CONFLICT (user_id, tenant_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-link users on signup
DROP TRIGGER IF EXISTS trigger_auto_link_default_tenant ON auth.users;
CREATE TRIGGER trigger_auto_link_default_tenant
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_user_to_default_tenant();

COMMENT ON COLUMN public.tenants.is_default IS 'Marks this tenant as the default for new user registrations. Only one tenant can be default.';
COMMENT ON FUNCTION public.set_default_tenant IS 'Sets a tenant as the default (removes default from others). Used by admins.';
COMMENT ON FUNCTION public.auto_link_user_to_default_tenant IS 'Automatically links new users to the default tenant upon registration.';