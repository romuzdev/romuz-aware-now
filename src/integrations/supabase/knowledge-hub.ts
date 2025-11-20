/**
 * M17: Knowledge Hub + RAG - Integration Layer
 * This file provides integration functions for the Knowledge Hub module
 * All backend communication goes through these functions
 */

import { supabase } from './client';

// ============================================================================
// Types
// ============================================================================

export interface KnowledgeDocument {
  id: string;
  tenant_id: string;
  title_ar: string;
  title_en?: string;
  content_ar: string;
  content_en?: string;
  summary_ar?: string;
  summary_en?: string;
  document_type: string;
  category: string;
  tags: string[];
  keywords: string[];
  embedding_vector?: number[];
  source_url?: string;
  source_document_id?: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  usefulness_score: number;
  views_count: number;
  helpful_count: number;
  unhelpful_count: number;
  metadata?: Record<string, any>;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by?: string;
  is_deleted: boolean;
}

export interface KnowledgeQA {
  id: string;
  tenant_id: string;
  question_ar: string;
  question_en?: string;
  answer_ar: string;
  answer_en?: string;
  source_documents: string[];
  confidence_score: number;
  model_used: string;
  was_helpful?: boolean;
  feedback_comment?: string;
  feedback_at?: string;
  views_count: number;
  asked_by?: string;
  created_at: string;
}

export interface KnowledgeRelation {
  id: string;
  source_doc_id: string;
  target_doc_id: string;
  relation_type: 'references' | 'supersedes' | 'relates_to' | 'conflicts_with' | 'extends';
  strength: number;
  is_auto_detected: boolean;
  created_at: string;
  created_by: string;
}

export interface SearchResult extends KnowledgeDocument {
  similarity: number;
}

export interface QAResponse {
  success: boolean;
  answer: string;
  confidence: number;
  sources: Array<{
    id: string;
    title: string;
    type: string;
    category: string;
    similarity: number;
  }>;
  qa_id?: string;
  is_cached?: boolean;
  is_insufficient_context?: boolean;
}

// ============================================================================
// Edge Function Calls
// ============================================================================

/**
 * Generate vector embedding for text
 */
export async function generateEmbedding(
  text: string,
  type: 'document' | 'query' = 'document'
): Promise<{ embedding: number[]; dimensions: number }> {
  try {
    const { data, error } = await supabase.functions.invoke('knowledge-embed', {
      body: { text, type },
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || 'Failed to generate embedding');

    return {
      embedding: data.embedding,
      dimensions: data.dimensions,
    };
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Semantic search across knowledge documents
 */
export async function searchKnowledge(params: {
  query: string;
  documentType?: string;
  category?: string;
  limit?: number;
  threshold?: number;
}): Promise<{ results: SearchResult[]; count: number }> {
  try {
    // Get current session for auth header
    const { data: { session } } = await supabase.auth.getSession();
    
    const { data, error } = await supabase.functions.invoke('knowledge-search', {
      body: params,
      headers: session?.access_token ? {
        Authorization: `Bearer ${session.access_token}`,
      } : undefined,
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || 'Search failed');

    return {
      results: data.results,
      count: data.count,
    };
  } catch (error) {
    console.error('Error searching knowledge:', error);
    throw error;
  }
}

/**
 * Ask a question using RAG (Retrieval-Augmented Generation)
 */
export async function askQuestion(params: {
  question: string;
  language?: 'ar' | 'en';
  maxSources?: number;
}): Promise<QAResponse> {
  try {
    // Get current session for auth header
    const { data: { session } } = await supabase.auth.getSession();
    
    const { data, error } = await supabase.functions.invoke('knowledge-qa', {
      body: params,
      headers: session?.access_token ? {
        Authorization: `Bearer ${session.access_token}`,
      } : undefined,
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || 'Q&A failed');

    return data as QAResponse;
  } catch (error) {
    console.error('Error asking question:', error);
    throw error;
  }
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Get all knowledge documents with optional filters
 */
export async function getKnowledgeDocuments(filters?: {
  documentType?: string;
  category?: string;
  isVerified?: boolean;
  tags?: string[];
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('knowledge_documents')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (filters?.documentType) {
      query = query.eq('document_type', filters.documentType);
    }

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.isVerified !== undefined) {
      query = query.eq('is_verified', filters.isVerified);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 10) - 1
      );
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as KnowledgeDocument[];
  } catch (error) {
    console.error('Error fetching knowledge documents:', error);
    throw error;
  }
}

/**
 * Get a single knowledge document by ID
 */
export async function getKnowledgeDocument(id: string) {
  try {
    const { data, error } = await supabase
      .from('knowledge_documents')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error) throw error;
    return data as KnowledgeDocument;
  } catch (error) {
    console.error('Error fetching knowledge document:', error);
    throw error;
  }
}

/**
 * Create a new knowledge document
 */
export async function createKnowledgeDocument(input: {
  title_ar: string;
  title_en?: string;
  content_ar: string;
  content_en?: string;
  summary_ar?: string;
  summary_en?: string;
  document_type: string;
  category: string;
  tags?: string[];
  keywords?: string[];
  source_url?: string;
  source_document_id?: string;
  metadata?: Record<string, any>;
}) {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Step 1: Generate embedding for the content
    const embeddingText = `${input.title_ar}\n\n${input.content_ar}`;
    const { embedding } = await generateEmbedding(embeddingText, 'document');

    // Step 2: Insert document with embedding
    const { data, error } = await supabase
      .from('knowledge_documents')
      .insert({
        ...input,
        embedding_vector: JSON.stringify(embedding),
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as KnowledgeDocument;
  } catch (error) {
    console.error('Error creating knowledge document:', error);
    throw error;
  }
}

/**
 * Update a knowledge document
 */
export async function updateKnowledgeDocument(
  id: string,
  updates: Partial<KnowledgeDocument>
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // If content changed, regenerate embedding
    let embeddingUpdate = {};
    if (updates.content_ar || updates.title_ar) {
      const doc = await getKnowledgeDocument(id);
      const newContent = updates.content_ar || doc.content_ar;
      const newTitle = updates.title_ar || doc.title_ar;
      const embeddingText = `${newTitle}\n\n${newContent}`;
      const { embedding } = await generateEmbedding(embeddingText, 'document');
      embeddingUpdate = { embedding_vector: JSON.stringify(embedding) };
    }

    const { data, error } = await supabase
      .from('knowledge_documents')
      .update({
        ...updates,
        ...embeddingUpdate,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as KnowledgeDocument;
  } catch (error) {
    console.error('Error updating knowledge document:', error);
    throw error;
  }
}

/**
 * Soft delete a knowledge document
 */
export async function deleteKnowledgeDocument(id: string) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('knowledge_documents')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
      })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting knowledge document:', error);
    throw error;
  }
}

/**
 * Verify a knowledge document
 */
export async function verifyKnowledgeDocument(id: string) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('knowledge_documents')
      .update({
        is_verified: true,
        verified_by: user.id,
        verified_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as KnowledgeDocument;
  } catch (error) {
    console.error('Error verifying knowledge document:', error);
    throw error;
  }
}

/**
 * Rate document usefulness
 */
export async function rateDocument(id: string, helpful: boolean) {
  try {
    const doc = await getKnowledgeDocument(id);

    const newHelpfulCount = helpful
      ? doc.helpful_count + 1
      : doc.helpful_count;
    const newUnhelpfulCount = !helpful
      ? doc.unhelpful_count + 1
      : doc.unhelpful_count;
    const totalRatings = newHelpfulCount + newUnhelpfulCount;
    const newScore =
      totalRatings > 0 ? (newHelpfulCount / totalRatings) * 5 : 0;

    const { data, error } = await supabase
      .from('knowledge_documents')
      .update({
        helpful_count: newHelpfulCount,
        unhelpful_count: newUnhelpfulCount,
        usefulness_score: newScore,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as KnowledgeDocument;
  } catch (error) {
    console.error('Error rating document:', error);
    throw error;
  }
}

/**
 * Get Q&A history
 */
export async function getQAHistory(params?: {
  limit?: number;
  wasHelpful?: boolean;
}) {
  try {
    let query = supabase
      .from('knowledge_qa')
      .select('*')
      .order('created_at', { ascending: false });

    if (params?.wasHelpful !== undefined) {
      query = query.eq('was_helpful', params.wasHelpful);
    }

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as KnowledgeQA[];
  } catch (error) {
    console.error('Error fetching Q&A history:', error);
    throw error;
  }
}

/**
 * Provide feedback on Q&A
 */
export async function provideQAFeedback(
  qaId: string,
  helpful: boolean,
  comment?: string
) {
  try {
    const { data, error } = await supabase
      .from('knowledge_qa')
      .update({
        was_helpful: helpful,
        feedback_comment: comment,
        feedback_at: new Date().toISOString(),
      })
      .eq('id', qaId)
      .select()
      .single();

    if (error) throw error;
    return data as KnowledgeQA;
  } catch (error) {
    console.error('Error providing Q&A feedback:', error);
    throw error;
  }
}

/**
 * Get knowledge graph for a document
 */
export async function getKnowledgeGraph(
  documentId: string,
  maxDepth: number = 2
) {
  try {
    const { data, error } = await supabase.rpc('get_knowledge_graph', {
      p_document_id: documentId,
      p_max_depth: maxDepth,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching knowledge graph:', error);
    throw error;
  }
}

/**
 * Create a relation between documents
 */
export async function createKnowledgeRelation(input: {
  source_doc_id: string;
  target_doc_id: string;
  relation_type: KnowledgeRelation['relation_type'];
  strength?: number;
}) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('knowledge_relations')
      .insert({
        ...input,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as KnowledgeRelation;
  } catch (error) {
    console.error('Error creating knowledge relation:', error);
    throw error;
  }
}

/**
 * Get document statistics
 */
export async function getDocumentStats() {
  try {
    const { count: totalDocs, error: e1 } = await supabase
      .from('knowledge_documents')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false);

    const { count: verifiedDocs, error: e2 } = await supabase
      .from('knowledge_documents')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false)
      .eq('is_verified', true);

    const { count: totalQA, error: e3 } = await supabase
      .from('knowledge_qa')
      .select('*', { count: 'exact', head: true });

    const { count: helpfulQA, error: e4 } = await supabase
      .from('knowledge_qa')
      .select('*', { count: 'exact', head: true })
      .eq('was_helpful', true);

    if (e1 || e2 || e3 || e4) {
      throw new Error('Failed to fetch stats');
    }

    return {
      totalDocuments: totalDocs || 0,
      verifiedDocuments: verifiedDocs || 0,
      totalQuestions: totalQA || 0,
      helpfulAnswers: helpfulQA || 0,
    };
  } catch (error) {
    console.error('Error fetching document stats:', error);
    throw error;
  }
}

/**
 * Import document from M10 Documents module
 */
export async function importFromDocuments(documentId: string) {
  try {
    // Fetch the document from documents table
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError) throw docError;
    if (!doc) throw new Error('Document not found');

    // Create knowledge document
    const knowledgeDoc = await createKnowledgeDocument({
      title_ar: doc.title || doc.filename,
      title_en: doc.title_en,
      content_ar: doc.description || doc.content || '',
      document_type: doc.type || 'document',
      category: doc.category || 'general',
      tags: doc.tags || [],
      source_document_id: doc.id,
      metadata: {
        imported_from: 'M10_documents',
        original_filename: doc.filename,
        original_type: doc.type,
      },
    });

    return knowledgeDoc;
  } catch (error) {
    console.error('Error importing from documents:', error);
    throw error;
  }
}
