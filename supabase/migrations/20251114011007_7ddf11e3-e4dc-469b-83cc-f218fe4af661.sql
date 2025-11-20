-- Simple approach: Work with the enum as-is
-- Just add indexes, constraints, and functions

-- 1. Add missing indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id 
ON public.user_roles(tenant_id) WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_roles_user_tenant 
ON public.user_roles(user_id, tenant_id);

-- 2. Create/Update functions to work with TEXT (flexible)
CREATE OR REPLACE FUNCTION public.has_role_in_tenant(_user_id UUID, _role TEXT, _tenant_id UUID)
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
      AND role::TEXT = _role
      AND tenant_id = _tenant_id
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID, _tenant_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT
  FROM public.user_roles
  WHERE user_id = _user_id
    AND (
      (_tenant_id IS NULL AND tenant_id IS NULL) OR
      (tenant_id = _tenant_id)
    )
  ORDER BY created_at DESC
  LIMIT 1;
$$;

-- 3. Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_user_roles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_roles_updated_at ON public.user_roles;
CREATE TRIGGER user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_roles_updated_at();