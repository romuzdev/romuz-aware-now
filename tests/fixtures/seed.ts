import { SupabaseClient } from '@supabase/supabase-js';

export interface TestTenant {
  id: string;
  name: string;
}

export interface TestUser {
  id: string;
  email: string;
  tenantId: string;
  accessToken: string;
}

export interface TestCampaign {
  id: string;
  tenantId: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface TestParticipant {
  id: string;
  tenantId: string;
  campaignId: string;
  employeeRef: string;
  status: string;
  completedAt: string | null;
  score: number | null;
}

export interface SeedData {
  tenantA: TestTenant;
  tenantB: TestTenant;
  userA: TestUser;
  userB: TestUser;
  campaignsA: TestCampaign[];
  campaignsB: TestCampaign[];
  participantsA: TestParticipant[];
  participantsB: TestParticipant[];
}

/**
 * Seed test database with two tenants, users, campaigns, and participants
 */
export async function seedTestData(supabase: SupabaseClient): Promise<SeedData> {
  // Create tenants
  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .insert([
      { name: 'Test Tenant A', domain: 'tenant-a-test.local', is_active: true },
      { name: 'Test Tenant B', domain: 'tenant-b-test.local', is_active: true },
    ])
    .select();

  if (tenantsError) throw new Error(`Failed to seed tenants: ${tenantsError.message}`);
  if (!tenants || tenants.length < 2) throw new Error('Failed to create tenants');

  const tenantA = tenants[0];
  const tenantB = tenants[1];

  // Create users via Supabase Auth
  const userAEmail = `user-a-${Date.now()}@test.local`;
  const userBEmail = `user-b-${Date.now()}@test.local`;

  const { data: authUserA, error: authErrorA } = await supabase.auth.admin.createUser({
    email: userAEmail,
    password: 'TestPass123!',
    email_confirm: true,
  });

  const { data: authUserB, error: authErrorB } = await supabase.auth.admin.createUser({
    email: userBEmail,
    password: 'TestPass123!',
    email_confirm: true,
  });

  if (authErrorA || !authUserA.user) throw new Error(`Failed to create userA: ${authErrorA?.message}`);
  if (authErrorB || !authUserB.user) throw new Error(`Failed to create userB: ${authErrorB?.message}`);

  // Map users to tenants
  await supabase.from('user_tenants').insert([
    { user_id: authUserA.user.id, tenant_id: tenantA.id, role: 'admin' },
    { user_id: authUserB.user.id, tenant_id: tenantB.id, role: 'admin' },
  ]);

  // Generate access tokens
  const { data: sessionA } = await supabase.auth.signInWithPassword({
    email: userAEmail,
    password: 'TestPass123!',
  });

  const { data: sessionB } = await supabase.auth.signInWithPassword({
    email: userBEmail,
    password: 'TestPass123!',
  });

  if (!sessionA?.session?.access_token || !sessionB?.session?.access_token) {
    throw new Error('Failed to get access tokens');
  }

  const userA: TestUser = {
    id: authUserA.user.id,
    email: userAEmail,
    tenantId: tenantA.id,
    accessToken: sessionA.session.access_token,
  };

  const userB: TestUser = {
    id: authUserB.user.id,
    email: userBEmail,
    tenantId: tenantB.id,
    accessToken: sessionB.session.access_token,
  };

  // Create campaigns
  const now = new Date();
  const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days ago
  const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days future

  const { data: campaigns, error: campaignsError } = await supabase
    .from('awareness_campaigns')
    .insert([
      {
        tenant_id: tenantA.id,
        name: 'Campaign A1',
        description: 'Test campaign A1',
        owner_name: 'Owner A',
        status: 'active',
        start_date: startDate,
        end_date: endDate,
        created_by: userA.id,
      },
      {
        tenant_id: tenantA.id,
        name: 'Campaign A2',
        description: 'Test campaign A2',
        owner_name: 'Owner A',
        status: 'draft',
        start_date: startDate,
        end_date: endDate,
        created_by: userA.id,
      },
      {
        tenant_id: tenantB.id,
        name: 'Campaign B1',
        description: 'Test campaign B1',
        owner_name: 'Owner B',
        status: 'active',
        start_date: startDate,
        end_date: endDate,
        created_by: userB.id,
      },
      {
        tenant_id: tenantB.id,
        name: 'Campaign B2',
        description: 'Test campaign B2',
        owner_name: 'Owner B',
        status: 'active',
        start_date: startDate,
        end_date: endDate,
        created_by: userB.id,
      },
    ])
    .select();

  if (campaignsError) throw new Error(`Failed to seed campaigns: ${campaignsError.message}`);
  if (!campaigns || campaigns.length < 4) throw new Error('Failed to create campaigns');

  const campaignsA = campaigns.slice(0, 2);
  const campaignsB = campaigns.slice(2, 4);

  // Create participants with varying statuses
  const { data: participants, error: participantsError } = await supabase
    .from('campaign_participants')
    .insert([
      // Tenant A, Campaign A1
      {
        tenant_id: tenantA.id,
        campaign_id: campaignsA[0].id,
        employee_ref: 'EMP-A-001',
        status: 'completed',
        completed_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        score: 85,
      },
      {
        tenant_id: tenantA.id,
        campaign_id: campaignsA[0].id,
        employee_ref: 'EMP-A-002',
        status: 'in_progress',
        completed_at: null,
        score: null,
      },
      {
        tenant_id: tenantA.id,
        campaign_id: campaignsA[0].id,
        employee_ref: 'EMP-A-003',
        status: 'not_started',
        completed_at: null,
        score: null,
      },
      // Tenant A, Campaign A2
      {
        tenant_id: tenantA.id,
        campaign_id: campaignsA[1].id,
        employee_ref: 'EMP-A-004',
        status: 'completed',
        completed_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        score: 92,
      },
      // Tenant B, Campaign B1
      {
        tenant_id: tenantB.id,
        campaign_id: campaignsB[0].id,
        employee_ref: 'EMP-B-001',
        status: 'completed',
        completed_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        score: 78,
      },
      {
        tenant_id: tenantB.id,
        campaign_id: campaignsB[0].id,
        employee_ref: 'EMP-B-002',
        status: 'not_started',
        completed_at: null,
        score: null,
      },
    ])
    .select();

  if (participantsError) throw new Error(`Failed to seed participants: ${participantsError.message}`);
  if (!participants) throw new Error('Failed to create participants');

  const participantsA = participants.filter((p) => p.tenant_id === tenantA.id);
  const participantsB = participants.filter((p) => p.tenant_id === tenantB.id);

  console.log('✅ Test data seeded successfully');
  console.log(`  - Tenants: ${tenants.length}`);
  console.log(`  - Users: 2 (userA, userB)`);
  console.log(`  - Campaigns: ${campaigns.length} (${campaignsA.length} tenant A, ${campaignsB.length} tenant B)`);
  console.log(`  - Participants: ${participants.length} (${participantsA.length} tenant A, ${participantsB.length} tenant B)`);

  return {
    tenantA,
    tenantB,
    userA,
    userB,
    campaignsA,
    campaignsB,
    participantsA,
    participantsB,
  };
}

/**
 * Clean up test data
 */
export async function teardownTestData(supabase: SupabaseClient, seedData: SeedData): Promise<void> {
  // Delete in reverse order of dependencies
  await supabase.from('campaign_participants').delete().in('tenant_id', [seedData.tenantA.id, seedData.tenantB.id]);
  await supabase.from('awareness_campaigns').delete().in('tenant_id', [seedData.tenantA.id, seedData.tenantB.id]);
  await supabase.from('saved_views').delete().in('tenant_id', [seedData.tenantA.id, seedData.tenantB.id]);
  await supabase.from('audit_log').delete().in('tenant_id', [seedData.tenantA.id, seedData.tenantB.id]);
  await supabase.from('user_tenants').delete().in('tenant_id', [seedData.tenantA.id, seedData.tenantB.id]);

  // Delete auth users
  await supabase.auth.admin.deleteUser(seedData.userA.id);
  await supabase.auth.admin.deleteUser(seedData.userB.id);

  // Delete tenants
  await supabase.from('tenants').delete().in('id', [seedData.tenantA.id, seedData.tenantB.id]);

  console.log('✅ Test data cleaned up');
}
