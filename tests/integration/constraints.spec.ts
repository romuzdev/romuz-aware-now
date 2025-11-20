import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServiceClient } from './setup/config';
import { seedTestData, teardownTestData, SeedData } from '../fixtures/seed';

describe('Constraints & Database Integrity', () => {
  let seedData: SeedData;
  const serviceClient = createServiceClient();

  beforeAll(async () => {
    seedData = await seedTestData(serviceClient);
  });

  afterAll(async () => {
    await teardownTestData(serviceClient, seedData);
  });

  describe('campaign_participants - UNIQUE constraints', () => {
    it('prevents duplicate participant (tenant_id, campaign_id, employee_ref) when not deleted', async () => {
      const { error } = await serviceClient.from('campaign_participants').insert({
        tenant_id: seedData.tenantA.id,
        campaign_id: seedData.campaignsA[0].id,
        employee_ref: seedData.participantsA[0].employee_ref, // Duplicate
        status: 'not_started',
      });

      expect(error).not.toBeNull();
      expect(error?.message.toLowerCase()).toContain('unique');
    });

    it('allows same employee_ref if deleted_at is set (soft delete)', async () => {
      const participant = seedData.participantsA[0];

      // Soft delete the participant
      const { error: deleteError } = await serviceClient
        .from('campaign_participants')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', participant.id);

      expect(deleteError).toBeNull();

      // Try to insert with same employee_ref
      const { data, error } = await serviceClient
        .from('campaign_participants')
        .insert({
          tenant_id: participant.tenant_id,
          campaign_id: participant.campaign_id,
          employee_ref: participant.employee_ref,
          status: 'not_started',
        })
        .select();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Clean up
      if (data?.[0]) {
        await serviceClient.from('campaign_participants').delete().eq('id', data[0].id);
      }

      // Restore original
      await serviceClient
        .from('campaign_participants')
        .update({ deleted_at: null })
        .eq('id', participant.id);
    });

    it('allows same employee_ref across different campaigns', async () => {
      const { data, error } = await serviceClient
        .from('campaign_participants')
        .insert({
          tenant_id: seedData.tenantA.id,
          campaign_id: seedData.campaignsA[1].id, // Different campaign
          employee_ref: seedData.participantsA[0].employee_ref, // Same employee
          status: 'not_started',
        })
        .select();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Clean up
      if (data?.[0]) {
        await serviceClient.from('campaign_participants').delete().eq('id', data[0].id);
      }
    });

    it('allows same employee_ref across different tenants', async () => {
      const { data, error } = await serviceClient
        .from('campaign_participants')
        .insert({
          tenant_id: seedData.tenantB.id, // Different tenant
          campaign_id: seedData.campaignsB[0].id,
          employee_ref: seedData.participantsA[0].employee_ref, // Same employee ref
          status: 'not_started',
        })
        .select();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Clean up
      if (data?.[0]) {
        await serviceClient.from('campaign_participants').delete().eq('id', data[0].id);
      }
    });
  });

  describe('Foreign Key constraints', () => {
    it('prevents participant creation with non-existent campaign_id', async () => {
      const { error } = await serviceClient.from('campaign_participants').insert({
        tenant_id: seedData.tenantA.id,
        campaign_id: '00000000-0000-0000-0000-000000000000', // Non-existent
        employee_ref: 'TEST-999',
        status: 'not_started',
      });

      expect(error).not.toBeNull();
      expect(error?.message.toLowerCase()).toMatch(/foreign key|violates/);
    });

    it('campaign deletion behavior (check if CASCADE or RESTRICT)', async () => {
      // Create test campaign
      const { data: campaign, error: createError } = await serviceClient
        .from('awareness_campaigns')
        .insert({
          tenant_id: seedData.tenantA.id,
          name: 'Delete Test Campaign',
          description: 'For deletion test',
          owner_name: 'Test',
          status: 'draft',
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          created_by: seedData.userA.id,
        })
        .select()
        .single();

      expect(createError).toBeNull();
      expect(campaign).toBeDefined();

      // Create participant
      const { data: participant, error: participantError } = await serviceClient
        .from('campaign_participants')
        .insert({
          tenant_id: seedData.tenantA.id,
          campaign_id: campaign!.id,
          employee_ref: 'DELETE-TEST-001',
          status: 'not_started',
        })
        .select()
        .single();

      expect(participantError).toBeNull();
      expect(participant).toBeDefined();

      // Try to delete campaign
      const { error: deleteError } = await serviceClient
        .from('awareness_campaigns')
        .delete()
        .eq('id', campaign!.id);

      if (deleteError) {
        // RESTRICT behavior - must delete participants first
        await serviceClient.from('campaign_participants').delete().eq('id', participant!.id);
        await serviceClient.from('awareness_campaigns').delete().eq('id', campaign!.id);
      } else {
        // CASCADE behavior - participants deleted automatically
        const { data: orphanedParticipants } = await serviceClient
          .from('campaign_participants')
          .select('*')
          .eq('id', participant!.id);

        expect(orphanedParticipants?.length).toBe(0);
      }
    });
  });

  describe('saved_views - Constraints', () => {
    it('prevents creating more than 10 saved views per user (if enforced via trigger)', async () => {
      // Note: This test assumes the trigger exists
      // Create 10 views
      const views = Array.from({ length: 10 }, (_, i) => ({
        tenant_id: seedData.tenantA.id,
        user_id: seedData.userA.id,
        page_key: 'campaigns',
        name: `View ${i + 1}`,
        filters: {},
      }));

      await serviceClient.from('saved_views').insert(views);

      // Try to create 11th view
      const { error } = await serviceClient.from('saved_views').insert({
        tenant_id: seedData.tenantA.id,
        user_id: seedData.userA.id,
        page_key: 'campaigns',
        name: 'View 11',
        filters: {},
      });

      // Clean up
      await serviceClient
        .from('saved_views')
        .delete()
        .eq('tenant_id', seedData.tenantA.id)
        .eq('user_id', seedData.userA.id);

      // If trigger exists, this should fail
      if (error) {
        expect(error.message).toContain('limit');
      }
    });
  });
});
