-- ============================================================================
-- Gate-G RLS Policies for Documents Tables (Part 3.2.C - SECURITY FIX)
-- ============================================================================

-- Enable RLS on documents table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Enable RLS on document_versions table
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for documents table
-- ============================================================================

-- SELECT: compliance_manager, standard_user, viewer can read documents in their tenant
CREATE POLICY "g_documents_select_policy"
ON public.documents FOR SELECT TO authenticated
USING (
  tenant_id = app_current_tenant_id()
  AND (
    app_has_role('compliance_manager'::text) 
    OR app_has_role('standard_user'::text) 
    OR app_has_role('viewer'::text)
  )
);

-- INSERT: compliance_manager, standard_user can create documents in their tenant
CREATE POLICY "g_documents_insert_policy"
ON public.documents FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = app_current_tenant_id()
  AND (app_has_role('compliance_manager'::text) OR app_has_role('standard_user'::text))
  AND created_by = app_current_user_id()
);

-- UPDATE: compliance_manager can update documents in their tenant
CREATE POLICY "g_documents_update_policy"
ON public.documents FOR UPDATE TO authenticated
USING (
  tenant_id = app_current_tenant_id()
  AND app_has_role('compliance_manager'::text)
)
WITH CHECK (
  tenant_id = app_current_tenant_id()
  AND app_has_role('compliance_manager'::text)
);

-- DELETE: compliance_manager can delete documents in their tenant
CREATE POLICY "g_documents_delete_policy"
ON public.documents FOR DELETE TO authenticated
USING (
  tenant_id = app_current_tenant_id()
  AND app_has_role('compliance_manager'::text)
);

-- ============================================================================
-- RLS Policies for document_versions table
-- ============================================================================

-- SELECT: compliance_manager, standard_user, viewer can read versions in their tenant
CREATE POLICY "g_document_versions_select_policy"
ON public.document_versions FOR SELECT TO authenticated
USING (
  tenant_id = app_current_tenant_id()
  AND (
    app_has_role('compliance_manager'::text) 
    OR app_has_role('standard_user'::text) 
    OR app_has_role('viewer'::text)
  )
);

-- INSERT: compliance_manager, standard_user can create versions in their tenant
CREATE POLICY "g_document_versions_insert_policy"
ON public.document_versions FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = app_current_tenant_id()
  AND (app_has_role('compliance_manager'::text) OR app_has_role('standard_user'::text))
  AND uploaded_by = app_current_user_id()
);

-- UPDATE: compliance_manager can update versions in their tenant
CREATE POLICY "g_document_versions_update_policy"
ON public.document_versions FOR UPDATE TO authenticated
USING (
  tenant_id = app_current_tenant_id()
  AND app_has_role('compliance_manager'::text)
)
WITH CHECK (
  tenant_id = app_current_tenant_id()
  AND app_has_role('compliance_manager'::text)
);

-- DELETE: compliance_manager can delete versions in their tenant
CREATE POLICY "g_document_versions_delete_policy"
ON public.document_versions FOR DELETE TO authenticated
USING (
  tenant_id = app_current_tenant_id()
  AND app_has_role('compliance_manager'::text)
);