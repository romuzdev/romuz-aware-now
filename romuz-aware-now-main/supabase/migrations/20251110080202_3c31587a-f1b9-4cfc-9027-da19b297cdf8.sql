-- Gate-G: Documents Hub v1 - Part 2.3
-- RLS & RBAC Intent Comments (Documentation Only - No RLS Enabled Yet)

-- ============================================
-- 1) Table-Level Comments
-- ============================================

COMMENT ON TABLE public.documents IS 
'Gate-G: Logical multi-tenant document entity with metadata and cross-module linking.

Purpose: Represents a logical document (policy, procedure, guideline, report, etc.) 
with metadata, status tracking, and generic linking to other modules.

RLS Intent: 
- Rows are isolated by tenant_id (strict tenant boundary)
- Access controlled via tenant RBAC:
  * Compliance Managers: can view/edit all documents in their tenant
  * Standard employees: can view documents tied to campaigns/modules they have access to
  * Document owners: can view/edit documents they created
- Documents can be linked to awareness campaigns, projects, or other entities via linked_module/linked_entity_id

Security Model: Multi-tenant isolation + Role-based access + Ownership-based permissions';

COMMENT ON TABLE public.document_versions IS 
'Gate-G: Physical file versions for documents, including storage path and file metadata.

Purpose: Tracks each physical file/version of a document with version control, 
file metadata (size, mime_type, checksum), and change history.

RLS Intent:
- Rows are isolated by tenant_id (must match parent document tenant)
- Access tied to parent document permissions:
  * Users who can view a document can view all its versions
  * Only authorized users can upload new versions
  * Version history is auditable (uploaded_by, uploaded_at)
- Version numbers are sequential per document (enforced by UNIQUE constraint)

Security Model: Inherits parent document security + Audit trail for all uploads';

COMMENT ON TABLE public.attachments IS 
'Gate-G: Generic attachments linked to documents or other entities.

Purpose: Flexible attachment system that can link files to documents OR directly 
to other modules (campaigns, projects, reports) for maximum reusability.

RLS Intent:
- Rows are isolated by tenant_id
- Access depends on link type:
  * If linked to document: inherits document permissions
  * If linked to other module: follows that module access rules
  * Private attachments (is_private=true): only uploader + admins can view
- Generic linking via linked_module/linked_entity_id enables cross-module file sharing

Security Model: Context-aware permissions + Privacy flag + Tenant isolation';

-- ============================================
-- 2) Key Column-Level Comments
-- ============================================

-- documents table columns
COMMENT ON COLUMN public.documents.tenant_id IS 
'Tenant isolation key. All RLS policies MUST filter by this column to enforce multi-tenant data separation. No cross-tenant access allowed.';

COMMENT ON COLUMN public.documents.created_by IS 
'User who created the document. Used for ownership-based permissions, audit trail, and determining who can edit/delete the document.';

COMMENT ON COLUMN public.documents.updated_by IS 
'User who last updated the document. Used for audit trail and tracking modification history.';

COMMENT ON COLUMN public.documents.linked_module IS 
'Generic cross-module link identifier (e.g., "campaign", "project", "report", "other"). Used to attach documents to entities in other modules for contextual access control.';

COMMENT ON COLUMN public.documents.linked_entity_id IS 
'UUID of the linked entity in the specified linked_module. Combined with linked_module, enables flexible document associations across the platform.';

COMMENT ON COLUMN public.documents.current_version_id IS 
'Points to the latest version in document_versions. Managed logically by application (no FK to avoid circular dependency). Used for quick access to current file.';

COMMENT ON COLUMN public.documents.status IS 
'Document lifecycle status: draft (work in progress), active (published/live), archived (historical). Affects visibility and editability based on RBAC rules.';

-- document_versions table columns
COMMENT ON COLUMN public.document_versions.tenant_id IS 
'Tenant isolation key. Must match parent document tenant_id. All RLS policies MUST filter by this column.';

COMMENT ON COLUMN public.document_versions.uploaded_by IS 
'User who uploaded this version. Used for audit trail, ownership tracking, and determining who can manage versions.';

COMMENT ON COLUMN public.document_versions.version_number IS 
'Sequential version number per document (starts at 1). Enforced unique per document_id. Used for version history and rollback capabilities.';

COMMENT ON COLUMN public.document_versions.storage_path IS 
'Full path to file in storage bucket. Format: tenant/{tenant_id}/docs/{document_id}/v{version}/filename. Used for secure file retrieval.';

COMMENT ON COLUMN public.document_versions.is_major IS 
'Indicates if this is a major version change (true) or minor update (false). Used for version history display and significance tracking.';

COMMENT ON COLUMN public.document_versions.checksum IS 
'File integrity checksum (SHA256 or MD5). Used for verifying file integrity, detecting tampering, and preventing duplicate uploads.';

-- attachments table columns
COMMENT ON COLUMN public.attachments.tenant_id IS 
'Tenant isolation key. All RLS policies MUST filter by this column to enforce multi-tenant data separation.';

COMMENT ON COLUMN public.attachments.uploaded_by IS 
'User who uploaded the attachment. Used for ownership-based permissions, audit trail, and determining who can delete/manage the attachment.';

COMMENT ON COLUMN public.attachments.linked_module IS 
'Generic cross-module link (e.g., "campaign", "project", "report", "document"). Determines which module access rules apply for this attachment.';

COMMENT ON COLUMN public.attachments.linked_entity_id IS 
'UUID of the entity in linked_module. Used to inherit access permissions from the linked entity (e.g., campaign participants can view campaign attachments).';

COMMENT ON COLUMN public.attachments.is_private IS 
'Privacy flag. If true, only uploader + compliance managers can view. If false, follows normal linked entity permissions. Used for sensitive/personal attachments.';

COMMENT ON COLUMN public.attachments.document_id IS 
'Optional link to parent document. If set, attachment inherits document permissions. If null, uses linked_module/linked_entity_id for access control.';

-- ============================================
-- 3) RLS Policy Intentions (Future Implementation Guide)
-- ============================================

-- Create a documentation table for RLS policy intentions
CREATE TABLE IF NOT EXISTS public._gate_g_rls_intentions (
  table_name TEXT PRIMARY KEY,
  policy_intent TEXT NOT NULL,
  rbac_roles TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public._gate_g_rls_intentions IS 
'Gate-G: Documentation table for intended RLS policies. Reference for security implementation. Not enforced - for documentation only.';

-- Insert RLS intentions for documents
INSERT INTO public._gate_g_rls_intentions (table_name, policy_intent, rbac_roles, notes)
VALUES (
  'documents',
  E'Intended RLS Policies:\n\n1. SELECT Policy - "view_documents_in_tenant":\n   - All users can view documents where tenant_id matches their tenant\n   - AND (status = ''active'' OR created_by = auth.uid() OR user has ''compliance_manager'' role)\n   - Purpose: Active documents are public within tenant; drafts only visible to creator + managers\n\n2. INSERT Policy - "create_documents_in_tenant":\n   - Authenticated users can insert documents in their own tenant\n   - WITH CHECK: tenant_id = get_user_tenant_id(auth.uid()) AND created_by = auth.uid()\n   - Purpose: Users can create documents in their tenant\n\n3. UPDATE Policy - "update_own_or_manager_documents":\n   - Users can update WHERE: tenant_id = their_tenant AND (created_by = auth.uid() OR has_role(''compliance_manager''))\n   - Purpose: Owners + managers can edit documents\n\n4. DELETE Policy - "delete_manager_only":\n   - Only compliance_manager role can delete\n   - WHERE: tenant_id = their_tenant AND has_role(''compliance_manager'')\n   - Purpose: Prevent accidental deletion, require manager approval',
  E'Roles involved:\n- compliance_manager: full access to all documents in tenant\n- standard_user: view active documents, edit own drafts\n- viewer: read-only access to active documents',
  'Linked documents: Access also depends on linked_module permissions (e.g., campaign access)'
) ON CONFLICT (table_name) DO UPDATE SET
  policy_intent = EXCLUDED.policy_intent,
  rbac_roles = EXCLUDED.rbac_roles,
  notes = EXCLUDED.notes;

-- Insert RLS intentions for document_versions
INSERT INTO public._gate_g_rls_intentions (table_name, policy_intent, rbac_roles, notes)
VALUES (
  'document_versions',
  E'Intended RLS Policies:\n\n1. SELECT Policy - "view_versions_of_accessible_documents":\n   - Users can view versions WHERE: tenant_id matches AND parent document is accessible\n   - JOIN with documents table to inherit parent permissions\n   - Purpose: Version history visible to anyone who can view the document\n\n2. INSERT Policy - "upload_new_versions":\n   - Users who can UPDATE the parent document can insert new versions\n   - WITH CHECK: tenant_id matches AND uploaded_by = auth.uid() AND can_update_parent_document\n   - Purpose: Authorized users can upload new versions\n\n3. UPDATE Policy - "no_updates_allowed":\n   - Versions are immutable once created (audit integrity)\n   - Only metadata updates allowed by compliance_manager if needed\n   - Purpose: Maintain audit trail integrity\n\n4. DELETE Policy - "manager_only_version_deletion":\n   - Only compliance_manager can delete versions (rare, for compliance)\n   - WHERE: tenant_id matches AND has_role(''compliance_manager'')\n   - Purpose: Preserve version history, prevent tampering',
  E'Roles involved:\n- compliance_manager: can delete versions if required by policy\n- document_owner: can upload new versions\n- standard_user: read-only access to versions of accessible documents',
  'Version deletion should be rare and logged. Consider soft-delete instead.'
) ON CONFLICT (table_name) DO UPDATE SET
  policy_intent = EXCLUDED.policy_intent,
  rbac_roles = EXCLUDED.rbac_roles,
  notes = EXCLUDED.notes;

-- Insert RLS intentions for attachments
INSERT INTO public._gate_g_rls_intentions (table_name, policy_intent, rbac_roles, notes)
VALUES (
  'attachments',
  E'Intended RLS Policies:\n\n1. SELECT Policy - "view_attachments_contextual":\n   - Complex policy based on attachment type:\n     a) If document_id IS NOT NULL: inherit document permissions\n     b) If linked_module = ''campaign'': check campaign access permissions\n     c) If is_private = true: only uploaded_by OR compliance_manager can view\n   - WHERE: tenant_id matches AND (above conditions)\n   - Purpose: Context-aware access based on attachment linkage\n\n2. INSERT Policy - "upload_attachments_with_permission":\n   - Users can upload WHERE: tenant_id matches AND uploaded_by = auth.uid()\n   - AND (has permission on linked entity OR is_private = true)\n   - Purpose: Users can attach files to entities they have access to\n\n3. UPDATE Policy - "update_own_attachment_metadata":\n   - Users can update their own attachments (filename, notes, is_private)\n   - WHERE: tenant_id matches AND uploaded_by = auth.uid()\n   - Compliance managers can update any attachment\n   - Purpose: Allow uploader to manage their attachments\n\n4. DELETE Policy - "delete_own_or_manager_attachments":\n   - Users can delete WHERE: uploaded_by = auth.uid() OR has_role(''compliance_manager'')\n   - AND tenant_id matches\n   - Purpose: Uploader + managers can remove attachments',
  E'Roles involved:\n- compliance_manager: full access to all attachments\n- uploader: can manage own attachments\n- standard_user: view attachments based on linked entity access\n- campaign_participant: can view campaign-linked attachments',
  'Privacy flag (is_private) overrides normal permissions. Consider data retention policies for attachment deletion.'
) ON CONFLICT (table_name) DO UPDATE SET
  policy_intent = EXCLUDED.policy_intent,
  rbac_roles = EXCLUDED.rbac_roles,
  notes = EXCLUDED.notes;