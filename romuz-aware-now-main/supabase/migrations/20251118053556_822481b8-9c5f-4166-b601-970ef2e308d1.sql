
-- حذف السياسات القديمة غير الصحيحة
DROP POLICY IF EXISTS "Admin users can view their tenant backups" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can upload backups" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can delete their tenant backups" ON storage.objects;

-- إنشاء سياسات جديدة تستخدم جدول user_roles
CREATE POLICY "Authenticated users can upload backups to their tenant folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'backups' 
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text 
    FROM user_tenants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can view backups from their tenant"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'backups' 
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text 
    FROM user_tenants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can delete backups from their tenant"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'backups' 
  AND (storage.foldername(name))[1] IN (
    SELECT tenant_id::text 
    FROM user_tenants 
    WHERE user_id = auth.uid()
  )
);

-- سياسة خاصة لـ platform_admin للوصول لكل النسخ الاحتياطية
CREATE POLICY "Platform admins can access all backups"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'backups' 
  AND EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'platform_admin'
  )
);
