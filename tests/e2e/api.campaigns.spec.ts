import { test, expect } from '@playwright/test';
import { createServiceClient } from '../integration/setup/config';

/**
 * API-Level E2E Tests for Campaigns
 * Tests direct API calls and database operations
 */

test.describe('API: Campaigns CRUD', () => {
  let supabase: ReturnType<typeof createServiceClient>;
  let testTenantId: string;
  let testUserId: string;
  let campaignId: string;

  test.beforeAll(async () => {
    supabase = createServiceClient();
    
    // Create test tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({ name: 'API Test Tenant' })
      .select('id')
      .single();
    
    if (tenantError) throw tenantError;
    testTenantId = tenant.id;

    // Create test user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: `api-test-${Date.now()}@example.com`,
      password: 'test123456',
      email_confirm: true,
    });

    if (authError) throw authError;
    testUserId = authUser.user.id;

    // Link user to tenant
    await supabase
      .from('user_tenants')
      .insert({ user_id: testUserId, tenant_id: testTenantId });
  });

  test.afterAll(async () => {
    // Cleanup
    await supabase.from('awareness_campaigns').delete().eq('tenant_id', testTenantId);
    await supabase.from('user_tenants').delete().eq('tenant_id', testTenantId);
    await supabase.auth.admin.deleteUser(testUserId);
    await supabase.from('tenants').delete().eq('id', testTenantId);
  });

  test('POST /awareness_campaigns - Create campaign', async () => {
    const { data, error } = await supabase
      .from('awareness_campaigns')
      .insert({
        tenant_id: testTenantId,
        name: 'API Test Campaign',
        description: 'Created via API test',
        status: 'draft',
        start_date: '2025-12-01',
        end_date: '2025-12-31',
        owner_name: 'API Tester',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data.name).toBe('API Test Campaign');
    expect(data.status).toBe('draft');
    
    campaignId = data.id;
  });

  test('GET /awareness_campaigns - Read campaigns', async () => {
    const { data, error } = await supabase
      .from('awareness_campaigns')
      .select('*')
      .eq('tenant_id', testTenantId);

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].tenant_id).toBe(testTenantId);
  });

  test('PATCH /awareness_campaigns - Update campaign', async () => {
    const { data, error } = await supabase
      .from('awareness_campaigns')
      .update({ 
        status: 'active',
        description: 'Updated via API test' 
      })
      .eq('id', campaignId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.status).toBe('active');
    expect(data.description).toBe('Updated via API test');
  });

  test('DELETE /awareness_campaigns - Soft delete campaign', async () => {
    const { error } = await supabase
      .from('awareness_campaigns')
      .update({ 
        archived_at: new Date().toISOString(),
        archived_by: testUserId 
      })
      .eq('id', campaignId);

    expect(error).toBeNull();

    // Verify soft delete
    const { data } = await supabase
      .from('awareness_campaigns')
      .select('archived_at')
      .eq('id', campaignId)
      .single();

    expect(data.archived_at).toBeTruthy();
  });
});

test.describe('API: RLS Enforcement', () => {
  let supabase: ReturnType<typeof createServiceClient>;
  let tenant1Id: string;
  let tenant2Id: string;
  let user1Token: string;
  let campaign1Id: string;
  let campaign2Id: string;

  test.beforeAll(async () => {
    supabase = createServiceClient();

    // Create two tenants
    const { data: t1 } = await supabase
      .from('tenants')
      .insert({ name: 'RLS Tenant 1' })
      .select('id')
      .single();
    tenant1Id = t1!.id;

    const { data: t2 } = await supabase
      .from('tenants')
      .insert({ name: 'RLS Tenant 2' })
      .select('id')
      .single();
    tenant2Id = t2!.id;

    // Create user for tenant 1
    const { data: authUser } = await supabase.auth.admin.createUser({
      email: `rls-test-${Date.now()}@example.com`,
      password: 'test123456',
      email_confirm: true,
    });
    const userId = authUser.user.id;

    await supabase
      .from('user_tenants')
      .insert({ user_id: userId, tenant_id: tenant1Id });

    // Get user token
    const { data: session } = await supabase.auth.signInWithPassword({
      email: authUser.user.email!,
      password: 'test123456',
    });
    user1Token = session.session!.access_token;

    // Create campaigns in both tenants
    const { data: c1 } = await supabase
      .from('awareness_campaigns')
      .insert({
        tenant_id: tenant1Id,
        name: 'Tenant 1 Campaign',
        status: 'draft',
      })
      .select('id')
      .single();
    campaign1Id = c1!.id;

    const { data: c2 } = await supabase
      .from('awareness_campaigns')
      .insert({
        tenant_id: tenant2Id,
        name: 'Tenant 2 Campaign',
        status: 'draft',
      })
      .select('id')
      .single();
    campaign2Id = c2!.id;
  });

  test.afterAll(async () => {
    await supabase.from('awareness_campaigns').delete().in('tenant_id', [tenant1Id, tenant2Id]);
    await supabase.from('user_tenants').delete().in('tenant_id', [tenant1Id, tenant2Id]);
    await supabase.from('tenants').delete().in('id', [tenant1Id, tenant2Id]);
  });

  test('User can read own tenant campaigns', async ({ request }) => {
    const response = await request.get(
      `${process.env.E2E_SUPABASE_URL}/rest/v1/awareness_campaigns?id=eq.${campaign1Id}`,
      {
        headers: {
          'Authorization': `Bearer ${user1Token}`,
          'apikey': process.env.E2E_SUPABASE_ANON_KEY!,
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.length).toBe(1);
    expect(data[0].id).toBe(campaign1Id);
  });

  test('User cannot read other tenant campaigns', async ({ request }) => {
    const response = await request.get(
      `${process.env.E2E_SUPABASE_URL}/rest/v1/awareness_campaigns?id=eq.${campaign2Id}`,
      {
        headers: {
          'Authorization': `Bearer ${user1Token}`,
          'apikey': process.env.E2E_SUPABASE_ANON_KEY!,
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.length).toBe(0); // RLS blocks access
  });

  test('User cannot update other tenant campaigns', async ({ request }) => {
    const response = await request.patch(
      `${process.env.E2E_SUPABASE_URL}/rest/v1/awareness_campaigns?id=eq.${campaign2Id}`,
      {
        headers: {
          'Authorization': `Bearer ${user1Token}`,
          'apikey': process.env.E2E_SUPABASE_ANON_KEY!,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        data: { status: 'active' },
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.length).toBe(0); // RLS blocks update
  });
});

test.describe('API: Database Constraints', () => {
  let supabase: ReturnType<typeof createServiceClient>;
  let testTenantId: string;
  let testCampaignId: string;

  test.beforeAll(async () => {
    supabase = createServiceClient();

    const { data: tenant } = await supabase
      .from('tenants')
      .insert({ name: 'Constraints Test Tenant' })
      .select('id')
      .single();
    testTenantId = tenant!.id;

    const { data: campaign } = await supabase
      .from('awareness_campaigns')
      .insert({
        tenant_id: testTenantId,
        name: 'Constraints Test Campaign',
        status: 'draft',
      })
      .select('id')
      .single();
    testCampaignId = campaign!.id;
  });

  test.afterAll(async () => {
    await supabase.from('campaign_participants').delete().eq('campaign_id', testCampaignId);
    await supabase.from('awareness_campaigns').delete().eq('id', testCampaignId);
    await supabase.from('tenants').delete().eq('id', testTenantId);
  });

  test('Unique constraint on participant employee_ref', async () => {
    // Insert first participant
    const { error: error1 } = await supabase
      .from('campaign_participants')
      .insert({
        tenant_id: testTenantId,
        campaign_id: testCampaignId,
        employee_ref: 'EMP001',
        status: 'not_started',
      });

    expect(error1).toBeNull();

    // Try duplicate - should fail
    const { error: error2 } = await supabase
      .from('campaign_participants')
      .insert({
        tenant_id: testTenantId,
        campaign_id: testCampaignId,
        employee_ref: 'EMP001',
        status: 'not_started',
      });

    expect(error2).toBeTruthy();
    expect(error2?.message).toContain('duplicate key value');
  });

  test('Foreign key constraint on campaign_id', async () => {
    const { error } = await supabase
      .from('campaign_participants')
      .insert({
        tenant_id: testTenantId,
        campaign_id: '00000000-0000-0000-0000-000000000000',
        employee_ref: 'EMP999',
        status: 'not_started',
      });

    expect(error).toBeTruthy();
    expect(error?.message).toContain('foreign key');
  });
});
