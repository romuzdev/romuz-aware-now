-- Gate-U: Expand app_role enum to support persona-based roles
-- Add new roles for Gate-U personas

-- Add new roles to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'tenant_admin';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'awareness_manager';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'risk_manager';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'compliance_officer';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'hr_manager';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'it_manager';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'executive';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'employee';

-- Note: super_admin already exists in the enum