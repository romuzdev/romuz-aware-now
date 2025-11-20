-- Gate-G: Documents Hub v1 - Part 2.3 (Completion Hotfix)
-- إضافة Column Comments المفقودة الثلاثة

-- 1. Comment على documents.doc_type
COMMENT ON COLUMN public.documents.doc_type IS 
'Document classification type: policy, procedure, guideline, report, form, template, other. 
Used for categorization, filtering, and applying type-specific access rules. 
Some tenants may restrict certain doc_types to specific roles (e.g., policies visible to compliance team only).';

-- 2. Comment على document_versions.document_id
COMMENT ON COLUMN public.document_versions.document_id IS 
'Foreign key to parent document. Ties this physical file version to its logical document entity. 
All versions of a document share the same document_id. Used for version history queries and inheritance of document permissions.';

-- 3. Comment على document_versions.source_version_id
COMMENT ON COLUMN public.document_versions.source_version_id IS 
'Optional reference to the version this was derived from (for branching/forking). 
Typically null for linear version history. Used in advanced workflows where documents are cloned or branched. 
Helps track version lineage and merge histories.';