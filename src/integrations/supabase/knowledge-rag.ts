/**
 * M17: Knowledge Hub - RAG Integration
 * Retrieval-Augmented Generation for intelligent Q&A
 */

import { supabase } from './client';

export interface RAGSearchParams {
  query: string;
  language?: 'ar' | 'en';
  threshold?: number;
  limit?: number;
}

export interface RAGSearchResult {
  id: string;
  article_id: string;
  chunk_text: string;
  chunk_index: number;
  similarity: number;
  article_title: string;
  article_category: string;
  document_type: string;
}

export interface RAGQueryResult {
  answer: string;
  sources: RAGSearchResult[];
  confidence: number;
  queryId: string;
}

/**
 * Perform semantic search using vector embeddings
 */
export async function performSemanticSearch(
  params: RAGSearchParams
): Promise<RAGSearchResult[]> {
  const { query, threshold = 0.3, limit = 10 } = params;

  // Step 1: Generate embedding for the query
  const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke(
    'knowledge-embed',
    {
      body: {
        text: query,
        type: 'query',
      },
    }
  );

  if (embeddingError) throw embeddingError;
  if (!embeddingData?.embedding) throw new Error('Failed to generate query embedding');

  // Step 2: Search for similar chunks
  const { data: searchResults, error: searchError } = await supabase.rpc(
    'match_knowledge_chunks',
    {
      query_embedding: JSON.stringify(embeddingData.embedding),
      match_threshold: threshold,
      match_count: limit,
    }
  );

  if (searchError) throw searchError;

  return searchResults as RAGSearchResult[];
}

/**
 * Ask a question and get AI-generated answer with sources
 */
export async function askQuestion(params: {
  question: string;
  language?: 'ar' | 'en';
  userId?: string;
}): Promise<RAGQueryResult> {
  const { question, language = 'ar', userId } = params;

  // Step 1: Perform semantic search
  const sources = await performSemanticSearch({
    query: question,
    language,
    threshold: 0.3,
    limit: 5,
  });

  if (sources.length === 0) {
    // No relevant sources found
    const emptyResult: RAGQueryResult = {
      answer:
        language === 'ar'
          ? 'عذراً، لم أتمكن من العثور على معلومات ذات صلة في قاعدة المعرفة للإجابة على سؤالك.'
          : 'Sorry, I could not find relevant information in the knowledge base to answer your question.',
      sources: [],
      confidence: 0,
      queryId: '',
    };

    // Log the query
    const { data: queryLog } = await supabase
      .from('knowledge_queries')
      .insert({
        query_text: question,
        query_language: language,
        user_id: userId,
        answer_text: emptyResult.answer,
        source_articles: [],
        confidence_score: 0,
      })
      .select()
      .single();

    return {
      ...emptyResult,
      queryId: queryLog?.id || '',
    };
  }

  // Step 2: Prepare context from top sources
  const context = sources
    .map(
      (source, idx) =>
        `[مصدر ${idx + 1}: ${source.article_title}]\n${source.chunk_text}`
    )
    .join('\n\n---\n\n');

  // Step 3: Generate answer using RAG
  const startTime = Date.now();
  const { data: ragData, error: ragError } = await supabase.functions.invoke(
    'knowledge-rag',
    {
      body: {
        question,
        context,
        language,
        sources: sources.map((s) => ({
          article_id: s.article_id,
          title: s.article_title,
        })),
      },
    }
  );

  const responseTime = Date.now() - startTime;

  if (ragError) throw ragError;
  if (!ragData?.answer) throw new Error('Failed to generate RAG answer');

  // Step 4: Log the query and response
  const { data: queryLog } = await supabase
    .from('knowledge_queries')
    .insert({
      query_text: question,
      query_language: language,
      user_id: userId,
      answer_text: ragData.answer,
      source_articles: sources.map((s) => s.article_id),
      confidence_score: ragData.confidence || 0.7,
      response_time_ms: responseTime,
      model_used: ragData.model || 'google/gemini-2.5-flash',
    })
    .select()
    .single();

  // Step 5: Update article search counts
  const uniqueArticleIds = [...new Set(sources.map((s) => s.article_id))];
  for (const articleId of uniqueArticleIds) {
    await supabase.rpc('increment_article_search', { p_article_id: articleId });
  }

  return {
    answer: ragData.answer,
    sources,
    confidence: ragData.confidence || 0.7,
    queryId: queryLog?.id || '',
  };
}

/**
 * Provide feedback on a RAG query result
 */
export async function provideQueryFeedback(
  queryId: string,
  helpful: boolean,
  comment?: string
) {
  const { data, error } = await supabase
    .from('knowledge_queries')
    .update({
      was_helpful: helpful,
      feedback_comment: comment,
      feedback_at: new Date().toISOString(),
    })
    .eq('id', queryId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get query history for a user
 */
export async function getQueryHistory(params: { userId?: string; limit?: number } = {}) {
  const { userId, limit = 20 } = params;

  let query = supabase
    .from('knowledge_queries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}
