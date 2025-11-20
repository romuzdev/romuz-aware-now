-- Gate-G: Documents Hub v1 - Part 3.2.A (Revised)
-- Storage RLS Policies Setup
-- 
-- NOTE: Storage buckets must be created via Lovable Cloud UI first
-- This migration only creates the RLS policies for storage.objects

-- ============================================================================
-- PREREQUISITE: Create buckets via Cloud UI
-- ============================================================================
-- Before applying this migration, ensure the following buckets exist:
-- 
-- 1. Bucket: 'documents'
--    - Visibility: PRIVATE
--    - File size limit: 50MB
--    - Allowed MIME types: PDF, DOCX, XLSX, PPTX, TXT, CSV, JSON
--
-- 2. Bucket: 'attachments'
--    - Visibility: PRIVATE
--    - File size limit: 20MB
--    - Allowed MIME types: JPEG, PNG, GIF, WEBP, PDF, DOCX, TXT, CSV, ZIP
--
-- To create buckets:
-- 1. Open Lovable Cloud UI
-- 2. Navigate to Storage section
-- 3. Click "New Bucket"
-- 4. Enter bucket name and configure settings
-- ============================================================================


-- ============================================================================
-- 1️⃣ RLS POLICIES: storage.objects for 'documents' bucket
-- ============================================================================

-- Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS "g_storage_documents_select" ON storage.objects;
DROP POLICY IF EXISTS "g_storage_documents_insert" ON storage.objects;
DROP POLICY IF EXISTS "g_storage_documents_update" ON storage.objects;
DROP POLICY IF EXISTS "g_storage_documents_delete" ON storage.objects;

-- SELECT Policy: View document files in own tenant
CREATE POLICY "g_storage_documents_select"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'tenant'
  AND (storage.foldername(name))[2] = app_current_tenant_id()::text
  AND (
    app_has_role('compliance_manager')
    OR app_has_role('standard_user')
    OR app_has_role('viewer')
  )
);

-- INSERT Policy: Upload documents in own tenant
CREATE POLICY "g_storage_documents_insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'tenant'
  AND (storage.foldername(name))[2] = app_current_tenant_id()::text
  AND (
    app_has_role('compliance_manager')
    OR app_has_role('standard_user')
  )
);

-- UPDATE Policy: Update document metadata in own tenant (compliance_manager only)
CREATE POLICY "g_storage_documents_update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'tenant'
  AND (storage.foldername(name))[2] = app_current_tenant_id()::text
  AND app_has_role('compliance_manager')
);

-- DELETE Policy: Delete documents in own tenant (compliance_manager only)
CREATE POLICY "g_storage_documents_delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'tenant'
  AND (storage.foldername(name))[2] = app_current_tenant_id()::text
  AND app_has_role('compliance_manager')
);


-- ============================================================================
-- 2️⃣ RLS POLICIES: storage.objects for 'attachments' bucket
-- ============================================================================

-- Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS "g_storage_attachments_select" ON storage.objects;
DROP POLICY IF EXISTS "g_storage_attachments_insert" ON storage.objects;
DROP POLICY IF EXISTS "g_storage_attachments_update" ON storage.objects;
DROP POLICY IF EXISTS "g_storage_attachments_delete" ON storage.objects;

-- SELECT Policy: View attachments in own tenant
CREATE POLICY "g_storage_attachments_select"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'attachments'
  AND (storage.foldername(name))[1] = 'tenant'
  AND (storage.foldername(name))[2] = app_current_tenant_id()::text
  AND (
    app_has_role('compliance_manager')
    OR app_has_role('standard_user')
    OR app_has_role('viewer')
  )
);

-- INSERT Policy: Upload attachments in own tenant
CREATE POLICY "g_storage_attachments_insert"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'attachments'
  AND (storage.foldername(name))[1] = 'tenant'
  AND (storage.foldername(name))[2] = app_current_tenant_id()::text
  AND (
    app_has_role('compliance_manager')
    OR app_has_role('standard_user')
  )
);

-- UPDATE Policy: Update attachment metadata in own tenant (compliance_manager only)
CREATE POLICY "g_storage_attachments_update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'attachments'
  AND (storage.foldername(name))[1] = 'tenant'
  AND (storage.foldername(name))[2] = app_current_tenant_id()::text
  AND app_has_role('compliance_manager')
);

-- DELETE Policy: Delete attachments in own tenant (compliance_manager only)
CREATE POLICY "g_storage_attachments_delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'attachments'
  AND (storage.foldername(name))[1] = 'tenant'
  AND (storage.foldername(name))[2] = app_current_tenant_id()::text
  AND app_has_role('compliance_manager')
);


-- ============================================================================
-- 3️⃣ FOLDER STRUCTURE DOCUMENTATION
-- ============================================================================
-- 
-- Path conventions for document_versions.storage_path:
-- Pattern: tenant/{tenant_id}/docs/{document_id}/v{version_number}/{filename}
-- Examples:
--   - tenant/6a5b-abc123/docs/3f2c-def456/v1/Policy_v1.pdf
--   - tenant/6a5b-abc123/docs/3f2c-def456/v2/Policy_v2.pdf
--
-- Path conventions for attachments.storage_path:
-- Pattern: tenant/{tenant_id}/attachments/{attachment_id}/{filename}
-- Examples:
--   - tenant/6a5b-abc123/attachments/9d1e-ghi789/image.png
--   - tenant/6a5b-abc123/attachments/7c4f-jkl012/report.pdf
--
-- Benefits:
--   ✅ Multi-tenant isolation via folder structure + RLS
--   ✅ Version tracking for documents
--   ✅ Easy file identification and organization
-- ============================================================================