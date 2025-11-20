
-- إنشاء سجلات profiles للمستخدمين الموجودين الذين ليس لديهم ملفات شخصية
INSERT INTO public.profiles (id, full_name, phone, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
  au.raw_user_meta_data->>'phone' as phone,
  now(),
  now()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- إنشاء دالة trigger لإنشاء ملف شخصي تلقائياً عند تسجيل مستخدم جديد
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    now(),
    now()
  );
  RETURN NEW;
END;
$$;

-- إنشاء trigger يعمل عند إنشاء مستخدم جديد
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
