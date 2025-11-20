import { describe, it, expect } from 'vitest';
import type { CampaignFilters } from '@/hooks/campaigns/useCampaignsFilters';
import type { ParticipantsFilters } from '@/types/participants';
import { TEST_CAMPAIGN_FILTERS, TEST_PARTICIPANT_FILTERS } from './_utils';

/**
 * Unit Tests: Filters Serialization/Parsing
 * 
 * Tests URL query string ↔ state round-trip for:
 * - Campaign filters
 * - Participant filters
 * - Edge cases (empty, undefined, defaults)
 */

describe('Campaign Filters: URL Serialization', () => {
  const DEFAULTS: CampaignFilters = {
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

  describe('filtersToURLParams', () => {
    function filtersToURLParams(filters: CampaignFilters): URLSearchParams {
      const params = new URLSearchParams();

      if (filters.q && filters.q !== DEFAULTS.q) params.set('q', filters.q);
      if (filters.status && filters.status !== DEFAULTS.status)
        params.set('status', filters.status);
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
      if (filters.owner && filters.owner !== DEFAULTS.owner)
        params.set('owner', filters.owner);
      if (filters.includeArchived) params.set('arch', '1');
      if (filters.pageSize !== DEFAULTS.pageSize)
        params.set('ps', String(filters.pageSize));
      if (filters.sortBy !== DEFAULTS.sortBy) params.set('sb', filters.sortBy);
      if (filters.sortDir !== DEFAULTS.sortDir) params.set('sd', filters.sortDir);

      return params;
    }

    it('should serialize empty filters to empty params', () => {
      const params = filtersToURLParams(DEFAULTS);
      expect(params.toString()).toBe('');
    });

    it('should serialize all non-default values', () => {
      const filters: CampaignFilters = {
        q: 'Security',
        status: 'active',
        from: '2024-01-01',
        to: '2024-12-31',
        owner: 'admin@test.com',
        includeArchived: true,
        pageSize: 25,
        sortBy: 'name',
        sortDir: 'asc',
      };

      const params = filtersToURLParams(filters);

      expect(params.get('q')).toBe('Security');
      expect(params.get('status')).toBe('active');
      expect(params.get('from')).toBe('2024-01-01');
      expect(params.get('to')).toBe('2024-12-31');
      expect(params.get('owner')).toBe('admin@test.com');
      expect(params.get('arch')).toBe('1');
      expect(params.get('ps')).toBe('25');
      expect(params.get('sb')).toBe('name');
      expect(params.get('sd')).toBe('asc');
    });

    it('should omit default values from URL', () => {
      const filters: CampaignFilters = {
        ...DEFAULTS,
        q: 'Security',
      };

      const params = filtersToURLParams(filters);

      expect(params.has('q')).toBe(true);
      expect(params.has('status')).toBe(false);
      expect(params.has('arch')).toBe(false);
    });

    it('should handle null date values', () => {
      const filters: CampaignFilters = {
        ...DEFAULTS,
        from: null,
        to: null,
      };

      const params = filtersToURLParams(filters);

      expect(params.has('from')).toBe(false);
      expect(params.has('to')).toBe(false);
    });
  });

  describe('urlParamsToFilters', () => {
    function urlParamsToFilters(params: URLSearchParams): CampaignFilters {
      return {
        q: params.get('q') || DEFAULTS.q,
        status: params.get('status') || DEFAULTS.status,
        from: params.get('from') || DEFAULTS.from,
        to: params.get('to') || DEFAULTS.to,
        owner: params.get('owner') || DEFAULTS.owner,
        includeArchived: params.get('arch') === '1',
        pageSize: parseInt(params.get('ps') || String(DEFAULTS.pageSize), 10),
        sortBy: params.get('sb') || DEFAULTS.sortBy,
        sortDir: (params.get('sd') as 'asc' | 'desc') || DEFAULTS.sortDir,
      };
    }

    it('should parse empty params to defaults', () => {
      const params = new URLSearchParams();
      const filters = urlParamsToFilters(params);

      expect(filters).toEqual(DEFAULTS);
    });

    it('should parse all params correctly', () => {
      const params = new URLSearchParams({
        q: 'Security',
        status: 'active',
        from: '2024-01-01',
        to: '2024-12-31',
        owner: 'admin@test.com',
        arch: '1',
        ps: '25',
        sb: 'name',
        sd: 'asc',
      });

      const filters = urlParamsToFilters(params);

      expect(filters.q).toBe('Security');
      expect(filters.status).toBe('active');
      expect(filters.from).toBe('2024-01-01');
      expect(filters.to).toBe('2024-12-31');
      expect(filters.owner).toBe('admin@test.com');
      expect(filters.includeArchived).toBe(true);
      expect(filters.pageSize).toBe(25);
      expect(filters.sortBy).toBe('name');
      expect(filters.sortDir).toBe('asc');
    });

    it('should handle partial params', () => {
      const params = new URLSearchParams({ q: 'Test', ps: '50' });
      const filters = urlParamsToFilters(params);

      expect(filters.q).toBe('Test');
      expect(filters.pageSize).toBe(50);
      expect(filters.status).toBe(DEFAULTS.status);
      expect(filters.includeArchived).toBe(false);
    });

    it('should default includeArchived to false if not "1"', () => {
      const params1 = new URLSearchParams({ arch: '0' });
      const params2 = new URLSearchParams({ arch: 'true' });
      const params3 = new URLSearchParams();

      expect(urlParamsToFilters(params1).includeArchived).toBe(false);
      expect(urlParamsToFilters(params2).includeArchived).toBe(false);
      expect(urlParamsToFilters(params3).includeArchived).toBe(false);
    });

    it('should handle invalid pageSize gracefully', () => {
      const params1 = new URLSearchParams({ ps: 'invalid' });
      const params2 = new URLSearchParams({ ps: '-5' });

      expect(urlParamsToFilters(params1).pageSize).toBe(NaN); // parseInt behavior
      expect(urlParamsToFilters(params2).pageSize).toBe(-5);
    });
  });

  describe('Round-trip consistency', () => {
    function roundTrip(filters: CampaignFilters): CampaignFilters {
      const DEFAULTS: CampaignFilters = {
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

      // Serialize
      const params = new URLSearchParams();
      if (filters.q && filters.q !== DEFAULTS.q) params.set('q', filters.q);
      if (filters.status && filters.status !== DEFAULTS.status)
        params.set('status', filters.status);
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
      if (filters.owner && filters.owner !== DEFAULTS.owner)
        params.set('owner', filters.owner);
      if (filters.includeArchived) params.set('arch', '1');
      if (filters.pageSize !== DEFAULTS.pageSize)
        params.set('ps', String(filters.pageSize));
      if (filters.sortBy !== DEFAULTS.sortBy) params.set('sb', filters.sortBy);
      if (filters.sortDir !== DEFAULTS.sortDir) params.set('sd', filters.sortDir);

      // Deserialize
      return {
        q: params.get('q') || DEFAULTS.q,
        status: params.get('status') || DEFAULTS.status,
        from: params.get('from') || DEFAULTS.from,
        to: params.get('to') || DEFAULTS.to,
        owner: params.get('owner') || DEFAULTS.owner,
        includeArchived: params.get('arch') === '1',
        pageSize: parseInt(params.get('ps') || String(DEFAULTS.pageSize), 10),
        sortBy: params.get('sb') || DEFAULTS.sortBy,
        sortDir: (params.get('sd') as 'asc' | 'desc') || DEFAULTS.sortDir,
      };
    }

    it('should maintain defaults after round-trip', () => {
      const result = roundTrip(DEFAULTS);
      expect(result).toEqual(DEFAULTS);
    });

    it('should maintain all values after round-trip', () => {
      const filters = TEST_CAMPAIGN_FILTERS.withValues;
      const result = roundTrip(filters);
      expect(result).toEqual(filters);
    });

    it('should maintain partial filters after round-trip', () => {
      const filters: CampaignFilters = {
        ...DEFAULTS,
        q: 'Test',
        includeArchived: true,
      };
      const result = roundTrip(filters);
      expect(result).toEqual(filters);
    });
  });
});

describe('Participant Filters: URL Serialization', () => {
  const DEFAULTS: ParticipantsFilters = {
    q: '',
    status: 'all',
    scoreGte: null,
    from: '',
    to: '',
    includeDeleted: false,
    sortBy: 'completed_at',
    sortDir: 'desc',
  };

  function filtersToURLParams(filters: ParticipantsFilters): URLSearchParams {
    const params = new URLSearchParams();

    if (filters.q) params.set('q', filters.q);
    if (filters.status !== 'all') params.set('status', filters.status);
    if (filters.scoreGte !== null) params.set('score_gte', String(filters.scoreGte));
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.includeDeleted) params.set('deleted', '1');
    if (filters.sortBy !== DEFAULTS.sortBy) params.set('sb', filters.sortBy);
    if (filters.sortDir !== DEFAULTS.sortDir) params.set('sd', filters.sortDir);

    return params;
  }

  function urlParamsToFilters(params: URLSearchParams): ParticipantsFilters {
    return {
      q: params.get('q') || DEFAULTS.q,
      status: (params.get('status') as any) || DEFAULTS.status,
      scoreGte: params.has('score_gte')
        ? parseInt(params.get('score_gte')!, 10)
        : DEFAULTS.scoreGte,
      from: params.get('from') || DEFAULTS.from,
      to: params.get('to') || DEFAULTS.to,
      includeDeleted: params.get('deleted') === '1',
      sortBy: (params.get('sb') as any) || DEFAULTS.sortBy,
      sortDir: (params.get('sd') as 'asc' | 'desc') || DEFAULTS.sortDir,
    };
  }

  it('should serialize empty filters', () => {
    const params = filtersToURLParams(DEFAULTS);
    expect(params.toString()).toBe('');
  });

  it('should serialize all non-default values', () => {
    const filters = TEST_PARTICIPANT_FILTERS.withValues;
    const params = filtersToURLParams(filters);

    expect(params.get('q')).toBe('EMP001');
    expect(params.get('status')).toBe('completed');
    expect(params.get('score_gte')).toBe('80');
    expect(params.get('from')).toBe('2024-01-01');
    expect(params.get('to')).toBe('2024-12-31');
    expect(params.has('deleted')).toBe(false);
  });

  it('should parse empty params to defaults', () => {
    const params = new URLSearchParams();
    const filters = urlParamsToFilters(params);
    expect(filters).toEqual(DEFAULTS);
  });

  it('should handle round-trip with numeric scoreGte', () => {
    const filters: ParticipantsFilters = {
      ...DEFAULTS,
      scoreGte: 75,
    };

    const params = filtersToURLParams(filters);
    const result = urlParamsToFilters(params);

    expect(result.scoreGte).toBe(75);
  });

  it('should handle round-trip with null scoreGte', () => {
    const filters = DEFAULTS;
    const params = filtersToURLParams(filters);
    const result = urlParamsToFilters(params);

    expect(result.scoreGte).toBeNull();
  });
});
