
-- Gate-P: Add Admin Policy to View All Tenants
-- Allows users with 'admin' role to view all tenants (for Gate-P Console)

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Admins can view all tenants" ON public.tenants;

-- Create new policy for admin users
CREATE POLICY "Admins can view all tenants"
ON public.tenants
FOR SELECT
TO authenticated
USING (
  -- Allow if user is admin
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
  -- OR if tenant belongs to user (existing logic)
  OR id IN (
    SELECT tenant_id FROM public.user_tenants
    WHERE user_id = auth.uid()
  )
);

-- Comment
COMMENT ON POLICY "Admins can view all tenants" ON public.tenants IS 
'Allows admin users to view all tenants for Gate-P Console management';
