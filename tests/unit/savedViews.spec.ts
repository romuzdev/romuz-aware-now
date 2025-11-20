import { describe, it, expect } from 'vitest';
import { assertImmutable } from './_utils';

/**
 * Unit Tests: Saved Views Adapter (Client-Side)
 * 
 * Tests merging current filters with saved view filters.
 * Precedence: Saved view overrides current filters.
 * Immutability: Original objects must not be mutated.
 */

type Filters = Record<string, any>;

/**
 * Merge current filters with saved view filters
 * 
 * @param current - Current filters state
 * @param saved - Saved view filters (from DB)
 * @returns New filters object (immutable)
 * 
 * Precedence: saved > current
 * - Saved view values override current values
 * - Undefined saved values keep current values
 * - Null saved values are preserved (explicit reset)
 */
function mergeSavedView(current: Filters, saved: Filters): Filters {
  return {
    ...current,
    ...saved,
  };
}

describe('Saved Views: Merge Logic', () => {
  it('should merge saved view into current filters', () => {
    const current = {
      q: 'Old Search',
      status: 'all',
      from: null,
      to: null,
    };

    const saved = {
      q: 'New Search',
      status: 'active',
    };

    const result = mergeSavedView(current, saved);

    expect(result).toEqual({
      q: 'New Search',
      status: 'active',
      from: null,
      to: null,
    });
  });

  it('should preserve current values when saved is empty', () => {
    const current = {
      q: 'Test',
      status: 'active',
      pageSize: 25,
    };

    const saved = {};

    const result = mergeSavedView(current, saved);

    expect(result).toEqual(current);
  });

  it('should override all current values with saved values', () => {
    const current = {
      q: 'Current',
      status: 'draft',
      from: '2024-01-01',
      to: '2024-12-31',
      owner: 'old@test.com',
    };

    const saved = {
      q: 'Saved',
      status: 'active',
      from: '2024-06-01',
      to: '2024-06-30',
      owner: 'new@test.com',
    };

    const result = mergeSavedView(current, saved);

    expect(result).toEqual(saved);
  });

  it('should handle null values in saved view (explicit reset)', () => {
    const current = {
      q: 'Test',
      from: '2024-01-01',
      to: '2024-12-31',
    };

    const saved = {
      from: null,
      to: null,
    };

    const result = mergeSavedView(current, saved);

    expect(result).toEqual({
      q: 'Test',
      from: null,
      to: null,
    });
  });

  it('should add new keys from saved view', () => {
    const current = {
      q: 'Test',
      status: 'all',
    };

    const saved = {
      owner: 'admin@test.com',
      includeArchived: true,
    };

    const result = mergeSavedView(current, saved);

    expect(result).toEqual({
      q: 'Test',
      status: 'all',
      owner: 'admin@test.com',
      includeArchived: true,
    });
  });
});

describe('Saved Views: Immutability', () => {
  it('should not mutate current filters', () => {
    const current = {
      q: 'Original',
      status: 'all',
    };
    const snapshot = { ...current };

    const saved = {
      q: 'Modified',
      status: 'active',
    };

    mergeSavedView(current, saved);

    assertImmutable(current, snapshot);
  });

  it('should not mutate saved filters', () => {
    const current = {
      q: 'Current',
      status: 'all',
    };

    const saved = {
      q: 'Saved',
      status: 'active',
    };
    const snapshot = { ...saved };

    mergeSavedView(current, saved);

    assertImmutable(saved, snapshot);
  });

  it('should return a new object', () => {
    const current = { q: 'Test' };
    const saved = { status: 'active' };

    const result = mergeSavedView(current, saved);

    expect(result).not.toBe(current);
    expect(result).not.toBe(saved);
  });
});

describe('Saved Views: Edge Cases', () => {
  it('should handle undefined values in saved view', () => {
    const current = {
      q: 'Test',
      status: 'active',
    };

    const saved = {
      q: undefined,
      status: 'draft',
    };

    const result = mergeSavedView(current, saved);

    expect(result.q).toBeUndefined();
    expect(result.status).toBe('draft');
  });

  it('should handle boolean toggles', () => {
    const current = {
      includeArchived: false,
      includeDeleted: false,
    };

    const saved = {
      includeArchived: true,
    };

    const result = mergeSavedView(current, saved);

    expect(result.includeArchived).toBe(true);
    expect(result.includeDeleted).toBe(false);
  });

  it('should handle numeric values', () => {
    const current = {
      pageSize: 10,
      scoreGte: null,
    };

    const saved = {
      pageSize: 50,
      scoreGte: 80,
    };

    const result = mergeSavedView(current, saved);

    expect(result.pageSize).toBe(50);
    expect(result.scoreGte).toBe(80);
  });

  it('should handle empty strings', () => {
    const current = {
      q: 'Search Term',
      owner: 'user@test.com',
    };

    const saved = {
      q: '',
      owner: '',
    };

    const result = mergeSavedView(current, saved);

    expect(result.q).toBe('');
    expect(result.owner).toBe('');
  });

  it('should handle deeply nested objects (shallow merge only)', () => {
    const current = {
      advanced: {
        nested: 'current',
      },
    };

    const saved = {
      advanced: {
        other: 'saved',
      },
    };

    const result = mergeSavedView(current, saved);

    // Shallow merge - saved replaces current entirely
    expect(result.advanced).toEqual({ other: 'saved' });
    expect(result.advanced).not.toHaveProperty('nested');
  });
});

describe('Saved Views: Precedence Documentation', () => {
  it('precedence: saved > current', () => {
    const current = { value: 'current' };
    const saved = { value: 'saved' };

    const result = mergeSavedView(current, saved);

    expect(result.value).toBe('saved'); // saved wins
  });

  it('precedence: undefined saved keeps current', () => {
    const current = { value: 'current' };
    const saved = {}; // no value key

    const result = mergeSavedView(current, saved);

    expect(result.value).toBe('current'); // current preserved
  });

  it('precedence: null saved overwrites current', () => {
    const current = { value: 'current' };
    const saved = { value: null };

    const result = mergeSavedView(current, saved);

    expect(result.value).toBeNull(); // null wins
  });

  it('precedence: false saved overwrites true current', () => {
    const current = { flag: true };
    const saved = { flag: false };

    const result = mergeSavedView(current, saved);

    expect(result.flag).toBe(false); // false wins
  });

  it('precedence: 0 saved overwrites non-zero current', () => {
    const current = { count: 10 };
    const saved = { count: 0 };

    const result = mergeSavedView(current, saved);

    expect(result.count).toBe(0); // 0 wins
  });
});
