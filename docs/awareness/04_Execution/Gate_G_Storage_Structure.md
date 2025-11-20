# Gate-G: Storage Buckets & Folder Structure Documentation

**Project:** Cyber Zone GRC – Romuz Awareness App  
**Module:** Gate-G — Documents & Attachments Hub v1  
**Phase:** 3.2.A — Storage Infrastructure Setup  
**Date:** 2025-01-10

---

## 📦 Storage Backend

**Provider:** Supabase Storage (Native)  
**Configuration:** Private buckets with RLS-based access control

---

## 🪣 Storage Buckets

### 1️⃣ `documents` Bucket

**Purpose:** Store all document version files (document_versions table)

| Property | Value |
|----------|-------|
| **Bucket ID** | `documents` |
| **Visibility** | PRIVATE |
| **File Size Limit** | 50 MB |
| **Allowed MIME Types** | `application/pdf`<br>`application/msword`<br>`application/vnd.openxmlformats-officedocument.wordprocessingml.document`<br>`application/vnd.ms-excel`<br>`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`<br>`application/vnd.ms-powerpoint`<br>`application/vnd.openxmlformats-officedocument.presentationml.presentation`<br>`text/plain`<br>`text/csv`<br>`application/json` |

**RLS Policies:**
- ✅ `g_storage_documents_select` — SELECT for tenant members
- ✅ `g_storage_documents_insert` — INSERT for compliance_manager, standard_user
- ✅ `g_storage_documents_update` — UPDATE for compliance_manager only
- ✅ `g_storage_documents_delete` — DELETE for compliance_manager only

---

### 2️⃣ `attachments` Bucket

**Purpose:** Store all attachment files (attachments table)

| Property | Value |
|----------|-------|
| **Bucket ID** | `attachments` |
| **Visibility** | PRIVATE |
| **File Size Limit** | 20 MB |
| **Allowed MIME Types** | `image/jpeg`<br>`image/png`<br>`image/gif`<br>`image/webp`<br>`application/pdf`<br>`application/msword`<br>`application/vnd.openxmlformats-officedocument.wordprocessingml.document`<br>`text/plain`<br>`text/csv`<br>`application/zip`<br>`application/x-zip-compressed` |

**RLS Policies:**
- ✅ `g_storage_attachments_select` — SELECT for tenant members
- ✅ `g_storage_attachments_insert` — INSERT for compliance_manager, standard_user
- ✅ `g_storage_attachments_update` — UPDATE for compliance_manager only
- ✅ `g_storage_attachments_delete` — DELETE for compliance_manager only

---

## 📁 Folder Structure Conventions

### Document Versions Path Pattern

**Pattern:**
```
tenant/{tenant_id}/docs/{document_id}/v{version_number}/{filename}
```

**Examples:**
```
tenant/6a5b-abc123-def4-5678/docs/3f2c-def456-abc7-8901/v1/Acceptable_Use_Policy_v1.pdf
tenant/6a5b-abc123-def4-5678/docs/3f2c-def456-abc7-8901/v2/Acceptable_Use_Policy_v2.pdf
tenant/7c8d-xyz789-ghi0-1234/docs/9e3a-jkl234-mno5-6789/v1/Data_Protection_Policy.docx
```

**DB Column:** `document_versions.storage_path`

**Benefits:**
- ✅ **Version tracking:** Each version has its own v{N} folder
- ✅ **Document grouping:** All versions of a document share the same {document_id} folder
- ✅ **Tenant isolation:** Top-level folder enforces tenant separation
- ✅ **Easy rollback:** Can retrieve any version by its path

---

### Attachments Path Pattern

**Pattern:**
```
tenant/{tenant_id}/attachments/{attachment_id}/{filename}
```

**Examples:**
```
tenant/6a5b-abc123-def4-5678/attachments/9d1e-ghi789-jkl0-1234/phishing_awareness_poster.png
tenant/6a5b-abc123-def4-5678/attachments/7c4f-jkl012-mno3-4567/incident_report_screenshot.jpg
tenant/7c8d-xyz789-ghi0-1234/attachments/5b2a-pqr567-stu8-9012/policy_attachment.pdf
```

**DB Column:** `attachments.storage_path`

**Benefits:**
- ✅ **Unique identification:** Each attachment has its own {attachment_id} folder
- ✅ **Tenant isolation:** Top-level folder enforces tenant separation
- ✅ **Flexible linking:** Can be linked to documents, campaigns, or other entities
- ✅ **Privacy support:** Works with `attachments.is_private` flag

---

## 🔒 Security Model

### Multi-Tenant Isolation

All storage paths **MUST** start with `tenant/{tenant_id}/` to ensure:
1. Folder-based tenant separation
2. RLS policies validate `tenant_id` matches `app_current_tenant_id()`
3. No cross-tenant access possible

### Role-Based Access Control (RBAC)

| Role | documents bucket | attachments bucket |
|------|-----------------|-------------------|
| **compliance_manager** | Full access (SELECT, INSERT, UPDATE, DELETE) | Full access (SELECT, INSERT, UPDATE, DELETE) |
| **standard_user** | Read + Upload (SELECT, INSERT) | Read + Upload (SELECT, INSERT) |
| **viewer** | Read-only (SELECT) | Read-only (SELECT) |

### Private Attachments

For `attachments` bucket:
- `is_private = false` → Accessible to all tenant members with valid role
- `is_private = true` → Only accessible to:
  - compliance_manager (always)
  - Uploader (`uploaded_by = current_user`)

---

## 🛠️ Implementation Checklist

### ✅ Completed (Phase 3.2.A)

- [x] RLS policies created for `documents` bucket (8 policies total)
- [x] RLS policies created for `attachments` bucket (8 policies total)
- [x] Folder structure conventions documented
- [x] Path patterns aligned with DB columns

### ⚠️ Manual Setup Required

- [ ] **Create `documents` bucket** via Lovable Cloud UI:
  1. Open backend/Cloud section
  2. Navigate to Storage
  3. Click "New Bucket"
  4. Enter name: `documents`
  5. Set visibility: PRIVATE
  6. Configure file size limit: 50 MB
  7. Add allowed MIME types (see table above)

- [ ] **Create `attachments` bucket** via Lovable Cloud UI:
  1. Open backend/Cloud section
  2. Navigate to Storage
  3. Click "New Bucket"
  4. Enter name: `attachments`
  5. Set visibility: PRIVATE
  6. Configure file size limit: 20 MB
  7. Add allowed MIME types (see table above)

### 🔜 Next Steps (Phase 3.2.B)

- [ ] Create TypeScript integration layer (`src/integrations/supabase/storage.ts`)
- [ ] Implement upload helpers with path generation
- [ ] Implement download/delete helpers
- [ ] Add progress tracking for uploads
- [ ] Add file validation (MIME type, size)

---

## 📊 Path Generation Examples (Code)

### Document Version Path

```typescript
function generateDocumentVersionPath(
  tenantId: string,
  documentId: string,
  versionNumber: number,
  filename: string
): string {
  return `tenant/${tenantId}/docs/${documentId}/v${versionNumber}/${filename}`;
}

// Example usage:
const path = generateDocumentVersionPath(
  '6a5b-abc123-def4-5678',
  '3f2c-def456-abc7-8901',
  1,
  'Acceptable_Use_Policy_v1.pdf'
);
// Result: tenant/6a5b-abc123-def4-5678/docs/3f2c-def456-abc7-8901/v1/Acceptable_Use_Policy_v1.pdf
```

### Attachment Path

```typescript
function generateAttachmentPath(
  tenantId: string,
  attachmentId: string,
  filename: string
): string {
  return `tenant/${tenantId}/attachments/${attachmentId}/${filename}`;
}

// Example usage:
const path = generateAttachmentPath(
  '6a5b-abc123-def4-5678',
  '9d1e-ghi789-jkl0-1234',
  'phishing_poster.png'
);
// Result: tenant/6a5b-abc123-def4-5678/attachments/9d1e-ghi789-jkl0-1234/phishing_poster.png
```

---

## 🔍 Verification Queries

### Check Storage Policies

```sql
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN policyname LIKE 'g_storage_documents%' THEN 'documents'
    WHEN policyname LIKE 'g_storage_attachments%' THEN 'attachments'
    ELSE 'other'
  END as bucket_group
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'g_storage_%'
ORDER BY bucket_group, cmd;
```

### Verify Bucket Existence

```sql
SELECT 
  id,
  name,
  public,
  file_size_limit,
  created_at
FROM storage.buckets
WHERE id IN ('documents', 'attachments')
ORDER BY name;
```

---

## 📝 Notes

1. **Bucket Creation Permissions:**  
   Due to permission restrictions, storage buckets cannot be created via SQL migrations in Lovable Cloud environment. Manual creation via UI is required.

2. **RLS Policy Names:**  
   All Gate-G storage policies follow the naming convention: `g_storage_{bucket}_{operation}`

3. **Helper Functions:**  
   Storage policies use the same RBAC helper functions as database tables:
   - `app_current_tenant_id()` — Returns current tenant UUID
   - `app_has_role(role_code)` — Checks if user has specified role

4. **Folder Validation:**  
   RLS policies enforce that all paths start with `tenant/{tenant_id}/` by checking:
   ```sql
   (storage.foldername(name))[1] = 'tenant'
   AND (storage.foldername(name))[2] = app_current_tenant_id()::text
   ```

---

## 🚀 Status

**Phase 3.2.A:** ✅ **Complete** (RLS Policies + Documentation)  
**Phase 3.2.B:** ⏳ Pending (TypeScript Integration Layer)  
**Phase 3.2.C:** ⏳ Pending (Upload/Download UI Components)
