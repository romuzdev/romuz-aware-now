/**
 * GRC Performance Utilities
 * 
 * Performance optimization helpers:
 * - Query caching strategies
 * - Data pagination
 * - Optimistic updates
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * GRC Query Keys
 * Centralized query keys for consistent caching
 */
export const grcQueryKeys = {
  // Risk queries
  risks: {
    all: ['grc', 'risks'] as const,
    lists: () => [...grcQueryKeys.risks.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => 
      [...grcQueryKeys.risks.lists(), { filters }] as const,
    details: () => [...grcQueryKeys.risks.all, 'detail'] as const,
    detail: (id: string) => [...grcQueryKeys.risks.details(), id] as const,
    statistics: () => [...grcQueryKeys.risks.all, 'statistics'] as const,
  },
  
  // Control queries
  controls: {
    all: ['grc', 'controls'] as const,
    lists: () => [...grcQueryKeys.controls.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => 
      [...grcQueryKeys.controls.lists(), { filters }] as const,
    details: () => [...grcQueryKeys.controls.all, 'detail'] as const,
    detail: (id: string) => [...grcQueryKeys.controls.details(), id] as const,
    statistics: () => [...grcQueryKeys.controls.all, 'statistics'] as const,
  },
  
  // Treatment plan queries
  treatmentPlans: {
    all: ['grc', 'treatment-plans'] as const,
    byRisk: (riskId: string) => 
      [...grcQueryKeys.treatmentPlans.all, 'risk', riskId] as const,
    detail: (id: string) => 
      [...grcQueryKeys.treatmentPlans.all, 'detail', id] as const,
  },
  
  // Control test queries
  controlTests: {
    all: ['grc', 'control-tests'] as const,
    lists: () => [...grcQueryKeys.controlTests.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => 
      [...grcQueryKeys.controlTests.lists(), { filters }] as const,
    byControl: (controlId: string) => 
      [...grcQueryKeys.controlTests.all, 'control', controlId] as const,
    detail: (id: string) => 
      [...grcQueryKeys.controlTests.all, 'detail', id] as const,
    statistics: () => [...grcQueryKeys.controlTests.all, 'statistics'] as const,
  },
} as const;

/**
 * GRC Query Cache Configuration
 * Optimized cache times for different query types
 */
export const grcQueryConfig = {
  // List queries - moderate staleness
  lists: {
    staleTime: 1000 * 60 * 2, // 2 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
  },
  
  // Detail queries - longer staleness
  details: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 15, // 15 minutes
  },
  
  // Statistics - shorter staleness
  statistics: {
    staleTime: 1000 * 60 * 1, // 1 minute
    cacheTime: 1000 * 60 * 5, // 5 minutes
  },
} as const;

/**
 * Invalidate related GRC queries
 * Helper to invalidate related queries after mutations
 */
export const invalidateGRCQueries = async (
  queryClient: QueryClient,
  entity: 'risk' | 'control' | 'treatment-plan' | 'control-test',
  id?: string
) => {
  switch (entity) {
    case 'risk':
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: grcQueryKeys.risks.all }),
        id && queryClient.invalidateQueries({ 
          queryKey: grcQueryKeys.treatmentPlans.byRisk(id) 
        }),
      ]);
      break;
      
    case 'control':
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: grcQueryKeys.controls.all }),
        id && queryClient.invalidateQueries({ 
          queryKey: grcQueryKeys.controlTests.byControl(id) 
        }),
      ]);
      break;
      
    case 'treatment-plan':
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: grcQueryKeys.treatmentPlans.all }),
        queryClient.invalidateQueries({ queryKey: grcQueryKeys.risks.all }),
      ]);
      break;
      
    case 'control-test':
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: grcQueryKeys.controlTests.all }),
        queryClient.invalidateQueries({ queryKey: grcQueryKeys.controls.all }),
      ]);
      break;
  }
};

/**
 * Optimistic update helper
 * Update cache optimistically before server response
 */
export const optimisticUpdate = <T>(
  queryClient: QueryClient,
  queryKey: unknown[],
  updater: (old: T | undefined) => T
) => {
  queryClient.setQueryData<T>(queryKey, updater);
};

/**
 * Pagination helper
 * Calculate pagination parameters
 */
export const calculatePagination = (
  page: number,
  pageSize: number
) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  
  return { from, to };
};
