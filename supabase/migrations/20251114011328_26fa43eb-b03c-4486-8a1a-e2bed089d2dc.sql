
-- Fix Critical Issues in user_roles table (Retry after data cleanup)

-- 1. Drop old UNIQUE constraint
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- 2. Add correct UNIQUE constraint (user can have same role in different tenants)
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_role_tenant_unique 
UNIQUE (user_id, role, tenant_id);

-- 3. Add CHECK constraint for platform vs tenant roles separation
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_platform_tenant_check
CHECK (
  -- Platform roles must have NULL tenant_id
  (role::TEXT IN ('platform_admin', 'platform_support') AND tenant_id IS NULL) OR
  -- All other roles must have a tenant_id
  (role::TEXT NOT IN ('platform_admin', 'platform_support') AND tenant_id IS NOT NULL)
);

-- 4. Update RLS policies to use new role structure

-- Drop old admin policies
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- Create new policies for platform admins
CREATE POLICY "Platform admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role::TEXT IN ('platform_admin', 'platform_support')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role::TEXT IN ('platform_admin', 'platform_support')
  )
);

-- Create policy for tenant admins to manage roles in their tenant
CREATE POLICY "Tenant admins can manage roles in their tenant"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT ur.tenant_id
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role::TEXT = 'tenant_admin'
      AND ur.tenant_id IS NOT NULL
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT ur.tenant_id
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role::TEXT = 'tenant_admin'
      AND ur.tenant_id IS NOT NULL
  )
);

-- Comment for documentation
COMMENT ON TABLE public.user_roles IS 'Enhanced RBAC: User roles with platform/tenant separation. Platform roles (platform_admin, platform_support) have NULL tenant_id. Tenant roles (tenant_admin, tenant_manager, tenant_employee) must have tenant_id.';
