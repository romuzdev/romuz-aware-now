-- ============================================================================
-- Fix backup_schedules RLS policy for INSERT
-- Issue: Platform admins and tenant admins cannot create schedules
-- ============================================================================

-- Drop existing INSERT policy
DROP POLICY IF EXISTS backup_schedules_admin_create ON backup_schedules;

-- Create new INSERT policy that allows:
-- 1. platform_admin: can create schedules for any tenant
-- 2. tenant_admin: can only create schedules for their tenant
CREATE POLICY backup_schedules_admin_create 
ON backup_schedules
FOR INSERT
TO authenticated
WITH CHECK (
  -- Platform admin can create for any tenant
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'platform_admin'
  )
  OR
  -- Tenant admin can only create for their tenant
  (
    tenant_id IN (
      SELECT ut.tenant_id
      FROM user_tenants ut
      JOIN user_roles ur ON ut.user_id = ur.user_id
      WHERE ut.user_id = auth.uid()
      AND ur.role = 'tenant_admin'
      AND ur.tenant_id = ut.tenant_id
    )
  )
);