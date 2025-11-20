-- Fix match_similar_questions to properly cast JSON string to vector
DROP FUNCTION IF EXISTS match_similar_questions(vector, float, uuid);

CREATE OR REPLACE FUNCTION match_similar_questions(
  query_embedding TEXT,  -- Changed from vector to TEXT
  match_threshold FLOAT DEFAULT 0.8,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  question TEXT,
  answer TEXT,
  similarity FLOAT
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
    qa.id,
    qa.question,
    qa.answer,
    1 - (qa.question_embedding <=> query_vec) as similarity
  FROM knowledge_qa qa
  WHERE 
    (p_tenant_id IS NULL OR qa.tenant_id = p_tenant_id)
    AND qa.is_helpful IS NOT false
    AND qa.question_embedding IS NOT NULL
    AND 1 - (qa.question_embedding <=> query_vec) > match_threshold
  ORDER BY qa.question_embedding <=> query_vec
  LIMIT 1;
END;
$$;