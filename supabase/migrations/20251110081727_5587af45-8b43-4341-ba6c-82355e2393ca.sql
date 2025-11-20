-- Gate-G: Documents Hub v1 - Part 3.1.A
-- Helper Functions & Role Checks
-- 
-- ⚠️ IMPORTANT: This migration creates WRAPPER functions only.
-- The core RBAC logic already exists in:
--   • auth.uid() -> current authenticated user
--   • get_user_tenant_id(user_id) -> tenant lookup
--   • has_role(user_id, role) -> role check
-- 
-- These wrappers simplify RLS policy syntax by removing repetitive auth.uid() calls.

-- ============================================================================
-- 1️⃣ app_current_user_id() -> Wrapper around auth.uid()
-- ============================================================================
CREATE OR REPLACE FUNCTION public.app_current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  -- Returns the currently authenticated user's UUID
  -- Wrapper around Supabase's built-in auth.uid() for consistency
  SELECT auth.uid();
$$;

COMMENT ON FUNCTION public.app_current_user_id() IS
'Gate-G helper: Returns current authenticated user UUID. 
Wrapper around auth.uid() for consistent naming across RLS policies.
Used in: documents, document_versions, attachments RLS policies.';


-- ============================================================================
-- 2️⃣ app_current_tenant_id() -> Wrapper around get_user_tenant_id(auth.uid())
-- ============================================================================
CREATE OR REPLACE FUNCTION public.app_current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  -- Returns the tenant_id for the current authenticated user
  -- Delegates to existing get_user_tenant_id() function
  SELECT public.get_user_tenant_id(auth.uid());
$$;

COMMENT ON FUNCTION public.app_current_tenant_id() IS
'Gate-G helper: Returns tenant_id for current user.
Wrapper around get_user_tenant_id(auth.uid()) for simplified RLS syntax.
Returns NULL if user has no tenant assignment (should never happen in production).
Used in: tenant isolation checks across all multi-tenant tables.';


-- ============================================================================
-- 3️⃣ app_has_role(role_code) -> Wrapper around has_role(auth.uid(), role)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.app_has_role(_role_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  -- Checks if current user has the specified role in their tenant
  -- Delegates to existing has_role() function with auth.uid()
  SELECT public.has_role(auth.uid(), _role_code);
$$;

COMMENT ON FUNCTION public.app_has_role(text) IS
'Gate-G helper: Checks if current user has specified role.
Wrapper around has_role(auth.uid(), role) for cleaner RLS policy syntax.
Example usage in RLS: 
  WITH CHECK (app_has_role(''admin'') OR app_has_role(''document_manager''))
Delegates to project''s existing RBAC system (user_roles table).';


-- ============================================================================
-- 4️⃣ Verification Query (for documentation purposes only)
-- ============================================================================
-- Verify all helper functions are in place:
-- SELECT 
--   routine_name, 
--   routine_type,
--   security_type
-- FROM information_schema.routines
-- WHERE routine_schema = 'public'
--   AND routine_name IN (
--     'app_current_user_id', 
--     'app_current_tenant_id', 
--     'app_has_role',
--     'get_user_tenant_id',
--     'has_role'
--   )
-- ORDER BY routine_name;