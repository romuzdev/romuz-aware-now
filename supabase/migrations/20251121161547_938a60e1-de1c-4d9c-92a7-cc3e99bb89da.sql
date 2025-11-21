-- ============================================================================
-- M18.5 - SecOps Integration: Fix Missing RLS Policies
-- إصلاح سياسات RLS المفقودة لجدول secops_connector_sync_logs
-- ============================================================================

-- Add missing UPDATE policy
CREATE POLICY "connector_sync_logs_tenant_isolation_update"
ON secops_connector_sync_logs FOR UPDATE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

-- Add missing DELETE policy
CREATE POLICY "connector_sync_logs_tenant_isolation_delete"
ON secops_connector_sync_logs FOR DELETE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

COMMENT ON POLICY "connector_sync_logs_tenant_isolation_update" ON secops_connector_sync_logs 
IS 'M18.5 - Allow users to update sync logs in their tenant';

COMMENT ON POLICY "connector_sync_logs_tenant_isolation_delete" ON secops_connector_sync_logs 
IS 'M18.5 - Allow users to delete sync logs in their tenant';