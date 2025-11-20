-- Gate-G: Documents Hub v1 - Part 3.1.C
-- RLS Policies for attachments + _gate_g_rls_intentions update
-- 
-- This migration completes Phase 3.1 by:
-- 1. Creating 4 RLS policies for attachments (SELECT, INSERT, UPDATE, DELETE)
-- 2. Updating _gate_g_rls_intentions to mark policies as implemented
-- 3. Ready for sanity check validation

-- ============================================================================
-- 1️⃣ DROP any existing conflicting policies (idempotent migration)
-- ============================================================================
DROP POLICY IF EXISTS g_attachments_select_policy ON public.attachments;
DROP POLICY IF EXISTS g_attachments_insert_policy ON public.attachments;
DROP POLICY IF EXISTS g_attachments_update_policy ON public.attachments;
DROP POLICY IF EXISTS g_attachments_delete_policy ON public.attachments;


-- ============================================================================
-- 2️⃣ CREATE POLICY: SELECT on attachments
-- ============================================================================
CREATE POLICY g_attachments_select_policy
ON public.attachments
FOR SELECT
USING (
  -- ✅ Tenant isolation (mandatory)
  tenant_id = app_current_tenant_id()
  
  AND (
    -- 🔓 Public attachments: viewable by any tenant member with valid role
    (
      is_private = false
      AND (
        app_has_role('compliance_manager')
        OR app_has_role('standard_user')
        OR app_has_role('viewer')
      )
    )
    
    OR
    
    -- 🔒 Private attachments: only compliance_manager or uploader
    (
      is_private = true
      AND (
        app_has_role('compliance_manager')
        OR uploaded_by = app_current_user_id()
      )
    )
  )
);

COMMENT ON POLICY g_attachments_select_policy ON public.attachments IS
'Gate-G: Attachments read access with tenant isolation + is_private flag enforcement.
Public attachments (is_private=false): visible to compliance_manager, standard_user, viewer.
Private attachments (is_private=true): visible only to compliance_manager or uploader.
Implements: _gate_g_rls_intentions row for attachments SELECT.';


-- ============================================================================
-- 3️⃣ CREATE POLICY: INSERT on attachments
-- ============================================================================
CREATE POLICY g_attachments_insert_policy
ON public.attachments
FOR INSERT
WITH CHECK (
  -- ✅ Tenant isolation
  tenant_id = app_current_tenant_id()
  
  -- ✅ Role check: only compliance_manager and standard_user can upload
  AND (
    app_has_role('compliance_manager')
    OR app_has_role('standard_user')
  )
  
  -- ✅ Ownership: uploaded_by must match current user
  AND uploaded_by = app_current_user_id()
);

COMMENT ON POLICY g_attachments_insert_policy ON public.attachments IS
'Gate-G: Attachments upload restricted to compliance_manager and standard_user.
Enforces: tenant isolation, uploaded_by = current user.
Implements: _gate_g_rls_intentions row for attachments INSERT.';


-- ============================================================================
-- 4️⃣ CREATE POLICY: UPDATE on attachments
-- ============================================================================
CREATE POLICY g_attachments_update_policy
ON public.attachments
FOR UPDATE
USING (
  -- ✅ Tenant isolation
  tenant_id = app_current_tenant_id()
  
  -- ✅ Role check: only compliance_manager can update attachments
  AND app_has_role('compliance_manager')
)
WITH CHECK (
  -- ✅ Ensure updated row still belongs to tenant
  tenant_id = app_current_tenant_id()
  
  -- ✅ Maintain role restriction
  AND app_has_role('compliance_manager')
);

COMMENT ON POLICY g_attachments_update_policy ON public.attachments IS
'Gate-G: Attachments update restricted to compliance_manager only.
Conservative approach: only compliance team can modify attachment metadata.
Implements: _gate_g_rls_intentions row for attachments UPDATE.';


-- ============================================================================
-- 5️⃣ CREATE POLICY: DELETE on attachments
-- ============================================================================
CREATE POLICY g_attachments_delete_policy
ON public.attachments
FOR DELETE
USING (
  -- ✅ Tenant isolation
  tenant_id = app_current_tenant_id()
  
  -- ✅ Role check: only compliance_manager can delete
  AND app_has_role('compliance_manager')
);

COMMENT ON POLICY g_attachments_delete_policy ON public.attachments IS
'Gate-G: Attachments deletion restricted to compliance_manager only.
Prevents accidental data loss by limiting delete permissions.
Implements: _gate_g_rls_intentions row for attachments DELETE.';


-- ============================================================================
-- 6️⃣ Update _gate_g_rls_intentions: Mark attachments policies as implemented
-- ============================================================================
-- Note: Assuming _gate_g_rls_intentions has columns for tracking implementation status
-- If this table structure differs, adjust accordingly

UPDATE public._gate_g_rls_intentions
SET notes = 'IMPLEMENTED ✅ via g_attachments_select_policy'
WHERE table_name = 'attachments' 
  AND policy_intent LIKE '%SELECT%';

UPDATE public._gate_g_rls_intentions
SET notes = 'IMPLEMENTED ✅ via g_attachments_insert_policy'
WHERE table_name = 'attachments' 
  AND policy_intent LIKE '%INSERT%';

UPDATE public._gate_g_rls_intentions
SET notes = 'IMPLEMENTED ✅ via g_attachments_update_policy'
WHERE table_name = 'attachments' 
  AND policy_intent LIKE '%UPDATE%';

UPDATE public._gate_g_rls_intentions
SET notes = 'IMPLEMENTED ✅ via g_attachments_delete_policy'
WHERE table_name = 'attachments' 
  AND policy_intent LIKE '%DELETE%';


-- ============================================================================
-- 7️⃣ Sanity Check Queries (for verification — not executed by migration)
-- ============================================================================
-- After migration, run these to verify:

-- Check RLS status:
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE tablename IN ('documents', 'document_versions', 'attachments')
--   AND schemaname = 'public';

-- Check policy coverage:
-- SELECT tablename, policyname, cmd 
-- FROM pg_policies 
-- WHERE tablename IN ('documents', 'document_versions', 'attachments')
--   AND schemaname = 'public'
-- ORDER BY tablename, cmd;

-- Verify helper functions usage in policies:
-- SELECT policyname, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
--   AND tablename = 'attachments';