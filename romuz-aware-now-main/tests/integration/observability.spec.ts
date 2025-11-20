// ============================================================================
// Gate-E: Integration Tests - Observability RLS & CRUD
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServiceClient, createTestClient } from './setup/config';
import { seedTestData, teardownTestData, SeedData } from '../fixtures/seed';

describe('Observability - RLS & Tenant Isolation', () => {
  let seedData: SeedData;
  const serviceClient = createServiceClient();

  beforeAll(async () => {
    seedData = await seedTestData(serviceClient);
  });

  afterAll(async () => {
    await teardownTestData(serviceClient, seedData);
  });

  describe('alert_channels - Tenant Isolation', () => {
    it('userA can create channel in their tenant', async () => {
      const clientA = createTestClient(seedData.userA.accessToken);

      const { data, error } = await clientA
        .from('alert_channels')
        .insert({
          tenant_id: seedData.tenantA.id,
          type: 'email',
          name: 'Test Channel A',
          config_json: { to: 'test@example.com' },
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.tenant_id).toBe(seedData.tenantA.id);
    });

    it('userA cannot create channel in tenant B', async () => {
      const clientA = createTestClient(seedData.userA.accessToken);

      const { error } = await clientA.from('alert_channels').insert({
        tenant_id: seedData.tenantB.id,
        type: 'email',
        name: 'Malicious Channel',
        config_json: { to: 'test@example.com' },
      });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('row-level security');
    });

    it('userA can view their tenant channels and platform channels', async () => {
      const clientA = createTestClient(seedData.userA.accessToken);

      const { data, error } = await clientA
        .from('alert_channels')
        .select('*')
        .or(`tenant_id.eq.${seedData.tenantA.id},tenant_id.is.null`);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(
        data?.every(
          (c) => c.tenant_id === seedData.tenantA.id || c.tenant_id === null
        )
      ).toBe(true);
    });

    it('userA cannot view tenant B channels', async () => {
      const clientA = createTestClient(seedData.userA.accessToken);

      const { data } = await clientA
        .from('alert_channels')
        .select('*')
        .eq('tenant_id', seedData.tenantB.id);

      expect(data?.length).toBe(0);
    });
  });

  describe('alert_policies - CRUD Operations', () => {
    it('userA can create policy in their tenant', async () => {
      const clientA = createTestClient(seedData.userA.accessToken);

      const { data, error } = await clientA
        .from('alert_policies')
        .insert({
          tenant_id: seedData.tenantA.id,
          name: 'Test Policy A',
          scope: 'campaign',
          metric: 'completion_rate',
          time_window: 'daily',
          operator: '<',
          threshold_value: 50,
          severity: 'warn',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.tenant_id).toBe(seedData.tenantA.id);
      expect(data?.is_enabled).toBe(true); // Default value
    });

    it('userA can update their own policy', async () => {
      const clientA = createTestClient(seedData.userA.accessToken);

      // First create
      const { data: policy } = await clientA
        .from('alert_policies')
        .insert({
          tenant_id: seedData.tenantA.id,
          name: 'Test Policy',
          scope: 'campaign',
          metric: 'completion_rate',
          time_window: 'daily',
          operator: '<',
          threshold_value: 50,
          severity: 'warn',
        })
        .select()
        .single();

      // Then update
      const { data, error } = await clientA
        .from('alert_policies')
        .update({ threshold_value: 60 })
        .eq('id', policy!.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.threshold_value).toBe(60);
    });

    it('userA can delete their own policy', async () => {
      const clientA = createTestClient(seedData.userA.accessToken);

      // First create
      const { data: policy } = await clientA
        .from('alert_policies')
        .insert({
          tenant_id: seedData.tenantA.id,
          name: 'Test Policy',
          scope: 'campaign',
          metric: 'completion_rate',
          time_window: 'daily',
          operator: '<',
          threshold_value: 50,
          severity: 'warn',
        })
        .select()
        .single();

      // Then delete
      const { error } = await clientA
        .from('alert_policies')
        .delete()
        .eq('id', policy!.id);

      expect(error).toBeNull();
    });

    it('userA cannot access tenant B policies', async () => {
      const clientA = createTestClient(seedData.userA.accessToken);

      const { data } = await clientA
        .from('alert_policies')
        .select('*')
        .eq('tenant_id', seedData.tenantB.id);

      expect(data?.length).toBe(0);
    });
  });

  describe('alert_templates - Platform vs Tenant Templates', () => {
    it('userA can view platform templates (tenant_id = null)', async () => {
      const clientA = createTestClient(seedData.userA.accessToken);

      const { data, error } = await clientA
        .from('alert_templates')
        .select('*')
        .is('tenant_id', null);

      expect(error).toBeNull();
      // Platform templates are visible to all tenants
    });

    it('userA can create tenant-specific template', async () => {
      const clientA = createTestClient(seedData.userA.accessToken);

      const { data, error } = await clientA
        .from('alert_templates')
        .insert({
          tenant_id: seedData.tenantA.id,
          code: 'custom_alert',
          locale: 'ar',
          subject_tpl: 'تنبيه: {{metric}}',
          body_tpl: 'القيمة: {{value}}%',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.tenant_id).toBe(seedData.tenantA.id);
    });

    it('userA cannot create template for tenant B', async () => {
      const clientA = createTestClient(seedData.userA.accessToken);

      const { error } = await clientA.from('alert_templates').insert({
        tenant_id: seedData.tenantB.id,
        code: 'malicious_alert',
        locale: 'ar',
        subject_tpl: 'Test',
        body_tpl: 'Test',
      });

      expect(error).not.toBeNull();
    });
  });

  describe('alert_events - Read-Only Access', () => {
    it('userA can view events in their tenant', async () => {
      const clientA = createTestClient(seedData.userA.accessToken);

      const { data, error } = await clientA
        .from('alert_events')
        .select('*')
        .eq('tenant_id', seedData.tenantA.id)
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(
        data?.every((e) => e.tenant_id === seedData.tenantA.id)
      ).toBe(true);
    });

    it('userA cannot view tenant B events', async () => {
      const clientA = createTestClient(seedData.userA.accessToken);

      const { data } = await clientA
        .from('alert_events')
        .select('*')
        .eq('tenant_id', seedData.tenantB.id);

      expect(data?.length).toBe(0);
    });

    it('userA cannot delete alert events', async () => {
      const clientA = createTestClient(seedData.userA.accessToken);

      // Try to delete (should fail - no DELETE policy)
      const { error } = await clientA
        .from('alert_events')
        .delete()
        .eq('tenant_id', seedData.tenantA.id);

      expect(error).not.toBeNull();
    });
  });
});
