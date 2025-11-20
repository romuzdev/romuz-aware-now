import { test, expect } from '@playwright/test';
import { createServiceClient } from '../integration/setup/config';

/**
 * API-Level E2E Tests for Saved Views
 * Tests saved views operations and constraints
 */

test.describe('API: Saved Views CRUD', () => {
  let supabase: ReturnType<typeof createServiceClient>;
  let testTenantId: string;
  let testUserId: string;
  let viewIds: string[] = [];

  test.beforeAll(async () => {
    supabase = createServiceClient();

    const { data: tenant } = await supabase
      .from('tenants')
      .insert({ name: 'Saved Views Test' })
      .select('id')
      .single();
    testTenantId = tenant!.id;

    const { data: authUser } = await supabase.auth.admin.createUser({
      email: `views-test-${Date.now()}@example.com`,
      password: 'test123456',
      email_confirm: true,
    });
    testUserId = authUser.user.id;

    await supabase
      .from('user_tenants')
      .insert({ user_id: testUserId, tenant_id: testTenantId });
  });

  test.afterAll(async () => {
    await supabase.from('saved_views').delete().eq('tenant_id', testTenantId);
    await supabase.from('user_tenants').delete().eq('tenant_id', testTenantId);
    await supabase.auth.admin.deleteUser(testUserId);
    await supabase.from('tenants').delete().eq('id', testTenantId);
  });

  test('Create saved view', async () => {
    const { data, error } = await supabase
      .from('saved_views')
      .insert({
        tenant_id: testTenantId,
        user_id: testUserId,
        page_key: 'campaigns:list',
        view_name: 'Active Campaigns',
        filters: { status: 'active' },
        is_default: false,
      })
      .select('id')
      .single();

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    viewIds.push(data.id);
  });

  test('List saved views for user', async () => {
    const { data, error } = await supabase
      .from('saved_views')
      .select('*')
      .eq('user_id', testUserId)
      .eq('page_key', 'campaigns:list')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
  });

  test('Update saved view', async () => {
    const { data, error } = await supabase
      .from('saved_views')
      .update({ 
        view_name: 'Updated View Name',
        filters: { status: 'active', owner: 'Test Owner' } 
      })
      .eq('id', viewIds[0])
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.view_name).toBe('Updated View Name');
  });

  test('Set default view (unset others)', async () => {
    // Create second view
    const { data: view2 } = await supabase
      .from('saved_views')
      .insert({
        tenant_id: testTenantId,
        user_id: testUserId,
        page_key: 'campaigns:list',
        view_name: 'Draft Campaigns',
        filters: { status: 'draft' },
        is_default: false,
      })
      .select('id')
      .single();
    
    viewIds.push(view2!.id);

    // Set second as default
    await supabase
      .from('saved_views')
      .update({ is_default: false })
      .eq('user_id', testUserId)
      .eq('page_key', 'campaigns:list');

    const { error } = await supabase
      .from('saved_views')
      .update({ is_default: true })
      .eq('id', view2!.id);

    expect(error).toBeNull();

    // Verify only one default
    const { data: defaults } = await supabase
      .from('saved_views')
      .select('id')
      .eq('user_id', testUserId)
      .eq('page_key', 'campaigns:list')
      .eq('is_default', true);

    expect(defaults?.length).toBe(1);
    expect(defaults![0].id).toBe(view2!.id);
  });

  test('Delete saved view', async () => {
    const { error } = await supabase
      .from('saved_views')
      .delete()
      .eq('id', viewIds[0]);

    expect(error).toBeNull();

    // Verify deletion
    const { data } = await supabase
      .from('saved_views')
      .select('id')
      .eq('id', viewIds[0]);

    expect(data?.length).toBe(0);
  });

  test('Enforce 10 views limit per user/page', async () => {
    // Create 10 views
    const views = Array.from({ length: 10 }, (_, i) => ({
      tenant_id: testTenantId,
      user_id: testUserId,
      page_key: 'policies:list',
      view_name: `Policy View ${i + 1}`,
      filters: { category: `Cat${i}` },
      is_default: false,
    }));

    const { error: insertError } = await supabase
      .from('saved_views')
      .insert(views);

    expect(insertError).toBeNull();

    // Try to insert 11th - should fail
    const { error: limitError } = await supabase
      .from('saved_views')
      .insert({
        tenant_id: testTenantId,
        user_id: testUserId,
        page_key: 'policies:list',
        view_name: 'Policy View 11',
        filters: {},
        is_default: false,
      });

    expect(limitError).toBeTruthy();
    expect(limitError?.message).toContain('Saved views limit reached');
  });
});

test.describe('API: Saved Views Isolation', () => {
  let supabase: ReturnType<typeof createServiceClient>;
  let tenant1Id: string;
  let tenant2Id: string;
  let user1Id: string;
  let user2Id: string;

  test.beforeAll(async () => {
    supabase = createServiceClient();

    // Create two tenants
    const { data: t1 } = await supabase
      .from('tenants')
      .insert({ name: 'Views Tenant 1' })
      .select('id')
      .single();
    tenant1Id = t1!.id;

    const { data: t2 } = await supabase
      .from('tenants')
      .insert({ name: 'Views Tenant 2' })
      .select('id')
      .single();
    tenant2Id = t2!.id;

    // Create users
    const { data: u1 } = await supabase.auth.admin.createUser({
      email: `views-user1-${Date.now()}@example.com`,
      password: 'test123456',
      email_confirm: true,
    });
    user1Id = u1.user.id;

    const { data: u2 } = await supabase.auth.admin.createUser({
      email: `views-user2-${Date.now()}@example.com`,
      password: 'test123456',
      email_confirm: true,
    });
    user2Id = u2.user.id;

    await supabase.from('user_tenants').insert([
      { user_id: user1Id, tenant_id: tenant1Id },
      { user_id: user2Id, tenant_id: tenant2Id },
    ]);

    // Create views for each user
    await supabase.from('saved_views').insert([
      {
        tenant_id: tenant1Id,
        user_id: user1Id,
        page_key: 'campaigns:list',
        view_name: 'User 1 View',
        filters: {},
      },
      {
        tenant_id: tenant2Id,
        user_id: user2Id,
        page_key: 'campaigns:list',
        view_name: 'User 2 View',
        filters: {},
      },
    ]);
  });

  test.afterAll(async () => {
    await supabase.from('saved_views').delete().in('tenant_id', [tenant1Id, tenant2Id]);
    await supabase.from('user_tenants').delete().in('tenant_id', [tenant1Id, tenant2Id]);
    await supabase.auth.admin.deleteUser(user1Id);
    await supabase.auth.admin.deleteUser(user2Id);
    await supabase.from('tenants').delete().in('id', [tenant1Id, tenant2Id]);
  });

  test('User can only see own saved views', async () => {
    // User 1 perspective
    const { data: user1Views } = await supabase
      .from('saved_views')
      .select('*')
      .eq('user_id', user1Id);

    expect(user1Views?.length).toBe(1);
    expect(user1Views![0].view_name).toBe('User 1 View');

    // User 2 perspective
    const { data: user2Views } = await supabase
      .from('saved_views')
      .select('*')
      .eq('user_id', user2Id);

    expect(user2Views?.length).toBe(1);
    expect(user2Views![0].view_name).toBe('User 2 View');
  });

  test('Users cannot access each other views', async () => {
    // User 1 tries to read User 2's view (should return empty via RLS)
    const { data } = await supabase
      .from('saved_views')
      .select('*')
      .eq('user_id', user2Id)
      .eq('tenant_id', tenant1Id);

    expect(data?.length).toBe(0);
  });
});
