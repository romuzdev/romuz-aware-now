-- Fix RLS policies to include admin role
DROP POLICY IF EXISTS g_documents_select_policy ON documents;
DROP POLICY IF EXISTS g_documents_insert_policy ON documents;
DROP POLICY IF EXISTS g_documents_update_policy ON documents;
DROP POLICY IF EXISTS g_documents_delete_policy ON documents;

-- Select: admin, compliance_manager, standard_user, viewer can read
CREATE POLICY g_documents_select_policy ON documents
  FOR SELECT
  USING (
    tenant_id = app_current_tenant_id() 
    AND (
      app_has_role('admin') 
      OR app_has_role('compliance_manager') 
      OR app_has_role('standard_user') 
      OR app_has_role('viewer')
    )
  );

-- Insert: admin and compliance_manager can create
CREATE POLICY g_documents_insert_policy ON documents
  FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant_id() 
    AND (app_has_role('admin') OR app_has_role('compliance_manager'))
  );

-- Update: admin and compliance_manager can update
CREATE POLICY g_documents_update_policy ON documents
  FOR UPDATE
  USING (
    tenant_id = app_current_tenant_id() 
    AND (app_has_role('admin') OR app_has_role('compliance_manager'))
  );

-- Delete: admin and compliance_manager can delete
CREATE POLICY g_documents_delete_policy ON documents
  FOR DELETE
  USING (
    tenant_id = app_current_tenant_id() 
    AND (app_has_role('admin') OR app_has_role('compliance_manager'))
  );