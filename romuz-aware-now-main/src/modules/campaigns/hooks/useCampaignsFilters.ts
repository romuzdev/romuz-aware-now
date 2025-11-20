import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

// Campaign filters shape
export type CampaignFilters = {
  q: string;                    // name search
  status: string;               // 'all' | 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled'
  from: string | null;          // start_date >= (yyyy-mm-dd)
  to: string | null;            // end_date <= (yyyy-mm-dd)
  owner: string;                // owner_name search
  includeArchived: boolean;
  pageSize: number;             // 10 | 25 | 50 | 100
  sortBy: string;               // 'start_date' | 'end_date' | 'name' | 'status' | 'created_at'
  sortDir: 'asc' | 'desc';
};

export const DEFAULTS: CampaignFilters = {
  q: '',
  status: 'all',
  from: null,
  to: null,
  owner: '',
  includeArchived: false,
  pageSize: 10,
  sortBy: 'start_date',
  sortDir: 'desc',
};

/**
 * useCampaignsFilters - Centralized filters + URL sync
 * 
 * NOTE: Saved Views are now handled by server-side hooks (useSavedViews).
 * This hook only manages in-memory filters and URL synchronization.
 * 
 * Usage:
 *   const { filters, setFilters, DEFAULTS } = useCampaignsFilters();
 *   
 *   // Update filters
 *   setFilters({ q: 'Security' });
 */
export function useCampaignsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Parse URL params → filters state
  const initialFilters = useMemo((): CampaignFilters => {
    return {
      q: searchParams.get('q') || DEFAULTS.q,
      status: searchParams.get('status') || DEFAULTS.status,
      from: searchParams.get('from') || DEFAULTS.from,
      to: searchParams.get('to') || DEFAULTS.to,
      owner: searchParams.get('owner') || DEFAULTS.owner,
      includeArchived: searchParams.get('arch') === '1',
      pageSize: parseInt(searchParams.get('ps') || String(DEFAULTS.pageSize), 10),
      sortBy: searchParams.get('sb') || DEFAULTS.sortBy,
      sortDir: (searchParams.get('sd') as 'asc' | 'desc') || DEFAULTS.sortDir,
    };
  }, [searchParams]);

  const [filters, setFiltersState] = useState<CampaignFilters>(initialFilters);

  // Sync filters → URL (write minimal params only)
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.q && filters.q !== DEFAULTS.q) params.set('q', filters.q);
    if (filters.status && filters.status !== DEFAULTS.status) params.set('status', filters.status);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.owner && filters.owner !== DEFAULTS.owner) params.set('owner', filters.owner);
    if (filters.includeArchived) params.set('arch', '1');
    if (filters.pageSize !== DEFAULTS.pageSize) params.set('ps', String(filters.pageSize));
    if (filters.sortBy !== DEFAULTS.sortBy) params.set('sb', filters.sortBy);
    if (filters.sortDir !== DEFAULTS.sortDir) params.set('sd', filters.sortDir);

    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Update filters (supports partial updates or updater function)
  const setFilters = (updater: Partial<CampaignFilters> | ((prev: CampaignFilters) => CampaignFilters)) => {
    if (typeof updater === 'function') {
      setFiltersState(updater);
    } else {
      setFiltersState(prev => ({ ...prev, ...updater }));
    }
  };

  return {
    filters,
    setFilters,
    DEFAULTS,
  };
}
