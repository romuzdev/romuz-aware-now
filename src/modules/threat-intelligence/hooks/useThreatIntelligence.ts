/**
 * M20 - Threat Intelligence Hooks
 * React Query hooks for threat intelligence operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import {
  fetchThreatFeeds,
  fetchThreatFeedById,
  createThreatFeed,
  updateThreatFeed,
  deleteThreatFeed,
  fetchThreatIndicators,
  fetchThreatIndicatorById,
  createThreatIndicator,
  updateThreatIndicator,
  deleteThreatIndicator,
  bulkCreateThreatIndicators,
  fetchThreatMatches,
  fetchThreatMatchById,
  createThreatMatch,
  updateThreatMatch,
  deleteThreatMatch,
  fetchThreatStatistics,
  searchIndicatorByValue,
} from '../integration/threat-intelligence.integration';
import type {
  FeedFilters,
  IndicatorFilters,
  MatchFilters,
  CreateFeedRequest,
  UpdateFeedRequest,
  CreateIndicatorRequest,
  UpdateIndicatorRequest,
  CreateMatchRequest,
  UpdateMatchRequest,
} from '../types/threat-intelligence.types';

// ============================================================
// Threat Intelligence Feeds Hooks
// ============================================================

export function useThreatFeeds(filters?: FeedFilters) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['threat-feeds', tenantId, filters],
    queryFn: () => fetchThreatFeeds(tenantId!, filters),
    enabled: !!tenantId,
  });
}

export function useThreatFeed(feedId: string | undefined) {
  return useQuery({
    queryKey: ['threat-feed', feedId],
    queryFn: () => fetchThreatFeedById(feedId!),
    enabled: !!feedId,
  });
}

export function useCreateThreatFeed() {
  const { tenantId, user } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateFeedRequest) =>
      createThreatFeed(tenantId!, user!.id, request),
    onSuccess: () => {
      toast({
        title: 'Feed Created',
        description: 'Threat intelligence feed created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['threat-feeds'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create feed',
      });
    },
  });
}

export function useUpdateThreatFeed() {
  const { user } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ feedId, request }: { feedId: string; request: UpdateFeedRequest }) =>
      updateThreatFeed(feedId, user!.id, request),
    onSuccess: (_, variables) => {
      toast({
        title: 'Feed Updated',
        description: 'Threat intelligence feed updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['threat-feeds'] });
      queryClient.invalidateQueries({ queryKey: ['threat-feed', variables.feedId] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update feed',
      });
    },
  });
}

export function useDeleteThreatFeed() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteThreatFeed,
    onSuccess: () => {
      toast({
        title: 'Feed Deleted',
        description: 'Threat intelligence feed deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['threat-feeds'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete feed',
      });
    },
  });
}

// ============================================================
// Threat Indicators Hooks
// ============================================================

export function useThreatIndicators(filters?: IndicatorFilters) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['threat-indicators', tenantId, filters],
    queryFn: () => fetchThreatIndicators(tenantId!, filters),
    enabled: !!tenantId,
  });
}

export function useThreatIndicator(indicatorId: string | undefined) {
  return useQuery({
    queryKey: ['threat-indicator', indicatorId],
    queryFn: () => fetchThreatIndicatorById(indicatorId!),
    enabled: !!indicatorId,
  });
}

export function useCreateThreatIndicator() {
  const { tenantId } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateIndicatorRequest) =>
      createThreatIndicator(tenantId!, request),
    onSuccess: () => {
      toast({
        title: 'Indicator Added',
        description: 'Threat indicator added successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['threat-indicators'] });
      queryClient.invalidateQueries({ queryKey: ['threat-statistics'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add indicator',
      });
    },
  });
}

export function useUpdateThreatIndicator() {
  const { user } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ indicatorId, request }: { indicatorId: string; request: UpdateIndicatorRequest }) =>
      updateThreatIndicator(indicatorId, user!.id, request),
    onSuccess: (_, variables) => {
      toast({
        title: 'Indicator Updated',
        description: 'Threat indicator updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['threat-indicators'] });
      queryClient.invalidateQueries({ queryKey: ['threat-indicator', variables.indicatorId] });
      queryClient.invalidateQueries({ queryKey: ['threat-statistics'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update indicator',
      });
    },
  });
}

export function useDeleteThreatIndicator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteThreatIndicator,
    onSuccess: () => {
      toast({
        title: 'Indicator Deleted',
        description: 'Threat indicator deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['threat-indicators'] });
      queryClient.invalidateQueries({ queryKey: ['threat-statistics'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete indicator',
      });
    },
  });
}

export function useBulkImportIndicators() {
  const { tenantId } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (indicators: CreateIndicatorRequest[]) =>
      bulkCreateThreatIndicators(tenantId!, indicators),
    onSuccess: (result) => {
      toast({
        title: 'Import Complete',
        description: `Imported ${result.imported} indicators. ${result.failed > 0 ? `${result.failed} failed.` : ''}`,
      });
      queryClient.invalidateQueries({ queryKey: ['threat-indicators'] });
      queryClient.invalidateQueries({ queryKey: ['threat-statistics'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import indicators',
      });
    },
  });
}

// ============================================================
// Threat Matches Hooks
// ============================================================

export function useThreatMatches(filters?: MatchFilters) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['threat-matches', tenantId, filters],
    queryFn: () => fetchThreatMatches(tenantId!, filters),
    enabled: !!tenantId,
  });
}

export function useThreatMatch(matchId: string | undefined) {
  return useQuery({
    queryKey: ['threat-match', matchId],
    queryFn: () => fetchThreatMatchById(matchId!),
    enabled: !!matchId,
  });
}

export function useCreateThreatMatch() {
  const { tenantId } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateMatchRequest) =>
      createThreatMatch(tenantId!, request),
    onSuccess: () => {
      toast({
        title: 'Threat Detected',
        description: 'Threat match recorded successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['threat-matches'] });
      queryClient.invalidateQueries({ queryKey: ['threat-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['threat-indicators'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to record threat match',
      });
    },
  });
}

export function useUpdateThreatMatch() {
  const { user } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matchId, request }: { matchId: string; request: UpdateMatchRequest }) =>
      updateThreatMatch(matchId, user!.id, request),
    onSuccess: (_, variables) => {
      toast({
        title: 'Match Updated',
        description: 'Threat match updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['threat-matches'] });
      queryClient.invalidateQueries({ queryKey: ['threat-match', variables.matchId] });
      queryClient.invalidateQueries({ queryKey: ['threat-statistics'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update match',
      });
    },
  });
}

export function useDeleteThreatMatch() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteThreatMatch,
    onSuccess: () => {
      toast({
        title: 'Match Deleted',
        description: 'Threat match deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['threat-matches'] });
      queryClient.invalidateQueries({ queryKey: ['threat-statistics'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete match',
      });
    },
  });
}

// ============================================================
// Statistics Hooks
// ============================================================

export function useThreatStatistics() {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['threat-statistics', tenantId],
    queryFn: () => fetchThreatStatistics(tenantId!),
    enabled: !!tenantId,
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useSearchIndicator(value: string | undefined) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['search-indicator', tenantId, value],
    queryFn: () => searchIndicatorByValue(tenantId!, value!),
    enabled: !!tenantId && !!value && value.length > 2,
  });
}

// ============================================================
// Edge Functions Integration Hooks
// ============================================================

export function useSyncFeed() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feedId: string) => {
      const { data, error } = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/threat-intel-sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ feed_id: feedId }),
        }
      ).then(res => res.json());

      if (error) throw new Error(error);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Sync Complete',
        description: `Added ${data.indicators_added} indicators, updated ${data.indicators_updated}`,
      });
      queryClient.invalidateQueries({ queryKey: ['threat-feeds'] });
      queryClient.invalidateQueries({ queryKey: ['threat-indicators'] });
      queryClient.invalidateQueries({ queryKey: ['threat-statistics'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Failed to sync feed',
      });
    },
  });
}
