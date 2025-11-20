import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServiceClient, createTestClient } from './setup/config';
import { seedTestData, teardownTestData, SeedData } from '../fixtures/seed';

describe('RLS - Row Level Security & Tenant Isolation', () => {
  let seedData: SeedData;
  const serviceClient = createServiceClient();

  beforeAll(async () => {
    seedData = await seedTestData(serviceClient);
  });

  afterAll(async () => {
    await teardownTestData(serviceClient, seedData);
  });

  describe('awareness_campaigns - Tenant Isolation', () => {
    it('userA can read own tenant campaigns only', async () => {
      const clientA = createTestClient(seedData.userA.accessToken);

      const { data, error } = await clientA
        .from('awareness_campaigns')
        .select('*')
        .eq('tenant_id', seedData.tenantA.id);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.length).toBeGreaterThan(0);
      expect(data?.every((c) => c.tenant_id === seedData.tenantA.id)).toBe(true);
    });

    it('userA cannot read tenant B campaigns', async () => {
      const clientA = createTestClient(seedData.userA.accessToken);

      const { data, error } = await clientA
        .from('awareness_campaigns')
        .select('*')
        .eq('tenant_id', seedData.tenantB.id);

      // Should return 0 rows or error depending on RLS policy
      expect(data?.length === 0 || error !== null).toBe(true);
    });

    it('userA cannot insert campaign with tenant B id', async () => {
      const clientA = createTestClient(seedData.userA.accessToken);

      const { error } = await clientA.from('awareness_campaigns').insert({
        tenant_id: seedData.tenantB.id, // Wrong tenant
        name: 'Malicious Campaign',
        description: 'Should fail',
        owner_name: 'Hacker',
        status: 'draft',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        created_by: seedData.userA.id,
      });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('row-level security');
    });

    it('userA cannot update tenant B campaigns', async () => {
      const clientA = createTestClient(seedData.userA.accessToken);

      const { error } = await clientA
        .from('awareness_campaigns')
        .update({ name: 'Hacked Name' })
        .eq('id', seedData.campaignsB[0].id);

      expect(error).not.toBeNull();
    });

    it('userA cannot delete tenant B campaigns', async () => {
      const clientA = createTestClient(seedData.userA.accessToken);

      const { error } = await clientA
        .from('awareness_campaigns')
        .delete()
        .eq('id', seedData.campaignsB[0].id);

      expect(error).not.toBeNull();
    });
  });

  describe('campaign_participants - Tenant Isolation', () => {
    it('userA can read own tenant participants only', async () => {
      const clientA = createTestClient(seedData.userA.accessToken);

      const { data, error } = await clientA
        .from('campaign_participants')
        .select('*')
        .eq('tenant_id', seedData.tenantA.id);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.every((p) => p.tenant_id === seedData.tenantA.id)).toBe(true);
    });

    it('userB cannot read tenant A participants', async () => {
      const clientB = createTestClient(seedData.userB.accessToken);

      const { data, error } = await clientB
        .from('campaign_participants')
        .select('*')
        .eq('tenant_id', seedData.tenantA.id);

      expect(data?.length === 0 || error !== null).toBe(true);
    });

    it('userA cannot insert participant for tenant B campaign', async () => {
      const clientA = createTestClient(seedData.userA.accessToken);

      const { error } = await clientA.from('campaign_participants').insert({
        tenant_id: seedData.tenantB.id,
        campaign_id: seedData.campaignsB[0].id,
        employee_ref: 'MALICIOUS-001',
        status: 'not_started',
      });

      expect(error).not.toBeNull();
    });
  });

  describe('saved_views - Tenant & User Isolation', () => {
    it('userA can create saved view for own tenant', async () => {
      const clientA = createTestClient(seedData.userA.accessToken);

      const { data, error } = await clientA
        .from('saved_views')
        .insert({
          tenant_id: seedData.tenantA.id,
          user_id: seedData.userA.id,
          page_key: 'campaigns',
          name: 'Test View A',
          filters: { status: 'active' },
        })
        .select();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.[0].tenant_id).toBe(seedData.tenantA.id);
      expect(data?.[0].user_id).toBe(seedData.userA.id);
    });

    it('userA cannot read userB saved views', async () => {
      // First create a view for userB
      const clientB = createTestClient(seedData.userB.accessToken);
      await clientB.from('saved_views').insert({
        tenant_id: seedData.tenantB.id,
        user_id: seedData.userB.id,
        page_key: 'campaigns',
        name: 'Test View B',
        filters: { status: 'draft' },
      });

      // Try to read as userA
      const clientA = createTestClient(seedData.userA.accessToken);
      const { data, error } = await clientA
        .from('saved_views')
        .select('*')
        .eq('user_id', seedData.userB.id);

      expect(data?.length === 0 || error !== null).toBe(true);
    });
  });

  describe('audit_log - Tenant Isolation', () => {
    it('userA can read own tenant audit logs only', async () => {
      const clientA = createTestClient(seedData.userA.accessToken);

      const { data, error } = await clientA
        .from('audit_log')
        .select('*')
        .eq('tenant_id', seedData.tenantA.id);

      expect(error).toBeNull();
      if (data && data.length > 0) {
        expect(data.every((log) => log.tenant_id === seedData.tenantA.id)).toBe(true);
      }
    });

    it('userB cannot read tenant A audit logs', async () => {
      const clientB = createTestClient(seedData.userB.accessToken);

      const { data, error } = await clientB
        .from('audit_log')
        .select('*')
        .eq('tenant_id', seedData.tenantA.id);

      expect(data?.length === 0 || error !== null).toBe(true);
    });
  });
});
