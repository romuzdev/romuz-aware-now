
# Appendix I — Compliance Calendar & Audit Readiness Snapshot
**Version:** v1.0 • **Date:** 2025-11-08 • **Owner:** Senior Systems/Product Analyst  
**Context:** Romuz Cybersecurity Culture Platform — Sub-conversation continuation (multi-tenant SaaS, per-DB isolation).  
**Relates To:** M21 (Calendar & Snapshot), M10 (Evidence), M14 (Semantic Layer), M17 (Access Reviews), M18 (Control Tests), M19 (Board Pack).

---

## جدول المحتويات (Table of Contents)
1. [نظرة عامة (Overview)](#1-نظرة-عامة-overview)
2. [أنواع عناصر التقويم (Calendar Item Types)](#2-أنواع-عناصر-التقويم-calendar-item-types)
3. [نموذج البيانات (Data Model)](#3-نموذج-البيانات-data-model)
4. [توليد Pre-Audit Snapshot](#4-توليد-pre-audit-snapshot)
5. [واجهات API & Webhooks](#5-واجهات-api--webhooks)
6. [جودة البيانات (DQ Gates)](#6-جودة-البيانات-dq-gates)
7. [الأمن والحوكمة (RLS/RBAC/Privacy)](#7-الأمن-والحوكمة-rlsrbacprivacy)
8. [قوالب وقوائم التحقق (Templates & Checklists)](#8-قوالب-وقوائم-التحقق-templates--checklists)
9. [معايير القبول (AC) وKPIs](#9-معايير-القبول-ac-وkpis)
10. [RACI & SLAs](#10-raci--slas)
11. [أمثلة عملية (Samples)](#11-أمثلة-عملية-samples)
12. [قيود/افتراضات](#12-قيودافتراضات)

---

## 1) نظرة عامة (Overview)
ملحق عملياتي يحدّد **معايير التقويم الامتثالي** وآلية إعداد **Pre-Audit Snapshot**، ويضمن اتساق التعاريف عبر طبقة **Semantic Layer (M14)** وربط كل عنصر بدليل قابل للتحقّق (M10) واختبارات ضوابط (M18) ومراجعات وصول (M17).

---

## 2) أنواع عناصر التقويم (Calendar Item Types)
| الرمز | النوع | الدورية المقترحة | المصدر | الدليل (Evidence) |
|---|---|---|---|---|
| CT | Controls Testing (M18) | شهري/ربع سنوي | sem.controls_tests_v1 | تقرير اختبار الضوابط + hash/timestamp |
| AR | Access Reviews (M17) | ربع سنوي | sem.access_reviews_v1 | تقرير المراجعة + اعتمادات |
| PH | Phishing/Campaigns (M2/M9) | شهري | sem.campaigns_v1 | نتائج الحملة + manifest |
| BP | Board Pack (M19) | شهري/ربع سنوي | sem.exec_reports_v1 | نسخة التقرير + Integrity Stamp |
| PR | Privacy/Retention (M16) | نصف سنوي | sem.privacy_checks_v1 | Matrix تحديث + استثناءات Legal Hold |
| IR | Incidents RCA (M13) | حسب الحاجة | sem.incidents_v1 | RCA & Evidence Pack |
| EV | Evidence Freshness Sweep | شهري | sem.evidence_freshness_v1 | قائمة الأدلة المنتهية/القريبة |

> يمكن إضافة عناصر يدوية (Manual) مع نفس الحقول القياسية.

---

## 3) نموذج البيانات (Data Model)
> **per-DB isolation** لكل عميل + تطبيق RLS على مستوى المستأجر/الوحدة.

### 3.1 الجداول الأساسية
- **compliance_calendar_items**  
  `{id, tenant_id, type, framework, title, owner_id, org_unit, due_at, status, evidence_ref, last_verified_at, sla_days, created_at}`

- **audit_checklists**  
  `{id, tenant_id, name, framework, period, items(jsonb), owner_id, created_at}`

- **audit_snapshots**  
  `{id, tenant_id, period, scope, status(draft/running/ready/failed), artifact_url, evidence_index(jsonb), created_by, created_at}`

### 3.2 Views (Semantic Layer)
```sql
CREATE VIEW sem.calendar_items_v1 AS
SELECT i.tenant_id, i.type, i.framework, i.title, i.owner_id, i.org_unit,
       i.due_at, i.status, i.evidence_ref, i.last_verified_at, i.sla_days
FROM compliance_calendar_items i;
```
```sql
CREATE VIEW sem.audit_readiness_v1 AS
SELECT s.tenant_id, s.period, s.status, jsonb_array_length(s.evidence_index) AS evidence_count
FROM audit_snapshots s;
```

---

## 4) توليد Pre-Audit Snapshot
**خطوات العمل:**
1) **Collect:** سحب مؤشرات من M14 (KPIs/Views) + روابط أدلة من M10 + نتائج M18/M17.  
2) **Assemble:** إنشاء **evidence_index** يتضمن `{item_id, path, hash, timestamp, verifier}`.  
3) **Render:** إنتاج **PDF/MD** موقّع مع **Correlation-ID** وWatermark.  
4) **Publish:** تخزين `artifact_url` وتفعيل **Webhook** `audit.snapshot.ready` بروابط تنزيل مؤقتة (TTL).

**معايير السلامة:** حذف تلقائي للنسخ المؤقتة بعد TTL، وفرض Redaction حسب M16.

---

## 5) واجهات API & Webhooks
### 5.1 APIs
- `GET /v1/compliance/calendar?period=2025-Q1&status=at-risk`  
- `POST /v1/audit/checklists` (إنشاء/تحديث قالب)  
- `POST /v1/audit/snapshot {period, scope}` → يرجع `{snapshot_id}`  
- `GET /v1/audit/snapshot/{id}` → حالة/روابط

### 5.2 Webhook (HMAC)
```text
X-Romuz-Signature: t={timestamp},v1={hex(hmac_sha256(secret, timestamp+"."+body))}
Event: audit.snapshot.ready
Payload: { "tenant_id": "t_123", "snapshot_id": "S-2025Q1", "artifact_url": "..." }
```

---

## 6) جودة البيانات (DQ Gates)
- **Freshness:** KPIs محدثة ضمن SLA (مثلاً 24h للحملات، 7d للاختبارات).  
- **Completeness:** لا عناصر بدون Owner/Due/Evidence.  
- **Uniqueness:** عدم تكرار عناصر لنفس `type+period+org_unit`.  
- **Integrity:** تطابق `hash/timestamp` للأدلة مع **manifest** (M10).  
- **Alerts:** إنشاء سجل `dq_alerts` وإشعار المالك (M24/M8).

---

## 7) الأمن والحوكمة (RLS/RBAC/Privacy)
- **RLS:** تصفية حسب `tenant_id` + `org_unit`.  
- **RBAC:** أدوار (Compliance Lead/Reviewer/Exec/Viewer).  
- **Privacy:** تصدير بدون PII افتراضيًا؛ تتطلب صلاحية مخصصة لعرض التفاصيل الاسمية.  
- **Audit Logs:** مسار كامل لتغييرات العناصر واللقطات.  
- **Retention:** اتباع مصفوفة M16 (حذف/أرشفة/Legal Hold).

---

## 8) قوالب وقوائم التحقق (Templates & Checklists)
**بنية عنصر Checklist:**
```json
{
  "item_id": "AR-REV-Q1-01",
  "definition": "Quarterly Access Review for Finance",
  "evidence_required": ["review_report.pdf", "approvals.csv"],
  "verification_method": "sample-10pct + dual-approval",
  "acceptance_criteria": "0 critical exceptions; <3% minor exceptions",
  "owner_role": "Finance Manager"
}
```

**CSV Template — Calendar Import:**
```csv
type,framework,title,owner_email,org_unit,due_at,sla_days
AR,ISO27001,Quarterly Access Review,manager@corp.sa,Finance,2025-03-31,7
CT,ISO27001,Controls Testing - Backup Restore,secops@corp.sa,IT,2025-02-15,5
```

---

## 9) معايير القبول (AC) وKPIs
**AC:**
1) كل عنصر تقويم يحتوي Owner/Due/Evidence/Last-Verified.  
2) إنشاء Snapshot مكتمل ≤ **10 دقائق** مع فهرس أدلة قابل للتتبّع.  
3) اتساق كامل للمؤشرات مع **Semantic Layer**.  
4) تصعيد **Overdue > 48h** عبر M8.

**KPIs:**
- **Audit Snapshot Time:** ≤ 10m  
- **Evidence Freshness:** ≥ 95%  
- **Coverage:** ≥ 90% من عناصر الإطار لكل فترة  
- **Overdue Trend:** انخفاض أسبوعي مستمر

---

## 10) RACI & SLAs
**RACI (مختصر):**
- **Responsible:** Compliance Lead / SecOps (حسب النوع)  
- **Accountable:** Program Owner  
- **Consulted:** Data Eng / Legal / HR  
- **Informed:** Executives

**SLAs (أمثلة):**
| النوع | إنشاء عنصر | التحقّق من الدليل | إغلاق المتأخر |
|---|---|---|---|
| AR | ≤ 2d | ≤ 5d | ≤ 48h |
| CT | ≤ 2d | ≤ 3d | ≤ 48h |
| PH | ≤ 1d | ≤ 2d | ≤ 24h |
| BP | ≤ 1d | ≤ 1d | ≤ 24h |

---

## 11) أمثلة عملية (Samples)
**Digest Email (أسبوعي):**
```
Subject: Compliance Calendar Digest — {period} ({tenant})
Ready: {n_ready} | At-Risk: {n_risk} | Overdue: {n_overdue}
Top Actions:
- {title1} ({owner}) due {due1} → Evidence: {e1}
- {title2} ({owner}) due {due2} → Evidence: {e2}
```

**Policy for Escalation:**
- يوم 0: إشعار المالك.  
- يوم +2: إشعار مدير الخط.  
- يوم +3: إدراج في تقرير التنفيذيين (M19) + تنبيه High.

---

## 12) قيود/افتراضات
- المصدر الوحيد للمقاييس: **Semantic Layer (M14)**.  
- التصدير بدون PII افتراضيًا.  
- الروابط مؤقتة مع TTL وسياسة إعادة توليد.  
- التنفيذ Web-first مع دعم RTL وWCAG.

---

**ملاحظة تنفيذية:** هذا الملحق يوفّر مرجعًا عملياتيًا لتشغيل التقويم والجاهزية للتدقيق، ويُستخدم كمكمّل مباشر لـ M21 لضمان اتساق القياسات والأدلة وسياسات الخصوصية.
