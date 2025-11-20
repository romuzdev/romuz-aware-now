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

  return {
    publishContentPublished,
    publishContentViewed,
  };
}
