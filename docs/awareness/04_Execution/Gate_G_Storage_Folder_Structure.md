# Gate-G Storage Folder Structure Documentation

**Version:** 1.0  
**Last Updated:** 2025-11-10  
**Phase:** 3.2.A — Storage Buckets & Folder Structure Setup

---

## 📦 Storage Buckets

Gate-G uses **two private storage buckets** in Supabase Storage:

| Bucket Name | Purpose | Max File Size | Visibility |
|------------|---------|---------------|------------|
| `documents` | Document versions (policies, procedures, forms) | 50 MB | Private |
| `attachments` | Generic attachments (images, PDFs, misc files) | 20 MB | Private |

---

## 🗂️ Folder Structure Conventions

### 1️⃣ **Documents Bucket** (`document_versions` table)

**Path Pattern:**
```
tenant/{tenant_id}/docs/{document_id}/v{version_number}/{filename}
```

**Examples:**
```
tenant/6a5b-abc123/docs/3f2c-def456/v1/Acceptable_Use_Policy_v1.pdf
tenant/6a5b-abc123/docs/3f2c-def456/v2/Acceptable_Use_Policy_v2.pdf
tenant/7d8e-xyz789/docs/9a1b-ghi012/v1/Incident_Response_Plan.docx
```

**Structure Breakdown:**
- `tenant/{tenant_id}` — Top-level tenant isolation
- `docs/{document_id}` — Logical document container (groups all versions)
- `v{version_number}` — Version folder (1, 2, 3, ...)
- `{filename}` — Original uploaded filename

**Benefits:**
- ✅ Clear version history tracking
- ✅ All versions of same document grouped under one document_id
- ✅ Easy to list all versions of a document
- ✅ RLS-enforced tenant isolation

---

### 2️⃣ **Attachments Bucket** (`attachments` table)

**Path Pattern:**
```
tenant/{tenant_id}/attachments/{attachment_id}/{filename}
```

**Examples:**
```
tenant/6a5b-abc123/attachments/9d1e-ghi789/phishing_poster.png
tenant/6a5b-abc123/attachments/7c4f-jkl012/incident_report.pdf
tenant/7d8e-xyz789/attachments/3a2b-mno345/training_screenshot.jpg
```

**Structure Breakdown:**
- `tenant/{tenant_id}` — Top-level tenant isolation
- `attachments/{attachment_id}` — Unique attachment container
- `{filename}` — Original uploaded filename

**Benefits:**
- ✅ Simple flat structure for generic files
- ✅ Each attachment gets unique folder (no name conflicts)
- ✅ RLS-enforced tenant isolation
- ✅ Easy cleanup when attachment deleted

---

## 🔒 Access Control (RLS Policies)

### Documents Bucket Policies

| Operation | Allowed Roles | Enforcement |
|-----------|--------------|-------------|
| **SELECT** (view) | `compliance_manager`, `standard_user`, `viewer` | Tenant isolation via folder path |
| **INSERT** (upload) | `compliance_manager`, `standard_user` | Must upload to own tenant folder |
| **UPDATE** (metadata) | `compliance_manager` only | Can only modify own tenant files |
| **DELETE** | `compliance_manager` only | Can only delete own tenant files |

### Attachments Bucket Policies

| Operation | Allowed Roles | Enforcement |
|-----------|--------------|-------------|
| **SELECT** (view) | `compliance_manager`, `standard_user`, `viewer` | Tenant isolation + `is_private` flag |
| **INSERT** (upload) | `compliance_manager`, `standard_user` | Must upload to own tenant folder |
| **UPDATE** (metadata) | `compliance_manager` only | Can only modify own tenant files |
| **DELETE** | `compliance_manager` only | Can only delete own tenant files |

**Additional Note:** The `is_private` flag in the `attachments` table provides an extra layer of access control at the application level (enforced in DB RLS, not storage RLS).

---

## 🛠️ Implementation Notes

### Database Columns

Both tables have a `storage_path` column that stores the full path:

```sql
-- document_versions table
storage_path TEXT NOT NULL  
-- Example: "tenant/abc/docs/def/v1/file.pdf"

-- attachments table
storage_path TEXT NOT NULL
-- Example: "tenant/abc/attachments/ghi/file.png"
```

### Path Construction (TypeScript)

When uploading files, construct paths as follows:

```typescript
// For document_versions
const buildDocumentPath = (
  tenantId: string,
  documentId: string,
  versionNumber: number,
  filename: string
): string => {
  return `tenant/${tenantId}/docs/${documentId}/v${versionNumber}/${filename}`;
};

// For attachments
const buildAttachmentPath = (
  tenantId: string,
  attachmentId: string,
  filename: string
): string => {
  return `tenant/${tenantId}/attachments/${attachmentId}/${filename}`;
};
```

### RLS Enforcement

Storage RLS policies check:
1. **bucket_id** matches expected bucket
2. **Folder path** starts with `tenant/{current_tenant_id}`
3. **User role** has required permissions

Example policy logic:
```sql
bucket_id = 'documents'
AND (storage.foldername(name))[1] = 'tenant'
AND (storage.foldername(name))[2] = app_current_tenant_id()::text
AND (app_has_role('compliance_manager') OR app_has_role('standard_user'))
```

---

## 📋 Bucket Configuration

### How to Create Buckets (Lovable Cloud UI)

1. Open **Lovable Cloud** backend panel
2. Navigate to **Storage** section
3. Click **"New Bucket"**
4. Configure as follows:

#### Documents Bucket
- **Bucket ID:** `documents`
- **Bucket Name:** `documents`
- **Public:** `false` (Private)
- **File Size Limit:** `52428800` (50 MB)
- **Allowed MIME Types:**
  - `application/pdf`
  - `application/msword`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - `application/vnd.ms-excel`
  - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `application/vnd.ms-powerpoint`
  - `application/vnd.openxmlformats-officedocument.presentationml.presentation`
  - `text/plain`
  - `text/csv`
  - `application/json`

#### Attachments Bucket
- **Bucket ID:** `attachments`
- **Bucket Name:** `attachments`
- **Public:** `false` (Private)
- **File Size Limit:** `20971520` (20 MB)
- **Allowed MIME Types:**
  - `image/jpeg`
  - `image/png`
  - `image/gif`
  - `image/webp`
  - `application/pdf`
  - `application/msword`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - `text/plain`
  - `text/csv`
  - `application/zip`
  - `application/x-zip-compressed`

---

## ✅ Verification Checklist

After bucket creation and RLS policy deployment:

- [ ] `documents` bucket exists and is private
- [ ] `attachments` bucket exists and is private
- [ ] 4 RLS policies active on `storage.objects` for `documents` bucket
- [ ] 4 RLS policies active on `storage.objects` for `attachments` bucket
- [ ] Helper functions (`app_current_tenant_id()`, `app_has_role()`) working
- [ ] Test upload: Upload file to correct tenant folder → success
- [ ] Test isolation: Try to access another tenant's folder → blocked

---

## 🚀 Next Steps

- **Part 3.2.B:** Storage Helper Functions (upload, download, delete)
- **Part 3.2.C:** Storage Integration Layer (TypeScript SDK wrappers)
- **Part 3.3:** Documents CRUD API Layer
- **Part 3.4:** React Hooks for Documents & Attachments

---

**End of Document**
