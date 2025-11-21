/**
 * M13.1 Content Hub - Unit Tests for Content Interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import {
  toggleLike,
  shareContent,
  getContentInteractions,
} from '@/integrations/supabase/content-hub/interactions';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

describe('Content Interactions Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('toggleLike', () => {
    it('should like content if not already liked', async () => {
      const mockUser = { id: 'user-1' };
      const mockTenant = { tenant_id: 'tenant-1' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const mockTenantQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTenant, error: null }),
      };

      const mockCheckQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      const mockInsertQuery = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockTenantQuery as any)
        .mockReturnValueOnce(mockCheckQuery as any)
        .mockReturnValueOnce(mockInsertQuery as any);

      const result = await toggleLike('content-1');

      expect(result.liked).toBe(true);
      expect(mockInsertQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          content_id: 'content-1',
          interaction_type: 'like',
        })
      );
    });

    it('should unlike content if already liked', async () => {
      const mockUser = { id: 'user-1' };
      const mockTenant = { tenant_id: 'tenant-1' };
      const existingLike = { id: 'like-1' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const mockTenantQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTenant, error: null }),
      };

      const mockCheckQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: existingLike, error: null }),
      };

      const mockDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockTenantQuery as any)
        .mockReturnValueOnce(mockCheckQuery as any)
        .mockReturnValueOnce(mockDeleteQuery as any);

      const result = await toggleLike('content-1');

      expect(result.liked).toBe(false);
      expect(mockDeleteQuery.delete).toHaveBeenCalled();
    });
  });

  describe('shareContent', () => {
    it('should record content share with platform', async () => {
      const mockUser = { id: 'user-1' };
      const mockTenant = { tenant_id: 'tenant-1' };

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
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockTenantQuery as any)
        .mockReturnValueOnce(mockInsertQuery as any);

      await shareContent('content-1', 'email');

      expect(mockInsertQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          content_id: 'content-1',
          interaction_type: 'share',
          metadata: expect.objectContaining({ platform: 'email' }),
        })
      );
    });
  });

  describe('getContentInteractions', () => {
    it('should fetch aggregated interaction stats', async () => {
      const mockStats = {
        likes: 10,
        shares: 5,
        views: 100,
        user_liked: true,
      };

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockStats,
        error: null,
      } as any);

      const result = await getContentInteractions('content-1');

      expect(supabase.rpc).toHaveBeenCalledWith('get_content_interactions', {
        p_content_id: 'content-1',
      });
      expect(result).toEqual(mockStats);
    });
  });
});
