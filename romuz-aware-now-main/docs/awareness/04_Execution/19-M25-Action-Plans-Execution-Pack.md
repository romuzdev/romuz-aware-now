# 19-M25 — Action Plans (Execution Pack)

## A) DB (DDL + RLS + Audit)

### A.1 الجداول (PostgreSQL/Supabase-ready)
```sql
-- 1) plans
CREATE TABLE IF NOT EXISTS plans (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  code          text NOT NULL,
  title         text NOT NULL,
  owner_user_id uuid,
  source_ref    text,   -- مرجع خارجي/ربط مع نظام آخر (اختياري)
  status        text NOT NULL DEFAULT 'active', -- active|on_hold|closed|archived
  start_at      date,
  end_at        date,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code)
);
CREATE INDEX IF NOT EXISTS idx_plans_tenant ON plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_plans_status ON plans(status);

-- 2) tasks
CREATE TABLE IF NOT EXISTS tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id     uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  priority    text NOT NULL DEFAULT 'medium', -- low|medium|high|critical
  status      text NOT NULL DEFAULT 'open',   -- open|in_progress|done|blocked|overdue|cancelled
  due_at      timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tasks_plan ON tasks(plan_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_at);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- 3) task_assignments
CREATE TABLE IF NOT EXISTS task_assignments (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role    text NOT NULL DEFAULT 'owner' -- owner|contributor|reviewer
);
CREATE INDEX IF NOT EXISTS idx_task_assignments_task ON task_assignments(task_id);

-- 4) task_dependencies (N:M ضمن نفس الخطة عادة)
CREATE TABLE IF NOT EXISTS task_dependencies (
  task_id            uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  PRIMARY KEY(task_id, depends_on_task_id),
  CHECK (task_id <> depends_on_task_id)
);

-- 5) task_comments
CREATE TABLE IF NOT EXISTS task_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL,
  body       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);

-- 6) task_attachments
CREATE TABLE IF NOT EXISTS task_attachments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  storage_url text NOT NULL,
  kind        text, -- link|file|image|doc...
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid
);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments(task_id);
```

### A.2 سياسات RLS (عزل المستأجر)
```sql
-- تمكين RLS
ALTER TABLE plans             ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments  ENABLE ROW LEVEL SECURITY;

-- plans: عزل مباشر
CREATE POLICY plans_tenant_iso ON plans
USING (tenant_id = current_setting('app.tenant_id')::uuid)
WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

-- الجداول التابعة: عبر parent EXISTS
CREATE POLICY tasks_tenant_iso ON tasks
USING (EXISTS (
  SELECT 1 FROM plans p
  WHERE p.id = tasks.plan_id
    AND p.tenant_id = current_setting('app.tenant_id')::uuid
))
WITH CHECK (EXISTS (
  SELECT 1 FROM plans p
  WHERE p.id = tasks.plan_id
    AND p.tenant_id = current_setting('app.tenant_id')::uuid
));

CREATE POLICY tassign_tenant_iso ON task_assignments
USING (EXISTS (
  SELECT 1 FROM tasks t JOIN plans p ON p.id = t.plan_id
  WHERE t.id = task_assignments.task_id
    AND p.tenant_id = current_setting('app.tenant_id')::uuid
));

CREATE POLICY tdeps_tenant_iso ON task_dependencies
USING (EXISTS (
  SELECT 1 FROM tasks t JOIN plans p ON p.id = t.plan_id
  WHERE t.id = task_dependencies.task_id
    AND p.tenant_id = current_setting('app.tenant_id')::uuid
));

CREATE POLICY tcomments_tenant_iso ON task_comments
USING (EXISTS (
  SELECT 1 FROM tasks t JOIN plans p ON p.id = t.plan_id
  WHERE t.id = task_comments.task_id
    AND p.tenant_id = current_setting('app.tenant_id')::uuid
));

CREATE POLICY tattach_tenant_iso ON task_attachments
USING (EXISTS (
  SELECT 1 FROM tasks t JOIN plans p ON p.id = t.plan_id
  WHERE t.id = task_attachments.task_id
    AND p.tenant_id = current_setting('app.tenant_id')::uuid
));
```

### A.3 Audit (Triggers)
```sql
CREATE TRIGGER trg_audit_plans
AFTER INSERT OR UPDATE OR DELETE ON plans
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_change();

CREATE TRIGGER trg_audit_tasks
AFTER INSERT OR UPDATE OR DELETE ON tasks
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_change();

CREATE TRIGGER trg_audit_task_assignments
AFTER INSERT OR UPDATE OR DELETE ON task_assignments
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_change();

CREATE TRIGGER trg_audit_task_dependencies
AFTER INSERT OR UPDATE OR DELETE ON task_dependencies
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_change();

CREATE TRIGGER trg_audit_task_comments
AFTER INSERT OR UPDATE OR DELETE ON task_comments
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_change();

CREATE TRIGGER trg_audit_task_attachments
AFTER INSERT OR UPDATE OR DELETE ON task_attachments
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_change();
```

---

## B) Server/API (Contracts)

### B.1 الأذونات
- قراءة: `action.read`
- إنشاء/تعديل/حذف: `action.write`

### B.2 REST Endpoints (Minimal Viable)

**Plans**
- `GET /api/plans?status=&q=` → 200 `{items, total}`
- `GET /api/plans/:id` → 200 `{plan, tasks_stats, timeline}`
- `POST /api/plans` (code,title,owner_user_id,start_at?,end_at?,status?) → 201 `{id}`
- `PUT /api/plans/:id` → 200
- `POST /api/plans/:id/close` → 200 (يتحقق من المهام المفتوحة)
- `DELETE /api/plans/:id` → 204 (مقيد)

**Tasks**
- `GET /api/tasks?plan_id=&status=&owner=&due_before=&due_after=` → 200 `{items, total}`
- `GET /api/tasks/:id` → 200 `{task, assignments, deps, comments, attachments}`
- `POST /api/tasks` (plan_id,title,description?,priority?,due_at?) → 201 `{id}`
- `PUT /api/tasks/:id` (title?,desc?,priority?,status?,due_at?) → 200
- `DELETE /api/tasks/:id` → 204

**Assignments**
- `POST /api/tasks/:id/assignments` (user_id, role?) → 201 `{assignment_id}`
- `DELETE /api/task-assignments/:assignment_id` → 204

**Dependencies**
- `POST /api/tasks/:id/dependencies` (depends_on_task_id) → 201
- `DELETE /api/tasks/:id/dependencies/:depends_on_task_id` → 204
- **Rule:** منع تعيين تبعية دائرية (يُفحص في الخادم).

**Comments**
- `POST /api/tasks/:id/comments` (body) → 201 `{comment_id}`
- `DELETE /api/task-comments/:id` → 204 (مقيد للمالك/ADMIN)

**Attachments**
- `POST /api/tasks/:id/attachments` (storage_url, kind?) → 201 `{attachment_id}`
- `DELETE /api/task-attachments/:id` → 204

**Validation & Errors**
- 403 إذن، 404 معرف، 409 تبعية دائرية، 422 نقص حقول.

---

## C) UI (Routes/Pages Scaffolds)

### C.1 Routes
- `/admin/plans` (List) — requires `action.read`
- `/admin/plans/new` (Create) — requires `action.write`
- `/admin/plans/:id` (Details) — requires `action.read`
- `/admin/tasks/:id` (Task Details) — requires `action.read`

### C.2 Plans List
- Header + **New Plan** (محروس)  
- Filters: status, owner, q  
- Table: code, title, owner, status, start/end, updated_at  
- Empty/Loading/Error

### C.3 Plan Details
- Summary cards (status, tasks_open, overdue, progress %)  
- Actions: Edit Plan, **Close Plan** (محروس)  
- Tabs:
  - **Tasks**: Table + Quick create  
  - **Timeline/Audit**  
  - **Relations** (روابط مستقبلية مع KPIs أو قرارات اللجان)

### C.4 Task Details
- Header actions: Edit, **Add Assignee**, **Add Dependency**, **Attach File**  
- Sections:
  - **Overview** (priority/status/due)  
  - **Assignments** (owner/contributors/reviewers)  
  - **Dependencies** (blocked by / blocking)  
  - **Comments** (thread)  
  - **Attachments** (list)  

### C.5 Kanban/List Toggle
- Kanban أعمدة: `open | in_progress | blocked | done`  
- Drag & drop (guarded) لتغيير الحالة.

---

## D) الاختبارات (Acceptance)

- **DB/RLS:** كل CRUD ضمن نفس المستأجر فقط.  
- **API:**  
  - ANALYST: GET فقط.  
  - ADMIN: CRUD كاملة + Close Plan.  
- **UI Guards:** إخفاء أزرار الإنشاء/التعديل لمن يفتقد `action.write`.  
- **Business Rules:**  
  - منع إغلاق خطة وبها مهام `open/in_progress/blocked/overdue`.  
  - منع تبعية دائرية (A→B وB→A).  
- **Audit:** تسجيل جميع تغييرات الخطط/المهام/التعيينات/التبعيات/التعليقات/المرفقات.

---

## E) فرص التحسين (اختيارية)
1) **SLA/OLA Tracking**: حساب زمن التنفيذ لكل مهمة وتوليد تنبيهات قبل الاستحقاق.  
2) **Bulk Ops**: إسناد/تغيير حالة جماعي.  
3) **Calendar View** للمهام حسب due_at.  
4) **Integration Hooks** للربط مع Slack/Email/Webhooks عند التغيير.
