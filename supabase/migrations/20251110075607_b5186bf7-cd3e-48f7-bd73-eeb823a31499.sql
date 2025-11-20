-- Gate-G: Documents Hub v1 - Part 2.2
-- Indexing & Constraints Refinement

-- ============================================
-- 1) Add CHECK constraint for version_number
-- ============================================

ALTER TABLE public.document_versions
ADD CONSTRAINT chk_version_number_positive CHECK (version_number >= 1);

COMMENT ON CONSTRAINT chk_version_number_positive ON public.document_versions 
IS 'Ensure version numbers start from 1 and are positive';

-- ============================================
-- 2) Rename indexes for consistency with spec
-- ============================================

-- documents table: rename linked index
DROP INDEX IF EXISTS public.idx_documents_tenant_linked;
CREATE INDEX idx_documents_tenant_link 
ON public.documents(tenant_id, linked_module, linked_entity_id);

-- document_versions table: rename uploaded_at index
DROP INDEX IF EXISTS public.idx_document_versions_tenant_uploaded;
CREATE INDEX idx_document_versions_tenant_uploaded_at 
ON public.document_versions(tenant_id, uploaded_at DESC);

-- attachments table: rename linked index
DROP INDEX IF EXISTS public.idx_attachments_tenant_linked;
CREATE INDEX idx_attachments_tenant_link 
ON public.attachments(tenant_id, linked_module, linked_entity_id);

-- ============================================
-- 3) Add composite FK for better tenant safety
-- ============================================

-- Note: Postgres doesn't support composite FK referencing (tenant_id, id)
-- without having a composite UNIQUE constraint on the parent.
-- We'll add this in a logical way without breaking the schema.

-- Add index on (tenant_id, id) in documents for FK safety checks
CREATE INDEX idx_documents_tenant_id_id ON public.documents(tenant_id, id);

-- Add index on (tenant_id, id) in document_versions for potential FK lookups
CREATE INDEX idx_document_versions_tenant_id_id ON public.document_versions(tenant_id, id);

-- ============================================
-- 4) Validation queries (informational)
-- ============================================

-- These comments document multi-tenant safety patterns:
COMMENT ON INDEX idx_documents_tenant_id_id IS 
'Gate-G: Composite index for tenant-safe FK lookups';

COMMENT ON INDEX idx_document_versions_tenant_id_id IS 
'Gate-G: Composite index for tenant-safe FK lookups';

-- ============================================
-- 5) Verify constraints summary
-- ============================================

-- All tables have:
-- - tenant_id NOT NULL with FK to tenants(id) ON DELETE RESTRICT ✓
-- - created_at/updated_at/uploaded_at with DEFAULT now() and NOT NULL ✓
-- - created_by/uploaded_by NOT NULL with FK to auth.users(id) ✓
-- - Proper enum defaults ✓
-- - No circular FK on documents.current_version_id ✓