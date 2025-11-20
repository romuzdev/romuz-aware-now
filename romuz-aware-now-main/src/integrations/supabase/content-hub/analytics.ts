/**
 * M13.1 - Content Hub: Analytics Service
 * تحليلات المحتوى المتقدمة
 */

import { supabase } from '@/integrations/supabase/client';

export interface ContentAnalytics {
  contentId: string;
  contentTitle: string;
  contentType: string;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalDownloads: number;
  uniqueUsers: number;
  avgCompletionPercentage: number;
  engagementScore: number;
}

export interface OverviewStats {
  totalContent: number;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalDownloads: number;
  uniqueUsers: number;
  avgEngagement: number;
}

export interface TimeSeriesData {
  date: string;
  views: number;
  likes: number;
  shares: number;
}

/**
 * Get content analytics using database function
 */
export async function getContentAnalytics(
  tenantId: string,
  contentId?: string,
  startDate?: string,
  endDate?: string
): Promise<ContentAnalytics[]> {
  const { data, error } = await supabase.rpc('get_content_analytics', {
    p_tenant_id: tenantId,
    p_content_id: contentId || null,
    p_start_date: startDate || null,
    p_end_date: endDate || null,
  });

  if (error) throw error;
  return data || [];
}

/**
 * Get overview statistics
 */
export async function getOverviewStats(
  tenantId: string,
  startDate?: string,
  endDate?: string
): Promise<OverviewStats> {
  // Get total content count
  let contentQuery = supabase
    .from('content_items')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'published');

  const { count: totalContent } = await contentQuery;

  // Get interaction stats
  let interactionsQuery = supabase
    .from('user_content_interactions')
    .select('interaction_type, user_id')
    .eq('tenant_id', tenantId);

  if (startDate) {
    interactionsQuery = interactionsQuery.gte('created_at', startDate);
  }

  if (endDate) {
    interactionsQuery = interactionsQuery.lte('created_at', endDate);
  }

  const { data: interactions, error } = await interactionsQuery;

  if (error) throw error;

  const stats: OverviewStats = {
    totalContent: totalContent || 0,
    totalViews: 0,
    totalLikes: 0,
    totalShares: 0,
    totalDownloads: 0,
    uniqueUsers: new Set<string>().size,
    avgEngagement: 0,
  };

  const uniqueUsers = new Set<string>();

  interactions?.forEach(interaction => {
    uniqueUsers.add(interaction.user_id);
    
    switch (interaction.interaction_type) {
      case 'view':
        stats.totalViews++;
        break;
      case 'like':
        stats.totalLikes++;
        break;
      case 'share':
        stats.totalShares++;
        break;
      case 'download':
        stats.totalDownloads++;
        break;
    }
  });

  stats.uniqueUsers = uniqueUsers.size;
  
  // Calculate average engagement
  const totalInteractions = stats.totalViews + stats.totalLikes + stats.totalShares + stats.totalDownloads;
  stats.avgEngagement = stats.totalContent > 0 
    ? Math.round(totalInteractions / stats.totalContent)
    : 0;

  return stats;
}

/**
 * Get time series data for charts
 */
export async function getTimeSeriesData(
  tenantId: string,
  startDate: string,
  endDate: string,
  interval: 'day' | 'week' | 'month' = 'day'
): Promise<TimeSeriesData[]> {
  const { data: interactions, error } = await supabase
    .from('user_content_interactions')
    .select('interaction_type, created_at')
    .eq('tenant_id', tenantId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Group by date
  const grouped = new Map<string, TimeSeriesData>();

  interactions?.forEach(interaction => {
    const date = new Date(interaction.created_at);
    let key: string;

    switch (interval) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        key = date.toISOString().split('T')[0];
    }

    if (!grouped.has(key)) {
      grouped.set(key, {
        date: key,
        views: 0,
        likes: 0,
        shares: 0,
      });
    }

    const entry = grouped.get(key)!;

    switch (interaction.interaction_type) {
      case 'view':
        entry.views++;
        break;
      case 'like':
        entry.likes++;
        break;
      case 'share':
        entry.shares++;
        break;
    }
  });

  return Array.from(grouped.values()).sort((a, b) => 
    a.date.localeCompare(b.date)
  );
}

/**
 * Get content type distribution
 */
export async function getContentTypeDistribution(tenantId: string) {
  const { data, error } = await supabase
    .from('content_items')
    .select('content_type')
    .eq('tenant_id', tenantId)
    .eq('status', 'published');

  if (error) throw error;

  const distribution = new Map<string, number>();

  data?.forEach(item => {
    const count = distribution.get(item.content_type) || 0;
    distribution.set(item.content_type, count + 1);
  });

  return Array.from(distribution.entries()).map(([type, count]) => ({
    type,
    count,
    percentage: Math.round((count / (data?.length || 1)) * 100),
  }));
}

/**
 * Get category performance
 */
export async function getCategoryPerformance(tenantId: string) {
  const analytics = await getContentAnalytics(tenantId);

  // Group by category
  const categoryMap = new Map<string, {
    category: string;
    totalViews: number;
    totalLikes: number;
    totalShares: number;
    contentCount: number;
    avgEngagement: number;
  }>();

  analytics.forEach(item => {
    // Note: We'll need to join with content_items to get category
    // For now, we'll aggregate at the content level
  });

  return Array.from(categoryMap.values());
}

/**
 * Get top performing content
 */
export async function getTopPerformingContent(
  tenantId: string,
  metric: 'views' | 'likes' | 'shares' | 'engagement' = 'engagement',
  limit: number = 10
) {
  const analytics = await getContentAnalytics(tenantId);

  const sorted = [...analytics].sort((a, b) => {
    switch (metric) {
      case 'views':
        return b.totalViews - a.totalViews;
      case 'likes':
        return b.totalLikes - a.totalLikes;
      case 'shares':
        return b.totalShares - a.totalShares;
      case 'engagement':
      default:
        return b.engagementScore - a.engagementScore;
    }
  });

  return sorted.slice(0, limit);
}

/**
 * Get user engagement report
 */
export async function getUserEngagementReport(
  tenantId: string,
  userId: string
) {
  const { data: interactions, error } = await supabase
    .from('user_content_interactions')
    .select(`
      interaction_type,
      duration_seconds,
      completion_percentage,
      created_at,
      content_items (
        id,
        title_ar,
        content_type,
        category
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('user_id', userId);

  if (error) throw error;

  const report = {
    totalViews: 0,
    totalLikes: 0,
    totalShares: 0,
    totalDownloads: 0,
    totalCompletions: 0,
    avgDuration: 0,
    avgCompletion: 0,
    favoriteCategories: new Map<string, number>(),
    favoriteTypes: new Map<string, number>(),
    lastActivity: null as string | null,
  };

  const durations: number[] = [];
  const completions: number[] = [];

  interactions?.forEach(interaction => {
    switch (interaction.interaction_type) {
      case 'view':
        report.totalViews++;
        if (interaction.duration_seconds) {
          durations.push(interaction.duration_seconds);
        }
        if (interaction.completion_percentage) {
          completions.push(interaction.completion_percentage);
        }
        break;
      case 'like':
        report.totalLikes++;
        break;
      case 'share':
        report.totalShares++;
        break;
      case 'download':
        report.totalDownloads++;
        break;
      case 'complete':
        report.totalCompletions++;
        break;
    }

    // Track favorite categories and types
    if (interaction.content_items) {
      const category = (interaction.content_items as any).category;
      const type = (interaction.content_items as any).content_type;
      
      if (category) {
        report.favoriteCategories.set(
          category,
          (report.favoriteCategories.get(category) || 0) + 1
        );
      }
      
      if (type) {
        report.favoriteTypes.set(
          type,
          (report.favoriteTypes.get(type) || 0) + 1
        );
      }
    }

    // Track last activity
    if (!report.lastActivity || interaction.created_at > report.lastActivity) {
      report.lastActivity = interaction.created_at;
    }
  });

  report.avgDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  report.avgCompletion = completions.length > 0
    ? Math.round(completions.reduce((a, b) => a + b, 0) / completions.length)
    : 0;

  return {
    ...report,
    favoriteCategories: Array.from(report.favoriteCategories.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count })),
    favoriteTypes: Array.from(report.favoriteTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count })),
  };
}

/**
 * Export analytics data to CSV
 */
export async function exportAnalyticsToCSV(
  tenantId: string,
  startDate?: string,
  endDate?: string
): Promise<string> {
  const analytics = await getContentAnalytics(tenantId, undefined, startDate, endDate);

  const headers = [
    'Content ID',
    'Title',
    'Type',
    'Total Views',
    'Total Likes',
    'Total Shares',
    'Total Downloads',
    'Unique Users',
    'Avg Completion %',
    'Engagement Score',
  ];

  const rows = analytics.map(item => [
    item.contentId,
    item.contentTitle,
    item.contentType,
    item.totalViews,
    item.totalLikes,
    item.totalShares,
    item.totalDownloads,
    item.uniqueUsers,
    item.avgCompletionPercentage,
    item.engagementScore,
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return csv;
}
