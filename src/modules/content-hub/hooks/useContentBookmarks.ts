/**
 * M13.1 Content Hub - Bookmarks Hook
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/core/components/ui/use-toast';
import {
  getUserBookmarks,
  toggleBookmark,
  updateBookmark,
  getBookmarkFolders,
} from '@/integrations/supabase/content-hub/bookmarks';
import { useContentEvents } from '@/lib/events/hooks/useContentEvents';

export function useContentBookmarks(contentId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { publishContentBookmarked } = useContentEvents();

  // Get user's bookmarks
  const {
    data: bookmarks,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user-bookmarks'],
    queryFn: () => getUserBookmarks(),
    staleTime: 30000,
  });

  // Get bookmark folders
  const { data: folders } = useQuery({
    queryKey: ['bookmark-folders'],
    queryFn: () => getBookmarkFolders(),
    staleTime: 60000,
  });

  // Toggle bookmark mutation
  const toggleMutation = useMutation({
    mutationFn: async (params: { contentId: string; folderName?: string; notes?: string }) => {
      const result = await toggleBookmark(params.contentId, params.folderName, params.notes);
      
      // Publish event if bookmarked
      if (result.bookmarked) {
        try {
          await publishContentBookmarked(params.contentId, 'Content', params.folderName);
        } catch (error) {
          console.error('Failed to publish bookmark event:', error);
        }
      }
      
      return result;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['content-interaction-state', variables.contentId] });
      queryClient.invalidateQueries({ queryKey: ['content-stats', variables.contentId] });
      toast({
        title: data.bookmarked ? 'تمت الإضافة للمفضلة' : 'تمت الإزالة من المفضلة',
        duration: 2000,
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ',
        variant: 'destructive',
      });
    },
  });

  // Update bookmark mutation
  const updateMutation = useMutation({
    mutationFn: (params: { bookmarkId: string; folderName?: string; notes?: string }) =>
      updateBookmark(params.bookmarkId, { 
        folder_name: params.folderName, 
        notes: params.notes 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookmarks'] });
      toast({
        title: 'تم تحديث المفضلة',
        duration: 2000,
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ',
        variant: 'destructive',
      });
    },
  });

  const handleToggleBookmark = (contentId: string, folderName?: string, notes?: string) => {
    toggleMutation.mutate({ contentId, folderName, notes });
  };

  const handleUpdateBookmark = (bookmarkId: string, folderName?: string, notes?: string) => {
    updateMutation.mutate({ bookmarkId, folderName, notes });
  };

  const isBookmarked = contentId 
    ? bookmarks?.some(b => b.content_id === contentId)
    : false;

  return {
    bookmarks: bookmarks || [],
    folders: folders || [],
    isLoading,
    error,
    isBookmarked,
    handleToggleBookmark,
    handleUpdateBookmark,
    isToggling: toggleMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
