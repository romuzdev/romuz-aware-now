/**
 * M20 - Threat Intelligence Hooks Unit Tests
 * Tests all React Query hooks for data fetching and mutations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  useThreatFeeds, 
  useThreatIndicators,
  useThreatMatches,
  useThreatStats,
  useRecentMatches,
  useCreateThreatFeed,
  useUpdateThreatFeed,
  useDeleteThreatFeed,
  useSyncThreatFeed
} from '@/modules/threat-intelligence/hooks/useThreatIntelligence';
import * as threatIntegration from '@/modules/threat-intelligence/integration/threat-intelligence.integration';

// Mock the integration layer
vi.mock('@/modules/threat-intelligence/integration/threat-intelligence.integration');

describe('Threat Intelligence Hooks', () => {
  let queryClient: QueryClient;
  const mockTenantId = 'test-tenant-id';

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useThreatFeeds', () => {
    it('should fetch threat feeds successfully', async () => {
      const mockFeeds = [
        {
          id: 'feed-1',
          tenant_id: mockTenantId,
          feed_name: 'Test Feed',
          feed_type: 'misp',
          feed_url: 'https://test.com',
          is_active: true,
          sync_frequency_hours: 24,
          last_fetched_at: null,
          next_fetch_at: null,
          total_indicators_fetched: 0,
          last_fetch_status: 'pending',
          last_error_message: null,
          auth_method: 'none',
          auth_config: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      vi.mocked(threatIntegration.fetchThreatFeeds).mockResolvedValue(mockFeeds);

      const { result } = renderHook(
        () => useThreatFeeds(mockTenantId, { status: 'active' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockFeeds);
      expect(threatIntegration.fetchThreatFeeds).toHaveBeenCalledWith(
        mockTenantId,
        { status: 'active' }
      );
    });

    it('should handle fetch error', async () => {
      vi.mocked(threatIntegration.fetchThreatFeeds).mockRejectedValue(
        new Error('Fetch failed')
      );

      const { result } = renderHook(
        () => useThreatFeeds(mockTenantId),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useThreatIndicators', () => {
    it('should fetch threat indicators with filters', async () => {
      const mockIndicators = [
        {
          id: 'indicator-1',
          tenant_id: mockTenantId,
          feed_id: 'feed-1',
          indicator_type: 'ip',
          indicator_value: '192.168.1.1',
          threat_level: 'high',
          confidence_score: 0.9,
          is_whitelisted: false,
          tags: ['malware'],
          metadata: {},
          first_seen_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          expires_at: null,
          detection_count: 5,
          false_positive_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      vi.mocked(threatIntegration.fetchThreatIndicators).mockResolvedValue(mockIndicators);

      const { result } = renderHook(
        () => useThreatIndicators(mockTenantId, { type: 'ip', severity: 'high' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockIndicators);
      expect(threatIntegration.fetchThreatIndicators).toHaveBeenCalledWith(
        mockTenantId,
        { type: 'ip', severity: 'high' }
      );
    });
  });

  describe('useThreatMatches', () => {
    it('should fetch threat matches successfully', async () => {
      const mockMatches = [
        {
          id: 'match-1',
          tenant_id: mockTenantId,
          indicator_id: 'indicator-1',
          matched_value: '192.168.1.1',
          matched_entity_type: 'firewall_log',
          matched_entity_id: 'log-1',
          confidence_score: 0.85,
          investigation_status: 'pending',
          investigated_by: null,
          investigated_at: null,
          investigation_notes: null,
          matched_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ];

      vi.mocked(threatIntegration.fetchThreatMatches).mockResolvedValue(mockMatches);

      const { result } = renderHook(
        () => useThreatMatches(mockTenantId, { severity: 'high' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockMatches);
    });
  });

  describe('useThreatStats', () => {
    it('should fetch threat statistics', async () => {
      const mockStats = {
        activeFeeds: 5,
        totalIndicators: 1500,
        recentMatches: 23,
        criticalThreats: 8,
      };

      vi.mocked(threatIntegration.fetchThreatStats).mockResolvedValue(mockStats);

      const { result } = renderHook(
        () => useThreatStats(mockTenantId),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockStats);
    });
  });

  describe('useRecentMatches', () => {
    it('should fetch recent matches with limit', async () => {
      const mockMatches = Array(10).fill(null).map((_, i) => ({
        id: `match-${i}`,
        tenant_id: mockTenantId,
        indicator_id: `indicator-${i}`,
        matched_value: `192.168.1.${i}`,
        matched_entity_type: 'firewall_log',
        matched_entity_id: `log-${i}`,
        confidence_score: 0.8,
        investigation_status: 'pending',
        matched_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }));

      vi.mocked(threatIntegration.fetchRecentMatches).mockResolvedValue(mockMatches);

      const { result } = renderHook(
        () => useRecentMatches(mockTenantId, 10),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(10);
    });
  });

  describe('Mutation Hooks', () => {
    describe('useCreateThreatFeed', () => {
      it('should create a new threat feed', async () => {
        const newFeed = {
          tenant_id: mockTenantId,
          feed_name: 'New Feed',
          feed_type: 'misp' as const,
          feed_url: 'https://new-feed.com',
          is_active: true,
          sync_frequency_hours: 24,
          auth_method: 'none' as const,
          auth_config: {},
        };

        const createdFeed = { id: 'new-feed-id', ...newFeed };
        vi.mocked(threatIntegration.createThreatFeed).mockResolvedValue(createdFeed);

        const { result } = renderHook(() => useCreateThreatFeed(), { wrapper });

        result.current.mutate(newFeed);

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(threatIntegration.createThreatFeed).toHaveBeenCalledWith(newFeed);
      });
    });

    describe('useUpdateThreatFeed', () => {
      it('should update an existing threat feed', async () => {
        const updateData = {
          id: 'feed-1',
          feed_name: 'Updated Feed',
          is_active: false,
        };

        vi.mocked(threatIntegration.updateThreatFeed).mockResolvedValue(undefined);

        const { result } = renderHook(() => useUpdateThreatFeed(), { wrapper });

        result.current.mutate(updateData);

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(threatIntegration.updateThreatFeed).toHaveBeenCalledWith(
          'feed-1',
          { feed_name: 'Updated Feed', is_active: false }
        );
      });
    });

    describe('useDeleteThreatFeed', () => {
      it('should delete a threat feed', async () => {
        vi.mocked(threatIntegration.deleteThreatFeed).mockResolvedValue(undefined);

        const { result } = renderHook(() => useDeleteThreatFeed(), { wrapper });

        result.current.mutate('feed-1');

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(threatIntegration.deleteThreatFeed).toHaveBeenCalledWith('feed-1');
      });
    });

    describe('useSyncThreatFeed', () => {
      it('should sync a threat feed', async () => {
        vi.mocked(threatIntegration.syncThreatFeed).mockResolvedValue(undefined);

        const { result } = renderHook(() => useSyncThreatFeed(), { wrapper });

        result.current.mutate('feed-1');

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(threatIntegration.syncThreatFeed).toHaveBeenCalledWith('feed-1');
      });
    });
  });
});
