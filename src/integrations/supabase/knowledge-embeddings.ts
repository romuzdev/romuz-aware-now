/**
 * M17: Knowledge Hub - Embeddings Integration
 * Vector embeddings management for semantic search
 */

import { supabase } from './client';
import type { Database } from './types';

type KnowledgeEmbedding = Database['public']['Tables']['knowledge_embeddings']['Row'];
type KnowledgeEmbeddingInsert = Database['public']['Tables']['knowledge_embeddings']['Insert'];

/**
 * Fetch embeddings for an article
 */
export async function fetchArticleEmbeddings(articleId: string) {
  const { data, error } = await supabase
    .from('knowledge_embeddings')
    .select('*')
    .eq('article_id', articleId)
    .order('chunk_index', { ascending: true });

  if (error) throw error;
  return data as KnowledgeEmbedding[];
}

/**
 * Create embedding chunks for an article
 */
export async function createArticleEmbeddings(embeddings: KnowledgeEmbeddingInsert[]) {
  const { data, error } = await supabase
    .from('knowledge_embeddings')
    .insert(embeddings)
    .select();

  if (error) throw error;
  return data as KnowledgeEmbedding[];
}

/**
 * Delete all embeddings for an article
 */
export async function deleteArticleEmbeddings(articleId: string) {
  const { error } = await supabase
    .from('knowledge_embeddings')
    .delete()
    .eq('article_id', articleId);

  if (error) throw error;
}

/**
 * Update embedding for a specific chunk
 */
export async function updateEmbeddingChunk(
  articleId: string,
  chunkIndex: number,
  embedding: number[]
) {
  const { data, error } = await supabase
    .from('knowledge_embeddings')
    .update({ embedding: JSON.stringify(embedding) as any })
    .eq('article_id', articleId)
    .eq('chunk_index', chunkIndex)
    .select()
    .single();

  if (error) throw error;
  return data as KnowledgeEmbedding;
}

/**
 * Get embedding statistics
 */
export async function getEmbeddingStats(tenantId: string) {
  const { data, error } = await supabase
    .from('knowledge_embeddings')
    .select('article_id, chunk_tokens')
    .eq('tenant_id', tenantId);

  if (error) throw error;

  const stats = {
    totalChunks: data.length,
    totalArticles: new Set(data.map((e) => e.article_id)).size,
    totalTokens: data.reduce((sum, e) => sum + (e.chunk_tokens || 0), 0),
    avgChunksPerArticle: 0,
    avgTokensPerChunk: 0,
  };

  if (stats.totalArticles > 0) {
    stats.avgChunksPerArticle = Math.round(stats.totalChunks / stats.totalArticles);
  }

  if (stats.totalChunks > 0) {
    stats.avgTokensPerChunk = Math.round(stats.totalTokens / stats.totalChunks);
  }

  return stats;
}

/**
 * Check if article has embeddings
 */
export async function articleHasEmbeddings(articleId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('knowledge_embeddings')
    .select('id', { count: 'exact', head: true })
    .eq('article_id', articleId);

  if (error) throw error;
  return (count || 0) > 0;
}

/**
 * Chunk text into smaller pieces for embedding
 * Max 500 tokens per chunk with 50 token overlap
 */
export function chunkText(text: string, maxTokens = 500, overlapTokens = 50): string[] {
  // Simple approximation: 1 token ≈ 4 characters for Arabic
  const maxChars = maxTokens * 4;
  const overlapChars = overlapTokens * 4;

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + maxChars;

    // If not the last chunk, find a natural break point
    if (endIndex < text.length) {
      // Look for sentence boundaries
      const searchText = text.slice(startIndex, endIndex);
      const lastPeriod = Math.max(
        searchText.lastIndexOf('.'),
        searchText.lastIndexOf('。'),
        searchText.lastIndexOf('؟'),
        searchText.lastIndexOf('!')
      );

      if (lastPeriod > maxChars / 2) {
        endIndex = startIndex + lastPeriod + 1;
      }
    }

    const chunk = text.slice(startIndex, endIndex).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Move to next chunk with overlap
    startIndex = endIndex - overlapChars;
  }

  return chunks;
}

/**
 * Estimate token count for text
 */
export function estimateTokens(text: string): number {
  // Simple approximation: 1 token ≈ 4 characters for Arabic
  return Math.ceil(text.length / 4);
}
