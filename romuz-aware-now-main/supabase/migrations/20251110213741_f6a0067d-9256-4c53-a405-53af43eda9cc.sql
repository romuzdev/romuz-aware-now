-- ============================================================================
-- Gate-G Storage Access Policies (Part 3.2.C) - CORRECTED
-- ============================================================================

-- Storage Policies for documents bucket
CREATE POLICY "g_documents_select_policy"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'tenant'
  AND (storage.foldername(name))[2] = app_current_tenant_id()::text
  AND (app_has_role('compliance_manager'::text) OR app_has_role('standard_user'::text) OR app_has_role('viewer'::text))
);

CREATE POLICY "g_documents_insert_policy"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'tenant'
  AND (storage.foldername(name))[2] = app_current_tenant_id()::text
  AND (app_has_role('compliance_manager'::text) OR app_has_role('standard_user'::text))
);

CREATE POLICY "g_documents_update_policy"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'tenant'
  AND (storage.foldername(name))[2] = app_current_tenant_id()::text
  AND app_has_role('compliance_manager'::text)
)
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'tenant'
  AND (storage.foldername(name))[2] = app_current_tenant_id()::text
  AND app_has_role('compliance_manager'::text)
);

CREATE POLICY "g_documents_delete_policy"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'tenant'
  AND (storage.foldername(name))[2] = app_current_tenant_id()::text
  AND app_has_role('compliance_manager'::text)
);

-- Storage Policies for attachments bucket
CREATE POLICY "g_attachments_select_policy"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'attachments'
  AND (storage.foldername(name))[1] = 'tenant'
  AND (storage.foldername(name))[2] = app_current_tenant_id()::text
  AND (
    app_has_role('compliance_manager'::text)
    OR ((app_has_role('standard_user'::text) OR app_has_role('viewer'::text)) AND EXISTS (
      SELECT 1 FROM attachments a WHERE a.storage_path = name AND a.is_private = false AND a.tenant_id = app_current_tenant_id()
    ))
    OR EXISTS (
      SELECT 1 FROM attachments a WHERE a.storage_path = name AND a.is_private = true 
      AND a.uploaded_by = app_current_user_id() AND a.tenant_id = app_current_tenant_id()
    )
  )
);

CREATE POLICY "g_attachments_insert_policy"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'attachments'
  AND (storage.foldername(name))[1] = 'tenant'
  AND (storage.foldername(name))[2] = app_current_tenant_id()::text
  AND (app_has_role('compliance_manager'::text) OR app_has_role('standard_user'::text))
);

CREATE POLICY "g_attachments_update_policy"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'attachments'
  AND (storage.foldername(name))[1] = 'tenant'
  AND (storage.foldername(name))[2] = app_current_tenant_id()::text
  AND app_has_role('compliance_manager'::text)
)
WITH CHECK (
  bucket_id = 'attachments'
  AND (storage.foldername(name))[1] = 'tenant'
  AND (storage.foldername(name))[2] = app_current_tenant_id()::text
  AND app_has_role('compliance_manager'::text)
);

CREATE POLICY "g_attachments_delete_policy"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'attachments'
  AND (storage.foldername(name))[1] = 'tenant'
  AND (storage.foldername(name))[2] = app_current_tenant_id()::text
  AND (
    app_has_role('compliance_manager'::text)
    OR EXISTS (
      SELECT 1 FROM attachments a WHERE a.storage_path = name 
      AND a.uploaded_by = app_current_user_id() AND a.tenant_id = app_current_tenant_id()
    )
  )
);