# 18-M24 — Documents (Execution Pack)

## A) DB (DDL + RLS + Audit)

### A.1 الجداول (PostgreSQL/Supabase-ready)
```sql
-- 1) documents
CREATE TABLE IF NOT EXISTS documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  code          text NOT NULL,
  title         text NOT NULL,
  type          text,              -- policy, procedure, record, template...
  owner_user_id uuid,
  status        text NOT NULL DEFAULT 'draft', -- draft|in_review|approved|effective|archived
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_documents_tenant_code
  ON documents(tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

-- 2) doc_versions
CREATE TABLE IF NOT EXISTS doc_versions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version     int  NOT NULL,
  storage_url text NOT NULL,
  checksum    text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid,
  status      text NOT NULL DEFAULT 'draft', -- draft|under_review|approved|effective|retired
  UNIQUE(document_id, version)
);
CREATE INDEX IF NOT EXISTS idx_doc_versions_doc ON doc_versions(document_id);

-- 3) tags
CREATE TABLE IF NOT EXISTS tags (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  code      text NOT NULL,
  name      text NOT NULL,
  UNIQUE(tenant_id, code)
);
CREATE INDEX IF NOT EXISTS idx_tags_tenant ON tags(tenant_id);

-- 4) doc_tags (N:M)
CREATE TABLE IF NOT EXISTS doc_tags (
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tag_id      uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY(document_id, tag_id)
);

-- 5) doc_reviews
CREATE TABLE IF NOT EXISTS doc_reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_version_id uuid NOT NULL REFERENCES doc_versions(id) ON DELETE CASCADE,
  reviewer_user_id uuid NOT NULL,
  result        text, -- approved|changes_requested|rejected
  notes         text,
  reviewed_at   timestamptz
);
CREATE INDEX IF NOT EXISTS idx_doc_reviews_version ON doc_reviews(doc_version_id);

-- 6) retention_rules
CREATE TABLE IF NOT EXISTS retention_rules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  rule_type   text NOT NULL,      -- legal|business|custom
  duration_months int NOT NULL,   -- مدة الاحتفاظ
  disposition text NOT NULL       -- retain|archive|destroy
);
CREATE INDEX IF NOT EXISTS idx_retention_document ON retention_rules(document_id);
```

### A.2 سياسات RLS (عزل المستأجر + علاقات تابعة)
```sql
-- تمكين RLS
ALTER TABLE documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_versions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags             ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_tags         ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_reviews      ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_rules  ENABLE ROW LEVEL SECURITY;

-- documents: عزل مباشر
CREATE POLICY documents_tenant_iso ON documents
USING (tenant_id = current_setting('app.tenant_id')::uuid)
WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

-- doc_versions: عبر parent
CREATE POLICY doc_versions_tenant_iso ON doc_versions
USING (EXISTS (
  SELECT 1 FROM documents d
  WHERE d.id = doc_versions.document_id
    AND d.tenant_id = current_setting('app.tenant_id')::uuid
))
WITH CHECK (EXISTS (
  SELECT 1 FROM documents d
  WHERE d.id = doc_versions.document_id
    AND d.tenant_id = current_setting('app.tenant_id')::uuid
));

-- tags: per-tenant
CREATE POLICY tags_tenant_iso ON tags
USING (tenant_id = current_setting('app.tenant_id')::uuid)
WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

-- doc_tags: عبر parent joins (document + tag)
CREATE POLICY doc_tags_tenant_iso ON doc_tags
USING (EXISTS (
  SELECT 1 FROM documents d
  JOIN tags t ON t.tenant_id = d.tenant_id
  WHERE d.id = doc_tags.document_id
    AND t.id = doc_tags.tag_id
    AND d.tenant_id = current_setting('app.tenant_id')::uuid
))
WITH CHECK (EXISTS (
  SELECT 1 FROM documents d
  JOIN tags t ON t.tenant_id = d.tenant_id
  WHERE d.id = doc_tags.document_id
    AND t.id = doc_tags.tag_id
    AND d.tenant_id = current_setting('app.tenant_id')::uuid
));

-- reviews/retention_rules: عبر parent document
CREATE POLICY doc_reviews_tenant_iso ON doc_reviews
USING (EXISTS (
  SELECT 1 FROM doc_versions v JOIN documents d ON d.id = v.document_id
  WHERE v.id = doc_reviews.doc_version_id
    AND d.tenant_id = current_setting('app.tenant_id')::uuid
));

CREATE POLICY retention_rules_tenant_iso ON retention_rules
USING (EXISTS (
  SELECT 1 FROM documents d
  WHERE d.id = retention_rules.document_id
    AND d.tenant_id = current_setting('app.tenant_id')::uuid
))
WITH CHECK (EXISTS (
  SELECT 1 FROM documents d
  WHERE d.id = retention_rules.document_id
    AND d.tenant_id = current_setting('app.tenant_id')::uuid
));
```

### A.3 Audit (Triggers)
```sql
CREATE TRIGGER trg_audit_documents
AFTER INSERT OR UPDATE OR DELETE ON documents
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_change();

CREATE TRIGGER trg_audit_doc_versions
AFTER INSERT OR UPDATE OR DELETE ON doc_versions
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_change();

CREATE TRIGGER trg_audit_tags
AFTER INSERT OR UPDATE OR DELETE ON tags
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_change();

CREATE TRIGGER trg_audit_doc_tags
AFTER INSERT OR UPDATE OR DELETE ON doc_tags
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_change();

CREATE TRIGGER trg_audit_doc_reviews
AFTER INSERT OR UPDATE OR DELETE ON doc_reviews
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_change();

CREATE TRIGGER trg_audit_retention_rules
AFTER INSERT OR UPDATE OR DELETE ON retention_rules
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_change();
```

---

## B) Server/API (Contracts)

### B.1 الأذونات
- قراءة: `doc.read`
- إنشاء/تعديل/حذف: `doc.write`

### B.2 REST Endpoints (Minimal Viable)

**Documents**
- `GET /api/documents?status=&tag=&q=` → 200 `{items, total}`
- `GET /api/documents/:id` → 200 `{document, latest_version, tags, retention}`
- `POST /api/documents` (code,title,type,owner_user_id,status?) → 201 `{id}`
- `PUT /api/documents/:id` → 200
- `DELETE /api/documents/:id` → 204 (مقيد)

**Doc Versions**
- `POST /api/documents/:id/versions` (storage_url, checksum?, version?) → 201 `{version_id}`
- `PUT /api/doc-versions/:version_id` (status, effective?) → 200
- قاعدة: منع حذف نسخة **effective**.

**Tags & DocTags**
- `GET /api/tags` → `{items}`
- `POST /api/tags` (code,name) → 201 `{id}`
- `POST /api/documents/:id/tags` (tag_id) → 201
- `DELETE /api/documents/:id/tags/:tag_id` → 204

**Reviews**
- `POST /api/doc-versions/:version_id/reviews` (reviewer_user_id, result, notes) → 201
- `GET /api/doc-versions/:version_id/reviews` → `{items}`

**Retention Rules**
- `POST /api/documents/:id/retention` (rule_type, duration_months, disposition) → 201
- `PUT /api/retention-rules/:id` → 200

**Validation & Errors**
- 403 إذن، 404 معرف، 422 حقول.

---

## C) UI (Routes/Pages Scaffolds)

### C.1 Routes
- `/admin/documents` (List) — requires `doc.read`
- `/admin/documents/new` (Create) — requires `doc.write`
- `/admin/documents/:id` (Details) — requires `doc.read`

### C.2 List Page
- Filters: status, type, tag, q
- Table: code, title, type, status, updated_at
- Actions: **New Document** (محروس)
- Empty/Loading/Error

### C.3 Details Page
- Summary (badges: status/type/owner) + actions (Edit, New Version, Tagging) محروسة
- Tabs:
  - **Versions**: جدول (version, status, created_at, checksum, actions)
  - **Reviews**: reviewer/result/notes/ts
  - **Tags**: add/remove
  - **Retention**: rule_type/duration/disposition
  - **Timeline/Audit**

### C.4 Forms
- Create Document
- New Version Upload
- Add Review
- Add/Remove Tag
- Add/Edit Retention Rule

---

## D) الاختبارات (Acceptance)
- **DB/RLS:** الوصول محصور بالمستأجر عبر EXISTS.  
- **API:** ANALYST = GET فقط / ADMIN = CRUD كاملة.  
- **UI Guards:** إخفاء أزرار `doc.write` للمستخدمين غير المصرح لهم.  
- **Audit:** تسجّل كل تغييرات المستند/النسخ/المراجعات/الوسوم/الاحتفاظ.  
- **Retention Rule:** منع حذف نسخة effective إن ارتبطت بقاعدة احتفاظ تفرض الإبقاء.

---

## E) فرص التحسين (اختيارية)
1) **Checksum enforcement** + **Content Hashing** لضمان النزاهة.  
2) **Virus Scan Hook** عند الرفع.  
3) **Preview Service** لتوليد معاينات PDF/IMG.  
4) **Bulk Tagging** و**Bulk Export**.
```
-- نهاية الحزمة
```
