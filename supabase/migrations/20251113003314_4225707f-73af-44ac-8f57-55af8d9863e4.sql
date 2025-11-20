
-- =====================================================
-- Gate-P: Step 2 - Grant super_admin Role and Add RLS Policies (Fixed)
-- =====================================================

-- 1. Assign super_admin role to platform owners
INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('e2d15c9c-7ec5-4ce9-9398-8c6375c211b7'::uuid, 'super_admin'::app_role),
  ('bc32716f-3b0d-413d-9315-0c1b0b468f8f'::uuid, 'super_admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Create RLS Policies for tenants table

-- Policy: Super admins can insert tenants
CREATE POLICY "Super admins can insert tenants"
ON public.tenants
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin')
);

-- Policy: Super admins can update tenants
CREATE POLICY "Super admins can update tenants"
ON public.tenants
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin')
);

-- Policy: Super admins can delete tenants
CREATE POLICY "Super admins can delete tenants"
ON public.tenants
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin')
);

-- 3. Log the super_admin assignments in audit_log
INSERT INTO public.audit_log (
  tenant_id,
  actor,
  entity_type,
  entity_id,
  action,
  payload
)
SELECT 
  ut.tenant_id,
  ur.user_id,
  'user_role',
  ur.id,
  'role_assigned',
  jsonb_build_object(
    'role', 'super_admin',
    'assigned_at', now(),
    'reason', 'Platform owner initialization',
    'granted_by', 'system'
  )
FROM public.user_roles ur
JOIN public.user_tenants ut ON ur.user_id = ut.user_id
WHERE ur.role = 'super_admin'::app_role
  AND NOT EXISTS (
    SELECT 1 FROM public.audit_log al
    WHERE al.actor = ur.user_id 
      AND al.entity_type = 'user_role'
      AND al.action = 'role_assigned'
      AND al.payload->>'role' = 'super_admin'
  );
