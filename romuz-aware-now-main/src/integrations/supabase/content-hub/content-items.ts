/**
 * M13.1 - Content Hub: Content Items Service
 * إدارة المحتوى الأساسي
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ContentItem = Database['public']['Tables']['content_items']['Row'];
type ContentItemInsert = Database['public']['Tables']['content_items']['Insert'];
type ContentItemUpdate = Database['public']['Tables']['content_items']['Update'];

export interface ContentFilters {
  status?: string;
  contentType?: string;
  category?: string;
  tags?: string[];
  authorId?: string;
  searchQuery?: string;
}

export interface ContentPagination {
  page: number;
  pageSize: number;
  sortBy?: 'created_at' | 'updated_at' | 'published_at' | 'views_count' | 'likes_count';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Get all content items with filters and pagination
 */
export async function getContentItems(
  tenantId: string,
  filters?: ContentFilters,
  pagination?: ContentPagination
) {
  let query = supabase
    .from('content_items')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId);

  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.contentType) {
    query = query.eq('content_type', filters.contentType);
  }

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags);
  }

  if (filters?.authorId) {
    query = query.eq('author_id', filters.authorId);
  }

  if (filters?.searchQuery) {
    query = query.or(
      `title_ar.ilike.%${filters.searchQuery}%,title_en.ilike.%${filters.searchQuery}%,content_body_ar.ilike.%${filters.searchQuery}%`
    );
  }

  // Apply pagination
  if (pagination) {
    const { page, pageSize, sortBy = 'created_at', sortOrder = 'desc' } = pagination;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    items: data || [],
    total: count || 0,
    page: pagination?.page || 1,
    pageSize: pagination?.pageSize || data?.length || 0,
  };
}

/**
 * Get single content item by ID
 */
export async function getContentItem(id: string) {
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create new content item
 */
export async function createContentItem(
  item: Omit<ContentItemInsert, 'id' | 'created_at' | 'updated_at'>
) {
  const { data, error } = await supabase
    .from('content_items')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update content item
 */
export async function updateContentItem(
  id: string,
  updates: ContentItemUpdate
) {
  const { data, error } = await supabase
    .from('content_items')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete content item
 */
export async function deleteContentItem(id: string) {
  const { error } = await supabase
    .from('content_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Publish content item
 */
export async function publishContentItem(id: string, userId: string) {
  const { data, error } = await supabase
    .from('content_items')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Archive content item
 */
export async function archiveContentItem(id: string, userId: string) {
  const { data, error } = await supabase
    .from('content_items')
    .update({
      status: 'archived',
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Increment view count
 */
export async function incrementViewCount(id: string) {
  const { data, error } = await supabase.rpc('increment', {
    row_id: id,
    table_name: 'content_items',
    column_name: 'views_count',
  });

  if (error) throw error;
  return data;
}

/**
 * Increment like count
 */
export async function incrementLikeCount(id: string) {
  const { data, error } = await supabase.rpc('increment', {
    row_id: id,
    table_name: 'content_items',
    column_name: 'likes_count',
  });

  if (error) throw error;
  return data;
}

/**
 * Get popular content (most viewed/liked)
 */
export async function getPopularContent(
  tenantId: string,
  limit: number = 10,
  metric: 'views' | 'likes' = 'views'
) {
  const sortColumn = metric === 'views' ? 'views_count' : 'likes_count';

  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'published')
    .order(sortColumn, { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Get recent content
 */
export async function getRecentContent(
  tenantId: string,
  limit: number = 10
) {
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Get content by category
 */
export async function getContentByCategory(
  tenantId: string,
  category: string,
  limit?: number
) {
  let query = supabase
    .from('content_items')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('category', category)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Search content
 */
export async function searchContent(
  tenantId: string,
  searchQuery: string,
  limit: number = 20
) {
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'published')
    .or(
      `title_ar.ilike.%${searchQuery}%,title_en.ilike.%${searchQuery}%,content_body_ar.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`
    )
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Get content statistics
 */
export async function getContentStatistics(tenantId: string) {
  const { data, error } = await supabase
    .from('content_items')
    .select('status, content_type')
    .eq('tenant_id', tenantId);

  if (error) throw error;

  const stats = {
    total: data?.length || 0,
    byStatus: {} as Record<string, number>,
    byType: {} as Record<string, number>,
  };

  data?.forEach(item => {
    stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;
    stats.byType[item.content_type] = (stats.byType[item.content_type] || 0) + 1;
  });

  return stats;
}
