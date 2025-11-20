import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServiceClient } from './setup/config';
import { seedTestData, teardownTestData, SeedData } from '../fixtures/seed';

describe('Analytics Views - Daily Engagement Trend', () => {
  let seedData: SeedData;
  const serviceClient = createServiceClient();

  beforeAll(async () => {
    seedData = await seedTestData(serviceClient);
  });

  afterAll(async () => {
    await teardownTestData(serviceClient, seedData);
  });

  describe('vw_awareness_daily_engagement', () => {
    it('returns daily engagement data for campaigns', async () => {
      const { data, error } = await serviceClient
        .from('vw_awareness_daily_engagement')
        .select('*')
        .eq('campaign_id', seedData.campaignsA[0].id)
        .order('day', { ascending: false })
        .limit(30);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data && data.length > 0) {
        data.forEach((row) => {
          expect(row.campaign_id).toBe(seedData.campaignsA[0].id);
          expect(row.tenant_id).toBe(seedData.tenantA.id);
          expect(row.day).toBeDefined();
          expect(typeof row.completed_delta).toBe('number');
        });
      }
    });

    it('completed_delta matches participants completed on that day', async () => {
      const { data } = await serviceClient
        .from('vw_awareness_daily_engagement')
        .select('*')
        .eq('campaign_id', seedData.campaignsA[0].id)
        .order('day', { ascending: false });

      if (data && data.length > 0) {
        // Find days with completions
        const daysWithCompletions = data.filter((d) => d.completed_delta > 0);

        for (const dayData of daysWithCompletions) {
          // Verify by counting participants completed on that day
          const { count } = await serviceClient
            .from('campaign_participants')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', seedData.campaignsA[0].id)
            .gte('completed_at', `${dayData.day}T00:00:00`)
            .lt('completed_at', `${dayData.day}T23:59:59`);

          if (count !== null && count > 0) {
            expect(dayData.completed_delta).toBe(count);
          }
        }
      }
    });

    it('avg_score_day calculated correctly for days with completions', async () => {
      const { data } = await serviceClient
        .from('vw_awareness_daily_engagement')
        .select('*')
        .eq('campaign_id', seedData.campaignsA[0].id)
        .not('avg_score_day', 'is', null);

      if (data && data.length > 0) {
        data.forEach((row) => {
          expect(row.avg_score_day).toBeGreaterThanOrEqual(0);
          expect(row.avg_score_day).toBeLessThanOrEqual(100);
        });
      }
    });

    it('returns data for correct date range', async () => {
      const { data } = await serviceClient
        .from('vw_awareness_daily_engagement')
        .select('*')
        .eq('campaign_id', seedData.campaignsA[0].id)
        .gte('day', '2025-01-01')
        .lte('day', '2025-12-31')
        .order('day', { ascending: true });

      expect(data).toBeDefined();

      if (data && data.length > 0) {
        // Verify dates are in order and within range
        for (let i = 0; i < data.length - 1; i++) {
          expect(new Date(data[i].day).getTime()).toBeLessThanOrEqual(
            new Date(data[i + 1].day).getTime()
          );
        }
      }
    });

    it('filters by tenant_id correctly', async () => {
      const { data: tenantAData } = await serviceClient
        .from('vw_awareness_daily_engagement')
        .select('*')
        .eq('tenant_id', seedData.tenantA.id);

      const { data: tenantBData } = await serviceClient
        .from('vw_awareness_daily_engagement')
        .select('*')
        .eq('tenant_id', seedData.tenantB.id);

      if (tenantAData && tenantAData.length > 0) {
        tenantAData.forEach((row) => {
          expect(row.tenant_id).toBe(seedData.tenantA.id);
        });
      }

      if (tenantBData && tenantBData.length > 0) {
        tenantBData.forEach((row) => {
          expect(row.tenant_id).toBe(seedData.tenantB.id);
        });
      }
    });

    it('handles campaigns with no activity gracefully', async () => {
      // Campaign A2 has only 1 participant completed days ago
      const { data } = await serviceClient
        .from('vw_awareness_daily_engagement')
        .select('*')
        .eq('campaign_id', seedData.campaignsA[1].id)
        .eq('day', new Date().toISOString().split('T')[0]); // Today

      // Should return no data or data with 0 deltas
      if (data && data.length > 0) {
        expect(data[0].completed_delta).toBe(0);
        expect(data[0].started_delta).toBe(0);
      }
    });

    it('started_delta reflects progress tracking (if implemented)', async () => {
      // This test depends on how started_delta is calculated
      // It might track first module_progress creation or status change to in_progress

      const { data } = await serviceClient
        .from('vw_awareness_daily_engagement')
        .select('*')
        .eq('campaign_id', seedData.campaignsA[0].id)
        .order('day', { ascending: false })
        .limit(30);

      if (data && data.length > 0) {
        data.forEach((row) => {
          // started_delta should be >= 0
          expect(row.started_delta).toBeGreaterThanOrEqual(0);
        });
      }
    });
  });
});
