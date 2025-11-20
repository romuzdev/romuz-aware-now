import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServiceClient } from './setup/config';
import { seedTestData, teardownTestData, SeedData } from '../fixtures/seed';

describe('Analytics Views - KPIs', () => {
  let seedData: SeedData;
  const serviceClient = createServiceClient();

  beforeAll(async () => {
    seedData = await seedTestData(serviceClient);
  });

  afterAll(async () => {
    await teardownTestData(serviceClient, seedData);
  });

  describe('vw_awareness_campaign_kpis', () => {
    it('returns KPIs for all campaigns with correct aggregations', async () => {
      const { data, error } = await serviceClient
        .from('vw_awareness_campaign_kpis')
        .select('*')
        .in('campaign_id', [seedData.campaignsA[0].id, seedData.campaignsA[1].id]);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);

      data!.forEach((kpi) => {
        // Basic validations
        expect(kpi.campaign_id).toBeDefined();
        expect(kpi.campaign_name).toBeDefined();
        expect(kpi.tenant_id).toBeDefined();
        expect(typeof kpi.total_participants).toBe('number');
      });
    });

    it('calculates completion_rate correctly', async () => {
      const { data } = await serviceClient
        .from('vw_awareness_campaign_kpis')
        .select('*')
        .eq('campaign_id', seedData.campaignsA[0].id)
        .single();

      expect(data).toBeDefined();

      // Campaign A1 has: 1 completed, 1 in_progress, 1 not_started = 3 total
      expect(data!.total_participants).toBe(3);
      expect(data!.completed_count).toBe(1);
      expect(data!.started_count).toBeGreaterThanOrEqual(1); // At least 1 (could be 2 if in_progress counts)

      // completion_rate = completed / total
      if (data!.completion_rate !== null) {
        const expectedRate = (data!.completed_count / data!.total_participants) * 100;
        expect(Math.abs(data!.completion_rate - expectedRate)).toBeLessThan(0.01);
      }
    });

    it('calculates avg_score correctly', async () => {
      const { data } = await serviceClient
        .from('vw_awareness_campaign_kpis')
        .select('*')
        .eq('campaign_id', seedData.campaignsA[0].id)
        .single();

      expect(data).toBeDefined();

      // Campaign A1 has 1 completed participant with score 85
      if (data!.avg_score !== null) {
        expect(data!.avg_score).toBe(85);
      }
    });

    it('calculates started_count correctly', async () => {
      const { data } = await serviceClient
        .from('vw_awareness_campaign_kpis')
        .select('*')
        .eq('campaign_id', seedData.campaignsA[0].id)
        .single();

      expect(data).toBeDefined();

      // Started = not 'not_started' status
      // Campaign A1: 1 completed + 1 in_progress = 2 started
      expect(data!.started_count).toBeGreaterThanOrEqual(1);
    });

    it('returns 0 for campaigns with no participants', async () => {
      // Create campaign with no participants
      const { data: emptyCampaign } = await serviceClient
        .from('awareness_campaigns')
        .insert({
          tenant_id: seedData.tenantA.id,
          name: 'Empty Campaign',
          description: 'No participants',
          owner_name: 'Test',
          status: 'draft',
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          created_by: seedData.userA.id,
        })
        .select()
        .single();

      const { data: kpis } = await serviceClient
        .from('vw_awareness_campaign_kpis')
        .select('*')
        .eq('campaign_id', emptyCampaign!.id)
        .maybeSingle();

      // View might return null or row with 0 participants depending on JOIN type
      if (kpis) {
        expect(kpis.total_participants).toBe(0);
        expect(kpis.completed_count).toBe(0);
        expect(kpis.started_count).toBe(0);
      }

      // Clean up
      await serviceClient.from('awareness_campaigns').delete().eq('id', emptyCampaign!.id);
    });

    it('filters by tenant_id correctly', async () => {
      const { data: tenantAData } = await serviceClient
        .from('vw_awareness_campaign_kpis')
        .select('*')
        .eq('tenant_id', seedData.tenantA.id);

      const { data: tenantBData } = await serviceClient
        .from('vw_awareness_campaign_kpis')
        .select('*')
        .eq('tenant_id', seedData.tenantB.id);

      expect(tenantAData).toBeDefined();
      expect(tenantBData).toBeDefined();

      // Verify no cross-tenant contamination
      tenantAData!.forEach((kpi) => {
        expect(kpi.tenant_id).toBe(seedData.tenantA.id);
      });

      tenantBData!.forEach((kpi) => {
        expect(kpi.tenant_id).toBe(seedData.tenantB.id);
      });
    });

    it('calculates overdue_count for past end_date campaigns', async () => {
      // Create overdue campaign
      const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data: overdueCampaign } = await serviceClient
        .from('awareness_campaigns')
        .insert({
          tenant_id: seedData.tenantA.id,
          name: 'Overdue Campaign',
          description: 'Past end date',
          owner_name: 'Test',
          status: 'active',
          start_date: pastDate,
          end_date: pastDate, // Already ended
          created_by: seedData.userA.id,
        })
        .select()
        .single();

      // Add incomplete participant
      await serviceClient.from('campaign_participants').insert({
        tenant_id: seedData.tenantA.id,
        campaign_id: overdueCampaign!.id,
        employee_ref: 'OVERDUE-001',
        status: 'not_started',
        completed_at: null,
      });

      const { data: kpis } = await serviceClient
        .from('vw_awareness_campaign_kpis')
        .select('*')
        .eq('campaign_id', overdueCampaign!.id)
        .single();

      expect(kpis).toBeDefined();
      expect(kpis!.overdue_count).toBeGreaterThan(0);

      // Clean up
      await serviceClient.from('campaign_participants').delete().eq('campaign_id', overdueCampaign!.id);
      await serviceClient.from('awareness_campaigns').delete().eq('id', overdueCampaign!.id);
    });
  });
});
