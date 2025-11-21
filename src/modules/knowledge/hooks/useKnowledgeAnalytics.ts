/**
 * M17: Knowledge Hub - Analytics Hook
 * Track and analyze knowledge hub usage
 */

import { useQuery } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import {
  getQueryAnalytics,
  getPoorlyPerformingQueries,
  getUnansweredQueries,
} from '@/integrations/supabase/knowledge-queries';
import { getEmbeddingStats } from '@/integrations/supabase/knowledge-embeddings';
import { getArticleStats } from '@/integrations/supabase/knowledge-articles';

/**
 * Get comprehensive knowledge hub analytics
 */
export function useKnowledgeAnalytics(days = 30) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['knowledge-analytics', tenantId, days],
    queryFn: async () => {
      const [queryAnalytics, articleStats, embeddingStats] = await Promise.all([
        getQueryAnalytics(tenantId!, days),
        getArticleStats(tenantId!),
        getEmbeddingStats(tenantId!),
      ]);

      return {
        queries: queryAnalytics,
        articles: articleStats,
        embeddings: embeddingStats,
      };
    },
    enabled: !!tenantId,
  });
}

/**
 * Get poorly performing queries for improvement
 */
export function usePoorlyPerformingQueries(limit = 20) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['poorly-performing-queries', tenantId, limit],
    queryFn: () => getPoorlyPerformingQueries(tenantId!, limit),
    enabled: !!tenantId,
  });
}

/**
 * Get unanswered queries
 */
export function useUnansweredQueries(limit = 20) {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['unanswered-queries', tenantId, limit],
    queryFn: () => getUnansweredQueries(tenantId!, limit),
    enabled: !!tenantId,
  });
}
