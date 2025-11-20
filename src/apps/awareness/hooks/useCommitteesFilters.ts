/**
 * Committees Filters Hook
 * Gate-K: D4 Upgrade - D1 Standard
 * 
 * Manages filters, URL state, and saved views for Committees list
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSavedViews } from '@/core/hooks/saved-views/useSavedViews';
import { useSavedViewsImport } from '@/core/hooks/saved-views/useSavedViewsImport';

export type CommitteeFilters = {
  search: string;
  status: string;
  dateFrom?: string;
  dateTo?: string;
};

const DEFAULT_FILTERS: CommitteeFilters = {
  search: '',
  status: 'all',
};

/**
 * Hook for managing Committees filters with URL state and saved views
 * 
 * Features:
 * - URL state synchronization
 * - Saved views integration
 * - Auto-apply default view on mount
 * - localStorage migration (one-time)
 */
export function useCommitteesFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFiltersState] = useState<CommitteeFilters>(DEFAULT_FILTERS);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Saved views integration
  const {
    views,
    loading: viewsLoading,
    createView,
    applyView,
    deleteView,
    setDefault,
    getDefaultView,
  } = useSavedViews({ pageKey: 'committees:list' });

  // One-time migration from localStorage
  const { importing } = useSavedViewsImport({ pageKey: 'committees:list' });

  /**
   * Parse filters from URL search params
   */
  const parseFiltersFromURL = useCallback((): CommitteeFilters => {
    return {
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || 'all',
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
    };
  }, [searchParams]);

  /**
   * Sync filters to URL
   */
  const syncFiltersToURL = useCallback((newFilters: CommitteeFilters) => {
    const params = new URLSearchParams();
    
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.status && newFilters.status !== 'all') params.set('status', newFilters.status);
    if (newFilters.dateFrom) params.set('dateFrom', newFilters.dateFrom);
    if (newFilters.dateTo) params.set('dateTo', newFilters.dateTo);

    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  /**
   * Update filters (both state and URL)
   */
  const setFilters = useCallback((newFilters: Partial<CommitteeFilters>) => {
    setFiltersState(prev => {
      const updated = { ...prev, ...newFilters };
      syncFiltersToURL(updated);
      return updated;
    });
  }, [syncFiltersToURL]);

  /**
   * Reset filters to default
   */
  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  /**
   * Apply saved view
   */
  const applySavedView = useCallback((viewId: string) => {
    const viewFilters = applyView(viewId);
    if (viewFilters) {
      setFiltersState(viewFilters);
      syncFiltersToURL(viewFilters);
    }
  }, [applyView, syncFiltersToURL]);

  /**
   * Save current filters as view
   */
  const saveCurrentView = useCallback(async (name: string) => {
    await createView(name, filters);
  }, [createView, filters]);

  /**
   * Initialize filters from URL or default view
   */
  useEffect(() => {
    if (hasInitialized || viewsLoading || importing) return;

    // Check if URL has filters
    const urlFilters = parseFiltersFromURL();
    const hasURLFilters = Object.values(urlFilters).some(
      (value, index) => value !== Object.values(DEFAULT_FILTERS)[index]
    );

    if (hasURLFilters) {
      // Use URL filters
      setFiltersState(urlFilters);
    } else {
      // Try to apply default view
      const defaultView = getDefaultView();
      if (defaultView) {
        setFiltersState(defaultView.filters);
        syncFiltersToURL(defaultView.filters);
      } else {
        // Use default filters
        setFiltersState(DEFAULT_FILTERS);
      }
    }

    setHasInitialized(true);
  }, [
    hasInitialized,
    viewsLoading,
    importing,
    parseFiltersFromURL,
    getDefaultView,
    syncFiltersToURL,
  ]);

  /**
   * Sync URL changes to filters state
   */
  useEffect(() => {
    if (!hasInitialized) return;
    
    const urlFilters = parseFiltersFromURL();
    setFiltersState(urlFilters);
  }, [searchParams, hasInitialized, parseFiltersFromURL]);

  return {
    filters,
    setFilters,
    resetFilters,
    
    // Saved views
    savedViews: views,
    applySavedView,
    saveCurrentView,
    deleteSavedView: deleteView,
    setDefaultView: setDefault,
    
    // Loading states
    isLoadingViews: viewsLoading || importing,
  };
}
