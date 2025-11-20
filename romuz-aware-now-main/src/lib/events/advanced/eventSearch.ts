/**
 * Advanced Event Search System
 * 
 * Powerful search and filtering capabilities for events
 */

import type { SystemEvent, EventCategory, EventPriority } from '../event.types';

export interface SearchFilters {
  query?: string;
  categories?: EventCategory[];
  priorities?: EventPriority[];
  eventTypes?: string[];
  modules?: string[];
  entityTypes?: string[];
  dateFrom?: string;
  dateTo?: string;
  userIds?: string[];
  status?: string[];
  hasPayload?: boolean;
  payloadKeys?: string[];
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'priority' | 'event_type';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  events: SystemEvent[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export class EventSearchEngine {
  /**
   * Search events with filters
   */
  async search(
    events: SystemEvent[],
    filters: SearchFilters,
    options: SearchOptions = {}
  ): Promise<SearchResult> {
    const {
      limit = 50,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = options;

    console.log('🔍 Searching events with filters:', filters);

    // Apply filters
    let filtered = this.applyFilters(events, filters);

    // Apply sorting
    filtered = this.applySorting(filtered, sortBy, sortOrder);

    // Calculate pagination
    const total = filtered.length;
    const page = Math.floor(offset / limit) + 1;
    const pageSize = limit;
    const hasMore = offset + limit < total;

    // Apply pagination
    const paginated = filtered.slice(offset, offset + limit);

    return {
      events: paginated,
      total,
      page,
      pageSize,
      hasMore,
    };
  }

  /**
   * Apply search filters
   */
  private applyFilters(events: SystemEvent[], filters: SearchFilters): SystemEvent[] {
    return events.filter(event => {
      // Text query filter (searches in event_type and payload)
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const matchesType = event.event_type.toLowerCase().includes(query);
        const matchesPayload = JSON.stringify(event.payload).toLowerCase().includes(query);
        
        if (!matchesType && !matchesPayload) {
          return false;
        }
      }

      // Category filter
      if (filters.categories && filters.categories.length > 0) {
        if (!filters.categories.includes(event.event_category)) {
          return false;
        }
      }

      // Priority filter
      if (filters.priorities && filters.priorities.length > 0) {
        if (!filters.priorities.includes(event.priority)) {
          return false;
        }
      }

      // Event types filter
      if (filters.eventTypes && filters.eventTypes.length > 0) {
        if (!filters.eventTypes.includes(event.event_type)) {
          return false;
        }
      }

      // Modules filter
      if (filters.modules && filters.modules.length > 0) {
        if (!filters.modules.includes(event.source_module)) {
          return false;
        }
      }

      // Entity types filter
      if (filters.entityTypes && filters.entityTypes.length > 0) {
        if (!event.entity_type || !filters.entityTypes.includes(event.entity_type)) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateFrom) {
        if (new Date(event.created_at) < new Date(filters.dateFrom)) {
          return false;
        }
      }
      if (filters.dateTo) {
        if (new Date(event.created_at) > new Date(filters.dateTo)) {
          return false;
        }
      }

      // User IDs filter
      if (filters.userIds && filters.userIds.length > 0) {
        if (!event.user_id || !filters.userIds.includes(event.user_id)) {
          return false;
        }
      }

      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(event.status)) {
          return false;
        }
      }

      // Payload existence filter
      if (filters.hasPayload !== undefined) {
        const hasPayload = Object.keys(event.payload).length > 0;
        if (hasPayload !== filters.hasPayload) {
          return false;
        }
      }

      // Payload keys filter
      if (filters.payloadKeys && filters.payloadKeys.length > 0) {
        const payloadKeys = Object.keys(event.payload);
        const hasAllKeys = filters.payloadKeys.every(key => payloadKeys.includes(key));
        if (!hasAllKeys) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Apply sorting
   */
  private applySorting(
    events: SystemEvent[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): SystemEvent[] {
    return [...events].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'priority':
          const priorityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'event_type':
          comparison = a.event_type.localeCompare(b.event_type);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Get search suggestions based on query
   */
  getSuggestions(events: SystemEvent[], query: string, limit = 10): string[] {
    const lowerQuery = query.toLowerCase();
    const suggestions = new Set<string>();

    // Get event type suggestions
    events.forEach(event => {
      if (event.event_type.toLowerCase().includes(lowerQuery)) {
        suggestions.add(event.event_type);
      }

      // Get payload key suggestions
      Object.keys(event.payload).forEach(key => {
        if (key.toLowerCase().includes(lowerQuery)) {
          suggestions.add(key);
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Build query from filters (for display/sharing)
   */
  buildQueryString(filters: SearchFilters): string {
    const parts: string[] = [];

    if (filters.query) parts.push(`query:"${filters.query}"`);
    if (filters.categories) parts.push(`categories:${filters.categories.join(',')}`);
    if (filters.priorities) parts.push(`priorities:${filters.priorities.join(',')}`);
    if (filters.dateFrom) parts.push(`from:${filters.dateFrom}`);
    if (filters.dateTo) parts.push(`to:${filters.dateTo}`);

    return parts.join(' ');
  }
}

/**
 * Global search engine instance
 */
export const eventSearchEngine = new EventSearchEngine();
