/**
 * M13.1 - Content Hub: User Interactions Service
 * تتبع تفاعلات المستخدمين مع المحتوى
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type UserInteraction = Database['public']['Tables']['user_content_interactions']['Row'];
type UserInteractionInsert = Database['public']['Tables']['user_content_interactions']['Insert'];

export type InteractionType = 'view' | 'like' | 'unlike' | 'share' | 'comment' | 'download' | 'complete' | 'bookmark' | 'report';

/**
 * Track user interaction with content
 */
export async function trackInteraction(
  tenantId: string,
  userId: string,
  contentId: string,
  interactionType: InteractionType,
  interactionData?: Record<string, any>,
  durationSeconds?: number,
  completionPercentage?: number
) {
  const interaction: Omit<UserInteractionInsert, 'id' | 'created_at'> = {
    tenant_id: tenantId,
    user_id: userId,
    content_id: contentId,
    interaction_type: interactionType,
    interaction_data: interactionData || {},
    duration_seconds: durationSeconds,
    completion_percentage: completionPercentage,
    source_page: window.location.pathname,
    device_type: getDeviceType(),
  };

  const { data, error } = await supabase
    .from('user_content_interactions')
    .upsert(interaction, {
      onConflict: 'tenant_id,user_id,content_id,interaction_type',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get user interactions for specific content
 */
export async function getUserInteractionsForContent(
  contentId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from('user_content_interactions')
    .select('*')
    .eq('content_id', contentId)
    .eq('user_id', userId);

  if (error) throw error;
  return data || [];
}

/**
 * Check if user has specific interaction with content
 */
export async function hasUserInteraction(
  userId: string,
  contentId: string,
  interactionType: InteractionType
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_content_interactions')
    .select('id')
    .eq('user_id', userId)
    .eq('content_id', contentId)
    .eq('interaction_type', interactionType)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}

/**
 * Get user's liked content
 */
export async function getUserLikedContent(
  tenantId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from('user_content_interactions')
    .select(`
      content_id,
      created_at,
      content_items (*)
    `)
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .eq('interaction_type', 'like')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get user's bookmarked content
 */
export async function getUserBookmarkedContent(
  tenantId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from('user_content_interactions')
    .select(`
      content_id,
      created_at,
      content_items (*)
    `)
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .eq('interaction_type', 'bookmark')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get user's content history
 */
export async function getUserContentHistory(
  tenantId: string,
  userId: string,
  limit: number = 20
) {
  const { data, error } = await supabase
    .from('user_content_interactions')
    .select(`
      content_id,
      interaction_type,
      duration_seconds,
      completion_percentage,
      created_at,
      content_items (*)
    `)
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .in('interaction_type', ['view', 'complete'])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Get content engagement metrics
 */
export async function getContentEngagementMetrics(contentId: string) {
  const { data, error } = await supabase
    .from('user_content_interactions')
    .select('interaction_type, duration_seconds, completion_percentage')
    .eq('content_id', contentId);

  if (error) throw error;

  const metrics = {
    totalViews: 0,
    uniqueUsers: new Set<string>(),
    totalLikes: 0,
    totalShares: 0,
    totalDownloads: 0,
    totalCompletions: 0,
    avgDuration: 0,
    avgCompletion: 0,
  };

  const durations: number[] = [];
  const completions: number[] = [];

  data?.forEach(interaction => {
    switch (interaction.interaction_type) {
      case 'view':
        metrics.totalViews++;
        if (interaction.duration_seconds) {
          durations.push(interaction.duration_seconds);
        }
        if (interaction.completion_percentage) {
          completions.push(interaction.completion_percentage);
        }
        break;
      case 'like':
        metrics.totalLikes++;
        break;
      case 'share':
        metrics.totalShares++;
        break;
      case 'download':
        metrics.totalDownloads++;
        break;
      case 'complete':
        metrics.totalCompletions++;
        break;
    }
  });

  metrics.avgDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  metrics.avgCompletion = completions.length > 0
    ? Math.round(completions.reduce((a, b) => a + b, 0) / completions.length)
    : 0;

  return {
    ...metrics,
    uniqueUsers: metrics.uniqueUsers.size,
  };
}

/**
 * Delete user interaction
 */
export async function deleteInteraction(
  userId: string,
  contentId: string,
  interactionType: InteractionType
) {
  const { error } = await supabase
    .from('user_content_interactions')
    .delete()
    .eq('user_id', userId)
    .eq('content_id', contentId)
    .eq('interaction_type', interactionType);

  if (error) throw error;
}

/**
 * Get trending content based on recent interactions
 */
export async function getTrendingContent(
  tenantId: string,
  days: number = 7,
  limit: number = 10
) {
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);

  const { data, error } = await supabase
    .from('user_content_interactions')
    .select(`
      content_id,
      content_items (*)
    `)
    .eq('tenant_id', tenantId)
    .gte('created_at', sinceDate.toISOString())
    .in('interaction_type', ['view', 'like', 'share']);

  if (error) throw error;

  // Count interactions per content
  const contentCounts = new Map<string, number>();
  data?.forEach(interaction => {
    const count = contentCounts.get(interaction.content_id) || 0;
    contentCounts.set(interaction.content_id, count + 1);
  });

  // Sort by count and get top items
  const trending = Array.from(contentCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([contentId]) => 
      data?.find(d => d.content_id === contentId)?.content_items
    )
    .filter(Boolean);

  return trending;
}

/**
 * Helper: Get device type
 */
function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}
