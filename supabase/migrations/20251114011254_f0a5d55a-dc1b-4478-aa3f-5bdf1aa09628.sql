
-- Add new role values to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'platform_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'platform_support';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tenant_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tenant_employee';

-- Note: 'tenant_admin' already exists in the old enum
