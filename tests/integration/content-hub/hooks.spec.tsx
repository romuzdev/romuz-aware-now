/**
 * M13.1 Content Hub - Integration Tests for Hooks
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useContentItems,
  useContentItem,
  useCreateContentItem,
  useUpdateContentItem,
  useDeleteContentItem,
} from '@/modules/content-hub/hooks/useContentItems';
import {
  useContentInteractions,
  useToggleLike,
  useShareContent,
} from '@/modules/content-hub/hooks/useContentInteractions';
import {
  useContentComments,
  useAddComment,
} from '@/modules/content-hub/hooks/useContentComments';
import {
  useContentBookmarks,
  useToggleBookmark,
} from '@/modules/content-hub/hooks/useContentBookmarks';

// Create wrapper for React Query
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('Content Hub Hooks Integration', () => {
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  afterEach(() => {
    // Cleanup
  });

  describe('useContentItems', () => {
    it('should fetch content items with default filters', async () => {
      const { result } = renderHook(() => useContentItems(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data)).toBe(true);
    });

    it('should handle loading state', () => {
      const { result } = renderHook(() => useContentItems(), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });

    it('should filter by content type', async () => {
      const { result } = renderHook(
        () => useContentItems({ contentType: 'article' }),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      if (result.current.data) {
        result.current.data.forEach((item) => {
          expect(item.content_type).toBe('article');
        });
      }
    });
  });

  describe('useContentItem', () => {
    it('should fetch single content item', async () => {
      const contentId = 'test-content-id';
      const { result } = renderHook(() => useContentItem(contentId), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.id).toBe(contentId);
    });
  });

  describe('useCreateContentItem', () => {
    it('should create new content item', async () => {
      const { result } = renderHook(() => useCreateContentItem(), { wrapper });

      const newContent = {
        title: 'Test Content',
        content_type: 'article' as const,
        body: 'Test body',
      };

      result.current.mutate(newContent);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.title).toBe('Test Content');
    });

    it('should handle optimistic updates', async () => {
      const { result } = renderHook(() => useCreateContentItem(), { wrapper });

      expect(result.current.isPending).toBe(false);

      const newContent = {
        title: 'Optimistic Content',
        content_type: 'video' as const,
        body: 'Test',
      };

      result.current.mutate(newContent);

      expect(result.current.isPending).toBe(true);
    });
  });

  describe('useContentInteractions', () => {
    it('should fetch interaction stats', async () => {
      const contentId = 'test-content-id';
      const { result } = renderHook(() => useContentInteractions(contentId), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data).toHaveProperty('likes');
      expect(result.current.data).toHaveProperty('shares');
      expect(result.current.data).toHaveProperty('views');
    });
  });

  describe('useToggleLike', () => {
    it('should toggle like status', async () => {
      const { result } = renderHook(() => useToggleLike(), { wrapper });

      result.current.mutate('test-content-id');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data).toHaveProperty('liked');
    });

    it('should invalidate related queries after like', async () => {
      const contentId = 'test-content-id';
      const { result: likeResult } = renderHook(() => useToggleLike(), {
        wrapper,
      });
      const { result: interactionsResult } = renderHook(
        () => useContentInteractions(contentId),
        { wrapper }
      );

      await waitFor(() => expect(interactionsResult.current.isSuccess).toBe(true));

      const initialLikes = interactionsResult.current.data?.likes || 0;

      likeResult.current.mutate(contentId);

      await waitFor(() => expect(likeResult.current.isSuccess).toBe(true));

      // Query should be refetched
      await waitFor(() => {
        const newLikes = interactionsResult.current.data?.likes || 0;
        expect(newLikes).not.toBe(initialLikes);
      });
    });
  });

  describe('useContentComments', () => {
    it('should fetch comments for content', async () => {
      const contentId = 'test-content-id';
      const { result } = renderHook(() => useContentComments(contentId), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data)).toBe(true);
    });
  });

  describe('useAddComment', () => {
    it('should add new comment', async () => {
      const { result } = renderHook(() => useAddComment(), { wrapper });

      result.current.mutate({
        contentId: 'test-content-id',
        commentText: 'Test comment',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.comment_text).toBe('Test comment');
    });
  });

  describe('useContentBookmarks', () => {
    it('should fetch user bookmarks', async () => {
      const { result } = renderHook(() => useContentBookmarks(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(Array.isArray(result.current.data)).toBe(true);
    });
  });

  describe('useToggleBookmark', () => {
    it('should toggle bookmark status', async () => {
      const { result } = renderHook(() => useToggleBookmark(), { wrapper });

      result.current.mutate({ contentId: 'test-content-id' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data).toHaveProperty('bookmarked');
    });
  });
});
