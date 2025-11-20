-- Fix match_knowledge_documents to properly cast JSON string to vector
DROP FUNCTION IF EXISTS match_knowledge_documents(vector, float, int, uuid, text);

CREATE OR REPLACE FUNCTION match_knowledge_documents(
  query_embedding TEXT,  -- Changed from vector to TEXT (JSON string)
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10,
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
  document_type TEXT,
  category TEXT,
  tags TEXT[],
  similarity FLOAT,
  usefulness_score INTEGER,
  views_count INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  query_vec vector(1536);
BEGIN
  -- Convert JSON string to vector
  query_vec := query_embedding::vector;
  
  RETURN QUERY
  SELECT
    kd.id,
    kd.title_ar,
    kd.title_en,
    kd.content_ar,
    kd.content_en,
    kd.summary_ar,
    kd.document_type,
    kd.category,
    kd.tags,
    1 - (kd.embedding_vector <=> query_vec) AS similarity,
    kd.usefulness_score,
    kd.views_count
  FROM knowledge_documents kd
  WHERE 
    kd.is_verified = true
    AND kd.is_deleted = false
    AND (p_tenant_id IS NULL OR kd.tenant_id = p_tenant_id)
    AND (p_document_type IS NULL OR kd.document_type = p_document_type)
    AND kd.embedding_vector IS NOT NULL
    AND 1 - (kd.embedding_vector <=> query_vec) > match_threshold
  ORDER BY kd.embedding_vector <=> query_vec
  LIMIT match_count;
END;
$$;