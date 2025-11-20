/**
 * Performance: React Query Configuration
 * 
 * Optimized configuration for React Query
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Create optimized QueryClient instance
 */
export function createOptimizedQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60 * 1000, // 2 minutes default
        gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 0, // Don't retry mutations by default
      },
    },
  });
}
