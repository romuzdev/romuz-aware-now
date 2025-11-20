-- تحديث سياسة RLS لجدول user_roles لضمان إمكانية قراءة الأدوار

-- حذف السياسة القديمة
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;

-- إنشاء سياسة جديدة للقراءة للمستخدمين المسجلين
CREATE POLICY "Users can view their own roles"
ON user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- التأكد من وجود دالة has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = _role
  );
$$;

-- التأكد من وجود دالة get_user_roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS TABLE(role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.user_roles
  WHERE user_id = _user_id;
$$;