/**
 * Performance: Prefetching Utilities
 * 
 * Helper functions to prefetch data before user navigation
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Prefetch data when user hovers over a link
 * Usage: <Link onMouseEnter={() => prefetchOnHover(queryClient, queryKey, queryFn)}>
 */
export const prefetchOnHover = async <T>(
  queryClient: QueryClient,
  queryKey: unknown[],
  queryFn: () => Promise<T>
) => {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: 30 * 1000, // 30 seconds
  });
};

/**
 * Prefetch multiple queries in parallel
 */
export const prefetchMultiple = async (
  queryClient: QueryClient,
  queries: Array<{
    queryKey: unknown[];
    queryFn: () => Promise<unknown>;
  }>
) => {
  await Promise.all(
    queries.map(({ queryKey, queryFn }) =>
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: 30 * 1000,
      })
    )
  );
};
