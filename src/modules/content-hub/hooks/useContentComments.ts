/**
 * M13.1 Content Hub - Comments Hook
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/core/components/ui/use-toast';
import {
  getContentComments,
  addComment,
  updateComment,
  deleteComment,
  flagComment,
} from '@/integrations/supabase/content-hub/comments';
import { useContentEvents } from '@/lib/events/hooks/useContentEvents';

export function useContentComments(contentId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { publishContentCommentAdded } = useContentEvents();

  // Get comments
  const {
    data: comments,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['content-comments', contentId],
    queryFn: () => getContentComments(contentId),
    staleTime: 10000,
  });

  // Add comment mutation
  const addMutation = useMutation({
    mutationFn: async (params: { text: string; parentId?: string }) => {
      const result = await addComment(contentId, params.text, params.parentId);
      
      // Publish event
      try {
        await publishContentCommentAdded(contentId, 'Content', result.id);
      } catch (error) {
        console.error('Failed to publish comment event:', error);
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-comments', contentId] });
      queryClient.invalidateQueries({ queryKey: ['content-stats', contentId] });
      toast({
        title: 'تم إضافة التعليق',
        duration: 2000,
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء إضافة التعليق',
        variant: 'destructive',
      });
    },
  });

  // Update comment mutation
  const updateMutation = useMutation({
    mutationFn: (params: { commentId: string; text: string }) =>
      updateComment(params.commentId, params.text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-comments', contentId] });
      toast({
        title: 'تم تحديث التعليق',
        duration: 2000,
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث التعليق',
        variant: 'destructive',
      });
    },
  });

  // Delete comment mutation
  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-comments', contentId] });
      queryClient.invalidateQueries({ queryKey: ['content-stats', contentId] });
      toast({
        title: 'تم حذف التعليق',
        duration: 2000,
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء حذف التعليق',
        variant: 'destructive',
      });
    },
  });

  // Flag comment mutation
  const flagMutation = useMutation({
    mutationFn: (commentId: string) => flagComment(commentId),
    onSuccess: () => {
      toast({
        title: 'تم الإبلاغ عن التعليق',
        description: 'سيتم مراجعته من قبل المشرفين',
        duration: 3000,
      });
    },
  });

  const handleAddComment = (text: string, parentId?: string) => {
    addMutation.mutate({ text, parentId });
  };

  const handleUpdateComment = (commentId: string, text: string) => {
    updateMutation.mutate({ commentId, text });
  };

  const handleDeleteComment = (commentId: string) => {
    deleteMutation.mutate(commentId);
  };

  const handleFlagComment = (commentId: string) => {
    flagMutation.mutate(commentId);
  };

  return {
    comments: comments || [],
    isLoading,
    error,
    handleAddComment,
    handleUpdateComment,
    handleDeleteComment,
    handleFlagComment,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
