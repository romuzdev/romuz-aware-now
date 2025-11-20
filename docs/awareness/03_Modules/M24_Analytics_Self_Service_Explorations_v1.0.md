
# M24 — Analytics Self-Service & Explorations (Semantic Layer)
**Version:** v1.0 • **Date:** 2025-11-08 • **Owner:** Senior Systems/Product Analyst  
**Context:** Romuz Cybersecurity Culture Platform — Sub-conversation continuation (multi-tenant SaaS, per-DB isolation).

---

## جدول المحتويات (Table of Contents)
1. [الغرض (Purpose)](#1-الغرض-purpose)
2. [نطاق الـMVP (Scope)](#2-نطاق-الـmvp-scope)
3. [العقود/التكاملات (Integration Contracts)](#3-العقودالتكاملات-integration-contracts)
4. [نموذج البيانات (High-Level Data Model)](#4-نموذج-البيانات-high-level-data-model)
5. [التدفقات (Key Flows)](#5-التدفقات-key-flows)
6. [الحوكمة والأمن (Governance & Security)](#6-الحوكمة-والأمن-governance--security)
7. [معايير القبول (Acceptance Criteria)](#7-معايير-القبول-acceptance-criteria)
8. [تحسينات خفيفة (Quick Wins)](#8-تحسينات-خفيفة-quick-wins)
9. [المؤشرات (KPIs)](#9-kpis)
10. [قيود وافتراضات (Constraints & Assumptions)](#10-قيود-وافتراضات-constraints--assumptions)

---

## 1) الغرض (Purpose)
تمكين الفرق غير التقنية من التحليل الذاتي على طبقة **Semantic Layer** (M14) عبر **Explorations** جاهزة وحفظ/مشاركة آمنة، مع اتساق كامل للمقاييس مع تقارير المجلس (M19).

## 2) نطاق الـMVP (Scope)
- **Explorations جاهزة (5 عدسات):** Culture, Campaigns, Phishing, Incidents, Controls.
- **Builder مبسّط:** اختيار المقاييس/الأبعاد، فلاتر، تجميعات، حفظ الاستعلام.
- **مشاركة آمنة:** مشاركة الاستكشاف مع أدوار محددة (Viewer/Manager/Exec).
- **Data Quality Gates:** تنبيهات Freshness/Nulls/Duplicates على جداول KPIs.
- **Exports:** CSV/MD (بدون PII افتراضيًا) وروابط مؤقتة.

## 3) العقود/التكاملات (Integration Contracts)
### 3.1 Inputs
- مستودع البيانات + Semantic Views من **M14**، مؤشرات من M3/M10/M18/M17.

### 3.2 APIs (M15)
- `POST /v1/analytics/explorations` إنشاء/تعديل.
- `POST /v1/analytics/explorations/run` تشغيل.
- `POST /v1/analytics/explorations/share` مشاركة.
- Webhooks: `analytics.exploration.shared`, `analytics.dq.alert`.

### 3.3 Outbound → M19
- لقطات KPIs/Charts للتقارير التنفيذية.

## 4) نموذج البيانات (High-Level Data Model)
> **per-DB isolation** لكل عميل + Views دلالية للقراءة فقط.

- **analytics_explorations** `{id, title, owner_id, scope, definition(json), created_at, updated_at}`
- **analytics_shares** `{exploration_id, role, org_unit?, expires_at}`
- **analytics_runs** `{id, exploration_id, started_at, finished_at, row_count, status}`
- **dq_alerts** `{id, source_table, type, detected_at, severity, resolved_at}`

## 5) التدفقات (Key Flows)
### F1 | Build & Save
اختيار عدسة → إضافة مقاييس/أبعاد/فلاتر → حفظ.

### F2 | Run & Visualize
تنفيذ سريع مع Paging وحدود حجم آمنة.

### F3 | Share
مشاركة مع دور/فريق، صلاحيات قراءة فقط.

### F4 | Export
تصدير CSV/MD بدون PII افتراضيًا.

### F5 | DQ Alerts
رصد Freshness/Nulls وإشعارات للمالكين.

## 6) الحوكمة والأمن (Governance & Security)
- **RLS/RBAC:** تطبيق كامل على الاستكشافات والنتائج.
- **PII Redaction:** افتراضيًا بلا حقول حساسة؛ يحتاج صلاحية خاصة لرفع الحساسية.
- **Rate Limits & Timeouts:** حماية من الاستعلامات الثقيلة.
- **Auditability:** كل Run/Share/Export مسجّل في audit_logs.
- **Lineage:** مرجع الجدول/القياس إلى Semantic Definition (Appendices-B/S).

## 7) معايير القبول (Acceptance Criteria)
- **AC-01 | Consistency:** تطابق 100% لتعريفات KPIs مع Semantic Layer عبر اختبار مرجعي.
- **AC-02 | RLS:** نتائج الاستكشاف لا تُظهر بيانات خارج نطاق الدور/الوحدة.
- **AC-03 | Performance:** P95 لتنفيذ الاستكشاف ≤ **2.5s** على عينات قياسية، مع حدود صفوف افتراضية.
- **AC-04 | DQ Alerts:** إنذار يُرسل عند Freshness>SLAs أو Nulls>Threshold.
- **AC-05 | Safe Exports:** التصدير بدون PII افتراضيًا وبروابط مؤقتة.

## 8) تحسينات خفيفة (Quick Wins)
- **Starter Views:** Explorations جاهزة بقوالب أسئلة شائعة.
- **Chart Presets:** خطوط/أعمدة/مؤشرات جاهزة لكل عدسة.
- **Bookmark Filters:** حفظ مجموعات فلاتر للأقسام/الأطر.
- **Explain KPI:** لوحة تعريف القياس وسياقه (من Appendices-S).

## 9) KPIs
- **Explorations Adoption (30d):** ≥ **60%** من الأدوار المستهدفة استخدمت على الأقل استكشافًا واحدًا.
- **DQ Incidents MTTR:** ≤ **24h** لإغلاق تنبيه جودة البيانات.
- **Export Safety:** 0 حوادث تسريب PII عبر التصدير.
- **P95 Run Time:** ≤ **2.5s**.

## 10) قيود وافتراضات
- المصدر الوحيد للمقاييس: **Semantic Layer (M14)**.
- لا تحرير مباشر للجداول؛ كل شيء عبر Views.
- التصدير النصي أولًا؛ صور/شرائح لاحقًا عند الحاجة.
- التنفيذ على الويب مع دعم RTL وWCAG.

---

**ملاحظة تنفيذية:** هذا الملف يلتزم بنمط العمل (مراجعة → اعتماد → تصدير Markdown) ويمكّن التحليلات الذاتية المتسقة مع طبقة الدلالات والتقارير التنفيذية.
