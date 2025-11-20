-- =====================================================
-- Seed Test Users for E2E Testing
-- =====================================================
-- This script creates test users for Playwright E2E tests
-- Run this ONCE before running tests for the first time
-- =====================================================

-- Create a test tenant (if not exists)
INSERT INTO public.tenants (id, name, code, status)
VALUES (
  'e2e-test-tenant-001',
  'E2E Test Tenant',
  'E2E_TEST',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 1. Create Admin User
-- =====================================================
-- Note: Supabase Auth handles password hashing automatically
-- This is a placeholder - you need to create users via Supabase Dashboard or Auth API

-- Steps to create via Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. Click "Add User"
-- 3. Email: admin@test.romuz.local
-- 4. Password: TestAdmin123!
-- 5. Confirm email: ✓ (auto-confirm should be enabled)

-- After creating in Auth, link to tenant:
-- INSERT INTO public.user_tenants (user_id, tenant_id, role)
-- SELECT 
--   auth.users.id,
--   'e2e-test-tenant-001',
--   'tenant_admin'
-- FROM auth.users
-- WHERE email = 'admin@test.romuz.local';

-- =====================================================
-- 2. Create Manager User
-- =====================================================
-- Same process:
-- Email: manager@test.romuz.local
-- Password: TestManager123!

-- INSERT INTO public.user_tenants (user_id, tenant_id, role)
-- SELECT 
--   auth.users.id,
--   'e2e-test-tenant-001',
--   'manager'
-- FROM auth.users
-- WHERE email = 'manager@test.romuz.local';

-- =====================================================
-- 3. Create Reader User
-- =====================================================
-- Same process:
-- Email: reader@test.romuz.local
-- Password: TestReader123!

-- INSERT INTO public.user_tenants (user_id, tenant_id, role)
-- SELECT 
--   auth.users.id,
--   'e2e-test-tenant-001',
--   'employee'
-- FROM auth.users
-- WHERE email = 'reader@test.romuz.local';

-- =====================================================
-- 4. Assign Permissions (via RBAC tables)
-- =====================================================
-- Note: This depends on your RBAC implementation
-- Adjust according to your actual permissions tables

-- Admin permissions (campaigns.manage + campaigns.view)
-- Manager permissions (campaigns.manage + campaigns.view)
-- Reader permissions (campaigns.view only)

-- =====================================================
-- Alternative: Edge Function to Create Test Users
-- =====================================================
-- You can create an edge function to automate this:
-- supabase/functions/seed-test-users/index.ts

/*
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const users = [
    { email: 'admin@test.romuz.local', password: 'TestAdmin123!', role: 'tenant_admin' },
    { email: 'manager@test.romuz.local', password: 'TestManager123!', role: 'manager' },
    { email: 'reader@test.romuz.local', password: 'TestReader123!', role: 'employee' },
  ]

  for (const user of users) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    })

    if (error) {
      console.error(`Error creating ${user.email}:`, error)
      continue
    }

    // Link to tenant
    await supabaseAdmin.from('user_tenants').insert({
      user_id: data.user.id,
      tenant_id: 'e2e-test-tenant-001',
      role: user.role,
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
*/

-- =====================================================
-- Quick Reference
-- =====================================================
-- Test Users:
-- 1. admin@test.romuz.local (TestAdmin123!) - tenant_admin
-- 2. manager@test.romuz.local (TestManager123!) - manager
-- 3. reader@test.romuz.local (TestReader123!) - employee
--
-- Tenant: e2e-test-tenant-001
-- =====================================================
