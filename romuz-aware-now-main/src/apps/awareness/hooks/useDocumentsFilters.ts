/**
 * Documents Filters Hook
 * Gate-D3: Documents Module - D1 Standard
 * 
 * React hook for managing documents filters with URL state synchronization
 */

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Document } from '@/modules/documents';

export interface DocumentsFilters {
  search: string;
  status: string;
  doc_type: string;
  linked_module: string;
  created_by: string;
}

export interface DocumentsSortConfig {
  field: keyof Document | null;
  direction: 'asc' | 'desc' | null;
}

const defaultFilters: DocumentsFilters = {
  search: '',
  status: '',
  doc_type: '',
  linked_module: '',
  created_by: '',
};

export function useDocumentsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<DocumentsFilters>(defaultFilters);
  const [sortConfig, setSortConfig] = useState<DocumentsSortConfig>({
    field: null,
    direction: null,
  });

  // Initialize filters from URL on mount
  useEffect(() => {
    const urlFilters: DocumentsFilters = { ...defaultFilters };

    if (searchParams.has('search')) urlFilters.search = searchParams.get('search') || '';
    if (searchParams.has('status')) urlFilters.status = searchParams.get('status') || '';
    if (searchParams.has('doc_type')) urlFilters.doc_type = searchParams.get('doc_type') || '';
    if (searchParams.has('linked_module')) urlFilters.linked_module = searchParams.get('linked_module') || '';
    if (searchParams.has('created_by')) urlFilters.created_by = searchParams.get('created_by') || '';

    setFilters(urlFilters);

    // Sort config
    if (searchParams.has('sortBy')) {
      const sortBy = searchParams.get('sortBy') as keyof Document;
      const sortDir = searchParams.get('sortDir') as 'asc' | 'desc';
      setSortConfig({ field: sortBy, direction: sortDir || 'asc' });
    }
  }, []);

  // Update filters and sync to URL
  const updateFilters = useCallback((newFilters: Partial<DocumentsFilters>) => {
    setFilters((prev) => {
      const updated = { ...prev, ...newFilters };
      
      // Sync to URL
      const params = new URLSearchParams(searchParams);
      
      Object.entries(updated).forEach(([key, value]) => {
        if (value && value !== '') {
          params.set(key, String(value));
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
  const updateSort = useCallback((field: keyof Document) => {
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

  // Apply filters to documents list
  const applyFilters = useCallback((documents: Document[]): Document[] => {
    return documents.filter((document) => {
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesSearch =
          document.title.toLowerCase().includes(search) ||
          (document.description && document.description.toLowerCase().includes(search));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'all') {
        if (document.status !== filters.status) return false;
      }

      // Doc Type filter
      if (filters.doc_type && filters.doc_type !== 'all') {
        if (document.doc_type !== filters.doc_type) return false;
      }

      // Linked Module filter
      if (filters.linked_module && filters.linked_module !== 'all') {
        if (document.linked_module !== filters.linked_module) return false;
      }

      // Created By filter
      if (filters.created_by && filters.created_by !== 'all') {
        if (document.created_by !== filters.created_by) return false;
      }

      return true;
    });
  }, [filters]);

  // Apply sorting to filtered documents
  const applySort = useCallback((documents: Document[]): Document[] => {
    if (!sortConfig.field || !sortConfig.direction) {
      return documents;
    }

    return [...documents].sort((a, b) => {
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
