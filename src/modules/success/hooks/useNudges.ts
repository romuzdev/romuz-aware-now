/**
 * M25 - Nudges Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getMyNudges,
  getUnreadNudgesCount,
  markNudgeAsRead,
  dismissNudge,
  createNudge,
  deleteNudge,
} from '../integration';
import type { NudgeFilters } from '../types';

const QUERY_KEY = ['success', 'nudges'];

export function useNudges(filters?: NudgeFilters) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get nudges
  const { data: nudges = [], isLoading } = useQuery({
    queryKey: [...QUERY_KEY, 'list', filters],
    queryFn: () => getMyNudges(filters),
  });

  // Get unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: [...QUERY_KEY, 'unread-count'],
    queryFn: getUnreadNudgesCount,
  });

  // Mark as read
  const markAsReadMutation = useMutation({
    mutationFn: markNudgeAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Dismiss
  const dismissMutation = useMutation({
    mutationFn: dismissNudge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Create nudge
  const createMutation = useMutation({
    mutationFn: createNudge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: 'تم',
        description: 'تم إنشاء التنبيه',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete nudge
  const deleteMutation = useMutation({
    mutationFn: deleteNudge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  return {
    nudges,
    unreadCount,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    dismiss: dismissMutation.mutate,
    create: createMutation.mutate,
    delete: deleteMutation.mutate,
  };
}
