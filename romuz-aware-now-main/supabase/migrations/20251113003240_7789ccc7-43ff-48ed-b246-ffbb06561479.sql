
-- =====================================================
-- Gate-P: Step 1 - Add super_admin to app_role enum
-- =====================================================

-- Add super_admin value to the enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
