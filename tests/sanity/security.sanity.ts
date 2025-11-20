/**
 * Security Sanity Checks
 * Verifies RBAC and RLS enforcement across critical pages
 */

import { createServiceClient, createTestClient } from '../integration/setup/config';

type CheckResult = {
  name: string;
  passed: boolean;
  message: string;
};

const results: CheckResult[] = [];

function addResult(name: string, passed: boolean, message: string) {
  results.push({ name, passed, message });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
}

async function checkRBACViewPermission() {
  const supabase = createServiceClient();
  
  // Create test user without any permissions
  const { data: authUser } = await supabase.auth.admin.createUser({
    email: `sanity-view-${Date.now()}@test.com`,
    password: 'test123456',
    email_confirm: true,
  });

  const userId = authUser.user.id;

  // Create tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .insert({ name: 'Sanity Test Tenant' })
    .select('id')
    .single();
  
  const tenantId = tenant!.id;

  // Link user to tenant
  await supabase
    .from('user_tenants')
    .insert({ user_id: userId, tenant_id: tenantId });

  // Get user token
  const { data: session } = await supabase.auth.signInWithPassword({
    email: authUser.user.email!,
    password: 'test123456',
  });

  const userClient = createTestClient(session.session!.access_token);

  // Try to view campaigns (should succeed with campaigns.view)
  const { data, error } = await userClient
    .from('awareness_campaigns')
    .select('id')
    .limit(1);

  // Cleanup
  await supabase.from('user_tenants').delete().eq('user_id', userId);
  await supabase.auth.admin.deleteUser(userId);
  await supabase.from('tenants').delete().eq('id', tenantId);

  const passed = !error;
  addResult(
    'RBAC: View Permission',
    passed,
    passed ? 'Users can view campaigns in their tenant' : `Failed: ${error?.message}`
  );
}

async function checkRBACManagePermission() {
  const supabase = createServiceClient();
  
  // Create test user
  const { data: authUser } = await supabase.auth.admin.createUser({
    email: `sanity-manage-${Date.now()}@test.com`,
    password: 'test123456',
    email_confirm: true,
  });

  const userId = authUser.user.id;

  // Create tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .insert({ name: 'Sanity Manage Tenant' })
    .select('id')
    .single();
  
  const tenantId = tenant!.id;

  await supabase
    .from('user_tenants')
    .insert({ user_id: userId, tenant_id: tenantId });

  const { data: session } = await supabase.auth.signInWithPassword({
    email: authUser.user.email!,
    password: 'test123456',
  });

  const userClient = createTestClient(session.session!.access_token);

  // Try to create campaign (should succeed with campaigns.manage)
  const { data, error } = await userClient
    .from('awareness_campaigns')
    .insert({
      tenant_id: tenantId,
      name: 'Sanity Test Campaign',
      status: 'draft',
      start_date: '2025-12-01',
      end_date: '2025-12-31',
      created_by: userId,
    })
    .select('id')
    .single();

  // Cleanup
  if (data) {
    await supabase.from('awareness_campaigns').delete().eq('id', data.id);
  }
  await supabase.from('user_tenants').delete().eq('user_id', userId);
  await supabase.auth.admin.deleteUser(userId);
  await supabase.from('tenants').delete().eq('id', tenantId);

  const passed = !error;
  addResult(
    'RBAC: Manage Permission',
    passed,
    passed ? 'Users can manage campaigns in their tenant' : `Failed: ${error?.message}`
  );
}

async function checkRLSTenantIsolation() {
  const supabase = createServiceClient();
  
  // Create two tenants
  const { data: t1 } = await supabase
    .from('tenants')
    .insert({ name: 'RLS Tenant 1' })
    .select('id')
    .single();
  
  const { data: t2 } = await supabase
    .from('tenants')
    .insert({ name: 'RLS Tenant 2' })
    .select('id')
    .single();

  const tenant1Id = t1!.id;
  const tenant2Id = t2!.id;

  // Create user for tenant 1
  const { data: authUser } = await supabase.auth.admin.createUser({
    email: `sanity-rls-${Date.now()}@test.com`,
    password: 'test123456',
    email_confirm: true,
  });

  const userId = authUser.user.id;

  await supabase
    .from('user_tenants')
    .insert({ user_id: userId, tenant_id: tenant1Id });

  // Create campaign in tenant 2
  const { data: campaign } = await supabase
    .from('awareness_campaigns')
    .insert({
      tenant_id: tenant2Id,
      name: 'Tenant 2 Campaign',
      status: 'draft',
      start_date: '2025-12-01',
      end_date: '2025-12-31',
    })
    .select('id')
    .single();

  const { data: session } = await supabase.auth.signInWithPassword({
    email: authUser.user.email!,
    password: 'test123456',
  });

  const userClient = createTestClient(session.session!.access_token);

  // Try to access tenant 2 campaign (should fail)
  const { data: accessData, error: accessError } = await userClient
    .from('awareness_campaigns')
    .select('*')
    .eq('id', campaign!.id);

  // Try to write to tenant 2 (should fail)
  const { error: writeError } = await userClient
    .from('awareness_campaigns')
    .update({ status: 'active' })
    .eq('id', campaign!.id);

  // Cleanup
  await supabase.from('awareness_campaigns').delete().eq('id', campaign!.id);
  await supabase.from('user_tenants').delete().eq('user_id', userId);
  await supabase.auth.admin.deleteUser(userId);
  await supabase.from('tenants').delete().in('id', [tenant1Id, tenant2Id]);

  const passed = (accessData?.length === 0) && (writeError !== null);
  addResult(
    'RLS: Tenant Isolation',
    passed,
    passed 
      ? 'Cross-tenant access blocked by RLS' 
      : 'RLS failed to block cross-tenant access'
  );
}

async function runSecuritySanityChecks() {
  console.log('\n🔒 Security Sanity Checks\n');
  console.log('═'.repeat(50));

  try {
    await checkRBACViewPermission();
    await checkRBACManagePermission();
    await checkRLSTenantIsolation();
  } catch (error) {
    console.error('❌ Error running security checks:', error);
  }

  console.log('═'.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`\n📊 Results: ${passed}/${total} checks passed`);
  
  if (passed < total) {
    console.log('\n⚠️  Some security checks failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All security checks passed!');
  }
}

// Run if executed directly
if (require.main === module) {
  runSecuritySanityChecks();
}

export { runSecuritySanityChecks };
