-- Gate-G: Documents Hub v1 - Part 2.1
-- DB Enums & Base Tables

-- ============================================
-- 1) Create enums for document classification
-- ============================================

CREATE TYPE public.document_status AS ENUM (
  'draft',
  'active',
  'archived'
);

CREATE TYPE public.document_type AS ENUM (
  'policy',
  'procedure',
  'guideline',
  'report',
  'awareness_material',
  'other'
);

-- ============================================
-- 2) Create documents table (logical entity)
-- ============================================

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  
  -- Document metadata
  title TEXT NOT NULL,
  description TEXT,
  doc_type public.document_type NOT NULL DEFAULT 'other',
  status public.document_status NOT NULL DEFAULT 'draft',
  current_version_id UUID,  -- Will point to document_versions, set later to avoid circular FK
  
  -- Generic linking to other modules
  linked_module TEXT,        -- e.g. 'campaign', 'project', 'report', 'other'
  linked_entity_id UUID,     -- id in that module
  
  -- Audit columns
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for documents
CREATE INDEX idx_documents_tenant_status ON public.documents(tenant_id, status);
CREATE INDEX idx_documents_tenant_linked ON public.documents(tenant_id, linked_module, linked_entity_id);

-- Trigger for updated_at
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_employee_profiles_updated_at();

COMMENT ON TABLE public.documents IS 'Gate-G: Logical document entities (entity-level, not file-level)';

-- ============================================
-- 3) Create document_versions table (physical files)
-- ============================================

CREATE TABLE public.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  
  -- Version metadata
  version_number INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  checksum TEXT,
  
  -- Audit & version control
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  change_summary TEXT,
  is_major BOOLEAN NOT NULL DEFAULT true,
  source_version_id UUID,  -- Optional reference to previous version
  
  -- Unique constraint: one version number per document
  CONSTRAINT uq_document_version UNIQUE (document_id, version_number)
);

-- Indexes for document_versions
CREATE INDEX idx_document_versions_tenant_doc ON public.document_versions(tenant_id, document_id);
CREATE INDEX idx_document_versions_tenant_uploaded ON public.document_versions(tenant_id, uploaded_at DESC);

COMMENT ON TABLE public.document_versions IS 'Gate-G: Physical file versions of documents';

-- ============================================
-- 4) Create attachments table (generic attachments)
-- ============================================

CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  
  -- Link to documents (optional)
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  
  -- Generic link to other modules
  linked_module TEXT,        -- e.g. 'campaign', 'project', 'report', 'other'
  linked_entity_id UUID,     -- id in that module
  
  -- File metadata
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  
  -- Audit & visibility
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_private BOOLEAN NOT NULL DEFAULT false,
  notes TEXT
);

-- Indexes for attachments
CREATE INDEX idx_attachments_tenant_doc ON public.attachments(tenant_id, document_id);
CREATE INDEX idx_attachments_tenant_linked ON public.attachments(tenant_id, linked_module, linked_entity_id);
CREATE INDEX idx_attachments_uploaded ON public.attachments(tenant_id, uploaded_at DESC);

COMMENT ON TABLE public.attachments IS 'Gate-G: Generic attachments for documents or other modules';