/**
 * Gate-K RPC Integration Tests
 * Tests all RPC functions with realistic scenarios
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createServiceClient } from './setup/config';

const TEST_TENANT_ID = 'a0000000-0000-0000-0000-000000000001';
const LAST_MONTH = new Date(
  new Date().getFullYear(),
  new Date().getMonth() - 1,
  1
).toISOString().split('T')[0];

describe('Gate-K RPC Integration Tests', () => {
  let supabase: ReturnType<typeof createServiceClient>;

  beforeAll(() => {
    supabase = createServiceClient();
  });

  describe('get_rca_top_contributors', () => {
    it('should return top contributors for campaign_completion_rate', async () => {
      const { data, error } = await supabase.rpc('get_rca_top_contributors', {
        p_kpi_key: 'campaign_completion_rate',
        p_month: LAST_MONTH,
        p_trend_window: 'm1',
        p_dim_key: null,
        p_top_n: 5,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);

      if (data && data.length > 0) {
        const firstContributor = data[0];
        expect(firstContributor).toHaveProperty('tenant_id');
        expect(firstContributor).toHaveProperty('kpi_key');
        expect(firstContributor).toHaveProperty('month');
        expect(firstContributor).toHaveProperty('trend_window');
        expect(firstContributor).toHaveProperty('dim_key');
        expect(firstContributor).toHaveProperty('dim_value');
        expect(firstContributor).toHaveProperty('delta_pct');
        expect(firstContributor).toHaveProperty('contribution_score');
        expect(firstContributor).toHaveProperty('contributor_rnk');

        console.log('✅ Top Contributors Sample:', JSON.stringify(data.slice(0, 3), null, 2));
      }
    });

    it('should filter by specific dimension (department)', async () => {
      const { data, error } = await supabase.rpc('get_rca_top_contributors', {
        p_kpi_key: 'campaign_completion_rate',
        p_month: LAST_MONTH,
        p_trend_window: 'm1',
        p_dim_key: 'department',
        p_top_n: 3,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data && data.length > 0) {
        // All results should be for department dimension
        data.forEach((row: any) => {
          expect(row.dim_key).toBe('department');
        });

        console.log('✅ Department Contributors:', JSON.stringify(data, null, 2));
      }
    });

    it('should respect p_top_n limit', async () => {
      const { data, error } = await supabase.rpc('get_rca_top_contributors', {
        p_kpi_key: 'campaign_completion_rate',
        p_month: LAST_MONTH,
        p_trend_window: 'm1',
        p_dim_key: 'department',
        p_top_n: 2,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data) {
        // Should have at most 2 contributors
        expect(data.length).toBeLessThanOrEqual(2);

        // All contributor_rnk should be <= 2
        data.forEach((row: any) => {
          expect(row.contributor_rnk).toBeLessThanOrEqual(2);
        });

        console.log('✅ Top 2 Contributors:', JSON.stringify(data, null, 2));
      }
    });
  });

  describe('generate_recommendations', () => {
    it('should generate recommendations for last month', async () => {
      const { data, error } = await supabase.rpc('generate_recommendations', {
        p_month: LAST_MONTH,
        p_limit: 1000,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(typeof data).toBe('number');
      expect(data).toBeGreaterThanOrEqual(0);

      console.log(`✅ Generated ${data} recommendations for ${LAST_MONTH}`);
    });

    it('should respect p_limit parameter', async () => {
      const { data, error } = await supabase.rpc('generate_recommendations', {
        p_month: LAST_MONTH,
        p_limit: 5,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toBeLessThanOrEqual(5);

      console.log(`✅ Generated ${data} recommendations (limited to 5)`);
    });

    it('should handle null month (all available months)', async () => {
      const { data, error } = await supabase.rpc('generate_recommendations', {
        p_month: null,
        p_limit: 100,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(typeof data).toBe('number');

      console.log(`✅ Generated ${data} recommendations for all months`);
    });
  });

  describe('get_recommendations', () => {
    it('should return recommendations list', async () => {
      const { data, error } = await supabase.rpc('get_recommendations', {
        p_month: LAST_MONTH,
        p_kpi_key: null,
        p_status: null,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);

      if (data && data.length > 0) {
        const firstReco = data[0];
        expect(firstReco).toHaveProperty('id');
        expect(firstReco).toHaveProperty('tenant_id');
        expect(firstReco).toHaveProperty('kpi_key');
        expect(firstReco).toHaveProperty('month');
        expect(firstReco).toHaveProperty('trend_window');
        expect(firstReco).toHaveProperty('dim_key');
        expect(firstReco).toHaveProperty('dim_value');
        expect(firstReco).toHaveProperty('flag');
        expect(firstReco).toHaveProperty('title_ar');
        expect(firstReco).toHaveProperty('body_ar');
        expect(firstReco).toHaveProperty('action_type_code');
        expect(firstReco).toHaveProperty('impact_level');
        expect(firstReco).toHaveProperty('effort_estimate');
        expect(firstReco).toHaveProperty('source_ref');
        expect(firstReco).toHaveProperty('status');
        expect(firstReco).toHaveProperty('created_at');

        console.log('✅ Recommendations Sample:', JSON.stringify(data.slice(0, 2), null, 2));
      }
    });

    it('should filter by KPI', async () => {
      const { data, error } = await supabase.rpc('get_recommendations', {
        p_month: LAST_MONTH,
        p_kpi_key: 'campaign_completion_rate',
        p_status: null,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data && data.length > 0) {
        // All results should be for specified KPI
        data.forEach((row: any) => {
          expect(row.kpi_key).toBe('campaign_completion_rate');
        });

        console.log(`✅ Found ${data.length} recommendations for campaign_completion_rate`);
      }
    });

    it('should filter by status', async () => {
      const { data, error } = await supabase.rpc('get_recommendations', {
        p_month: LAST_MONTH,
        p_kpi_key: null,
        p_status: 'pending',
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data && data.length > 0) {
        // All results should have pending status
        data.forEach((row: any) => {
          expect(row.status).toBe('pending');
        });

        console.log(`✅ Found ${data.length} pending recommendations`);
      }
    });

    it('should validate source_ref structure', async () => {
      const { data, error } = await supabase.rpc('get_recommendations', {
        p_month: LAST_MONTH,
        p_kpi_key: null,
        p_status: null,
      });

      expect(error).toBeNull();

      if (data && data.length > 0) {
        const firstReco = data[0];
        expect(firstReco.source_ref).toBeDefined();
        expect(typeof firstReco.source_ref).toBe('object');

        // Validate source_ref keys
        expect(firstReco.source_ref).toHaveProperty('contributor_rnk');
        expect(firstReco.source_ref).toHaveProperty('priority_rnk');
        expect(firstReco.source_ref).toHaveProperty('delta_pct');
        expect(firstReco.source_ref).toHaveProperty('contribution_score');
        expect(firstReco.source_ref).toHaveProperty('share_ratio');
        expect(firstReco.source_ref).toHaveProperty('variance_from_overall_pct');

        console.log('✅ source_ref structure valid:', firstReco.source_ref);
      }
    });
  });

  describe('End-to-End Workflow', () => {
    it('should complete full Gate-K workflow', async () => {
      console.log('\n=== Starting Full Gate-K Workflow ===\n');

      // Step 1: Get RCA top contributors
      console.log('Step 1: Fetching RCA top contributors...');
      const { data: contributors, error: rcaError } = await supabase.rpc(
        'get_rca_top_contributors',
        {
          p_kpi_key: 'campaign_completion_rate',
          p_month: LAST_MONTH,
          p_trend_window: 'm1',
          p_dim_key: null,
          p_top_n: 5,
        }
      );

      expect(rcaError).toBeNull();
      expect(contributors).toBeDefined();
      console.log(`✅ Found ${contributors?.length || 0} top contributors`);

      // Step 2: Generate recommendations
      console.log('\nStep 2: Generating recommendations...');
      const { data: recoCount, error: genError } = await supabase.rpc(
        'generate_recommendations',
        {
          p_month: LAST_MONTH,
          p_limit: 500,
        }
      );

      expect(genError).toBeNull();
      expect(recoCount).toBeDefined();
      console.log(`✅ Generated ${recoCount} recommendations`);

      // Step 3: Fetch recommendations
      console.log('\nStep 3: Fetching recommendations...');
      const { data: recommendations, error: listError } = await supabase.rpc(
        'get_recommendations',
        {
          p_month: LAST_MONTH,
          p_kpi_key: 'campaign_completion_rate',
          p_status: 'pending',
        }
      );

      expect(listError).toBeNull();
      expect(recommendations).toBeDefined();
      console.log(`✅ Found ${recommendations?.length || 0} pending recommendations`);

      // Step 4: Validate recommendations match contributors
      if (contributors && contributors.length > 0 && recommendations && recommendations.length > 0) {
        console.log('\nStep 4: Validating recommendation-contributor linkage...');

        const contributorDimValues = new Set(
          contributors.map((c: any) => c.dim_value)
        );
        const recoDimValues = new Set(
          recommendations.map((r: any) => r.dim_value)
        );

        // Check if some recommendation dim_values match contributor dim_values
        const hasMatches = Array.from(recoDimValues).some(val =>
          contributorDimValues.has(val)
        );

        expect(hasMatches).toBe(true);
        console.log('✅ Recommendations correctly linked to top contributors');
      }

      console.log('\n=== Full Gate-K Workflow Complete ===\n');
    });
  });
});
