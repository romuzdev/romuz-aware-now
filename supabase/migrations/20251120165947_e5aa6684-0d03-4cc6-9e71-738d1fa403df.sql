-- Drop with correct signature (DOUBLE PRECISION = FLOAT)
DROP FUNCTION IF EXISTS match_knowledge_documents(TEXT, DOUBLE PRECISION, INTEGER, UUID, TEXT);
DROP FUNCTION IF EXISTS match_similar_questions(TEXT, DOUBLE PRECISION, INTEGER, UUID);

-- Recreate with FLOAT
CREATE FUNCTION match_knowledge_documents(
  query_embedding TEXT,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INTEGER DEFAULT 10,
  p_tenant_id UUID DEFAULT NULL,
  p_document_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  document_type TEXT,
  category TEXT,
  tags TEXT[],
  author_name TEXT,
  view_count INTEGER,
  is_featured BOOLEAN,
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
    kd.title,
    kd.content,
    kd.document_type,
    kd.category,
    kd.tags,
    kd.author_name,
    kd.view_count,
    kd.is_featured,
    kd.created_at,
    kd.updated_at,
    (1 - (kd.embedding_vector <=> query_vec)) AS similarity
  FROM knowledge_documents kd
  WHERE 
    (p_tenant_id IS NULL OR kd.tenant_id = p_tenant_id)
    AND (p_document_type IS NULL OR kd.document_type = p_document_type)
    AND kd.embedding_vector IS NOT NULL
    AND (1 - (kd.embedding_vector <=> query_vec)) >= match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

CREATE FUNCTION match_similar_questions(
  query_embedding TEXT,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INTEGER DEFAULT 5,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  question TEXT,
  answer TEXT,
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
    qa.id,
    qa.question,
    qa.answer,
    (1 - (qa.question_embedding <=> query_vec)) AS similarity
  FROM knowledge_qa_history qa
  WHERE 
    qa.tenant_id = p_tenant_id
    AND qa.question_embedding IS NOT NULL
    AND (1 - (qa.question_embedding <=> query_vec)) >= match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;