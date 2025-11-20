/**
 * D4 Enhancement: Committee Notifications Custom Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  fetchMyNotifications,
  fetchUnreadNotificationsCount,
  fetchCommitteeNotifications,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteReadNotifications,
} from '@/modules/committees/integration';
import type { NotificationFilters } from '@/modules/committees';

/**
 * Fetch my notifications
 */
export function useMyNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: ['my-notifications', filters],
    queryFn: () => fetchMyNotifications(filters),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Fetch unread notifications count
 */
export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: ['unread-notifications-count'],
    queryFn: fetchUnreadNotificationsCount,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Fetch committee notifications
 */
export function useCommitteeNotifications(committeeId: string) {
  return useQuery({
    queryKey: ['committee-notifications', committeeId],
    queryFn: () => fetchCommitteeNotifications(committeeId),
    enabled: !!committeeId,
  });
}

/**
 * Create notification mutation
 */
export function useCreateNotification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['committee-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
      toast({
        title: 'تم الإرسال',
        description: 'تم إرسال الإشعار بنجاح',
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
}

/**
 * Mark notification as read mutation
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    },
  });
}

/**
 * Mark all notifications as read mutation
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
      toast({
        title: 'تم',
        description: 'تم تعليم جميع الإشعارات كمقروءة',
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
}

/**
 * Delete notification mutation
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الإشعار',
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
}

/**
 * Delete read notifications mutation
 */
export function useDeleteReadNotifications() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteReadNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف جميع الإشعارات المقروءة',
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
}
