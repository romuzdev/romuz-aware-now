/**
 * Policies Filters Hook
 * Gate-D2: Policies Module - D1 Standard
 * 
 * React hook for managing policies filters with URL state synchronization
 */

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Policy } from '@/modules/policies';

export interface PoliciesFilters {
  search: string;
  status: string;
  category: string;
  owner: string;
  lastReviewFrom: Date | null;
  lastReviewTo: Date | null;
  nextReviewFrom: Date | null;
  nextReviewTo: Date | null;
}

export interface PoliciesSortConfig {
  field: keyof Policy | null;
  direction: 'asc' | 'desc' | null;
}

const defaultFilters: PoliciesFilters = {
  search: '',
  status: '',
  category: '',
  owner: '',
  lastReviewFrom: null,
  lastReviewTo: null,
  nextReviewFrom: null,
  nextReviewTo: null,
};

export function usePoliciesFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<PoliciesFilters>(defaultFilters);
  const [sortConfig, setSortConfig] = useState<PoliciesSortConfig>({
    field: null,
    direction: null,
  });

  // Initialize filters from URL on mount
  useEffect(() => {
    const urlFilters: PoliciesFilters = { ...defaultFilters };

    if (searchParams.has('search')) urlFilters.search = searchParams.get('search') || '';
    if (searchParams.has('status')) urlFilters.status = searchParams.get('status') || '';
    if (searchParams.has('category')) urlFilters.category = searchParams.get('category') || '';
    if (searchParams.has('owner')) urlFilters.owner = searchParams.get('owner') || '';
    
    if (searchParams.has('lastReviewFrom')) {
      const date = searchParams.get('lastReviewFrom');
      urlFilters.lastReviewFrom = date ? new Date(date) : null;
    }
    if (searchParams.has('lastReviewTo')) {
      const date = searchParams.get('lastReviewTo');
      urlFilters.lastReviewTo = date ? new Date(date) : null;
    }
    if (searchParams.has('nextReviewFrom')) {
      const date = searchParams.get('nextReviewFrom');
      urlFilters.nextReviewFrom = date ? new Date(date) : null;
    }
    if (searchParams.has('nextReviewTo')) {
      const date = searchParams.get('nextReviewTo');
      urlFilters.nextReviewTo = date ? new Date(date) : null;
    }

    setFilters(urlFilters);

    // Sort config
    if (searchParams.has('sortBy')) {
      const sortBy = searchParams.get('sortBy') as keyof Policy;
      const sortDir = searchParams.get('sortDir') as 'asc' | 'desc';
      setSortConfig({ field: sortBy, direction: sortDir || 'asc' });
    }
  }, []);

  // Update filters and sync to URL
  const updateFilters = useCallback((newFilters: Partial<PoliciesFilters>) => {
    setFilters((prev) => {
      const updated = { ...prev, ...newFilters };
      
      // Sync to URL
      const params = new URLSearchParams(searchParams);
      
      Object.entries(updated).forEach(([key, value]) => {
        if (value && value !== '') {
          if (value instanceof Date) {
            params.set(key, value.toISOString().split('T')[0]);
          } else {
            params.set(key, String(value));
          }
        } else {
          params.delete(key);
        }
      });

      setSearchParams(params);
      return updated;
    });
  }, [searchParams, setSearchParams]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    const params = new URLSearchParams(searchParams);
    
    // Keep only sortBy and sortDir
    const sortBy = params.get('sortBy');
    const sortDir = params.get('sortDir');
    params.forEach((_, key) => {
      if (key !== 'sortBy' && key !== 'sortDir') {
        params.delete(key);
      }
    });
    
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  // Update sort config and sync to URL
  const updateSort = useCallback((field: keyof Policy) => {
    setSortConfig((prev) => {
      let newDirection: 'asc' | 'desc' | null = 'asc';
      
      if (prev.field === field) {
        if (prev.direction === 'asc') newDirection = 'desc';
        else if (prev.direction === 'desc') newDirection = null;
      }

      const params = new URLSearchParams(searchParams);
      if (newDirection) {
        params.set('sortBy', field);
        params.set('sortDir', newDirection);
      } else {
        params.delete('sortBy');
        params.delete('sortDir');
      }
      setSearchParams(params);

      return {
        field: newDirection ? field : null,
        direction: newDirection,
      };
    });
  }, [searchParams, setSearchParams]);

  // Apply filters to policies list
  const applyFilters = useCallback((policies: Policy[]): Policy[] => {
    return policies.filter((policy) => {
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesSearch =
          policy.code.toLowerCase().includes(search) ||
          policy.title.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'all') {
        if (policy.status !== filters.status) return false;
      }

      // Category filter
      if (filters.category && filters.category !== 'all') {
        if (policy.category !== filters.category) return false;
      }

      // Owner filter
      if (filters.owner && filters.owner !== 'all') {
        if (policy.owner !== filters.owner) return false;
      }

      // Last Review Date filters
      if (filters.lastReviewFrom && policy.last_review_date) {
        const reviewDate = new Date(policy.last_review_date);
        if (reviewDate < filters.lastReviewFrom) return false;
      }
      if (filters.lastReviewTo && policy.last_review_date) {
        const reviewDate = new Date(policy.last_review_date);
        if (reviewDate > filters.lastReviewTo) return false;
      }

      // Next Review Date filters
      if (filters.nextReviewFrom && policy.next_review_date) {
        const nextDate = new Date(policy.next_review_date);
        if (nextDate < filters.nextReviewFrom) return false;
      }
      if (filters.nextReviewTo && policy.next_review_date) {
        const nextDate = new Date(policy.next_review_date);
        if (nextDate > filters.nextReviewTo) return false;
      }

      return true;
    });
  }, [filters]);

  // Apply sorting to filtered policies
  const applySort = useCallback((policies: Policy[]): Policy[] => {
    if (!sortConfig.field || !sortConfig.direction) {
      return policies;
    }

    return [...policies].sort((a, b) => {
      const aValue = a[sortConfig.field!];
      const bValue = b[sortConfig.field!];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Compare values
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [sortConfig]);

  return {
    filters,
    sortConfig,
    updateFilters,
    clearFilters,
    updateSort,
    applyFilters,
    applySort,
  };
}
