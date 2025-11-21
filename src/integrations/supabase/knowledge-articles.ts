/**
 * M17: Knowledge Hub - Articles Integration
 * CRUD operations for knowledge articles
 */

import { supabase } from './client';
import type { Database } from './types';

type KnowledgeArticle = Database['public']['Tables']['knowledge_articles']['Row'];
type KnowledgeArticleInsert = Database['public']['Tables']['knowledge_articles']['Insert'];
type KnowledgeArticleUpdate = Database['public']['Tables']['knowledge_articles']['Update'];

export interface ArticleFilters {
  category?: string;
  documentType?: string;
  isPublished?: boolean;
  isVerified?: boolean;
  tags?: string[];
  searchQuery?: string;
  language?: 'ar' | 'en' | 'both';
}

/**
 * Fetch knowledge articles with filters
 */
export async function fetchKnowledgeArticles(filters: ArticleFilters = {}) {
  let query = supabase
    .from('knowledge_articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  if (filters.documentType) {
    query = query.eq('document_type', filters.documentType);
  }

  if (filters.isPublished !== undefined) {
    query = query.eq('is_published', filters.isPublished);
  }

  if (filters.isVerified !== undefined) {
    query = query.eq('is_verified', filters.isVerified);
  }

  if (filters.language) {
    query = query.eq('language', filters.language);
  }

  if (filters.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags);
  }

  if (filters.searchQuery) {
    query = query.or(
      `title_ar.ilike.%${filters.searchQuery}%,title_en.ilike.%${filters.searchQuery}%,content_ar.ilike.%${filters.searchQuery}%,content_en.ilike.%${filters.searchQuery}%`
    );
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as KnowledgeArticle[];
}

/**
 * Fetch single article by ID
 */
export async function fetchArticleById(articleId: string) {
  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('*')
    .eq('id', articleId)
    .single();

  if (error) throw error;
  return data as KnowledgeArticle;
}

/**
 * Create new knowledge article
 */
export async function createKnowledgeArticle(article: KnowledgeArticleInsert) {
  const { data, error } = await supabase
    .from('knowledge_articles')
    .insert(article)
    .select()
    .single();

  if (error) throw error;
  return data as KnowledgeArticle;
}

/**
 * Update existing article
 */
export async function updateKnowledgeArticle(
  articleId: string,
  updates: KnowledgeArticleUpdate
) {
  const { data, error } = await supabase
    .from('knowledge_articles')
    .update(updates)
    .eq('id', articleId)
    .select()
    .single();

  if (error) throw error;
  return data as KnowledgeArticle;
}

/**
 * Delete article
 */
export async function deleteKnowledgeArticle(articleId: string) {
  const { error } = await supabase
    .from('knowledge_articles')
    .delete()
    .eq('id', articleId);

  if (error) throw error;
}

/**
 * Publish article
 */
export async function publishArticle(articleId: string) {
  const { data, error } = await supabase
    .from('knowledge_articles')
    .update({
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .eq('id', articleId)
    .select()
    .single();

  if (error) throw error;
  return data as KnowledgeArticle;
}

/**
 * Unpublish article
 */
export async function unpublishArticle(articleId: string) {
  const { data, error } = await supabase
    .from('knowledge_articles')
    .update({
      is_published: false,
    })
    .eq('id', articleId)
    .select()
    .single();

  if (error) throw error;
  return data as KnowledgeArticle;
}

/**
 * Verify article
 */
export async function verifyArticle(articleId: string, verifiedBy: string) {
  const { data, error } = await supabase
    .from('knowledge_articles')
    .update({
      is_verified: true,
      verified_by: verifiedBy,
      verified_at: new Date().toISOString(),
    })
    .eq('id', articleId)
    .select()
    .single();

  if (error) throw error;
  return data as KnowledgeArticle;
}

/**
 * Increment article view count
 */
export async function incrementArticleView(articleId: string) {
  const { error } = await supabase.rpc('increment_article_view', {
    p_article_id: articleId,
  });

  if (error) throw error;
}

/**
 * Increment article search count
 */
export async function incrementArticleSearch(articleId: string) {
  const { error } = await supabase.rpc('increment_article_search', {
    p_article_id: articleId,
  });

  if (error) throw error;
}

/**
 * Record article feedback (helpful/not helpful)
 */
export async function recordArticleFeedback(
  articleId: string,
  helpful: boolean
) {
  const field = helpful ? 'helpful_count' : 'not_helpful_count';
  
  const { data: article } = await supabase
    .from('knowledge_articles')
    .select(field)
    .eq('id', articleId)
    .single();

  if (!article) throw new Error('Article not found');

  const currentCount = (article as any)[field] || 0;

  const { error } = await supabase
    .from('knowledge_articles')
    .update({ [field]: currentCount + 1 })
    .eq('id', articleId);

  if (error) throw error;
}

/**
 * Get article statistics
 */
export async function getArticleStats(tenantId: string) {
  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('document_type, category, is_published, is_verified')
    .eq('tenant_id', tenantId);

  if (error) throw error;

  const stats = {
    total: data.length,
    published: data.filter((a) => a.is_published).length,
    verified: data.filter((a) => a.is_verified).length,
    byType: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
  };

  data.forEach((article) => {
    stats.byType[article.document_type] = (stats.byType[article.document_type] || 0) + 1;
    stats.byCategory[article.category] = (stats.byCategory[article.category] || 0) + 1;
  });

  return stats;
}

/**
 * Get trending articles (most viewed/searched)
 */
export async function getTrendingArticles(limit = 10) {
  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('*')
    .eq('is_published', true)
    .order('view_count', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as KnowledgeArticle[];
}

/**
 * Get related articles by tags
 */
export async function getRelatedArticles(articleId: string, limit = 5) {
  const { data: article } = await supabase
    .from('knowledge_articles')
    .select('tags, category')
    .eq('id', articleId)
    .single();

  if (!article) return [];

  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('*')
    .eq('is_published', true)
    .neq('id', articleId)
    .or(`category.eq.${article.category},tags.ov.{${article.tags?.join(',') || ''}}`)
    .limit(limit);

  if (error) throw error;
  return data as KnowledgeArticle[];
}
