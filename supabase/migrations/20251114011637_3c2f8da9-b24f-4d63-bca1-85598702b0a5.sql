
-- CRITICAL FIX: RLS Policies causing potential infinite recursion
-- Current policies use subqueries on user_roles table itself
-- This violates best practice and may cause infinite recursion

-- Step 1: Drop problematic policies
DROP POLICY IF EXISTS "Platform admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Tenant admins can manage roles in their tenant" ON public.user_roles;

-- Step 2: Create SECURITY DEFINER function for platform admin check
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::TEXT IN ('platform_admin', 'platform_support')
  );
$$;

-- Step 3: Create SECURITY DEFINER function for tenant admin check
CREATE OR REPLACE FUNCTION public.get_user_tenant_admin_tenants(_user_id UUID)
RETURNS TABLE(tenant_id UUID)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ur.tenant_id
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
    AND ur.role::TEXT = 'tenant_admin'
    AND ur.tenant_id IS NOT NULL;
$$;

-- Step 4: Create NEW safe RLS policies using SECURITY DEFINER functions
CREATE POLICY "Platform admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "Tenant admins can manage roles in their tenant"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.get_user_tenant_admin_tenants(auth.uid())
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.get_user_tenant_admin_tenants(auth.uid())
  )
);

-- Step 5: Add missing trigger for updated_at
DROP TRIGGER IF EXISTS user_roles_updated_at ON public.user_roles;
CREATE TRIGGER user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_roles_updated_at();

COMMENT ON FUNCTION public.is_platform_admin IS 'SECURITY DEFINER function to prevent RLS recursion when checking platform admin status';
COMMENT ON FUNCTION public.get_user_tenant_admin_tenants IS 'SECURITY DEFINER function to prevent RLS recursion when checking tenant admin permissions';
