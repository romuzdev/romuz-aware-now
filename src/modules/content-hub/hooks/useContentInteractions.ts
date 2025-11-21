/**
 * M13.1 Content Hub - Content Interactions Hook
 */

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/core/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  trackInteraction,
  hasUserInteraction,
  deleteInteraction,
  getContentEngagementMetrics,
  type InteractionType,
} from '@/integrations/supabase/content-hub/interactions';
import { useContentEvents } from '@/lib/events/hooks/useContentEvents';
import type { ShareChannel } from '../types';

export function useContentInteractions(contentId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    publishContentLiked,
    publishContentShared,
    publishContentBookmarked,
    publishContentViewed,
  } = useContentEvents();
  const [isLiking, setIsLiking] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user and tenant info
  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: tenantData } = await supabase
          .from('user_tenants')
          .select('tenant_id')
          .eq('user_id', user.id)
          .single();
        if (tenantData) {
          setTenantId(tenantData.tenant_id);
        }
      }
    };
    fetchUserInfo();
  }, []);

  // Check if user has liked
  const { data: hasLiked, isLoading: isLoadingLike } = useQuery({
    queryKey: ['content-has-liked', contentId, userId],
    queryFn: () => hasUserInteraction(userId!, contentId, 'like'),
    enabled: !!userId,
    staleTime: 30000,
  });

  // Check if user has bookmarked
  const { data: hasBookmarked, isLoading: isLoadingBookmark } = useQuery({
    queryKey: ['content-has-bookmarked', contentId, userId],
    queryFn: () => hasUserInteraction(userId!, contentId, 'bookmark'),
    enabled: !!userId,
    staleTime: 30000,
  });

  // Get engagement metrics
  const { data: metrics, isLoading: isLoadingStats } = useQuery({
    queryKey: ['content-metrics', contentId],
    queryFn: () => getContentEngagementMetrics(contentId),
    staleTime: 10000,
  });

  // Track view mutation
  const viewMutation = useMutation({
    mutationFn: (params: { duration?: number; completion?: number }) =>
      trackInteraction(
        tenantId!,
        userId!,
        contentId,
        'view',
        {},
        params.duration,
        params.completion
      ),
  });

  // Like/Unlike mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (hasLiked) {
        await deleteInteraction(userId!, contentId, 'like');
        return { liked: false };
      } else {
        await trackInteraction(tenantId!, userId!, contentId, 'like');
        
        // Publish event
        try {
          await publishContentLiked(contentId, 'Content');
        } catch (error) {
          console.error('Failed to publish like event:', error);
        }
        
        return { liked: true };
      }
    },
    onMutate: () => setIsLiking(true),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['content-has-liked', contentId, userId] });
      queryClient.invalidateQueries({ queryKey: ['content-metrics', contentId] });
      toast({
        title: data.liked ? 'تم الإعجاب' : 'تم إلغاء الإعجاب',
        duration: 2000,
      });
      setIsLiking(false);
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ',
        variant: 'destructive',
      });
      setIsLiking(false);
    },
  });

  // Share mutation
  const shareMutation = useMutation({
    mutationFn: async (params: { channel: ShareChannel; metadata?: Record<string, any> }) => {
      await trackInteraction(
        tenantId!,
        userId!,
        contentId,
        'share',
        { ...params.metadata, channel: params.channel }
      );
      
      // Publish event
      try {
        await publishContentShared(contentId, 'Content', params.channel);
      } catch (error) {
        console.error('Failed to publish share event:', error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-metrics', contentId] });
      toast({
        title: 'تمت المشاركة بنجاح',
        duration: 2000,
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ في المشاركة',
        description: error instanceof Error ? error.message : 'حدث خطأ',
        variant: 'destructive',
      });
    },
  });

  // Track view on mount
  useEffect(() => {
    if (tenantId && userId) {
      viewMutation.mutate({ duration: 0, completion: 0 });
    }
  }, [contentId, tenantId, userId]);

  const handleView = (duration?: number, completion?: number) => {
    if (tenantId && userId) {
      viewMutation.mutate({ duration, completion });
    }
  };

  const handleLike = () => {
    if (!isLiking && tenantId && userId) {
      likeMutation.mutate();
    }
  };

  const handleShare = (channel: ShareChannel, metadata?: Record<string, any>) => {
    if (tenantId && userId) {
      shareMutation.mutate({ channel, metadata });
    }
  };

  const stats = {
    views: metrics?.totalViews || 0,
    likes: metrics?.totalLikes || 0,
    shares: metrics?.totalShares || 0,
    bookmarks: 0, // Not tracked in current schema
    comments: 0, // Separate table
  };

  return {
    // State
    hasLiked: hasLiked || false,
    hasBookmarked: hasBookmarked || false,
    stats,
    isLoading: isLoadingLike || isLoadingBookmark || isLoadingStats,
    isLiking,
    
    // Actions
    handleView,
    handleLike,
    handleShare,
  };
}
