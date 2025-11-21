-- =====================================================
-- M16 & M17 Enhancement: AI Advisory + Knowledge Hub
-- Week 7-10 Implementation
-- =====================================================

-- =====================================================
-- PART 1: M16 - AI Advisory Engine Enhancements
-- =====================================================

-- 1.1: Add backup tracking to ai_recommendations
ALTER TABLE public.ai_recommendations
ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMP WITH TIME ZONE;

-- 1.2: Add backup tracking to ai_decision_logs
ALTER TABLE public.ai_decision_logs
ADD COLUMN IF NOT EXISTS last_backed_up_at TIMESTAMP WITH TIME ZONE;

-- 1.3: Create ai_learning_metrics table for feedback analytics
CREATE TABLE IF NOT EXISTS public.ai_learning_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  recommendation_id UUID REFERENCES public.ai_recommendations(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL,
  
  -- Metrics
  feedback_count INTEGER DEFAULT 0,
  acceptance_rate DECIMAL(5,2),
  avg_confidence_score DECIMAL(5,2),
  avg_feedback_rating DECIMAL(3,2),
  
  -- Learning insights
  common_rejection_reasons TEXT[],
  improvement_suggestions JSONB,
  model_performance_score DECIMAL(5,2),
  
  -- Aggregation period
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_backed_up_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT valid_period CHECK (period_end > period_start),
  CONSTRAINT valid_rates CHECK (
    acceptance_rate IS NULL OR (acceptance_rate >= 0 AND acceptance_rate <= 100)
  )
);

-- Add indexes for ai_learning_metrics
CREATE INDEX IF NOT EXISTS idx_ai_learning_metrics_tenant 
  ON public.ai_learning_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_learning_metrics_context 
  ON public.ai_learning_metrics(tenant_id, context_type);
CREATE INDEX IF NOT EXISTS idx_ai_learning_metrics_period 
  ON public.ai_learning_metrics(period_start, period_end);

-- Enable RLS for ai_learning_metrics
ALTER TABLE public.ai_learning_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_learning_metrics
CREATE POLICY "learning_metrics_tenant_isolation"
  ON public.ai_learning_metrics
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- PART 2: M17 - Knowledge Hub + RAG System
-- =====================================================

-- 2.1: Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2.2: Create knowledge_articles table
CREATE TABLE IF NOT EXISTS public.knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  
  -- Article content
  title_ar TEXT NOT NULL,
  title_en TEXT,
  content_ar TEXT NOT NULL,
  content_en TEXT,
  summary_ar TEXT,
  summary_en TEXT,
  
  -- Categorization
  category TEXT NOT NULL,
  tags TEXT[],
  document_type TEXT NOT NULL CHECK (
    document_type IN (
      'policy', 'procedure', 'guideline', 'standard',
      'best_practice', 'case_study', 'regulation', 'faq',
      'training', 'template'
    )
  ),
  
  -- Metadata
  author_id UUID,
  is_published BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  version INTEGER DEFAULT 1,
  source_url TEXT,
  
  -- SEO & Search
  keywords TEXT[],
  language TEXT DEFAULT 'ar' CHECK (language IN ('ar', 'en', 'both')),
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  search_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  
  -- Relations
  related_articles UUID[],
  superseded_by UUID,
  
  -- Timestamps
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_backed_up_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for knowledge_articles
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_tenant 
  ON public.knowledge_articles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_category 
  ON public.knowledge_articles(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_type 
  ON public.knowledge_articles(tenant_id, document_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_published 
  ON public.knowledge_articles(tenant_id, is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_tags 
  ON public.knowledge_articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_keywords 
  ON public.knowledge_articles USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_search_count 
  ON public.knowledge_articles(search_count DESC);

-- Enable RLS for knowledge_articles
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for knowledge_articles
CREATE POLICY "knowledge_articles_tenant_isolation"
  ON public.knowledge_articles
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "knowledge_articles_published_read"
  ON public.knowledge_articles
  FOR SELECT
  USING (is_published = true);

-- 2.3: Create knowledge_embeddings table
CREATE TABLE IF NOT EXISTS public.knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  article_id UUID NOT NULL REFERENCES public.knowledge_articles(id) ON DELETE CASCADE,
  
  -- Chunk information
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  chunk_tokens INTEGER,
  
  -- Vector embedding (1536 dimensions for text-embedding-3-small)
  embedding vector(1536),
  
  -- Metadata
  language TEXT DEFAULT 'ar',
  section_title TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_backed_up_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT unique_article_chunk UNIQUE (article_id, chunk_index)
);

-- Add indexes for knowledge_embeddings
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_tenant 
  ON public.knowledge_embeddings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_article 
  ON public.knowledge_embeddings(article_id);

-- HNSW index for fast vector similarity search
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_vector 
  ON public.knowledge_embeddings 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Enable RLS for knowledge_embeddings
ALTER TABLE public.knowledge_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for knowledge_embeddings
CREATE POLICY "knowledge_embeddings_tenant_isolation"
  ON public.knowledge_embeddings
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants
      WHERE user_id = auth.uid()
    )
  );

-- 2.4: Create knowledge_queries table
CREATE TABLE IF NOT EXISTS public.knowledge_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  
  -- Query information
  query_text TEXT NOT NULL,
  query_language TEXT DEFAULT 'ar',
  user_id UUID,
  
  -- Response
  answer_text TEXT,
  source_articles UUID[],
  confidence_score DECIMAL(5,2),
  
  -- Feedback
  was_helpful BOOLEAN,
  feedback_comment TEXT,
  feedback_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  response_time_ms INTEGER,
  model_used TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_backed_up_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for knowledge_queries
CREATE INDEX IF NOT EXISTS idx_knowledge_queries_tenant 
  ON public.knowledge_queries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_queries_user 
  ON public.knowledge_queries(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_queries_created 
  ON public.knowledge_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_queries_helpful 
  ON public.knowledge_queries(was_helpful) WHERE was_helpful IS NOT NULL;

-- Enable RLS for knowledge_queries
ALTER TABLE public.knowledge_queries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for knowledge_queries
CREATE POLICY "knowledge_queries_tenant_isolation"
  ON public.knowledge_queries
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "knowledge_queries_user_own"
  ON public.knowledge_queries
  FOR ALL
  USING (user_id = auth.uid());

-- =====================================================
-- PART 3: Database Functions
-- =====================================================

-- 3.1: Vector similarity search function
CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  article_id UUID,
  chunk_text TEXT,
  chunk_index INTEGER,
  similarity FLOAT,
  article_title TEXT,
  article_category TEXT,
  document_type TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ke.id,
    ke.article_id,
    ke.chunk_text,
    ke.chunk_index,
    1 - (ke.embedding <=> query_embedding) AS similarity,
    ka.title_ar AS article_title,
    ka.category AS article_category,
    ka.document_type
  FROM public.knowledge_embeddings ke
  INNER JOIN public.knowledge_articles ka ON ka.id = ke.article_id
  WHERE 
    (p_tenant_id IS NULL OR ke.tenant_id = p_tenant_id)
    AND ka.is_published = true
    AND (1 - (ke.embedding <=> query_embedding)) > match_threshold
  ORDER BY ke.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 3.2: Update knowledge article view count
CREATE OR REPLACE FUNCTION public.increment_article_view(
  p_article_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.knowledge_articles
  SET 
    view_count = view_count + 1,
    updated_at = now()
  WHERE id = p_article_id;
END;
$$;

-- 3.3: Update knowledge article search count
CREATE OR REPLACE FUNCTION public.increment_article_search(
  p_article_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.knowledge_articles
  SET 
    search_count = search_count + 1,
    updated_at = now()
  WHERE id = p_article_id;
END;
$$;

-- =====================================================
-- PART 4: Triggers
-- =====================================================

-- 4.1: Auto-update updated_at for ai_learning_metrics
CREATE OR REPLACE FUNCTION public.update_ai_learning_metrics_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ai_learning_metrics_updated_at
  BEFORE UPDATE ON public.ai_learning_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_learning_metrics_updated_at();

-- 4.2: Auto-update updated_at for knowledge_articles
CREATE OR REPLACE FUNCTION public.update_knowledge_articles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_knowledge_articles_updated_at
  BEFORE UPDATE ON public.knowledge_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_knowledge_articles_updated_at();

-- 4.3: Auto-update updated_at for knowledge_embeddings
CREATE OR REPLACE FUNCTION public.update_knowledge_embeddings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_knowledge_embeddings_updated_at
  BEFORE UPDATE ON public.knowledge_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_knowledge_embeddings_updated_at();

-- 4.4: Audit log triggers for ai_recommendations
CREATE TRIGGER trg_ai_recommendations_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.ai_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.log_table_changes();

-- 4.5: Audit log triggers for knowledge_articles
CREATE TRIGGER trg_knowledge_articles_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.knowledge_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_table_changes();

-- =====================================================
-- PART 5: Indexes for Performance
-- =====================================================

-- Add missing indexes for ai_recommendations
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_context_type 
  ON public.ai_recommendations(tenant_id, context_type);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_status 
  ON public.ai_recommendations(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_priority 
  ON public.ai_recommendations(tenant_id, priority);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_created 
  ON public.ai_recommendations(created_at DESC);

-- Add missing indexes for ai_decision_logs
CREATE INDEX IF NOT EXISTS idx_ai_decision_logs_context 
  ON public.ai_decision_logs(tenant_id, context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_ai_decision_logs_decided 
  ON public.ai_decision_logs(decided_at DESC);

-- =====================================================
-- PART 6: Documentation Comments
-- =====================================================

COMMENT ON TABLE public.ai_learning_metrics IS 'M16: Stores aggregated learning metrics and feedback analytics for AI recommendations';
COMMENT ON TABLE public.knowledge_articles IS 'M17: Main table for knowledge hub articles with full content and metadata';
COMMENT ON TABLE public.knowledge_embeddings IS 'M17: Vector embeddings for semantic search across knowledge articles';
COMMENT ON TABLE public.knowledge_queries IS 'M17: Logs user queries and RAG responses for analytics and improvement';
COMMENT ON FUNCTION public.match_knowledge_chunks IS 'M17: Performs vector similarity search for RAG semantic search';
COMMENT ON FUNCTION public.increment_article_view IS 'M17: Increments view count for knowledge articles';
COMMENT ON FUNCTION public.increment_article_search IS 'M17: Increments search count when article appears in results';