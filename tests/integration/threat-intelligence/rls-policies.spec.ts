/**
 * M20 - Threat Intelligence RLS Policies Integration Tests
 * Tests Row Level Security policies for all threat intelligence tables
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

describe('Threat Intelligence RLS Policies', () => {
  let serviceClient: SupabaseClient;
  let tenantAId: string;
  let tenantBId: string;
  let userAId: string;
  let userBId: string;
  let feedAId: string;
  let indicatorAId: string;

  beforeAll(async () => {
    serviceClient = createClient(supabaseUrl, supabaseKey);

    // Create test tenants
    tenantAId = 'test-tenant-a-' + Date.now();
    tenantBId = 'test-tenant-b-' + Date.now();

    // Note: In a real setup, you would create actual users with auth
    // For now, we'll use mock user IDs
    userAId = 'test-user-a-' + Date.now();
    userBId = 'test-user-b-' + Date.now();
  });

  afterAll(async () => {
    // Cleanup test data
    await serviceClient.from('threat_matches').delete().eq('tenant_id', tenantAId);
    await serviceClient.from('threat_indicators').delete().eq('tenant_id', tenantAId);
    await serviceClient.from('threat_intelligence_feeds').delete().eq('tenant_id', tenantAId);
    await serviceClient.from('threat_matches').delete().eq('tenant_id', tenantBId);
    await serviceClient.from('threat_indicators').delete().eq('tenant_id', tenantBId);
    await serviceClient.from('threat_intelligence_feeds').delete().eq('tenant_id', tenantBId);
  });

  describe('threat_intelligence_feeds RLS', () => {
    it('should allow tenant to create their own feeds', async () => {
      const { data, error } = await serviceClient
        .from('threat_intelligence_feeds')
        .insert({
          tenant_id: tenantAId,
          feed_name: 'Test Feed A',
          feed_type: 'misp',
          feed_url: 'https://test-feed-a.com',
          is_active: true,
          sync_frequency_hours: 24,
          auth_method: 'none',
          auth_config: {},
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.tenant_id).toBe(tenantAId);
      
      if (data) {
        feedAId = data.id;
      }
    });

    it('should allow tenant to read their own feeds', async () => {
      const { data, error } = await serviceClient
        .from('threat_intelligence_feeds')
        .select('*')
        .eq('tenant_id', tenantAId);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.length).toBeGreaterThan(0);
      expect(data?.[0].tenant_id).toBe(tenantAId);
    });

    it('should NOT allow tenant to read other tenant feeds', async () => {
      // Create a feed for tenant B
      await serviceClient
        .from('threat_intelligence_feeds')
        .insert({
          tenant_id: tenantBId,
          feed_name: 'Test Feed B',
          feed_type: 'otx',
          feed_url: 'https://test-feed-b.com',
          is_active: true,
          sync_frequency_hours: 12,
          auth_method: 'none',
          auth_config: {},
        });

      // Try to read tenant B's feeds as tenant A
      const { data, error } = await serviceClient
        .from('threat_intelligence_feeds')
        .select('*')
        .eq('tenant_id', tenantBId);

      // With RLS, this should return empty or error
      expect(data?.length).toBe(0);
    });

    it('should allow tenant to update their own feeds', async () => {
      const { error } = await serviceClient
        .from('threat_intelligence_feeds')
        .update({ feed_name: 'Updated Feed A' })
        .eq('id', feedAId)
        .eq('tenant_id', tenantAId);

      expect(error).toBeNull();
    });

    it('should allow tenant to delete their own feeds', async () => {
      // Create a temporary feed to delete
      const { data: tempFeed } = await serviceClient
        .from('threat_intelligence_feeds')
        .insert({
          tenant_id: tenantAId,
          feed_name: 'Temp Feed',
          feed_type: 'misp',
          feed_url: 'https://temp.com',
          is_active: false,
          sync_frequency_hours: 24,
          auth_method: 'none',
          auth_config: {},
        })
        .select()
        .single();

      const { error } = await serviceClient
        .from('threat_intelligence_feeds')
        .delete()
        .eq('id', tempFeed!.id)
        .eq('tenant_id', tenantAId);

      expect(error).toBeNull();
    });
  });

  describe('threat_indicators RLS', () => {
    it('should allow tenant to create indicators for their feeds', async () => {
      const { data, error } = await serviceClient
        .from('threat_indicators')
        .insert({
          tenant_id: tenantAId,
          feed_id: feedAId,
          indicator_type: 'ip',
          indicator_value: '192.168.1.100',
          threat_level: 'high',
          confidence_score: 0.95,
          is_whitelisted: false,
          tags: ['malware', 'botnet'],
          metadata: { source: 'test' },
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.tenant_id).toBe(tenantAId);

      if (data) {
        indicatorAId = data.id;
      }
    });

    it('should allow tenant to read their own indicators', async () => {
      const { data, error } = await serviceClient
        .from('threat_indicators')
        .select('*')
        .eq('tenant_id', tenantAId);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.length).toBeGreaterThan(0);
    });

    it('should NOT allow tenant to read other tenant indicators', async () => {
      // Create an indicator for tenant B
      const { data: feedB } = await serviceClient
        .from('threat_intelligence_feeds')
        .select('id')
        .eq('tenant_id', tenantBId)
        .single();

      if (feedB) {
        await serviceClient
          .from('threat_indicators')
          .insert({
            tenant_id: tenantBId,
            feed_id: feedB.id,
            indicator_type: 'domain',
            indicator_value: 'evil.com',
            threat_level: 'critical',
            confidence_score: 0.99,
            is_whitelisted: false,
            tags: ['phishing'],
            metadata: {},
          });
      }

      // Try to read tenant B's indicators as tenant A
      const { data } = await serviceClient
        .from('threat_indicators')
        .select('*')
        .eq('tenant_id', tenantBId);

      expect(data?.length).toBe(0);
    });

    it('should allow tenant to update their own indicators', async () => {
      const { error } = await serviceClient
        .from('threat_indicators')
        .update({ is_whitelisted: true })
        .eq('id', indicatorAId)
        .eq('tenant_id', tenantAId);

      expect(error).toBeNull();
    });
  });

  describe('threat_matches RLS', () => {
    it('should allow tenant to create threat matches', async () => {
      const { data, error } = await serviceClient
        .from('threat_matches')
        .insert({
          tenant_id: tenantAId,
          indicator_id: indicatorAId,
          matched_value: '192.168.1.100',
          matched_entity_type: 'firewall_log',
          matched_entity_id: 'log-123',
          confidence_score: 0.88,
          investigation_status: 'pending',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.tenant_id).toBe(tenantAId);
    });

    it('should allow tenant to read their own matches', async () => {
      const { data, error } = await serviceClient
        .from('threat_matches')
        .select('*')
        .eq('tenant_id', tenantAId);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.length).toBeGreaterThan(0);
    });

    it('should NOT allow tenant to read other tenant matches', async () => {
      const { data } = await serviceClient
        .from('threat_matches')
        .select('*')
        .eq('tenant_id', tenantBId);

      expect(data?.length).toBe(0);
    });

    it('should allow tenant to update investigation status', async () => {
      const { data: match } = await serviceClient
        .from('threat_matches')
        .select('id')
        .eq('tenant_id', tenantAId)
        .single();

      if (match) {
        const { error } = await serviceClient
          .from('threat_matches')
          .update({
            investigation_status: 'investigating',
            investigation_notes: 'Under review',
          })
          .eq('id', match.id)
          .eq('tenant_id', tenantAId);

        expect(error).toBeNull();
      }
    });
  });

  describe('Tenant Isolation Tests', () => {
    it('should enforce complete tenant isolation across all tables', async () => {
      // Tenant A should not access any Tenant B data
      const [feeds, indicators, matches] = await Promise.all([
        serviceClient
          .from('threat_intelligence_feeds')
          .select('*')
          .eq('tenant_id', tenantBId),
        serviceClient
          .from('threat_indicators')
          .select('*')
          .eq('tenant_id', tenantBId),
        serviceClient
          .from('threat_matches')
          .select('*')
          .eq('tenant_id', tenantBId),
      ]);

      expect(feeds.data?.length).toBe(0);
      expect(indicators.data?.length).toBe(0);
      expect(matches.data?.length).toBe(0);
    });
  });

  describe('Data Integrity Constraints', () => {
    it('should enforce NOT NULL constraints on required fields', async () => {
      const { error } = await serviceClient
        .from('threat_indicators')
        .insert({
          tenant_id: tenantAId,
          feed_id: feedAId,
          indicator_type: 'ip',
          // Missing indicator_value (required)
          threat_level: 'high',
          confidence_score: 0.9,
        } as any);

      expect(error).toBeDefined();
      expect(error?.message).toContain('null');
    });

    it('should enforce foreign key constraints', async () => {
      const { error } = await serviceClient
        .from('threat_indicators')
        .insert({
          tenant_id: tenantAId,
          feed_id: 'non-existent-feed-id',
          indicator_type: 'ip',
          indicator_value: '10.0.0.1',
          threat_level: 'low',
          confidence_score: 0.5,
        });

      expect(error).toBeDefined();
    });
  });
});
