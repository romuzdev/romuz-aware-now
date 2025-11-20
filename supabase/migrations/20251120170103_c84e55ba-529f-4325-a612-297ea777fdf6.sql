-- Drop with correct signature
DROP FUNCTION IF EXISTS match_knowledge_documents(TEXT, DOUBLE PRECISION, INTEGER, UUID, TEXT);
DROP FUNCTION IF EXISTS match_similar_questions(TEXT, DOUBLE PRECISION, INTEGER, UUID);

-- Recreate match_knowledge_documents with correct column names
CREATE FUNCTION match_knowledge_documents(
  query_embedding TEXT,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INTEGER DEFAULT 10,
  p_tenant_id UUID DEFAULT NULL,
  p_document_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title_ar TEXT,
  title_en TEXT,
  content_ar TEXT,
  content_en TEXT,
  summary_ar TEXT,
  summary_en TEXT,
  document_type TEXT,
  category TEXT,
  tags TEXT[],
  keywords TEXT[],
  source_url TEXT,
  is_verified BOOLEAN,
  usefulness_score NUMERIC,
  views_count INTEGER,
  helpful_count INTEGER,
  unhelpful_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  query_vec vector;
BEGIN
  query_vec := query_embedding::vector;
  
  RETURN QUERY
  SELECT 
    kd.id,
    kd.title_ar,
    kd.title_en,
    kd.content_ar,
    kd.content_en,
    kd.summary_ar,
    kd.summary_en,
    kd.document_type,
    kd.category,
    kd.tags,
    kd.keywords,
    kd.source_url,
    kd.is_verified,
    kd.usefulness_score,
    kd.views_count,
    kd.helpful_count,
    kd.unhelpful_count,
    kd.created_at,
    kd.updated_at,
    (1 - (kd.embedding_vector <=> query_vec)) AS similarity
  FROM knowledge_documents kd
  WHERE 
    (p_tenant_id IS NULL OR kd.tenant_id = p_tenant_id)
    AND (p_document_type IS NULL OR kd.document_type = p_document_type)
    AND kd.embedding_vector IS NOT NULL
    AND kd.is_deleted = false
    AND (1 - (kd.embedding_vector <=> query_vec)) >= match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;