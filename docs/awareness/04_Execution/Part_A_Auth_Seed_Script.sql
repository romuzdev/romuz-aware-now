-- ================================================
-- Part D: Dev Seed Data Script
-- Run this ONCE in Supabase SQL Editor after signing up
-- ================================================

-- STEP 1: Replace YOUR_USER_UUID with your actual auth.users.id
-- You can find it by running: SELECT id, email FROM auth.users;

-- STEP 2: Run this script in Supabase SQL Editor

-- 1) Ensure a Dev Tenant exists
INSERT INTO tenants (id, name, is_active)
VALUES ('00000000-0000-0000-0000-000000000000', 'Dev Tenant', true)
ON CONFLICT (id) DO NOTHING;

-- 2) Link your user to Dev Tenant (replace YOUR_USER_UUID)
INSERT INTO user_tenants (user_id, tenant_id, role)
VALUES (
  'YOUR_USER_UUID',  -- <-- REPLACE THIS with your actual user ID
  '00000000-0000-0000-0000-000000000000',
  'admin'
)
ON CONFLICT DO NOTHING;

-- 3) Create sample campaigns
INSERT INTO awareness_campaigns (
  id,
  tenant_id,
  name,
  description,
  status,
  start_date,
  end_date,
  owner_name,
  created_by
) VALUES
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'Q1 Security Awareness Kickoff',
  'Company-wide phishing & password hygiene program.',
  'scheduled',
  '2025-11-15',
  '2025-12-15',
  'Awareness Team',
  'YOUR_USER_UUID'  -- <-- REPLACE THIS
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'Data Privacy Week Campaign',
  'Educate employees on PDPL compliance and data handling best practices.',
  'active',
  '2025-11-01',
  '2025-11-30',
  'Compliance Team',
  'YOUR_USER_UUID'  -- <-- REPLACE THIS
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'Ransomware Defense Training',
  'Interactive training sessions on preventing and responding to ransomware attacks.',
  'draft',
  NULL,
  NULL,
  'Security Operations',
  'YOUR_USER_UUID'  -- <-- REPLACE THIS
);

-- ================================================
-- VERIFICATION QUERIES (run these to check)
-- ================================================

-- Check your user ID:
-- SELECT id, email FROM auth.users;

-- Check tenant membership:
-- SELECT * FROM user_tenants WHERE user_id = 'YOUR_USER_UUID';

-- Check campaigns:
-- SELECT id, name, status FROM awareness_campaigns 
-- WHERE tenant_id = '00000000-0000-0000-0000-000000000000';
