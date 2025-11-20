# 17-M22 — Objectives & KPIs (Execution Pack)

## A) DB (DDL + RLS + Audit)

### A.1 الجداول (PostgreSQL/Supabase-ready)
```sql
-- 1) objectives
CREATE TABLE IF NOT EXISTS objectives (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  code          text NOT NULL,
  title         text NOT NULL,
  owner_user_id uuid,
  horizon       text,  -- annual|quarterly|monthly|custom
  status        text NOT NULL DEFAULT 'active', -- active|on_hold|archived
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_objectives_tenant_code
  ON objectives(tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_objectives_tenant ON objectives(tenant_id);

-- 2) kpis
CREATE TABLE IF NOT EXISTS kpis (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  objective_id  uuid NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
  code          text NOT NULL,
  title         text NOT NULL,
  unit          text NOT NULL,   -- %, number, SAR, hours...
  direction     text NOT NULL,   -- up|down (التحسن يكون أعلى/أدنى)
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code)
);
CREATE INDEX IF NOT EXISTS idx_kpis_objective ON kpis(objective_id);
CREATE INDEX IF NOT EXISTS idx_kpis_tenant ON kpis(tenant_id);

-- 3) kpi_targets
CREATE TABLE IF NOT EXISTS kpi_targets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id       uuid NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
  period       text NOT NULL,     -- YYYYQn / YYYY-MM / custom label
  target_value numeric NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_kpi_targets_kpi_period
  ON kpi_targets(kpi_id, period);

-- 4) kpi_readings
CREATE TABLE IF NOT EXISTS kpi_readings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id        uuid NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
  period        text NOT NULL,
  actual_value  numeric NOT NULL,
  collected_at  timestamptz NOT NULL DEFAULT now(),
  source        text
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_kpi_readings_kpi_period
  ON kpi_readings(kpi_id, period);

-- 5) initiatives (اختياري للربط)
CREATE TABLE IF NOT EXISTS initiatives (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id  uuid NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
  title         text NOT NULL,
  owner_user_id uuid,
  start_at      date,
  end_at        date,
  status        text NOT NULL DEFAULT 'planned' -- planned|in_progress|done|cancelled
);
CREATE INDEX IF NOT EXISTS idx_initiatives_objective ON initiatives(objective_id);
```

### A.2 سياسات RLS (عزل المستأجر)
```sql
-- تمكين RLS
ALTER TABLE objectives  ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis        ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;

-- objectives: عزل مباشر عبر tenant_id
CREATE POLICY objectives_tenant_iso ON objectives
USING (tenant_id = current_setting('app.tenant_id')::uuid)
WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

-- kpis: عزل مزدوج (tenant_id على السجل + parent objective)
CREATE POLICY kpis_tenant_iso ON kpis
USING (
  tenant_id = current_setting('app.tenant_id')::uuid AND
  EXISTS (SELECT 1 FROM objectives o 
          WHERE o.id = kpis.objective_id 
            AND o.tenant_id = current_setting('app.tenant_id')::uuid)
)
WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

-- targets/readings/initiatives: عبر parent EXISTS
CREATE POLICY kpi_targets_tenant_iso ON kpi_targets
USING (EXISTS (
  SELECT 1 FROM kpis k
  JOIN objectives o ON o.id = k.objective_id
  WHERE k.id = kpi_targets.kpi_id
    AND o.tenant_id = current_setting('app.tenant_id')::uuid
));

CREATE POLICY kpi_readings_tenant_iso ON kpi_readings
USING (EXISTS (
  SELECT 1 FROM kpis k
  JOIN objectives o ON o.id = k.objective_id
  WHERE k.id = kpi_readings.kpi_id
    AND o.tenant_id = current_setting('app.tenant_id')::uuid
));

CREATE POLICY initiatives_tenant_iso ON initiatives
USING (EXISTS (
  SELECT 1 FROM objectives o
  WHERE o.id = initiatives.objective_id
    AND o.tenant_id = current_setting('app.tenant_id')::uuid
))
WITH CHECK (EXISTS (
  SELECT 1 FROM objectives o
  WHERE o.id = initiatives.objective_id
    AND o.tenant_id = current_setting('app.tenant_id')::uuid
));
```

### A.3 Audit (Triggers)
```sql
CREATE TRIGGER trg_audit_objectives
AFTER INSERT OR UPDATE OR DELETE ON objectives
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_change();

CREATE TRIGGER trg_audit_kpis
AFTER INSERT OR UPDATE OR DELETE ON kpis
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_change();

CREATE TRIGGER trg_audit_kpi_targets
AFTER INSERT OR UPDATE OR DELETE ON kpi_targets
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_change();

CREATE TRIGGER trg_audit_kpi_readings
AFTER INSERT OR UPDATE OR DELETE ON kpi_readings
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_change();

CREATE TRIGGER trg_audit_initiatives
AFTER INSERT OR UPDATE OR DELETE ON initiatives
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_change();
```

---

## B) Server/API (Contracts)

### B.1 الأذونات
- قراءة: `kpi.read`
- إنشاء/تعديل/حذف: `kpi.write`

### B.2 REST Endpoints (Minimal Viable)

**Objectives**
- `GET /api/objectives?q=&status=&owner=` → 200 `{items, total}`
- `GET /api/objectives/:id` → 200 `{objective, kpis, initiatives}`
- `POST /api/objectives` (code,title,owner_user_id,horizon,status?) → 201 `{id}`
- `PUT /api/objectives/:id` → 200
- `DELETE /api/objectives/:id` → 204 (مقيد)

**KPIs**
- `GET /api/kpis?objective_id=&q=` → 200 `{items, total}`
- `GET /api/kpis/:id` → 200 `{kpi, targets, readings}`
- `POST /api/kpis` (objective_id, code, title, unit, direction) → 201 `{id}`
- `PUT /api/kpis/:id` → 200
- `DELETE /api/kpis/:id` → 204 (مقيد)

**Targets & Readings**
- `POST /api/kpis/:id/targets` (period, target_value) → 201 `{target_id}`
- `POST /api/kpis/:id/readings` (period, actual_value, collected_at?, source?) → 201 `{reading_id}`
- `PUT /api/kpi-targets/:target_id` → 200
- `PUT /api/kpi-readings/:reading_id` → 200

**Initiatives**
- `POST /api/objectives/:id/initiatives` (title, owner_user_id, start_at?, end_at?) → 201 `{initiative_id}`
- `PUT /api/initiatives/:id` → 200
- `DELETE /api/initiatives/:id` → 204

**Validation & Errors**
- 403 عند غياب الإذن، 404 للمعرفات غير الموجودة، 422 لحقول ناقصة.

---

## C) UI (Routes/Pages Scaffolds)

### C.1 Routes
- `/admin/objectives` (List) — requires `kpi.read`
- `/admin/objectives/new` (Create) — requires `kpi.write`
- `/admin/objectives/:id` (Details) — requires `kpi.read`
  - Tabs: **KPIs**, **Initiatives**, **Timeline/Audit**

- `/admin/kpis/:id` (Details) — requires `kpi.read`
  - Tabs: **Overview**, **Targets**, **Readings (Chart)**, **Timeline/Audit**

### C.2 List Pages
- **Objectives List**: Filters (status/owner/q), Table (code,title,owner,status,updated_at)
- **KPIs List** (اختياري): Filters (objective/unit/q), Table (code,title,unit,direction,updated_at)

### C.3 Details & Forms
- **Objective Details**: summary + actions (Edit/Delete) محروسة
- **KPI Details**: summary + chart (period vs value) + actions
- **Forms**:
  - Create Objective: code,title,owner,horizon,status
  - Create KPI: objective, code, title, unit, direction
  - Add Target: period, target_value
  - Add Reading: period, actual_value, collected_at?, source?

### C.4 Charts
- Line/Bar chart لقراءات KPI عبر الفترات (recharts).  
- Variance indicator مقابل Target (إن وُجد).

---

## D) الاختبارات (Acceptance)

- **DB/RLS:** CRUD داخل نفس المستأجر فقط (EXISTS policies صحيحة).  
- **API:**  
  - ANALYST: 200 على GET فقط، 403 للباقي.  
  - ADMIN: 200 على CRUD كاملة + Targets/Readings/Initiatives.  
- **UI Guards:** إخفاء أزرار الإنشاء/التعديل لمن يفتقد `kpi.write`.  
- **Audit:** أحداث لكل CRUD على الجداول الخمسة.  
- **Charts:** تعرض readings المتاحة فقط للمستأجر الحالي.

---

## E) فرص التحسين (اختيارية)
1) **Materialized Views** لتجميع القراءات شهريًا/ربع سنويًا.  
2) **Quality Flags** لقراءات تأتي من مصادر مختلفة.  
3) **Variance Alerts** عند انحراف حاد عن الهدف.  
4) **CSV Import/Export** للقراءات والأهداف.
```
-- نهاية الحزمة
```
