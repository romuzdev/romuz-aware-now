/**
 * M17: Knowledge Hub - useKnowledgeSearch Hook
 * React hook for semantic search functionality
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchKnowledge } from '@/integrations/supabase/knowledge-hub';
import { useToast } from '@/core/components/ui/use-toast';

export function useKnowledgeSearch() {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    documentType: undefined as string | undefined,
    category: undefined as string | undefined,
    limit: 10,
    // Lower threshold to make semantic search less strict and return more results
    threshold: 0.2,
  });

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['knowledge-search', query, filters],
    queryFn: async () => {
      if (!query.trim()) {
        return { results: [], count: 0 };
      }

      try {
        return await searchKnowledge({
          query,
          ...filters,
        });
      } catch (err) {
        console.error('Search error:', err);
        toast({
          title: 'خطأ في البحث',
          description: err instanceof Error ? err.message : 'حدث خطأ أثناء البحث',
          variant: 'destructive',
        });
        throw err;
      }
    },
    enabled: query.trim().length > 0,
  });

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
  };

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  return {
    query,
    filters,
    results: data?.results || [],
    count: data?.count || 0,
    isLoading,
    error,
    handleSearch,
    updateFilters,
    refetch,
  };
}
