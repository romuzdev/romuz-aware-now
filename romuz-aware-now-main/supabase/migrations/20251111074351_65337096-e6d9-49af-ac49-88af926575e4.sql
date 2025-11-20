-- Part 2.2: Gate-H — RLS + RBAC Policies
-- Enable Row Level Security and implement role-based access control

-- ============================================================
-- 1) Enable RLS on all Gate-H tables
-- ============================================================

ALTER TABLE gate_h.action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_h.action_items FORCE ROW LEVEL SECURITY;

ALTER TABLE gate_h.action_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_h.action_updates FORCE ROW LEVEL SECURITY;

ALTER TABLE gate_h.action_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_h.action_links FORCE ROW LEVEL SECURITY;

ALTER TABLE gate_h.action_sla_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_h.action_sla_rules FORCE ROW LEVEL SECURITY;

-- ============================================================
-- 2) RLS Policies for gate_h.action_items
-- ============================================================

-- SELECT: Allow viewers, analysts, owners, and admins to read actions in their tenant
CREATE POLICY "action_items_select_by_tenant_and_roles"
  ON gate_h.action_items
  FOR SELECT
  USING (
    tenant_id = app_current_tenant_id()
    AND (
      app_has_role('awareness_viewer')
      OR app_has_role('awareness_analyst')
      OR app_has_role('awareness_owner')
      OR app_has_role('tenant_admin')
    )
  );

COMMENT ON POLICY "action_items_select_by_tenant_and_roles" ON gate_h.action_items IS 
  'Gate-H action items: Allow read access to all users with awareness roles (viewer, analyst, owner, admin) within their tenant';

-- INSERT: Allow analysts, owners, and admins to create new actions
CREATE POLICY "action_items_insert_by_analyst_or_admin"
  ON gate_h.action_items
  FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant_id()
    AND (
      app_has_role('awareness_analyst')
      OR app_has_role('awareness_owner')
      OR app_has_role('tenant_admin')
    )
  );

COMMENT ON POLICY "action_items_insert_by_analyst_or_admin" ON gate_h.action_items IS 
  'Gate-H action items: Allow analysts, owners, and admins to create new actions in their tenant';

-- UPDATE: Allow owners (when involved), analysts, and admins to update actions
CREATE POLICY "action_items_update_by_owner_analyst_admin"
  ON gate_h.action_items
  FOR UPDATE
  USING (
    tenant_id = app_current_tenant_id()
    AND (
      -- Tenant admin has full control
      app_has_role('tenant_admin')
      -- Analysts can update any action in their tenant
      OR app_has_role('awareness_analyst')
      -- Owners can update actions they are involved in
      OR (
        app_has_role('awareness_owner')
        AND (
          owner_user_id = app_current_user_id()
          OR assignee_user_id = app_current_user_id()
        )
      )
    )
  )
  WITH CHECK (
    tenant_id = app_current_tenant_id()
    AND (
      app_has_role('tenant_admin')
      OR app_has_role('awareness_analyst')
      OR (
        app_has_role('awareness_owner')
        AND (
          owner_user_id = app_current_user_id()
          OR assignee_user_id = app_current_user_id()
        )
      )
    )
  );

COMMENT ON POLICY "action_items_update_by_owner_analyst_admin" ON gate_h.action_items IS 
  'Gate-H action items: Allow admins and analysts to update any action; owners can only update actions they own or are assigned to';

-- DELETE: Only tenant admins can delete actions
CREATE POLICY "action_items_delete_by_admin"
  ON gate_h.action_items
  FOR DELETE
  USING (
    tenant_id = app_current_tenant_id()
    AND app_has_role('tenant_admin')
  );

COMMENT ON POLICY "action_items_delete_by_admin" ON gate_h.action_items IS 
  'Gate-H action items: Only tenant admins can delete actions';

-- ============================================================
-- 3) RLS Policies for gate_h.action_updates
-- ============================================================

-- SELECT: Allow same visibility as parent action_items (viewer/analyst/owner/admin)
CREATE POLICY "action_updates_select_by_tenant_and_roles"
  ON gate_h.action_updates
  FOR SELECT
  USING (
    tenant_id = app_current_tenant_id()
    AND (
      app_has_role('awareness_viewer')
      OR app_has_role('awareness_analyst')
      OR app_has_role('awareness_owner')
      OR app_has_role('tenant_admin')
    )
  );

COMMENT ON POLICY "action_updates_select_by_tenant_and_roles" ON gate_h.action_updates IS 
  'Gate-H action updates: Allow read access to all users with awareness roles within their tenant';

-- INSERT: Allow analysts, owners, and admins to add updates/comments/evidence
CREATE POLICY "action_updates_insert_by_analyst_owner_admin"
  ON gate_h.action_updates
  FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant_id()
    AND (
      app_has_role('awareness_analyst')
      OR app_has_role('awareness_owner')
      OR app_has_role('tenant_admin')
    )
  );

COMMENT ON POLICY "action_updates_insert_by_analyst_owner_admin" ON gate_h.action_updates IS 
  'Gate-H action updates: Allow analysts, owners, and admins to add updates/comments/evidence';

-- DELETE: Only tenant admins can delete updates (append-only log for others)
CREATE POLICY "action_updates_delete_by_admin"
  ON gate_h.action_updates
  FOR DELETE
  USING (
    tenant_id = app_current_tenant_id()
    AND app_has_role('tenant_admin')
  );

COMMENT ON POLICY "action_updates_delete_by_admin" ON gate_h.action_updates IS 
  'Gate-H action updates: Only tenant admins can delete updates (append-only log for others)';

-- ============================================================
-- 4) RLS Policies for gate_h.action_links
-- ============================================================

-- SELECT: Allow viewer/analyst/owner/admin to read links within their tenant
CREATE POLICY "action_links_select_by_tenant_and_roles"
  ON gate_h.action_links
  FOR SELECT
  USING (
    tenant_id = app_current_tenant_id()
    AND (
      app_has_role('awareness_viewer')
      OR app_has_role('awareness_analyst')
      OR app_has_role('awareness_owner')
      OR app_has_role('tenant_admin')
    )
  );

COMMENT ON POLICY "action_links_select_by_tenant_and_roles" ON gate_h.action_links IS 
  'Gate-H action links: Allow read access to all users with awareness roles within their tenant';

-- INSERT: Allow analysts, owners, and admins to create links
CREATE POLICY "action_links_insert_by_analyst_owner_admin"
  ON gate_h.action_links
  FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant_id()
    AND (
      app_has_role('awareness_analyst')
      OR app_has_role('awareness_owner')
      OR app_has_role('tenant_admin')
    )
  );

COMMENT ON POLICY "action_links_insert_by_analyst_owner_admin" ON gate_h.action_links IS 
  'Gate-H action links: Allow analysts, owners, and admins to create external links';

-- DELETE: Allow tenant admins and owners (for actions they own) to delete links
CREATE POLICY "action_links_delete_by_owner_or_admin"
  ON gate_h.action_links
  FOR DELETE
  USING (
    tenant_id = app_current_tenant_id()
    AND (
      -- Tenant admin has full control
      app_has_role('tenant_admin')
      -- Owners can delete links for actions they own or are assigned to
      OR (
        app_has_role('awareness_owner')
        AND EXISTS (
          SELECT 1
          FROM gate_h.action_items ai
          WHERE ai.id = action_id
            AND ai.tenant_id = app_current_tenant_id()
            AND (
              ai.owner_user_id = app_current_user_id()
              OR ai.assignee_user_id = app_current_user_id()
            )
        )
      )
    )
  );

COMMENT ON POLICY "action_links_delete_by_owner_or_admin" ON gate_h.action_links IS 
  'Gate-H action links: Allow tenant admins to delete any link; owners can delete links for actions they own/assigned';

-- ============================================================
-- 5) RLS Policies for gate_h.action_sla_rules
-- ============================================================

-- SELECT: Allow analysts and admins to read SLA rules (viewers and owners don't need this)
CREATE POLICY "action_sla_rules_select_by_analyst_and_admin"
  ON gate_h.action_sla_rules
  FOR SELECT
  USING (
    tenant_id = app_current_tenant_id()
    AND (
      app_has_role('awareness_analyst')
      OR app_has_role('tenant_admin')
    )
  );

COMMENT ON POLICY "action_sla_rules_select_by_analyst_and_admin" ON gate_h.action_sla_rules IS 
  'Gate-H SLA rules: Allow analysts and admins to read SLA rules for their tenant';

-- INSERT/UPDATE/DELETE: Only tenant admins can modify SLA rules
CREATE POLICY "action_sla_rules_write_by_admin_only"
  ON gate_h.action_sla_rules
  FOR ALL
  USING (
    tenant_id = app_current_tenant_id()
    AND app_has_role('tenant_admin')
  )
  WITH CHECK (
    tenant_id = app_current_tenant_id()
    AND app_has_role('tenant_admin')
  );

COMMENT ON POLICY "action_sla_rules_write_by_admin_only" ON gate_h.action_sla_rules IS 
  'Gate-H SLA rules: Only tenant admins can create, update, or delete SLA rules';

-- ============================================================
-- 6) Sanity Check Examples (in comments)
-- ============================================================

/*
  SANITY CHECK EXAMPLES:
  
  === gate_h.action_items ===
  
  1. awareness_viewer in tenant A:
     - SELECT: ✅ Can read all actions in tenant A
     - INSERT: ❌ Denied
     - UPDATE: ❌ Denied
     - DELETE: ❌ Denied
  
  2. awareness_analyst in tenant A:
     - SELECT: ✅ Can read all actions in tenant A
     - INSERT: ✅ Can create new actions in tenant A
     - UPDATE: ✅ Can update any action in tenant A
     - DELETE: ❌ Only admin can delete
  
  3. awareness_owner in tenant A (owns action X, assigned to action Y):
     - SELECT: ✅ Can read all actions in tenant A
     - INSERT: ✅ Can create new actions in tenant A
     - UPDATE: ✅ Can update actions X and Y only
     - DELETE: ❌ Only admin can delete
  
  4. tenant_admin in tenant A:
     - SELECT: ✅ Full read access
     - INSERT: ✅ Full create access
     - UPDATE: ✅ Full update access
     - DELETE: ✅ Full delete access
  
  5. Cross-tenant access:
     - User in tenant A trying to access tenant B data: ❌ ALL operations denied
  
  === gate_h.action_updates ===
  
  - awareness_viewer: READ only
  - awareness_analyst/owner/admin: READ + INSERT
  - Only admin can DELETE (append-only log for others)
  
  === gate_h.action_links ===
  
  - awareness_viewer: READ only
  - awareness_analyst/owner/admin: READ + INSERT
  - admin + owners (for their actions): DELETE
  
  === gate_h.action_sla_rules ===
  
  - awareness_viewer: ❌ No access
  - awareness_owner: ❌ No access
  - awareness_analyst: READ only
  - tenant_admin: Full CRUD access
  
  ALL policies enforce: tenant_id = app_current_tenant_id()
  No cross-tenant access is possible.
*/

-- ============================================================
-- End of Part 2.2: Gate-H RLS + RBAC Policies
-- ============================================================