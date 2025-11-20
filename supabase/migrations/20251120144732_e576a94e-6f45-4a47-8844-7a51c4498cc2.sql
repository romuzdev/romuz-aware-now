-- ============================================================================
-- M17: Knowledge Hub + RAG - Database Schema
-- Part 1: Core Tables, Vector Database, RLS, Security Enhancements
-- Version: 1.0
-- Created: 2025-11-20
-- ============================================================================

-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- TABLE 1: knowledge_documents - مستودع المستندات المعرفية
-- ============================================================================
CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  
  -- Content (AR/EN)
  title_ar TEXT NOT NULL,
  title_en TEXT,
  content_ar TEXT NOT NULL,
  content_en TEXT,
  summary_ar TEXT,
  summary_en TEXT,
  
  -- Classification
  document_type TEXT NOT NULL CHECK (document_type IN (
    'policy',        -- السياسات
    'procedure',     -- الإجراءات
    'guideline',     -- الإرشادات
    'standard',      -- المعايير
    'best_practice', -- أفضل الممارسات
    'case_study',    -- دراسات حالة
    'regulation',    -- الأنظمة واللوائح
    'faq',          -- أسئلة شائعة
    'training',     -- مواد تدريبية
    'template'      -- قوالب جاهزة
  )),
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  
  -- Vector Embedding for Semantic Search (OpenAI ada-002 = 1536 dimensions)
  embedding_vector vector(1536),
  
  -- Source & Linking
  source_url TEXT,
  source_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  
  -- Verification & Quality
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  usefulness_score NUMERIC(3,2) DEFAULT 0 CHECK (usefulness_score >= 0 AND usefulness_score <= 5),
  views_count INT DEFAULT 0,
  helpful_count INT DEFAULT 0,
  unhelpful_count INT DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Backup Metadata (حسب ملف التحسينات)
  backup_metadata JSONB DEFAULT '{}',
  
  -- Audit Trail
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_by UUID,
  
  -- Soft Delete
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
);

-- ============================================================================
-- TABLE 2: knowledge_qa - نظام الأسئلة والأجوبة (RAG)
-- ============================================================================
CREATE TABLE knowledge_qa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  
  -- Question
  question_ar TEXT NOT NULL,
  question_en TEXT,
  question_embedding vector(1536),
  
  -- Answer
  answer_ar TEXT NOT NULL,
  answer_en TEXT,
  
  -- Sources & Confidence
  source_documents UUID[] DEFAULT '{}',
  confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  model_used TEXT DEFAULT 'google/gemini-2.5-flash',
  
  -- Feedback
  was_helpful BOOLEAN,
  feedback_comment TEXT,
  feedback_at TIMESTAMPTZ,
  
  -- Usage Statistics
  views_count INT DEFAULT 0,
  
  -- User
  asked_by UUID,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Backup Metadata
  backup_metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================================
-- TABLE 3: knowledge_relations - العلاقات المعرفية (Knowledge Graph)
-- ============================================================================
CREATE TABLE knowledge_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  
  source_doc_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  target_doc_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  
  relation_type TEXT NOT NULL CHECK (relation_type IN (
    'references',      -- يشير إلى
    'supersedes',      -- يحل محل
    'relates_to',      -- مرتبط بـ
    'conflicts_with',  -- يتعارض مع
    'extends'          -- يوسع
  )),
  
  strength NUMERIC(3,2) DEFAULT 0.5 CHECK (strength >= 0 AND strength <= 1),
  
  -- Auto-detected or manual
  is_auto_detected BOOLEAN DEFAULT false,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Backup Metadata
  backup_metadata JSONB DEFAULT '{}',
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID NOT NULL,
  
  -- Prevent duplicate relations
  UNIQUE(source_doc_id, target_doc_id, relation_type)
);

-- ============================================================================
-- TABLE 4: knowledge_document_versions - إصدارات المستندات
-- ============================================================================
CREATE TABLE knowledge_document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  
  version_number INT NOT NULL,
  title_ar TEXT NOT NULL,
  content_ar TEXT NOT NULL,
  
  change_summary TEXT,
  changed_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  UNIQUE(document_id, version_number)
);

-- ============================================================================
-- INDEXES - محسّنة للحجم الضخم (> 50,000 مستند)
-- ============================================================================

-- Performance Indexes
CREATE INDEX idx_knowledge_docs_tenant_id 
  ON knowledge_documents(tenant_id) 
  WHERE is_deleted = false;

CREATE INDEX idx_knowledge_docs_tenant_category 
  ON knowledge_documents(tenant_id, category) 
  WHERE is_deleted = false;

CREATE INDEX idx_knowledge_docs_type 
  ON knowledge_documents(document_type) 
  WHERE is_verified = true AND is_deleted = false;

CREATE INDEX idx_knowledge_docs_tags 
  ON knowledge_documents USING GIN(tags);

CREATE INDEX idx_knowledge_docs_keywords 
  ON knowledge_documents USING GIN(keywords);

CREATE INDEX idx_knowledge_docs_verified 
  ON knowledge_documents(tenant_id, is_verified) 
  WHERE is_deleted = false;

CREATE INDEX idx_knowledge_docs_created 
  ON knowledge_documents(tenant_id, created_at DESC) 
  WHERE is_deleted = false;

-- Vector Search Index (IVFFlat for large datasets)
-- lists = 500 لأن الحجم ضخم (> 50,000)
CREATE INDEX idx_knowledge_docs_embedding 
  ON knowledge_documents 
  USING ivfflat (embedding_vector vector_cosine_ops)
  WITH (lists = 500);

-- QA Indexes
CREATE INDEX idx_knowledge_qa_tenant 
  ON knowledge_qa(tenant_id, created_at DESC);

CREATE INDEX idx_knowledge_qa_helpful 
  ON knowledge_qa(tenant_id, was_helpful) 
  WHERE was_helpful IS NOT NULL;

CREATE INDEX idx_knowledge_qa_embedding 
  ON knowledge_qa 
  USING ivfflat (question_embedding vector_cosine_ops)
  WITH (lists = 200);

-- Relations Indexes
CREATE INDEX idx_knowledge_relations_source 
  ON knowledge_relations(source_doc_id);

CREATE INDEX idx_knowledge_relations_target 
  ON knowledge_relations(target_doc_id);

CREATE INDEX idx_knowledge_relations_type 
  ON knowledge_relations(relation_type);

-- ============================================================================
-- RLS POLICIES - محكمة وآمنة
-- ============================================================================

-- Enable RLS
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_qa ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_document_versions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS: knowledge_documents
-- ============================================================================

-- SELECT: All authenticated users can view verified documents in their tenant
CREATE POLICY "Users view tenant knowledge docs"
  ON knowledge_documents FOR SELECT
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND is_deleted = false
    AND (is_verified = true OR created_by = auth.uid())
  );

-- INSERT: Editors and above can create documents
CREATE POLICY "Editors create knowledge docs"
  ON knowledge_documents FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    AND created_by = auth.uid()
    AND (
      has_role(auth.uid(), 'tenant_admin')
      OR has_role(auth.uid(), 'manager')
      OR has_role(auth.uid(), 'editor')
    )
  );

-- UPDATE: Editors and above can update documents
CREATE POLICY "Editors update knowledge docs"
  ON knowledge_documents FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND is_deleted = false
    AND (
      has_role(auth.uid(), 'tenant_admin')
      OR has_role(auth.uid(), 'manager')
      OR has_role(auth.uid(), 'editor')
    )
  )
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
  );

-- DELETE: Only admins can delete (soft delete)
CREATE POLICY "Admins delete knowledge docs"
  ON knowledge_documents FOR DELETE
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND (
      has_role(auth.uid(), 'tenant_admin')
      OR has_role(auth.uid(), 'manager')
    )
  );

-- ============================================================================
-- RLS: knowledge_qa
-- ============================================================================

-- SELECT: All users can view Q&A in their tenant
CREATE POLICY "Users view tenant Q&A"
  ON knowledge_qa FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- INSERT: All authenticated users can ask questions
CREATE POLICY "Users create Q&A"
  ON knowledge_qa FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    AND (asked_by = auth.uid() OR asked_by IS NULL)
  );

-- UPDATE: Users can update their own feedback
CREATE POLICY "Users update own Q&A feedback"
  ON knowledge_qa FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND (asked_by = auth.uid() OR asked_by IS NULL)
  )
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
  );

-- ============================================================================
-- RLS: knowledge_relations
-- ============================================================================

-- SELECT: All users can view relations
CREATE POLICY "Users view knowledge relations"
  ON knowledge_relations FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- INSERT: Editors can create relations
CREATE POLICY "Editors create relations"
  ON knowledge_relations FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    AND created_by = auth.uid()
    AND (
      has_role(auth.uid(), 'tenant_admin')
      OR has_role(auth.uid(), 'manager')
      OR has_role(auth.uid(), 'editor')
    )
  );

-- DELETE: Editors can delete relations
CREATE POLICY "Editors delete relations"
  ON knowledge_relations FOR DELETE
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND (
      has_role(auth.uid(), 'tenant_admin')
      OR has_role(auth.uid(), 'manager')
      OR has_role(auth.uid(), 'editor')
    )
  );

-- ============================================================================
-- RLS: knowledge_document_versions
-- ============================================================================

-- SELECT: Users can view versions of documents they can see
CREATE POLICY "Users view document versions"
  ON knowledge_document_versions FOR SELECT
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM knowledge_documents kd
      WHERE kd.id = knowledge_document_versions.document_id
      AND kd.tenant_id = get_user_tenant_id(auth.uid())
      AND kd.is_deleted = false
    )
  );

-- INSERT: System creates versions automatically
CREATE POLICY "System creates versions"
  ON knowledge_document_versions FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    AND changed_by = auth.uid()
  );

-- ============================================================================
-- FUNCTIONS - Database Functions
-- ============================================================================

-- Function: Vector Search for Knowledge Documents
CREATE OR REPLACE FUNCTION match_knowledge_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  p_tenant_id uuid DEFAULT NULL,
  p_document_type text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title_ar text,
  title_en text,
  content_ar text,
  content_en text,
  summary_ar text,
  document_type text,
  category text,
  tags text[],
  similarity float,
  usefulness_score numeric,
  views_count int
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
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
    1 - (kd.embedding_vector <=> query_embedding) AS similarity,
    kd.usefulness_score,
    kd.views_count
  FROM knowledge_documents kd
  WHERE 
    kd.is_verified = true
    AND kd.is_deleted = false
    AND (p_tenant_id IS NULL OR kd.tenant_id = p_tenant_id)
    AND (p_document_type IS NULL OR kd.document_type = p_document_type)
    AND 1 - (kd.embedding_vector <=> query_embedding) > match_threshold
  ORDER BY kd.embedding_vector <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function: Find Similar Questions (for Q&A)
CREATE OR REPLACE FUNCTION match_similar_questions(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 5,
  p_tenant_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  question_ar text,
  answer_ar text,
  similarity float,
  was_helpful boolean
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    qa.id,
    qa.question_ar,
    qa.answer_ar,
    1 - (qa.question_embedding <=> query_embedding) AS similarity,
    qa.was_helpful
  FROM knowledge_qa qa
  WHERE 
    (p_tenant_id IS NULL OR qa.tenant_id = p_tenant_id)
    AND qa.question_embedding IS NOT NULL
    AND 1 - (qa.question_embedding <=> query_embedding) > match_threshold
  ORDER BY qa.question_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function: Get Knowledge Graph for a document
CREATE OR REPLACE FUNCTION get_knowledge_graph(
  p_document_id uuid,
  p_max_depth int DEFAULT 2
)
RETURNS TABLE (
  source_id uuid,
  target_id uuid,
  relation_type text,
  strength numeric,
  depth int
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE graph AS (
    -- Base case: direct relations
    SELECT 
      kr.source_doc_id,
      kr.target_doc_id,
      kr.relation_type,
      kr.strength,
      1 as depth
    FROM knowledge_relations kr
    WHERE kr.source_doc_id = p_document_id
    
    UNION
    
    -- Recursive case: follow relations
    SELECT 
      kr.source_doc_id,
      kr.target_doc_id,
      kr.relation_type,
      kr.strength,
      g.depth + 1
    FROM knowledge_relations kr
    INNER JOIN graph g ON kr.source_doc_id = g.target_doc_id
    WHERE g.depth < p_max_depth
  )
  SELECT 
    g.source_doc_id,
    g.target_doc_id,
    g.relation_type,
    g.strength,
    g.depth
  FROM graph g;
END;
$$;

-- ============================================================================
-- TRIGGERS - Transaction Logging (حسب ملف التحسينات)
-- ============================================================================

-- Trigger: Log changes to knowledge_documents
CREATE TRIGGER knowledge_documents_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON knowledge_documents
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- Trigger: Log changes to knowledge_qa
CREATE TRIGGER knowledge_qa_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON knowledge_qa
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- Trigger: Log changes to knowledge_relations
CREATE TRIGGER knowledge_relations_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON knowledge_relations
  FOR EACH ROW
  EXECUTE FUNCTION log_table_changes();

-- Trigger: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_knowledge_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER knowledge_docs_update_timestamp
  BEFORE UPDATE ON knowledge_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_updated_at();

-- Trigger: Create version on update
CREATE OR REPLACE FUNCTION create_document_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if content changed
  IF OLD.content_ar IS DISTINCT FROM NEW.content_ar OR 
     OLD.title_ar IS DISTINCT FROM NEW.title_ar THEN
    
    INSERT INTO knowledge_document_versions (
      document_id,
      tenant_id,
      version_number,
      title_ar,
      content_ar,
      changed_by
    )
    SELECT 
      NEW.id,
      NEW.tenant_id,
      COALESCE(MAX(version_number), 0) + 1,
      OLD.title_ar,
      OLD.content_ar,
      NEW.updated_by
    FROM knowledge_document_versions
    WHERE document_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER knowledge_docs_versioning
  AFTER UPDATE ON knowledge_documents
  FOR EACH ROW
  EXECUTE FUNCTION create_document_version();

-- ============================================================================
-- COMMENTS - توثيق الجداول
-- ============================================================================

COMMENT ON TABLE knowledge_documents IS 'M17: Knowledge Hub - مستودع المستندات المعرفية مع البحث الدلالي';
COMMENT ON TABLE knowledge_qa IS 'M17: Knowledge Hub - نظام الأسئلة والأجوبة بالـ RAG';
COMMENT ON TABLE knowledge_relations IS 'M17: Knowledge Hub - العلاقات المعرفية بين المستندات';
COMMENT ON TABLE knowledge_document_versions IS 'M17: Knowledge Hub - إصدارات المستندات';

COMMENT ON COLUMN knowledge_documents.embedding_vector IS 'Vector embedding (1536 dims) for semantic search using OpenAI ada-002 or similar';
COMMENT ON COLUMN knowledge_documents.usefulness_score IS 'User rating 0-5 based on helpful/unhelpful votes';
COMMENT ON COLUMN knowledge_qa.confidence_score IS 'AI confidence score 0-1 for the generated answer';
COMMENT ON COLUMN knowledge_relations.strength IS 'Relation strength 0-1, can be auto-calculated or manual';