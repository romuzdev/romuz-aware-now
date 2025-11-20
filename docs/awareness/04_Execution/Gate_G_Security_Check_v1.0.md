# Gate-G Storage Security Sanity Check v1.0

**Date**: 2025-01-10  
**Phase**: 3.2.C - Storage Access Policies & Security  
**Status**: ✅ Complete

---

## 🔒 Security Architecture Overview

### Multi-Tenant Isolation Model

Gate-G implements **strict multi-tenant isolation** at multiple layers:

1. **Database Layer** (RLS Policies on tables)
2. **Storage Layer** (RLS Policies on `storage.objects`)
3. **Application Layer** (Auth context + RBAC helpers)

All layers enforce the same security model:
- Tenant ID derived from **authenticated user context** (never client input)
- Role-based access control via `app_has_role()`
- Path-based storage isolation: `tenant/{tenant_id}/...`

---

## 📁 Storage Buckets Security Status

### Bucket: `documents`
- **Status**: Private (not publicly readable)
- **Usage**: Document versions from `document_versions` table
- **Path Pattern**: `tenant/{tenant_id}/docs/{document_id}/v{version_number}/{filename}`
- **Size Limit**: 50 MB per file
- **Allowed MIME Types**: documents, PDFs, office files, text, CSV, JSON

#### Access Policies:
| Operation | Roles Allowed | Tenant Isolation | Additional Checks |
|-----------|---------------|------------------|-------------------|
| **SELECT** (Read) | `compliance_manager`, `standard_user`, `viewer` | ✅ Path must start with `tenant/{current_tenant_id}/` | None |
| **INSERT** (Upload) | `compliance_manager`, `standard_user` | ✅ Path must start with `tenant/{current_tenant_id}/` | None |
| **UPDATE** (Metadata) | `compliance_manager` only | ✅ Path must start with `tenant/{current_tenant_id}/` | None |
| **DELETE** | `compliance_manager` only | ✅ Path must start with `tenant/{current_tenant_id}/` | None |

**Policy Names**: `g_documents_select_policy`, `g_documents_insert_policy`, `g_documents_update_policy`, `g_documents_delete_policy`

---

### Bucket: `attachments`
- **Status**: Private (not publicly readable)
- **Usage**: General attachments from `attachments` table
- **Path Pattern**: `tenant/{tenant_id}/attachments/{attachment_id}/{filename}`
- **Size Limit**: 20 MB per file
- **Allowed MIME Types**: images, PDFs, documents, text, CSV, ZIP

#### Access Policies:
| Operation | Roles Allowed | Tenant Isolation | Privacy Logic |
|-----------|---------------|------------------|---------------|
| **SELECT** (Read) | Privacy-aware (see below) | ✅ Path must start with `tenant/{current_tenant_id}/` | `is_private` flag enforced |
| **INSERT** (Upload) | `compliance_manager`, `standard_user` | ✅ Path must start with `tenant/{current_tenant_id}/` | N/A |
| **UPDATE** (Metadata) | `compliance_manager` only | ✅ Path must start with `tenant/{current_tenant_id}/` | N/A |
| **DELETE** | `compliance_manager` or **uploader** | ✅ Path must start with `tenant/{current_tenant_id}/` | Uploader can delete own files |

**Privacy Logic for SELECT**:
- **Public Attachments** (`is_private = false`):
  - Readable by: `compliance_manager`, `standard_user`, `viewer`
- **Private Attachments** (`is_private = true`):
  - Readable by: `compliance_manager` OR original uploader (`uploaded_by = current_user`)

**Policy Names**: `g_attachments_select_policy`, `g_attachments_insert_policy`, `g_attachments_update_policy`, `g_attachments_delete_policy`

---

## 🛡️ Security Mechanisms

### 1. Path-Based Tenant Isolation

All storage paths are validated using Postgres functions:

```sql
(storage.foldername(name))[1] = 'tenant'
AND (storage.foldername(name))[2] = app_current_tenant_id()::text
```

**What this prevents**:
- ❌ Users cannot access files from other tenants
- ❌ Users cannot construct arbitrary paths to bypass isolation
- ❌ Path manipulation attacks (e.g., `../../other-tenant/...`)

### 2. Role-Based Access Control (RBAC)

All operations check user roles via security definer functions:

```sql
app_has_role('compliance_manager'::text)
app_has_role('standard_user'::text)
app_has_role('viewer'::text)
```

**What this prevents**:
- ❌ Unauthorized uploads
- ❌ Unauthorized deletions
- ❌ Role escalation attacks

### 3. Privacy-Aware Attachment Access

Private attachments use database cross-checks:

```sql
EXISTS (
  SELECT 1 FROM attachments a
  WHERE a.storage_path = name
  AND a.is_private = true
  AND a.uploaded_by = app_current_user_id()
  AND a.tenant_id = app_current_tenant_id()
)
```

**What this prevents**:
- ❌ Viewing private files of other users
- ❌ Direct URL guessing for sensitive attachments

---

## 🔐 Application Layer Security

### Upload Flow Security

**File Upload Process** (from `src/integrations/supabase/documents.ts` & `attachments.ts`):

1. ✅ **Authenticate User**
   ```typescript
   const { data: { user }, error } = await supabase.auth.getUser();
   if (error || !user) throw new Error('User not authenticated');
   ```

2. ✅ **Derive Tenant ID** (Server-Side)
   ```typescript
   const { data: tenantId } = await supabase.rpc('get_user_tenant_id', { _user_id: user.id });
   ```
   - **Critical**: Tenant ID is **never** accepted from client input

3. ✅ **Compute Storage Path** (Using helpers)
   ```typescript
   const storagePath = buildDocumentVersionPath(tenantId, documentId, versionNumber, filename);
   // Result: tenant/{tenantId}/docs/{documentId}/v{versionNumber}/{filename}
   ```

4. ✅ **Upload to Storage**
   - Storage policies verify tenant isolation and roles

5. ✅ **Insert DB Record**
   - RLS on `document_versions` / `attachments` enforces tenant isolation
   - Rollback storage file if DB insert fails

6. ✅ **Update Document Metadata** (for document_versions only)
   - Update `documents.current_version_id`

**Security Guarantees**:
- No code path allows arbitrary path construction
- Tenant ID always derived from auth context
- Storage + DB operations are transactional (rollback on error)

---

### Download Flow Security

**File Download Process**:

1. ✅ **Verify DB Access**
   ```typescript
   const { data: version } = await supabase
     .from('document_versions')
     .select('storage_path, tenant_id')
     .eq('id', versionId)
     .single();
   ```
   - RLS filters rows by tenant automatically
   - If row not found → user has no access

2. ✅ **Generate Signed URL**
   ```typescript
   const { data, error } = await supabase.storage
     .from('documents')
     .createSignedUrl(storagePath, expiresIn);
   ```
   - Storage policies verify tenant isolation again
   - Time-limited URLs (default: 1 hour for documents, 30 min for private attachments)

**Security Guarantees**:
- Download only possible if user has DB access (RLS check)
- Storage policies provide defense-in-depth
- URLs are short-lived (expire after time limit)

---

## 🎯 Security Validation Checklist

### ✅ Completed Checks

- [x] **Buckets Created**: Both `documents` and `attachments` buckets exist and configured
- [x] **No Public Buckets**: Both `documents` and `attachments` are private
- [x] **Path-Based Isolation**: All policies enforce `tenant/{tenant_id}/` prefix
- [x] **Role-Based Access**: All operations check `app_has_role()`
- [x] **No Client-Controlled Paths**: Storage paths computed server-side only
- [x] **No Hard-Coded Credentials**: All auth via Supabase auth context
- [x] **DB + Storage Consistency**: Upload/download both verify DB rows via RLS
- [x] **Privacy Enforcement**: `is_private` flag enforced for attachments
- [x] **Rollback on Failure**: Storage files deleted if DB insert fails
- [x] **Time-Limited URLs**: Signed URLs expire (not permanent access)
- [x] **Audit Trail**: All uploads record `uploaded_by` and `tenant_id`
- [x] **Database RLS Enabled**: All tables (`documents`, `document_versions`, `attachments`) have RLS enabled
- [x] **Database Policies Applied**: 12 RLS policies on database tables (4 per table)

---

## 📊 Policy Coverage Matrix

### Storage RLS Policies (storage.objects)
| Bucket | SELECT | INSERT | UPDATE | DELETE | Special Logic |
|--------|--------|--------|--------|--------|---------------|
| `documents` | ✅ 3 roles | ✅ 2 roles | ✅ 1 role | ✅ 1 role | N/A |
| `attachments` | ✅ Privacy-aware | ✅ 2 roles | ✅ 1 role | ✅ Manager + Uploader | ✅ Enforced |

### Database RLS Policies (Tables)
| Table | SELECT | INSERT | UPDATE | DELETE | Special Logic |
|-------|--------|--------|--------|--------|---------------|
| `documents` | ✅ 3 roles | ✅ 2 roles (owner check) | ✅ 1 role | ✅ 1 role | Created by = current user |
| `document_versions` | ✅ 3 roles | ✅ 2 roles (owner check) | ✅ 1 role | ✅ 1 role | Uploaded by = current user |
| `attachments` | ✅ Privacy-aware | ✅ 2 roles (owner check) | ✅ 1 role | ✅ 1 role | Uploaded by = current user |

---

## 🚨 Known Security Limitations

### 1. ✅ Buckets Created Successfully (RESOLVED)
**Status**: Storage buckets `documents` and `attachments` have been **successfully created**.

**Configuration**:
- `documents`: 50MB limit, private, document MIME types
- `attachments`: 20MB limit, private, image/document MIME types

**Verification**:
  ```sql
  SELECT id, name, public, file_size_limit 
  FROM storage.buckets 
  WHERE id IN ('documents', 'attachments');
  ```

### 2. No Backend-Mediated Download Routes
**Current State**: File downloads use direct Supabase Storage signed URLs.

**Security**: Acceptable because:
- Signed URLs are time-limited
- Storage policies enforce tenant isolation
- DB RLS checks happen before URL generation

**Optional Enhancement** (Future):
- Create Supabase Edge Functions for download routes
- Centralizes security logic
- Enables additional access logging
- Example: `/api/files/documents/{versionId}`

### 3. No Rate Limiting on Uploads
**Current State**: No rate limiting on file uploads.

**Risk**: Potential for abuse (large file spam, storage exhaustion).

**Mitigation**: 
- File size limits enforced (50MB documents, 20MB attachments)
- Consider adding per-tenant quotas in future

---

## 🔍 Verification Queries

### Check Storage Policies Exist
```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE 'g_%'
ORDER BY policyname;
```

**Expected**: 8 policies (4 for documents, 4 for attachments)

### Verify No Public Buckets
```sql
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id IN ('documents', 'attachments');
```

**Expected**:
- `public = false` for both
- `file_size_limit` set correctly

### Test Tenant Isolation (Example)
```sql
-- As user in tenant A, try to access tenant B's files
SELECT * FROM storage.objects 
WHERE bucket_id = 'documents' 
AND name LIKE 'tenant/{tenant_b_id}/%';
```

**Expected**: Empty result (RLS blocks cross-tenant access)

---

## 📝 Security Audit Log

| Date | Action | Result |
|------|--------|--------|
| 2025-01-10 | Created 8 storage RLS policies for Gate-G | ✅ Success |
| 2025-01-10 | Documented security architecture | ✅ Complete |
| 2025-01-10 | Verified no public storage access | ✅ Confirmed |
| 2025-01-10 | Validated path-based tenant isolation | ✅ Enforced |
| 2025-01-10 | Confirmed RBAC integration with storage | ✅ Working |
| 2025-01-10 | Created storage buckets (documents, attachments) | ✅ Success |
| 2025-01-10 | Enabled RLS on documents and document_versions tables | ✅ Success |
| 2025-01-10 | Created 12 database RLS policies (4 per table) | ✅ Success |
| 2025-01-10 | Verified complete security implementation | ✅ Complete |

---

## ✅ Conclusion

**Gate-G Storage Security Status**: **SECURE** ✅

All requirements from Part 3.2.C have been implemented:

1. ✅ **Backend-Gated Access**: Upload/download flow enforces DB checks before storage access
2. ✅ **Storage Policies**: 8 comprehensive RLS policies on `storage.objects`
3. ✅ **Tenant Isolation**: Path-based isolation enforced at storage level
4. ✅ **RBAC Integration**: All operations check user roles
5. ✅ **Privacy Controls**: `is_private` flag enforced for attachments
6. ✅ **No Public Access**: Both buckets are private
7. ✅ **Defense in Depth**: DB RLS + Storage Policies + App Logic

**Next Steps**:
- Part 3.2.D: Create React Hooks for Documents & Attachments
- Part 3.2.E: Build UI Components for Document Management

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-10  
**Maintained By**: Gate-G Development Team
