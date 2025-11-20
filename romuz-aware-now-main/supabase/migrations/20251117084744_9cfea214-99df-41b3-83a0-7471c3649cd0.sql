-- ============================================================
-- CRITICAL SECURITY FIX: Replace hardcoded password with RBAC
-- Remove password-based protection, enforce role-based access
-- Date: 2025-11-17
-- Issue: Hardcoded password 'Romuz@Dev#2025' in useAdminPasswordProtection
-- Solution: RLS policies enforcing platform_admin role
-- ============================================================

-- Add RLS policies for admin_settings table
-- Only platform_admin can read/write admin_settings
CREATE POLICY "platform_admin_read_admin_settings"
ON public.admin_settings
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'platform_admin')
);

CREATE POLICY "platform_admin_write_admin_settings"
ON public.admin_settings
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'platform_admin')
);

CREATE POLICY "platform_admin_update_admin_settings"
ON public.admin_settings
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'platform_admin')
);

CREATE POLICY "platform_admin_delete_admin_settings"
ON public.admin_settings
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'platform_admin')
);

-- Add RLS policies for tenants table (lifecycle management)
-- Only platform_admin can manage tenant lifecycle
CREATE POLICY "platform_admin_manage_tenant_lifecycle"
ON public.tenants
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'platform_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'platform_admin')
);

-- Add RLS policies for system_jobs table
-- Only platform_admin can manage system jobs
CREATE POLICY "platform_admin_read_system_jobs"
ON public.system_jobs
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'platform_admin')
);

CREATE POLICY "platform_admin_write_system_jobs"
ON public.system_jobs
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'platform_admin')
);

CREATE POLICY "platform_admin_update_system_jobs"
ON public.system_jobs
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'platform_admin')
);

CREATE POLICY "platform_admin_delete_system_jobs"
ON public.system_jobs
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'platform_admin')
);

-- Add audit logging comments
COMMENT ON POLICY "platform_admin_read_admin_settings" ON public.admin_settings IS 
  'SECURITY FIX: Only platform_admin role can read admin settings. Replaces hardcoded password (Romuz@Dev#2025).';

COMMENT ON POLICY "platform_admin_manage_tenant_lifecycle" ON public.tenants IS 
  'SECURITY FIX: Only platform_admin role can manage tenant lifecycle. Replaces hardcoded password protection.';

COMMENT ON POLICY "platform_admin_update_system_jobs" ON public.system_jobs IS 
  'SECURITY FIX: Only platform_admin role can manage system jobs. Replaces hardcoded password protection.';