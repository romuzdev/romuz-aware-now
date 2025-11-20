# 16-M21 — Committees (Execution Pack)

## A) DB (DDL + RLS + Audit)

### A.1 الجداول (PostgreSQL/Supabase-ready)
```sql
-- 1) committees
CREATE TABLE IF NOT EXISTS committees (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL,
  code       text NOT NULL,
  name       text NOT NULL,
  charter    text,
  status     text NOT NULL DEFAULT 'active', -- active|inactive|archived
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_committees_tenant_code
  ON committees(tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_committees_tenant ON committees(tenant_id);

-- 2) committee_members
CREATE TABLE IF NOT EXISTS committee_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id uuid NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL, -- من جدول users (هوية)
  role         text,          -- chair|member|secretary...
  is_voting    boolean NOT NULL DEFAULT true,
  start_at     date,
  end_at       date
);
CREATE INDEX IF NOT EXISTS idx_comm_members_committee ON committee_members(committee_id);

-- 3) meetings
CREATE TABLE IF NOT EXISTS meetings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id uuid NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  status       text NOT NULL DEFAULT 'planned', -- planned|in_progress|closed|cancelled
  minutes_url  text,
  created_by   uuid NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_meetings_committee ON meetings(committee_id);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled ON meetings(scheduled_at DESC);

-- 4) agenda_items
CREATE TABLE IF NOT EXISTS agenda_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id     uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  title          text NOT NULL,
  owner_user_id  uuid,
  seq            int,
  notes          text
);
CREATE INDEX IF NOT EXISTS idx_agenda_items_meeting ON agenda_items(meeting_id);

-- 5) decisions
CREATE TABLE IF NOT EXISTS decisions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id     uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  agenda_item_id uuid REFERENCES agenda_items(id) ON DELETE SET NULL,
  title          text NOT NULL,
  resolution     text,      -- القرار النصي
  vote_result    text,      -- passed|failed|consensus|unanimous
  decided_at     timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_decisions_meeting ON decisions(meeting_id);

-- 6) followups
CREATE TABLE IF NOT EXISTS followups (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id   uuid NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  title         text NOT NULL,
  owner_user_id uuid NOT NULL,
  due_at        timestamptz,
  status        text NOT NULL DEFAULT 'open' -- open|in_progress|done|blocked|overdue
);
CREATE INDEX IF NOT EXISTS idx_followups_decision ON followups(decision_id);
CREATE INDEX IF NOT EXISTS idx_followups_due ON followups(due_at);
```

### A.2 سياسات RLS (نمط موحّد بالعزل لكل Tenant)
```sql
-- تمكين RLS
ALTER TABLE committees        ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups         ENABLE ROW LEVEL SECURITY;

-- committees: مباشرة عبر tenant_id
CREATE POLICY committees_tenant_iso ON committees
USING (tenant_id = current_setting('app.tenant_id')::uuid)
WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

-- الجداول التابعة: عبر parent EXISTS
CREATE POLICY cmembers_tenant_iso ON committee_members
USING (EXISTS (
  SELECT 1 FROM committees c
  WHERE c.id = committee_members.committee_id
    AND c.tenant_id = current_setting('app.tenant_id')::uuid
))
WITH CHECK (EXISTS (
  SELECT 1 FROM committees c
  WHERE c.id = committee_members.committee_id
    AND c.tenant_id = current_setting('app.tenant_id')::uuid
));

CREATE POLICY meetings_tenant_iso ON meetings
USING (EXISTS (
  SELECT 1 FROM committees c
  WHERE c.id = meetings.committee_id
    AND c.tenant_id = current_setting('app.tenant_id')::uuid
))
WITH CHECK (EXISTS (
  SELECT 1 FROM committees c
  WHERE c.id = meetings.committee_id
    AND c.tenant_id = current_setting('app.tenant_id')::uuid
));

CREATE POLICY agenda_items_tenant_iso ON agenda_items
USING (EXISTS (
  SELECT 1 FROM meetings m JOIN committees c ON c.id = m.committee_id
  WHERE m.id = agenda_items.meeting_id
    AND c.tenant_id = current_setting('app.tenant_id')::uuid
))
WITH CHECK (EXISTS (
  SELECT 1 FROM meetings m JOIN committees c ON c.id = m.committee_id
  WHERE m.id = agenda_items.meeting_id
    AND c.tenant_id = current_setting('app.tenant_id')::uuid
));

CREATE POLICY decisions_tenant_iso ON decisions
USING (EXISTS (
  SELECT 1 FROM meetings m JOIN committees c ON c.id = m.committee_id
  WHERE m.id = decisions.meeting_id
    AND c.tenant_id = current_setting('app.tenant_id')::uuid
))
WITH CHECK (EXISTS (
  SELECT 1 FROM meetings m JOIN committees c ON c.id = m.committee_id
  WHERE m.id = decisions.meeting_id
    AND c.tenant_id = current_setting('app.tenant_id')::uuid
));

CREATE POLICY followups_tenant_iso ON followups
USING (EXISTS (
  SELECT 1 FROM decisions d JOIN meetings m ON m.id=d.meeting_id
  JOIN committees c ON c.id = m.committee_id
  WHERE d.id = followups.decision_id
    AND c.tenant_id = current_setting('app.tenant_id')::uuid
))
WITH CHECK (EXISTS (
  SELECT 1 FROM decisions d JOIN meetings m ON m.id=d.meeting_id
  JOIN committees c ON c.id = m.committee_id
  WHERE d.id = followups.decision_id
    AND c.tenant_id = current_setting('app.tenant_id')::uuid
));
```

### A.3 Audit (Triggers)
```sql
CREATE TRIGGER trg_audit_committees
AFTER INSERT OR UPDATE OR DELETE ON committees
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_change();

CREATE TRIGGER trg_audit_committee_members
AFTER INSERT OR UPDATE OR DELETE ON committee_members
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_change();

CREATE TRIGGER trg_audit_meetings
AFTER INSERT OR UPDATE OR DELETE ON meetings
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_change();

CREATE TRIGGER trg_audit_agenda_items
AFTER INSERT OR UPDATE OR DELETE ON agenda_items
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_change();

CREATE TRIGGER trg_audit_decisions
AFTER INSERT OR UPDATE OR DELETE ON decisions
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_change();

CREATE TRIGGER trg_audit_followups
AFTER INSERT OR UPDATE OR DELETE ON followups
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_change();
```

---

## B) Server/API (Contracts)

### B.1 إذن الوصول
- قراءة: `committee.read`
- إنشاء/تعديل/حذف: `committee.write`

### B.2 REST Endpoints (Minimal Viable)
**Committees**
- `GET /api/committees?status=&q=` → 200 `{items, total}`
- `GET /api/committees/:id` → 200 `{committee, members, next_meeting}`
- `POST /api/committees` (code,name,charter,status) → 201 `{id}`
- `PUT /api/committees/:id` → 200
- `DELETE /api/committees/:id` → 204 (مقيد)

**Committee Members**
- `POST /api/committees/:id/members` (user_id, role, is_voting, start_at) → 201
- `DELETE /api/committee-members/:member_id` → 204

**Meetings**
- `GET /api/meetings/:id` → 200 `{meeting, agenda, decisions, followups}`
- `POST /api/committees/:id/meetings` (scheduled_at, status, minutes_url) → 201 `{meeting_id}`
- `PUT /api/meetings/:id` → 200
- `POST /api/meetings/:id/close` → 200 (يتحقق من المتابعات الحرجة)

**Agenda Items**
- `POST /api/meetings/:id/agenda` (title, owner_user_id, seq, notes) → 201 `{agenda_item_id}`
- `PUT /api/agenda-items/:id` → 200
- `DELETE /api/agenda-items/:id` → 204

**Decisions**
- `POST /api/meetings/:id/decisions` (agenda_item_id?, title, resolution, vote_result) → 201 `{decision_id}`
- `PUT /api/decisions/:id` → 200

**Follow-ups**
- `POST /api/decisions/:id/followups` (title, owner_user_id, due_at) → 201 `{followup_id}`
- `PUT /api/followups/:id` (status, due_at, title) → 200

**Validation & Errors**
- 403: غياب الإذن، 404: معرف غير موجود، 422: نقص حقول.

---

## C) UI (Routes/Pages Scaffolds)

### C.1 Routes
- `/admin/committees` (List) — requires `committee.read`
- `/admin/committees/new` (Create) — requires `committee.write`
- `/admin/committees/:id` (Details) — requires `committee.read`
  - Tabs: **Members**, **Meetings**, **Timeline/Audit**

- `/admin/meetings/:id` (Details) — requires `committee.read`
  - Tabs: **Agenda**, **Decisions**, **Follow-ups**

### C.2 List Page
- Header + **New Committee** (محروس)
- Filters: status, q
- Table: code, name, status, next_meeting, updated_at
- Empty/Loading/Error

### C.3 Committee Details
- Summary (badges: status, members count, next meeting)
- Actions (محروسة): Add Member, New Meeting, Edit Committee
- Tab **Members**: table (user, role, voting, start/end)
- Tab **Meetings**: upcoming/past + quick actions
- Tab **Timeline/Audit**: أحداث مرتبطة

### C.4 Meeting Details
- Header actions: Add Agenda Item, Add Decision, Close Meeting
- Tab **Agenda**: sortable list (seq)
- Tab **Decisions**: table + create
- Tab **Follow-ups**: board (open/in_progress/done/overdue)

---

## D) الاختبارات (Acceptance)

- **DB/RLS:** القراءة/الكتابة ضمن نفس المستأجر فقط (EXISTS policies صحيحة).
- **API:** 
  - ANALYST: 200 على GET فقط، 403 للباقي.
  - ADMIN: 200 على CRUD الكاملة.
- **UI Guards:** أخفاء الأزرار لمن يفتقد `committee.write`.
- **Close Meeting Rule:** تحذير عند وجود Follow-ups حرجة غير منجزة.
- **Audit:** أحداث لكل CRUD على الجداول الستة.

---

## E) فرص التحسين (اختيارية)
1) **Reminder Jobs** لمتابعات متأخرة (Slack/Email).  
2) **Voting Schema** مخصص إذا احتاجت أنماط تصويت معقدة.  
3) **Templates** لجدول الأعمال والقرارات لتوحيد الصياغة.  
4) **Soft-delete** للّجان/الاجتماعات بدل الحذف الصلب.

```
-- نهاية الحزمة
```
