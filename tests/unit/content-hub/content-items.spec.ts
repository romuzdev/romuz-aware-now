/**
 * M13.1 Content Hub - Unit Tests for Content Items Integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import {
  getContentItems,
  getContentItem,
  createContentItem,
  updateContentItem,
  deleteContentItem,
  publishContentItem,
} from '@/integrations/supabase/content-hub/content-items';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe('Content Items Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getContentItems', () => {
    it('should fetch all content items with default filters', async () => {
      const mockData = [
        {
          id: '1',
          title: 'Test Content',
          content_type: 'article',
          status: 'published',
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await getContentItems();

      expect(supabase.from).toHaveBeenCalledWith('content_items');
      expect(result).toEqual(mockData);
    });

    it('should filter by content type', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await getContentItems({ contentType: 'article' });

      expect(mockQuery.eq).toHaveBeenCalledWith('content_type', 'article');
    });

    it('should throw error on failure', async () => {
      const mockError = new Error('Database error');
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(getContentItems()).rejects.toThrow('Database error');
    });
  });

  describe('getContentItem', () => {
    it('should fetch single content item by id', async () => {
      const mockData = {
        id: '1',
        title: 'Test Content',
        content_type: 'article',
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await getContentItem('1');

      expect(supabase.from).toHaveBeenCalledWith('content_items');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual(mockData);
    });
  });

  describe('createContentItem', () => {
    it('should create new content item with tenant context', async () => {
      const mockUser = { id: 'user-1' };
      const mockTenant = { tenant_id: 'tenant-1' };
      const mockInput = {
        title: 'New Content',
        content_type: 'article' as const,
        body: 'Test body',
      };

      const mockCreatedItem = {
        id: 'new-1',
        ...mockInput,
        tenant_id: 'tenant-1',
        created_by: 'user-1',
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const mockTenantQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTenant, error: null }),
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCreatedItem, error: null }),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockTenantQuery as any)
        .mockReturnValueOnce(mockInsertQuery as any);

      const result = await createContentItem(mockInput);

      expect(result).toEqual(mockCreatedItem);
      expect(mockInsertQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Content',
          tenant_id: 'tenant-1',
          created_by: 'user-1',
        })
      );
    });
  });

  describe('publishContentItem', () => {
    it('should update content status to published', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: '1', status: 'published' },
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await publishContentItem('1');

      expect(mockQuery.update).toHaveBeenCalledWith({ status: 'published' });
      expect(result.status).toBe('published');
    });
  });
});
