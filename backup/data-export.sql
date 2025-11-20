-- ============================================================================
-- Romuz Awareness GRC - Data Export
-- ============================================================================
-- Created: 2025-11-20
-- Source Project: Lovable Cloud (varbgkrfwbgzmkkxpqjg)
-- ============================================================================
-- IMPORTANT: This file contains production data
-- Execute AFTER running migrations-combined.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: TENANTS DATA (55 tenants)
-- ============================================================================

-- Insert tenants (sample - adjust as needed)
INSERT INTO public.tenants (id, name, status, created_at, updated_at) VALUES
  ('976e0f1c-63b4-47d8-b5c3-6d2aa4e78ae5', 'Test Tenant 050', 'ACTIVE', now(), now()),
  ('fae7dcf4-76ae-47c1-9e9e-13947d525351', 'T-SUSPENDED', 'ACTIVE', now(), now()),
  ('7414e810-3375-486a-aa7e-5e80628c1cf5', 'T-FRESH', 'ACTIVE', now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  updated_at = now();

-- ============================================================================
-- SECTION 2: USER DATA NOTES
-- ============================================================================

-- IMPORTANT: Users must be created through Supabase Auth Dashboard or API
-- You cannot directly insert into auth.users table
-- 
-- Current users to recreate:
-- 1. info@primestudio.media (admin role, tenant: 976e0f1c-63b4-47d8-b5c3-6d2aa4e78ae5)
-- 2. info@exposinsider.com (admin role, tenant: 976e0f1c-63b4-47d8-b5c3-6d2aa4e78ae5)
-- 3. romuzdev@gmail.com (admin role, tenant: 976e0f1c-63b4-47d8-b5c3-6d2aa4e78ae5)
-- 4. drtalal46@gmail.com (tenant_admin role, tenant: fae7dcf4-76ae-47c1-9e9e-13947d525351)
-- 5. info@expos.news (NO TENANT - NEEDS ASSIGNMENT)

-- ============================================================================
-- SECTION 3: USER ASSOCIATIONS (After creating users in Auth)
-- ============================================================================

-- NOTE: Replace these UUIDs with actual user IDs after creating users
-- 
-- Example for user 1 (info@primestudio.media):
-- 
-- INSERT INTO public.user_tenants (user_id, tenant_id) VALUES
--   ('4b5dffc9-5ff3-4f30-bba4-24f6cb04f822', '976e0f1c-63b4-47d8-b5c3-6d2aa4e78ae5')
-- ON CONFLICT DO NOTHING;
-- 
-- INSERT INTO public.user_roles (user_id, tenant_id, role) VALUES
--   ('4b5dffc9-5ff3-4f30-bba4-24f6cb04f822', '976e0f1c-63b4-47d8-b5c3-6d2aa4e78ae5', 'admin')
-- ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 4: POLICIES DATA (5 policies)
-- ============================================================================

-- Sample policies - adjust as needed
INSERT INTO public.policies (
  id, tenant_id, policy_code, name_ar, name_en, category, status, version
) VALUES
  (gen_random_uuid(), '976e0f1c-63b4-47d8-b5c3-6d2aa4e78ae5', 'POL001', 'سياسة الخصوصية', 'Privacy Policy', 'security', 'active', 1),
  (gen_random_uuid(), '976e0f1c-63b4-47d8-b5c3-6d2aa4e78ae5', 'POL002', 'سياسة الأمن السيبراني', 'Cybersecurity Policy', 'security', 'active', 1)
ON CONFLICT (tenant_id, policy_code) DO NOTHING;

-- ============================================================================
-- SECTION 5: AWARENESS CAMPAIGNS DATA (10 campaigns)
-- ============================================================================

-- Sample campaigns - adjust as needed
INSERT INTO public.awareness_campaigns (
  id, tenant_id, campaign_code, title_ar, title_en, start_date, end_date, status, created_by
) VALUES
  (gen_random_uuid(), '976e0f1c-63b4-47d8-b5c3-6d2aa4e78ae5', 'CAMP001', 'حملة الأمن السيبراني', 'Cybersecurity Campaign', '2025-01-01', '2025-12-31', 'active', '4b5dffc9-5ff3-4f30-bba4-24f6cb04f822')
ON CONFLICT (tenant_id, campaign_code) DO NOTHING;

-- ============================================================================
-- SECTION 6: MASTER DATA (Catalogs, Terms, Mappings)
-- ============================================================================

-- Sample catalog
INSERT INTO public.ref_catalogs (
  id, tenant_id, code, label_ar, label_en, scope, status, version, created_by
) VALUES
  (gen_random_uuid(), '976e0f1c-63b4-47d8-b5c3-6d2aa4e78ae5', 'RISK_LEVELS', 'مستويات المخاطر', 'Risk Levels', 'TENANT', 'PUBLISHED', 1, '4b5dffc9-5ff3-4f30-bba4-24f6cb04f822')
ON CONFLICT (tenant_id, code, scope) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these after import to verify data
DO $$
DECLARE
  v_tenants INTEGER;
  v_policies INTEGER;
  v_campaigns INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_tenants FROM public.tenants;
  SELECT COUNT(*) INTO v_policies FROM public.policies;
  SELECT COUNT(*) INTO v_campaigns FROM public.awareness_campaigns;
  
  RAISE NOTICE 'Data import verification:';
  RAISE NOTICE '  Tenants: %', v_tenants;
  RAISE NOTICE '  Policies: %', v_policies;
  RAISE NOTICE '  Campaigns: %', v_campaigns;
  
  IF v_tenants >= 3 THEN
    RAISE NOTICE '✅ Tenants imported successfully';
  ELSE
    RAISE WARNING '⚠️ Expected at least 3 tenants, found %', v_tenants;
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- NEXT STEPS
-- ============================================================================

-- 1. Create users through Supabase Auth Dashboard
-- 2. Update user_tenants and user_roles tables with actual user IDs
-- 3. Import remaining data as needed
-- 4. Test RLS policies
-- 5. Verify all functionality

-- ============================================================================
-- END OF DATA EXPORT
-- ============================================================================
