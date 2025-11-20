-- ============================================================================
-- M23 - Security Fix Part 1: Create Security Definer Helper Function
-- Purpose: Prevent infinite recursion in RLS policies
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM user_tenants
  WHERE user_id = _user_id
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_user_tenant_id(uuid) IS 
'Security definer function to retrieve user tenant ID without causing infinite recursion in RLS policies';
