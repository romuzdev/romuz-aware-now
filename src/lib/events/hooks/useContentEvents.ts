/**
 * Content Hub Module - Event Integration Hook
 * 
 * Integration between Content Hub and Event System
 */

import { useCallback } from 'react';
import { useEventBus } from '../useEventBus';
import type { PublishEventParams } from '../event.types';

export function useContentEvents() {
  const { publishEvent } = useEventBus();

  /**
   * Content Published Event
   */
  const publishContentPublished = useCallback(async (
    contentId: string,
    contentData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'content_published',
      event_category: 'content',
      source_module: 'content_hub',
      entity_type: 'content',
      entity_id: contentId,
      priority: 'medium',
      payload: {
        content_title: contentData.title,
        content_type: contentData.type,
        category: contentData.category,
        author: contentData.author,
        published_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Content Viewed Event
   */
  const publishContentViewed = useCallback(async (
    contentId: string,
    userId: string,
    viewData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'content_viewed',
      event_category: 'content',
      source_module: 'content_hub',
      entity_type: 'content_view',
      entity_id: `${contentId}_${userId}`,
      priority: 'low',
      payload: {
        content_id: contentId,
        user_id: userId,
        content_title: viewData.content_title,
        view_duration_seconds: viewData.duration_seconds,
        viewed_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Content Liked Event
   */
  const publishContentLiked = useCallback(async (
    contentId: string,
    contentTitle: string
  ) => {
    const params: PublishEventParams = {
      event_type: 'content_liked',
      event_category: 'content',
      source_module: 'content_hub',
      entity_type: 'content_interaction',
      entity_id: contentId,
      priority: 'low',
      payload: {
        content_id: contentId,
        content_title: contentTitle,
        interaction_type: 'like',
        timestamp: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Content Shared Event
   */
  const publishContentShared = useCallback(async (
    contentId: string,
    contentTitle: string,
    channel: string
  ) => {
    const params: PublishEventParams = {
      event_type: 'content_shared',
      event_category: 'content',
      source_module: 'content_hub',
      entity_type: 'content_interaction',
      entity_id: contentId,
      priority: 'medium',
      payload: {
        content_id: contentId,
        content_title: contentTitle,
        share_channel: channel,
        timestamp: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Content Bookmarked Event
   */
  const publishContentBookmarked = useCallback(async (
    contentId: string,
    contentTitle: string,
    folderName?: string
  ) => {
    const params: PublishEventParams = {
      event_type: 'content_bookmarked',
      event_category: 'content',
      source_module: 'content_hub',
      entity_type: 'content_interaction',
      entity_id: contentId,
      priority: 'low',
      payload: {
        content_id: contentId,
        content_title: contentTitle,
        folder_name: folderName,
        timestamp: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Content Comment Added Event
   */
  const publishContentCommentAdded = useCallback(async (
    contentId: string,
    contentTitle: string,
    commentId: string
  ) => {
    const params: PublishEventParams = {
      event_type: 'content_comment_added',
      event_category: 'content',
      source_module: 'content_hub',
      entity_type: 'content_comment',
      entity_id: commentId,
      priority: 'low',
      payload: {
        content_id: contentId,
        content_title: contentTitle,
        comment_id: commentId,
        timestamp: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  return {
    publishContentPublished,
    publishContentViewed,
    publishContentLiked,
    publishContentShared,
    publishContentBookmarked,
    publishContentCommentAdded,
  };
}
