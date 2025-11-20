# Gate-K — Data Contracts (v1.0)

## 1) مبادئ عامة

### 1.1) Single Source of Truth (SSOT)
- كل Gate يُعتبر **المصدر الرسمي الوحيد** للبيانات التي يمتلكها
- Gate-K **لا يُخزّن** نسخاً مكررة من البيانات المصدرية
- Gate-K **يستهلك** البيانات عبر Views/APIs موثقة ومضمونة

### 1.2) Versioning & Change Control
- كل تغيير في Schema أو Business Logic يتطلب:
  - **Version Increment** (v1 → v2)
  - **Backward Compatibility** لمدة 60 يوماً على الأقل
  - **Breaking Changes**: إشعار مسبق 30 يوماً + Migration Guide
- عقود البيانات تُوثّق في:
  - `data_contracts` metadata table (per Gate)
  - API documentation (OpenAPI/Swagger)
  - Release Notes

### 1.3) Data Lineage
- كل حقل في Gate-K يحمل:
  ```json
  {
    "source_gate": "Gate-I",
    "source_table": "mv_awareness_campaign_kpis",
    "source_field": "completion_rate",
    "transformation": "direct_mapping",
    "last_synced_at": "2025-01-15T02:30:00Z"
  }
  ```
- أي تحويل (transformation) يُوثّق في `kpi_catalog.formula`

### 1.4) Ownership & Accountability
| Gate | Owner Team | Contact | SLA Response |
|------|-----------|---------|--------------|
| **Gate-I** | Awareness Analytics | awareness-team@romuz.sa | 4 ساعات عمل |
| **Gate-J** | Impact & Validation | impact-team@romuz.sa | 8 ساعات عمل |
| **Gate-F** | Reports & Exports | reports-team@romuz.sa | 4 ساعات عمل |
| **Gate-H** | Action Plans (TBD) | governance-team@romuz.sa | 8 ساعات عمل |
| **Gate-K** | Continuous Improvement | analytics-lead@romuz.sa | 2 ساعات عمل |

### 1.5) Multi-Tenant RLS & RBAC
- **جميع** الجداول/Views المصدرية تحتوي على `tenant_id`
- **RLS Policies** مُفعّلة على جميع المصادر:
  ```sql
  WHERE tenant_id = app_current_tenant_id()
  ```
- **RBAC Roles** المطلوبة:
  - `platform_admin`: قراءة كل Tenants
  - `tenant_admin`: قراءة tenant الخاص فقط
  - `analyst`: قراءة مع حدود (masked PII)
  - `viewer`: قراءة Dashboard KPIs فقط

### 1.6) Freshness SLAs
| Data Type | Target Freshness | Max Acceptable Delay | Failure Mode |
|-----------|-----------------|---------------------|--------------|
| **Daily KPIs** | 02:00 Riyadh daily | +6 ساعات | Last-good value + warning |
| **Real-time Events** | < 5 دقائق | +15 دقيقة | Degraded mode (sampling) |
| **Impact Scores** | Monthly (5th of month) | +5 أيام | Use previous month + flag |
| **Calibration** | Quarterly | +14 يوم | Use baseline weights |

### 1.7) Failure Modes
**عند تعطل مصدر البيانات:**
1. **Degraded Mode**: 
   - عرض آخر قيمة موثوقة (`last_good_value`)
   - Badge: "⚠️ Data delayed (2 hours)"
2. **Fallback to Historical Baseline**:
   - استخدام متوسط آخر 30 يوم
   - Badge: "📊 Using historical average"
3. **Total Outage**:
   - إخفاء KPI مع رسالة: "Temporarily unavailable"
   - Alert إلى Platform Admin

---

## 2) Gate-I (Insights & Analytics) — Contract

### 2.1) Scope
Gate-I يوفر بيانات:
- **Campaign KPIs**: Reach, Engagement, Completion, Quiz Scores
- **Timeseries Data**: Daily/Weekly engagement trends
- **Feedback Insights**: Sentiment, satisfaction scores

### 2.2) Exposed Views (Read-only)

#### **View 1: `mv_awareness_campaign_kpis`**
**الوصف:** KPIs مُجمّعة على مستوى Campaign (Materialized View، يتحدّث يومياً 02:00)

**Schema:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `tenant_id` | UUID | NOT NULL, FK | معرّف Tenant (RLS isolation) |
| `campaign_id` | UUID | NOT NULL, FK | معرّف الحملة |
| `campaign_name` | TEXT | NOT NULL | اسم الحملة |
| `owner_name` | TEXT | NULL | صاحب الحملة |
| `start_date` | DATE | NOT NULL | تاريخ البدء |
| `end_date` | DATE | NOT NULL | تاريخ الانتهاء |
| `total_participants` | INTEGER | >= 0 | إجمالي المشاركين المدعوين |
| `started_count` | INTEGER | >= 0 | عدد من بدأ (opened_at IS NOT NULL) |
| `completed_count` | INTEGER | >= 0 | عدد المكتملين |
| `avg_score` | NUMERIC(5,2) | 0-100, NULL | متوسط درجات الاختبارات |
| `overdue_count` | INTEGER | >= 0 | عدد المتأخرين |
| `completion_rate` | NUMERIC(5,2) | 0-100, NULL | نسبة الإكمال (%) |
| `started_rate` | NUMERIC(5,2) | 0-100, NULL | نسبة البدء (%) |
| `active_days` | INTEGER | >= 0 | عدد الأيام النشطة |

**Access Pattern:**
```sql
SELECT * 
FROM public.mv_awareness_campaign_kpis
WHERE tenant_id = app_current_tenant_id()
  AND campaign_id = :campaign_id;
```

**Freshness Target:** Daily by 02:00 Riyadh  
**Refresh Function:** `public.refresh_awareness_views()`  
**Late Data Policy:** إذا تأخر التحديث > 6 ساعات → استخدام last-good snapshot + warning flag

**Owner:** Awareness Analytics Team  
**Escalation Path:** awareness-team@romuz.sa → Platform Admin (4h SLA)

---

#### **View 2: `mv_awareness_timeseries`**
**الوصف:** بيانات Engagement يومية (time-series) لكل Campaign

**Schema:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `tenant_id` | UUID | NOT NULL | معرّف Tenant |
| `campaign_id` | UUID | NOT NULL | معرّف الحملة |
| `day` | DATE | NOT NULL | التاريخ (YYYY-MM-DD) |
| `started_delta` | INTEGER | >= 0 | عدد من بدأ في هذا اليوم |
| `completed_delta` | INTEGER | >= 0 | عدد من أكمل في هذا اليوم |
| `avg_score_day` | NUMERIC(5,2) | 0-100, NULL | متوسط الدرجات لهذا اليوم |

**Unique Key:** `(tenant_id, campaign_id, day)`

**Access Pattern (W12 Trend):**
```sql
SELECT * 
FROM public.mv_awareness_timeseries
WHERE tenant_id = app_current_tenant_id()
  AND day >= CURRENT_DATE - INTERVAL '12 weeks'
ORDER BY day DESC;
```

**Freshness Target:** Daily by 02:00 Riyadh  
**Backfill Policy:** إعادة حساب آخر 7 أيام عند كل تحديث (لتصحيح Late Arrivals)

---

#### **View 3: `mv_awareness_feedback_insights`**
**الوصف:** تحليل Feedback & Sentiment لكل Campaign

**Schema:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `tenant_id` | UUID | NOT NULL | معرّف Tenant |
| `campaign_id` | UUID | NOT NULL | معرّف الحملة |
| `campaign_name` | TEXT | NOT NULL | اسم الحملة |
| `total_feedback_count` | INTEGER | >= 0 | عدد التقييمات المقدمة |
| `avg_feedback_score` | NUMERIC(5,2) | 0-100, NULL | متوسط درجة الرضا |
| `sentiment` | TEXT | NULL | Sentiment: positive/neutral/negative |
| `top_themes` | JSONB | NULL | أهم المواضيع من Comments |

**Freshness Target:** Weekly (Sunday 02:00)  
**Retention:** 24 شهر، ثم Archive

**PII Notice:** حقل `comments` (في الجدول الأصلي) يحتوي على نصوص حرة (PII)  
→ **لا يُعرض** في Gate-K إلا لـ `tenant_admin` مع Masking

---

### 2.3) Dimensions (Join Keys)
| Dimension | Join Table | Key Field | Gate-K Usage |
|-----------|-----------|-----------|--------------|
| **Department** | `employee_profiles` | `department` | Cross-dimension KPI breakdowns |
| **Campaign Type** | `awareness_campaigns.tags` (JSONB) | `tags->'type'` | Segment by type (security, compliance, etc.) |
| **Location** | `employee_profiles.location` | `location` | Geo-based analytics |

---

### 2.4) Data Quality Checks (Gate-I Ownership)
| Check | Rule | Action if Fails |
|-------|------|----------------|
| **Freshness** | Updated daily by 02:00 | Alert + use last-good |
| **Null Rate** | `completion_rate` NULL < 5% | Warning (insufficient sample) |
| **Range** | `completion_rate` in [0, 100] | Flag outliers |
| **Referential Integrity** | All `campaign_id` exist in `awareness_campaigns` | Block refresh |

---

## 3) Gate-J (Impact Engine + Calibration) — Contract

### 3.1) Scope
Gate-J يوفر:
- **Impact Scores**: درجة تأثير Awareness على السلوك الفعلي
- **Validation Results**: فجوات التحقق بين Predicted vs Actual
- **Calibration Runs**: نتائج معايرة الأوزان

### 3.2) Exposed Tables (Read-only)

#### **Table 1: `awareness_impact_scores`**
**الوصف:** Impact Scores المحسوبة لكل Org Unit + Period

**Schema:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique ID |
| `tenant_id` | UUID | NOT NULL, FK | معرّف Tenant |
| `org_unit_id` | UUID | NOT NULL | معرّف الوحدة التنظيمية |
| `period_year` | INTEGER | >= 2024 | السنة |
| `period_month` | INTEGER | 1-12 | الشهر |
| `engagement_score` | NUMERIC(5,2) | 0-100 | درجة التفاعل |
| `completion_score` | NUMERIC(5,2) | 0-100 | درجة الإكمال |
| `feedback_quality_score` | NUMERIC(5,2) | 0-100 | درجة جودة الملاحظات |
| `compliance_linkage_score` | NUMERIC(5,2) | 0-100 | درجة ارتباط الامتثال |
| `impact_score` | NUMERIC(5,2) | 0-100 | **النتيجة النهائية** (weighted sum) |
| `risk_level` | TEXT | ENUM: very_low, low, medium, high | مستوى المخاطر المُشتق |
| `confidence_level` | NUMERIC(5,2) | 0-100, NULL | مستوى الثقة |
| `data_source` | TEXT | NULL | مصدر البيانات (Gate-J Formula Engine) |
| `notes` | TEXT | NULL | ملاحظات اختيارية |
| `created_at` | TIMESTAMPTZ | NOT NULL | تاريخ الإنشاء |
| `updated_at` | TIMESTAMPTZ | NOT NULL | آخر تحديث |

**Unique Key:** `(tenant_id, org_unit_id, period_year, period_month)`

**Access Pattern:**
```sql
SELECT 
  org_unit_id,
  period_year,
  period_month,
  impact_score,
  risk_level,
  confidence_level
FROM public.awareness_impact_scores
WHERE tenant_id = app_current_tenant_id()
  AND period_year = 2025
  AND period_month = 1;
```

**Freshness Target:** Monthly (5th of each month for previous month)  
**Backfill Rules:** السماح بإعادة حساب آخر 3 أشهر عند تحديث الأوزان (Weights)

**Owner:** Impact & Validation Team  
**Escalation:** impact-team@romuz.sa (8h SLA)

---

#### **Table 2: `awareness_impact_validations`**
**الوصف:** نتائج التحقق من دقة Impact Scores (Predicted vs Actual)

**Schema:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique ID |
| `tenant_id` | UUID | NOT NULL | معرّف Tenant |
| `org_unit_id` | UUID | NOT NULL | معرّف الوحدة |
| `period_year` | INTEGER | >= 2024 | السنة |
| `period_month` | INTEGER | 1-12 | الشهر |
| `computed_impact_score` | NUMERIC(5,2) | 0-100 | **Predicted** (من Gate-J Formula) |
| `actual_behavior_score` | NUMERIC(5,2) | 0-100, NULL | **Actual** (من بيانات سلوكية حقيقية) |
| `validation_gap` | NUMERIC(6,2) | NULL | الفرق: `computed - actual` |
| `validation_status` | TEXT | pending, passed, failed | حالة التحقق |
| `confidence_gap` | NUMERIC(5,2) | NULL | تدني الثقة بسبب الفجوة |
| `risk_incident_count` | INTEGER | >= 0 | عدد الحوادث الفعلية |
| `notes` | TEXT | NULL | ملاحظات |
| `created_at` | TIMESTAMPTZ | NOT NULL | تاريخ الإنشاء |
| `updated_at` | TIMESTAMPTZ | NOT NULL | آخر تحديث |

**Mapping to Gate-K KPI:**
- `kpi_validation_gap_avg` = `AVG(validation_gap)`
- `kpi_calibration_accuracy` = `(COUNT(*) WHERE ABS(validation_gap) <= 10) / COUNT(*) * 100`

**Freshness Target:** Monthly (10th of each month, بعد Impact Scores)  
**Late Data Policy:** إذا تأخرت Actual Behavior Data → `validation_status = 'pending'`

---

#### **Table 3: `awareness_impact_calibration_runs`**
**الوصف:** سجلات Calibration Runs (معايرة الأوزان)

**Schema:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique ID |
| `tenant_id` | UUID | NOT NULL | معرّف Tenant |
| `run_label` | TEXT | NULL | تسمية Run (e.g., "Q1 2025 Calibration") |
| `model_version` | INTEGER | >= 1 | إصدار النموذج |
| `period_start` | DATE | NULL | بداية الفترة المستخدمة |
| `period_end` | DATE | NULL | نهاية الفترة |
| `sample_size` | INTEGER | >= 0 | عدد العينات |
| `avg_validation_gap` | NUMERIC(6,2) | NULL | متوسط الفجوة |
| `min_validation_gap` | NUMERIC(6,2) | NULL | أقل فجوة |
| `max_validation_gap` | NUMERIC(6,2) | NULL | أعلى فجوة |
| `correlation_score` | NUMERIC(5,2) | 0-1, NULL | معامل الارتباط (Predicted vs Actual) |
| `overall_status` | TEXT | NULL | excellent, good, needs_review, poor |
| `created_at` | TIMESTAMPTZ | NOT NULL | تاريخ الإنشاء |
| `created_by` | UUID | NULL | من قام بـ Run |

**Access Pattern:**
```sql
-- Get latest calibration run
SELECT *
FROM public.awareness_impact_calibration_runs
WHERE tenant_id = app_current_tenant_id()
ORDER BY created_at DESC
LIMIT 1;
```

**Refresh Cadence:** Quarterly (يناير، أبريل، يوليو، أكتوبر)  
**Owner:** Platform Admin (يتطلب موافقة لتشغيل Calibration)

---

#### **Table 4: `awareness_impact_weights`**
**الوصف:** الأوزان المستخدمة في حساب Impact Score

**Schema:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique ID |
| `tenant_id` | UUID | NULL | NULL = Platform-level weights |
| `version` | INTEGER | >= 1 | إصدار الأوزان |
| `is_active` | BOOLEAN | NOT NULL | هل هذا الإصدار نشط؟ |
| `engagement_weight` | NUMERIC(3,2) | 0-1, default 0.25 | وزن Engagement |
| `completion_weight` | NUMERIC(3,2) | 0-1, default 0.25 | وزن Completion |
| `feedback_quality_weight` | NUMERIC(3,2) | 0-1, default 0.25 | وزن Feedback Quality |
| `compliance_linkage_weight` | NUMERIC(3,2) | 0-1, default 0.25 | وزن Compliance Linkage |
| `label` | TEXT | NULL | تسمية (e.g., "Default Weights") |
| `notes` | TEXT | NULL | ملاحظات |
| `created_at` | TIMESTAMPTZ | NOT NULL | تاريخ الإنشاء |

**Constraint:** `SUM(weights) = 1.0`

**Access Pattern:**
```sql
-- Get active weights for tenant
SELECT *
FROM public.awareness_impact_weights
WHERE (tenant_id = app_current_tenant_id() OR tenant_id IS NULL)
  AND is_active = TRUE
ORDER BY tenant_id NULLS LAST -- Tenant-specific overrides Platform
LIMIT 1;
```

**Change Control:** تغيير الأوزان يتطلب:
1. Calibration Run للتحقق من التأثير
2. Approval من Tenant Admin
3. Version Increment + Effective Date

---

### 3.3) Data Quality Checks (Gate-J Ownership)
| Check | Rule | Action if Fails |
|-------|------|----------------|
| **Freshness** | Monthly by 5th of month | Alert + use previous month |
| **Completeness** | `impact_score` NOT NULL | Block insert |
| **Range** | All scores in [0, 100] | Reject outliers |
| **Weights Sum** | `SUM(weights) = 1.0` | Validation error |
| **Referential Integrity** | `org_unit_id` exists | Block computation |

---

## 4) Gate-F (Reports/Exports Usage) — Contract

### 4.1) Scope
Gate-F يوفر:
- **Daily Report KPIs**: Delivery, Open Rate, CTR, Completion
- **Cumulative-to-Date (CTD)**: إجماليات من بداية الحملة
- **Export Events**: تتبع استخدام ميزة Export (CSV, JSON, XLSX)

### 4.2) Exposed Views (Read-only)

#### **View 1: `mv_report_kpis_daily`**
**الوصف:** KPIs يومية لكل Campaign (تستخدم في Dashboard + Export)

**Schema:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `tenant_id` | UUID | NOT NULL | معرّف Tenant |
| `campaign_id` | UUID | NOT NULL | معرّف الحملة |
| `campaign_name` | TEXT | NOT NULL | اسم الحملة |
| `owner_name` | TEXT | NULL | صاحب الحملة |
| `date` | DATE | NOT NULL | التاريخ |
| `deliveries` | BIGINT | >= 0 | عدد الرسائل المُسلّمة |
| `opens` | BIGINT | >= 0 | عدد الفتحات |
| `clicks` | BIGINT | >= 0 | عدد النقرات |
| `bounces` | BIGINT | >= 0 | عدد الارتدادات |
| `reminders` | BIGINT | >= 0 | عدد التذكيرات المُرسلة |
| `open_rate` | NUMERIC(5,2) | 0-100 | نسبة الفتح (%) |
| `ctr` | NUMERIC(5,2) | 0-100 | نسبة النقر (%) |
| `completed_count` | BIGINT | >= 0 | عدد المكتملين |
| `activated_count` | BIGINT | >= 0 | عدد المنشّطين |
| `completion_rate` | NUMERIC(5,2) | 0-100 | نسبة الإكمال (%) |
| `activation_rate` | NUMERIC(5,2) | 0-100 | نسبة التنشيط (%) |

**Unique Key:** `(tenant_id, campaign_id, date)`

**Access Pattern:**
```sql
-- Function provided by Gate-F
SELECT * 
FROM public.get_report_kpis_daily(
  p_campaign_id := :campaign_id,
  p_from_date := '2025-01-01',
  p_to_date := '2025-01-31'
);
```

**Freshness Target:** Daily by 02:00 Riyadh  
**Refresh Function:** `public.refresh_report_views()`

**Mapping to Gate-K KPIs:**
- `kpi_delivery_success_rate` = `(deliveries - bounces) / deliveries * 100`
- `kpi_bounce_rate` = `bounces / deliveries * 100`
- `kpi_open_rate` = `opens / deliveries * 100`
- `kpi_click_through_rate` = `clicks / opens * 100`

**Owner:** Reports & Exports Team  
**Escalation:** reports-team@romuz.sa (4h SLA)

---

#### **View 2: `vw_report_kpis_ctd`**
**الوصف:** Cumulative-to-Date KPIs (من بداية الحملة حتى آخر تاريخ)

**Schema:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `tenant_id` | UUID | NOT NULL | معرّف Tenant |
| `campaign_id` | UUID | NOT NULL | معرّف الحملة |
| `last_date` | DATE | NOT NULL | آخر تاريخ تحديث |
| `total_deliveries` | BIGINT | >= 0 | إجمالي المُسلّمة |
| `total_opens` | BIGINT | >= 0 | إجمالي الفتحات |
| `total_clicks` | BIGINT | >= 0 | إجمالي النقرات |
| `total_bounces` | BIGINT | >= 0 | إجمالي الارتدادات |
| `total_reminders` | BIGINT | >= 0 | إجمالي التذكيرات |
| `total_completed` | BIGINT | >= 0 | إجمالي المكتملين |
| `total_activated` | BIGINT | >= 0 | إجمالي المنشّطين |
| `avg_open_rate` | NUMERIC(5,2) | 0-100 | متوسط Open Rate |
| `avg_ctr` | NUMERIC(5,2) | 0-100 | متوسط CTR |

**Access Pattern:**
```sql
SELECT * 
FROM public.get_report_kpis_ctd(p_campaign_id := :campaign_id);
```

**Freshness Target:** يتحدّث كل ساعة (via Trigger on mv_report_kpis_daily)

---

#### **Table 3: `report_exports` (Export Events)**
**الوصف:** تتبع Export operations (لحساب Adoption KPIs)

**Schema:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique ID |
| `tenant_id` | UUID | NOT NULL | معرّف Tenant |
| `user_id` | UUID | NOT NULL | من قام بـ Export |
| `report_type` | TEXT | NOT NULL | نوع التقرير (performance, deliverability, etc.) |
| `file_format` | TEXT | NOT NULL | csv, json, xlsx |
| `status` | TEXT | NOT NULL | pending, processing, completed, failed |
| `batch_id` | TEXT | NULL | Batch ID (if part of bulk export) |
| `total_rows` | INTEGER | >= 0 | عدد الصفوف |
| `storage_url` | TEXT | NULL | URL للملف المُولّد |
| `created_at` | TIMESTAMPTZ | NOT NULL | تاريخ بدء Export |
| `completed_at` | TIMESTAMPTZ | NULL | تاريخ الانتهاء |
| `error_message` | TEXT | NULL | رسالة الخطأ (if failed) |

**Mapping to Gate-K KPIs:**
- `kpi_report_exports_count` = `COUNT(*) WHERE status = 'completed'`
- `kpi_export_avg_latency` = `AVG(completed_at - created_at)`
- `kpi_export_failure_rate` = `COUNT(*) WHERE status = 'failed' / COUNT(*) * 100`

**Freshness Target:** Real-time (Events)  
**Retention Policy:** 90 يوم (ثم Archive), Files في Storage تُحذف بعد 7 أيام

**PII Notice:** `storage_url` قد يحتوي على بيانات حساسة (PII)  
→ **Access Control**: فقط `user_id` (صاحب Export) أو `tenant_admin`

---

### 4.3) Data Quality Checks (Gate-F Ownership)
| Check | Rule | Action if Fails |
|-------|------|----------------|
| **Freshness** | Daily by 02:00 | Alert + use last-good |
| **Completeness** | `open_rate`, `ctr` NOT NULL | Warning (data gap) |
| **Range** | All rates in [0, 100] | Flag outliers |
| **Event Ordering** | `created_at` <= `completed_at` | Validation error |

---

## 5) Gate-H (Action Plans & Follow-ups) — Contract (if available)

### 5.1) Status
⚠️ **Gate-H Schema غير متاح حالياً في الـ Production**

**Pending Items:**
- [ ] تأكيد Schema النهائي لـ `action_plans` table
- [ ] تحديد RLS policies + Ownership model
- [ ] تعريف KPIs المطلوبة:
  - `kpi_action_plans_created`
  - `kpi_action_followup_closure_rate`
  - `kpi_action_avg_days_to_close`
  - `kpi_action_overdue_count`

### 5.2) Proposed Schema (Draft v0.1)

#### **Table: `action_plans` (Proposed)**
**الوصف:** خطط العمل المُنشأة من Insights/Incidents

**Schema (Draft):**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK | Unique ID |
| `tenant_id` | UUID | NOT NULL | معرّف Tenant |
| `title` | TEXT | NOT NULL | عنوان خطة العمل |
| `description` | TEXT | NULL | التفاصيل |
| `priority` | TEXT | ENUM: low, medium, high, critical | الأولوية |
| `status` | TEXT | ENUM: open, in_progress, completed, cancelled | الحالة |
| `owner_id` | UUID | NOT NULL | مسؤول التنفيذ |
| `department_id` | UUID | NULL | القسم المعني |
| `campaign_id` | UUID | NULL | الحملة المرتبطة (optional) |
| `due_date` | DATE | NULL | تاريخ الاستحقاق |
| `created_at` | TIMESTAMPTZ | NOT NULL | تاريخ الإنشاء |
| `completed_at` | TIMESTAMPTZ | NULL | تاريخ الإكمال |
| `closure_time_days` | INTEGER | NULL | عدد الأيام للإغلاق (computed) |
| `linked_incident_id` | UUID | NULL | Incident ID (if applicable) |

**Join Keys with Dimensions:**
- `department_id` → `dim_department.id`
- `campaign_id` → `awareness_campaigns.id`

**SLA & Integrity Requirements:**
1. **SLA:** يجب إكمال `high` priority خلال 30 يوم، `critical` خلال 7 أيام
2. **Integrity:** لا يمكن `completed` بدون `completed_at`
3. **Audit:** جميع التغييرات تُسجّل في `audit_log`

---

### 5.3) Mapping to Gate-K KPIs (When Available)
| Gate-K KPI | Source Field | Formula |
|-----------|-------------|---------|
| `kpi_action_plans_created` | `COUNT(*)` | `WHERE created_at >= period_start` |
| `kpi_action_followup_closure_rate` | `status` | `(COUNT(*) WHERE status = 'completed') / COUNT(*) * 100` |
| `kpi_action_avg_days_to_close` | `closure_time_days` | `AVG(closure_time_days) WHERE status = 'completed'` |
| `kpi_action_overdue_count` | `due_date`, `status` | `COUNT(*) WHERE due_date < CURRENT_DATE AND status != 'completed'` |

**Freshness Target (Proposed):** Real-time (via Triggers)  
**Owner (Proposed):** Governance Team

**Status:** ⏳ **Pending Gate-H implementation (Q2 2025)**

---

## 6) ضمان الجودة (Data Quality)

### 6.1) Quality Dimensions
| Dimension | Definition | Measurement |
|-----------|------------|-------------|
| **Freshness** | مدى حداثة البيانات | `NOW() - last_updated_at` |
| **Completeness** | نسبة البيانات المفقودة | `(NOT NULL count / Total) * 100` |
| **Accuracy** | مطابقة الحسابات للصيغ المحددة | Unit tests + spot checks |
| **Consistency** | توافق البيانات عبر Sources | Cross-source reconciliation |
| **Validity** | البيانات ضمن النطاقات المسموحة | Range checks (e.g., 0-100 for %) |

### 6.2) Automated Quality Checks

#### **Check 1: Freshness Monitor**
```sql
-- Run every hour via Edge Function
SELECT 
  'mv_awareness_campaign_kpis' AS source,
  MAX(updated_at) AS last_refresh,
  EXTRACT(EPOCH FROM (NOW() - MAX(updated_at))) / 3600 AS hours_since_refresh,
  CASE 
    WHEN EXTRACT(EPOCH FROM (NOW() - MAX(updated_at))) / 3600 > 6 THEN 'CRITICAL'
    WHEN EXTRACT(EPOCH FROM (NOW() - MAX(updated_at))) / 3600 > 3 THEN 'WARNING'
    ELSE 'OK'
  END AS status
FROM public.mv_awareness_campaign_kpis;
```

**Action on Failure:**
- `WARNING`: Log + Dashboard badge
- `CRITICAL`: Alert to Platform Admin + Use last-good value

---

#### **Check 2: Null Rate Monitor**
```sql
-- Run daily after refresh
WITH null_checks AS (
  SELECT 
    'completion_rate' AS field,
    COUNT(*) AS total_rows,
    COUNT(*) FILTER (WHERE completion_rate IS NULL) AS null_count,
    ROUND(COUNT(*) FILTER (WHERE completion_rate IS NULL)::NUMERIC / COUNT(*) * 100, 2) AS null_pct
  FROM public.mv_awareness_campaign_kpis
  WHERE tenant_id = :tenant_id
)
SELECT *
FROM null_checks
WHERE null_pct > 5.0; -- Threshold: 5%
```

**Action on Failure:**
- Log warning: "Insufficient sample size for completion_rate"
- Add badge to KPI: "⚠️ Low confidence"

---

#### **Check 3: Range Validation**
```sql
-- Run daily after refresh
SELECT 
  campaign_id,
  completion_rate
FROM public.mv_awareness_campaign_kpis
WHERE completion_rate NOT BETWEEN 0 AND 100
  OR completion_rate IS NULL AND total_participants > 0;
```

**Action on Failure:**
- Flag outlier campaigns in dashboard
- Investigate data source (potential bug)

---

#### **Check 4: Outlier Detection (Z-score)**
```sql
-- Detect anomalies in impact_score
WITH stats AS (
  SELECT 
    AVG(impact_score) AS mean,
    STDDEV(impact_score) AS stddev
  FROM public.awareness_impact_scores
  WHERE tenant_id = :tenant_id
    AND period_year = 2025
)
SELECT 
  org_unit_id,
  impact_score,
  (impact_score - stats.mean) / NULLIF(stats.stddev, 0) AS z_score
FROM public.awareness_impact_scores
CROSS JOIN stats
WHERE ABS((impact_score - stats.mean) / NULLIF(stats.stddev, 0)) > 3; -- 3σ threshold
```

**Action on Failure:**
- Flag in Gate-K dashboard as "Potential outlier"
- Require manual review by Analyst

---

### 6.3) Evidence & Reporting

#### **DQ Dashboard (Gate-K UI)**
**URL:** `/admin/data-quality`

**Sections:**
1. **Freshness Status**: Green/Yellow/Red per source
2. **Completeness Score**: % per table/field
3. **Outlier Alerts**: List of flagged records
4. **Historical Trends**: 30-day quality score trend

**Access:** `platform_admin`, `tenant_admin`

---

#### **Automated Test Report**
**Cadence:** Daily (after all refreshes complete)

**Format:**
```json
{
  "report_date": "2025-01-15",
  "tenant_id": "tenant-uuid",
  "overall_score": 95.5,
  "checks": [
    {
      "source": "Gate-I: mv_awareness_campaign_kpis",
      "freshness": "OK",
      "completeness": 98.2,
      "accuracy": "OK",
      "outliers_count": 2
    },
    {
      "source": "Gate-J: awareness_impact_scores",
      "freshness": "WARNING (4h delay)",
      "completeness": 100.0,
      "accuracy": "OK",
      "outliers_count": 0
    }
  ],
  "action_items": [
    "Investigate Gate-J delay (4h)",
    "Review 2 outlier campaigns in Gate-I"
  ]
}
```

**Delivery:** Email إلى Platform Admin + Slack #data-quality

---

## 7) الأمن والامتثال

### 7.1) RLS Policies (Multi-Tenant Isolation)

**جميع الجداول/Views المصدرية تطبق:**
```sql
-- Generic RLS policy template
CREATE POLICY "tenant_isolation_policy"
ON {table_name}
FOR SELECT
USING (tenant_id = app_current_tenant_id());
```

**Example: Gate-I**
```sql
ALTER TABLE public.mv_awareness_campaign_kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view campaigns in their tenant"
ON public.mv_awareness_campaign_kpis
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));
```

**Verification:**
- Integration tests تتحقق من RLS لكل View/Table
- Security scan (Gate-G) يُنفّذ ربع سنوي

---

### 7.2) Field-Level Restrictions (PII)

**Sensitive Fields:**
| Field | Table | Restriction | Masking Rule |
|-------|-------|-------------|-------------|
| `employee_ref` | `campaign_participants` | `tenant_admin` only | Show first 3 chars + `***` |
| `email` | `employee_profiles` | Not exposed in Gate-K | N/A |
| `comments` | `campaign_feedback` | `tenant_admin` only | Show only if `feedback_score` < 50 (negative) |

**Implementation:**
```sql
-- Function to mask employee_ref
CREATE OR REPLACE FUNCTION mask_employee_ref(ref TEXT, role TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  IF role IN ('tenant_admin', 'platform_admin') THEN
    RETURN ref;
  ELSE
    RETURN SUBSTRING(ref, 1, 3) || '***';
  END IF;
END;
$$;
```

---

### 7.3) Audit Logs

**جميع الـ Read Operations على البيانات الحساسة تُسجّل في `audit_log`:**
```sql
-- Example: Log when tenant_admin reads PII
INSERT INTO public.audit_log (
  tenant_id,
  actor,
  entity_type,
  entity_id,
  action,
  payload
)
VALUES (
  app_current_tenant_id(),
  auth.uid(),
  'campaign_participants',
  :participant_id,
  'read_pii',
  jsonb_build_object('field', 'employee_ref', 'reason', 'investigation')
);
```

**Retention:** 24 شهر (compliance requirement)

---

### 7.4) Data Contract Violation Handling

**Incident Response Workflow:**
```
1. Detection (Automated monitoring)
   ↓
2. Alert (Platform Admin via Slack/Email)
   ↓
3. Triage (Within 1 hour)
   - Severity: Low / Medium / High / Critical
   ↓
4. Containment
   - Critical: Disable data source integration
   - High: Switch to fallback (last-good)
   - Medium/Low: Log + continue with warning
   ↓
5. Root Cause Analysis (RCA)
   - Document in incident report
   - Update contract if schema drift
   ↓
6. Remediation
   - Fix source system
   - Backfill missing data (if applicable)
   ↓
7. Post-Mortem
   - Share learnings with source Gate team
   - Update monitoring rules
```

**Example Violations:**
- **Schema Drift**: Gate-I adds new field without notice → `ERROR: column not found`
- **Data Type Mismatch**: `completion_rate` suddenly TEXT instead of NUMERIC → Query fails
- **Freshness SLA Breach**: Data not updated for 12 hours → Use last-good + alert

**Escalation Matrix:**
| Severity | Response Time | Escalation Path |
|----------|--------------|-----------------|
| **Critical** | 15 دقيقة | Platform Admin → CTO |
| **High** | 1 ساعة | Source Gate Owner → Platform Admin |
| **Medium** | 4 ساعات | Source Gate Owner |
| **Low** | 24 ساعة | Log only (review in weekly sync) |

---

### 7.5) Compliance (PDPL / Saudi Data Law)

**Data Residency:**
- جميع البيانات مُخزّنة في **Riyadh Region** (Supabase ME Central)
- Cross-border transfers: ❌ Not allowed without explicit consent

**Data Minimization:**
- Gate-K **لا يُخزّن** نسخاً من PII (يستهلك فقط aggregated KPIs)
- Exceptions: `employee_ref` (pseudonymized ID, not real name/email)

**Right to be Forgotten:**
- عند حذف `campaign_participant`:
  - Hard delete من Source (Gate-I)
  - Cascade delete من `audit_log` (after 90 days)
  - Gate-K: Aggregated KPIs تبقى (no PII)

**Consent Management:**
- خارج نطاق Gate-K (تُدار في HR System)
- Gate-K يفترض أن جميع البيانات المُستهلكة **لها موافقة**

---

## 8) التوقيع والاعتماد

### Approved By

| Role | Name | Date | Signature |
|------|------|------|-----------|
| **Solution Architect** | _____________________________ | _______________ | _______________ |
| **Data Engineer Lead** | _____________________________ | _______________ | _______________ |
| **Gate-I Owner (Awareness Team)** | _____________________________ | _______________ | _______________ |
| **Gate-J Owner (Impact Team)** | _____________________________ | _______________ | _______________ |
| **Gate-F Owner (Reports Team)** | _____________________________ | _______________ | _______________ |
| **Platform Admin** | _____________________________ | _______________ | _______________ |

### Notes

```
Change Log:
- v1.0 (2025-01-15): Initial Data Contracts
  - Defined contracts for Gate-I, Gate-J, Gate-F
  - Gate-H marked as TBD (pending implementation)
  - Established quality checks, RLS policies, and incident handling

Pending Items:
- [ ] Finalize Gate-H Schema (ETA: Q2 2025)
- [ ] Implement DQ Dashboard UI (/admin/data-quality)
- [ ] Set up automated DQ Report emails (daily)
- [ ] Add cross-tenant benchmarking contracts (v2, post-legal review)

Dependencies:
- Gate-I: mv_awareness_campaign_kpis, mv_awareness_timeseries, mv_awareness_feedback_insights (✅ Available)
- Gate-J: awareness_impact_scores, awareness_impact_validations (✅ Available)
- Gate-F: mv_report_kpis_daily, vw_report_kpis_ctd (✅ Available)
- Gate-H: action_plans table (⏳ Pending Q2 2025)

Next Steps:
1. Implement Data Contracts metadata table (schema registry)
2. Build Gate-K Integration Layer (Edge Functions to consume contracts)
3. Create DQ monitoring Edge Function (hourly checks)
4. Set up Slack/Email alerts for contract violations
5. Document API endpoints for each contract (OpenAPI specs)
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-15  
**Owner**: Gate-K — Continuous Improvement Analytics Team  
**Status**: Approved for Implementation  
**Classification**: Internal — Data Governance

---

## ملاحق (Appendices)

### Appendix A: Data Contract Metadata Schema

```sql
-- Table to track all data contracts
CREATE TABLE public.data_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_name TEXT NOT NULL UNIQUE, -- e.g., "Gate-I: Campaign KPIs"
  source_gate TEXT NOT NULL, -- Gate-I, Gate-J, Gate-F, Gate-H
  source_table TEXT NOT NULL, -- Table/View name
  owner_team TEXT NOT NULL, -- e.g., "Awareness Analytics Team"
  owner_email TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE, -- NULL = active
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  schema_definition JSONB NOT NULL, -- JSON schema of fields
  freshness_sla TEXT, -- e.g., "daily by 02:00"
  quality_rules JSONB, -- DQ checks
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_data_contracts_active ON public.data_contracts(is_active) WHERE is_active = TRUE;
```

---

### Appendix B: Example Contract JSON

```json
{
  "contract_name": "Gate-I: Campaign KPIs",
  "source_gate": "Gate-I",
  "source_table": "mv_awareness_campaign_kpis",
  "owner_team": "Awareness Analytics Team",
  "owner_email": "awareness-team@romuz.sa",
  "version": 1,
  "effective_from": "2025-01-15",
  "schema_definition": {
    "fields": [
      {
        "name": "tenant_id",
        "type": "UUID",
        "nullable": false,
        "description": "Tenant identifier for RLS"
      },
      {
        "name": "campaign_id",
        "type": "UUID",
        "nullable": false,
        "description": "Campaign unique ID"
      },
      {
        "name": "completion_rate",
        "type": "NUMERIC(5,2)",
        "nullable": true,
        "range": [0, 100],
        "description": "Percentage of participants who completed"
      }
    ]
  },
  "freshness_sla": "daily by 02:00 Riyadh",
  "quality_rules": {
    "freshness_max_delay_hours": 6,
    "null_rate_threshold_pct": 5,
    "range_checks": [
      {"field": "completion_rate", "min": 0, "max": 100}
    ]
  },
  "notes": "Primary source for awareness engagement KPIs"
}
```

---

**End of Document**
