/**
 * M17: Knowledge Hub - Query Logs Integration
 * Track and analyze user queries for RAG system
 */

import { supabase } from './client';
import type { Database } from './types';

type KnowledgeQuery = Database['public']['Tables']['knowledge_queries']['Row'];
type KnowledgeQueryInsert = Database['public']['Tables']['knowledge_queries']['Insert'];
type KnowledgeQueryUpdate = Database['public']['Tables']['knowledge_queries']['Update'];

/**
 * Log a new query and response
 */
export async function logKnowledgeQuery(query: KnowledgeQueryInsert) {
  const { data, error } = await supabase
    .from('knowledge_queries')
    .insert(query)
    .select()
    .single();

  if (error) throw error;
  return data as KnowledgeQuery;
}

/**
 * Update query with feedback
 */
export async function updateQueryFeedback(
  queryId: string,
  wasHelpful: boolean,
  comment?: string
) {
  const { data, error } = await supabase
    .from('knowledge_queries')
    .update({
      was_helpful: wasHelpful,
      feedback_comment: comment,
      feedback_at: new Date().toISOString(),
    })
    .eq('id', queryId)
    .select()
    .single();

  if (error) throw error;
  return data as KnowledgeQuery;
}

/**
 * Fetch query history for a user
 */
export async function fetchUserQueryHistory(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('knowledge_queries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as KnowledgeQuery[];
}

/**
 * Fetch all queries for analytics
 */
export async function fetchAllQueries(tenantId: string, filters: {
  startDate?: string;
  endDate?: string;
  wasHelpful?: boolean;
  limit?: number;
} = {}) {
  let query = supabase
    .from('knowledge_queries')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  if (filters.wasHelpful !== undefined) {
    query = query.eq('was_helpful', filters.wasHelpful);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as KnowledgeQuery[];
}

/**
 * Get query analytics
 */
export async function getQueryAnalytics(tenantId: string, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('knowledge_queries')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('created_at', startDate.toISOString());

  if (error) throw error;

  const queries = data as KnowledgeQuery[];

  // Calculate analytics
  const totalQueries = queries.length;
  const queriesWithFeedback = queries.filter((q) => q.was_helpful !== null);
  const helpfulQueries = queries.filter((q) => q.was_helpful === true);
  const unhelpfulQueries = queries.filter((q) => q.was_helpful === false);

  const avgResponseTime =
    queries.reduce((sum, q) => sum + (q.response_time_ms || 0), 0) / totalQueries || 0;

  const avgConfidence =
    queries.reduce((sum, q) => sum + (q.confidence_score || 0), 0) / totalQueries || 0;

  // Most common queries
  const queryFrequency: Record<string, number> = {};
  queries.forEach((q) => {
    const normalized = q.query_text.toLowerCase().trim();
    queryFrequency[normalized] = (queryFrequency[normalized] || 0) + 1;
  });

  const topQueries = Object.entries(queryFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([query, count]) => ({ query, count }));

  // Queries by language
  const byLanguage = {
    ar: queries.filter((q) => q.query_language === 'ar').length,
    en: queries.filter((q) => q.query_language === 'en').length,
  };

  return {
    totalQueries,
    queriesWithFeedback: queriesWithFeedback.length,
    helpfulQueries: helpfulQueries.length,
    unhelpfulQueries: unhelpfulQueries.length,
    helpfulnessRate:
      queriesWithFeedback.length > 0
        ? (helpfulQueries.length / queriesWithFeedback.length) * 100
        : 0,
    avgResponseTime: Math.round(avgResponseTime),
    avgConfidence: Math.round(avgConfidence * 100) / 100,
    topQueries,
    byLanguage,
  };
}

/**
 * Get poorly performing queries (low confidence or unhelpful)
 */
export async function getPoorlyPerformingQueries(tenantId: string, limit = 20) {
  const { data, error } = await supabase
    .from('knowledge_queries')
    .select('*')
    .eq('tenant_id', tenantId)
    .or('was_helpful.eq.false,confidence_score.lt.0.5')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as KnowledgeQuery[];
}

/**
 * Get queries without answers (failed to find relevant content)
 */
export async function getUnansweredQueries(tenantId: string, limit = 20) {
  const { data, error } = await supabase
    .from('knowledge_queries')
    .select('*')
    .eq('tenant_id', tenantId)
    .is('answer_text', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as KnowledgeQuery[];
}
