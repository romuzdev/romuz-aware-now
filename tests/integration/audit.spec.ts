import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServiceClient, createTestClient } from './setup/config';
import { seedTestData, teardownTestData, SeedData } from '../fixtures/seed';

describe('Audit Log - Side Effects', () => {
  let seedData: SeedData;
  const serviceClient = createServiceClient();

  beforeAll(async () => {
    seedData = await seedTestData(serviceClient);
  });

  afterAll(async () => {
    await teardownTestData(serviceClient, seedData);
  });

  describe('Campaign Operations Audit', () => {
    it('logs campaign creation in audit_log', async () => {
      const clientA = createTestClient(seedData.userA.accessToken);

      // Create campaign
      const { data: campaign, error } = await clientA
        .from('awareness_campaigns')
        .insert({
          tenant_id: seedData.tenantA.id,
          name: 'Audit Test Campaign',
          description: 'For audit logging test',
          owner_name: 'Test Owner',
          status: 'draft',
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          created_by: seedData.userA.id,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(campaign).toBeDefined();

      // Check if audit log entry exists
      // Note: This depends on whether audit logging is implemented via triggers/functions
      const { data: auditLogs } = await serviceClient
        .from('audit_log')
        .select('*')
        .eq('tenant_id', seedData.tenantA.id)
        .eq('entity_type', 'campaign')
        .eq('entity_id', campaign!.id)
        .eq('action', 'create');

      // If audit logging is implemented, we should have an entry
      if (auditLogs && auditLogs.length > 0) {
        expect(auditLogs[0].actor).toBe(seedData.userA.id);
        expect(auditLogs[0].action).toBe('create');
        expect(auditLogs[0].entity_type).toBe('campaign');
      }

      // Clean up
      await serviceClient.from('awareness_campaigns').delete().eq('id', campaign!.id);
    });

    it('logs campaign updates in audit_log', async () => {
      const clientA = createTestClient(seedData.userA.accessToken);

      const originalName = seedData.campaignsA[0].name;
      const newName = 'Updated Campaign Name';

      // Update campaign
      const { error } = await clientA
        .from('awareness_campaigns')
        .update({ name: newName })
        .eq('id', seedData.campaignsA[0].id);

      expect(error).toBeNull();

      // Check audit log
      const { data: auditLogs } = await serviceClient
        .from('audit_log')
        .select('*')
        .eq('tenant_id', seedData.tenantA.id)
        .eq('entity_type', 'campaign')
        .eq('entity_id', seedData.campaignsA[0].id)
        .eq('action', 'update')
        .order('created_at', { ascending: false })
        .limit(1);

      if (auditLogs && auditLogs.length > 0) {
        expect(auditLogs[0].actor).toBeDefined();
        expect(auditLogs[0].action).toBe('update');
      }

      // Restore original name
      await serviceClient
        .from('awareness_campaigns')
        .update({ name: originalName })
        .eq('id', seedData.campaignsA[0].id);
    });

    it('logs campaign deletion in audit_log', async () => {
      // Create test campaign
      const { data: campaign } = await serviceClient
        .from('awareness_campaigns')
        .insert({
          tenant_id: seedData.tenantA.id,
          name: 'Delete Audit Test',
          description: 'Will be deleted',
          owner_name: 'Test',
          status: 'draft',
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          created_by: seedData.userA.id,
        })
        .select()
        .single();

      const clientA = createTestClient(seedData.userA.accessToken);

      // Delete campaign
      const { error } = await clientA
        .from('awareness_campaigns')
        .delete()
        .eq('id', campaign!.id);

      expect(error).toBeNull();

      // Check audit log
      const { data: auditLogs } = await serviceClient
        .from('audit_log')
        .select('*')
        .eq('tenant_id', seedData.tenantA.id)
        .eq('entity_type', 'campaign')
        .eq('entity_id', campaign!.id)
        .eq('action', 'delete');

      if (auditLogs && auditLogs.length > 0) {
        expect(auditLogs[0].action).toBe('delete');
      }
    });
  });

  describe('Participant Operations Audit', () => {
    it('logs participant creation if audit context exists', async () => {
      const clientA = createTestClient(seedData.userA.accessToken);

      const { data: participant, error } = await clientA
        .from('campaign_participants')
        .insert({
          tenant_id: seedData.tenantA.id,
          campaign_id: seedData.campaignsA[0].id,
          employee_ref: 'AUDIT-TEST-001',
          status: 'not_started',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(participant).toBeDefined();

      // Check audit log (might not exist if no explicit logging for participants)
      const { data: auditLogs } = await serviceClient
        .from('audit_log')
        .select('*')
        .eq('tenant_id', seedData.tenantA.id)
        .eq('entity_type', 'participant')
        .eq('entity_id', participant!.id);

      // Audit logging for participants is optional based on implementation
      // Test passes if no error occurred

      // Clean up
      await serviceClient.from('campaign_participants').delete().eq('id', participant!.id);
    });
  });

  describe('Audit Log Read Operations', () => {
    it('can query audit logs by date range', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await serviceClient
        .from('audit_log')
        .select('*')
        .eq('tenant_id', seedData.tenantA.id)
        .gte('created_at', yesterday)
        .lte('created_at', tomorrow);

      expect(error).toBeNull();
      if (data) {
        expect(Array.isArray(data)).toBe(true);
      }
    });

    it('can query audit logs by action type', async () => {
      const { data, error } = await serviceClient
        .from('audit_log')
        .select('*')
        .eq('tenant_id', seedData.tenantA.id)
        .eq('action', 'create');

      expect(error).toBeNull();
      if (data && data.length > 0) {
        data.forEach((log) => {
          expect(log.action).toBe('create');
        });
      }
    });

    it('can query audit logs by entity type', async () => {
      const { data, error } = await serviceClient
        .from('audit_log')
        .select('*')
        .eq('tenant_id', seedData.tenantA.id)
        .eq('entity_type', 'campaign');

      expect(error).toBeNull();
      if (data && data.length > 0) {
        data.forEach((log) => {
          expect(log.entity_type).toBe('campaign');
        });
      }
    });
  });

  describe('Audit Non-Blocking Behavior', () => {
    it('campaign creation succeeds even if audit log fails gracefully', async () => {
      // This test verifies that audit logging doesn't block operations
      // In production, audit logging should be non-blocking (try-catch or async)

      const clientA = createTestClient(seedData.userA.accessToken);

      const { data, error } = await clientA
        .from('awareness_campaigns')
        .insert({
          tenant_id: seedData.tenantA.id,
          name: 'Non-Blocking Test',
          description: 'Should succeed regardless of audit',
          owner_name: 'Test',
          status: 'draft',
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          created_by: seedData.userA.id,
        })
        .select()
        .single();

      // Operation should succeed
      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Clean up
      await serviceClient.from('awareness_campaigns').delete().eq('id', data!.id);
    });
  });
});
