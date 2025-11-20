-- Gate-F: RBAC Integration for Reports
-- Following security guidelines: separate roles table + security definer function

-- 1️⃣ Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'analyst', 'manager', 'viewer');

-- 2️⃣ Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(user_id, role)
);

-- 3️⃣ Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::TEXT = _role
  )
$$;

-- 4️⃣ Create function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS TABLE (role TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- 5️⃣ Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 6️⃣ RLS Policies
-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- Only admins can insert roles (enforced via application logic + RLS)
CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND has_role(auth.uid(), 'admin')
  );

-- Only admins can update roles
CREATE POLICY "Admins can update roles"
  ON public.user_roles
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Only admins can delete roles
CREATE POLICY "Admins can delete roles"
  ON public.user_roles
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- 7️⃣ Create indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- 8️⃣ Comments
COMMENT ON TABLE public.user_roles IS 'Gate-F: User roles for RBAC - separate from users table';
COMMENT ON FUNCTION public.has_role IS 'Gate-F: Security definer function to check if user has specific role';
COMMENT ON FUNCTION public.get_user_roles IS 'Gate-F: Security definer function to get all roles for a user';