
# M14 — Data Warehouse & Benchmarking
**Version:** v1.0 • **Date:** 2025-11-08 • **Owner:** Senior Systems/Product Analyst  
**Context:** Romuz Cybersecurity Culture Platform — Sub-conversation continuation (multi-tenant SaaS, per-DB isolation).

---

## جدول المحتويات (Table of Contents)
1. [الغرض (Purpose)](#1-الغرض-purpose)
2. [نطاق الـMVP (Scope)](#2-نطاق-الـmvp-scope)
3. [العقود/التكاملات (Integration Contracts)](#3-العقودالتكاملات-integration-contracts)
4. [نموذج البيانات (High-Level Data Model)](#4-نموذج-البيانات-high-level-data-model)
5. [التدفقات (Data Flows & Pipelines)](#5-التدفقات-data-flows--pipelines)
6. [الحوكمة والأمن (Governance & Security)](#6-الحوكمة-والأمن-governance--security)
7. [معايير القبول (Acceptance Criteria)](#7-معايير-القبول-acceptance-criteria--أمثلة)
8. [تحسينات خفيفة (Quick Wins)](#8-تحسينات-خفيفة-quick-wins)
9. [المؤشرات (KPIs)](#9-kpis-warehouse--benchmark)
10. [قيود وافتراضات (Constraints & Assumptions)](#10-قيود-وافتراضات-constraints--assumptions)

---

## 1) الغرض (Purpose)
تأسيس **طبقة بيانات مؤسسية** تدعم التحليلات المتقدمة، مؤشرات الثقافة السيبرانية، والتقارير التنفيذية عبر **Data Warehouse** متعدد العملاء مع **Benchmarking** (اختياري/Opt-in) مجهول الهوية عبر القطاعات، لتمكين المقارنة الموضوعية (Peer Comparison) والتعلّم المؤسسي وتحسين القرارات.

## 2) نطاق الـMVP (Scope)
- **Warehouse Layers:** Staging → Curated (ODS) → Marts (Reporting Marts) لكل Tenant + Mart موحّد مجهول للقياس المقارن.
- **Sources (من M1–M13):** الهوية والمستخدمون، الحملات والتعلّم المصغّر، Culture KPIs، المحتوى والأدلة، Gamification، التكاملات (Entra/M365/Email/Slack)، التصعيد والمتابعة، التصيّد، التقارير، AI Insights، HRMS/JIT، Incident–Risk Bridge.
- **ETL/ELT Pipelines:** دفعات مجدولة (Batch) + Hooks للأحداث الحرجة (Near-Real-Time) لمقاييس فورية.
- **Semantic Layer:** تعريف موحّد للمقاييس (مثل: Completion Rate, Phish-prone %, TTP90, MTTR, Culture Index).
- **Benchmarking (Opt-in):** طبقة Aggregation مع إخفاء الهوية ودعم التصفية حسب **الحجم/القطاع/المنطقة**.
- **BI Outputs:** لوحات تنفيذية (Executive), لوحات تشغيليّة (Ops), وملفات Evidence جاهزة للتنزيل (M10).

## 3) العقود/التكاملات (Integration Contracts)
### 3.1 Data Contracts (Inbound)
- جداول معيارية لكل مصدر مع Schema Versioning و`_ingested_at`, `_source_tenant_id`, `_hash`.
- سياسة **Idempotent Upserts** باستخدام مفاتيح أعمال (business keys) + `surrogate keys`.

### 3.2 Event Bus (اختياري)
- أحداث مختارة `kpi.snapshot.created`, `campaign.completed`, `phishing.result.recorded`, `incident.closed` لالتقاط لقطات فورية.

### 3.3 Outbound/BI
- **SQL Views** معيارية للمؤشرات، و**Materialized Views** لزمن استجابة منخفض.
- **Exports:** CSV/Parquet آمن، و**Secure BI Connectors** (مثلاً Looker/Power BI/Tableau).

### 3.4 Benchmark Opt-in API
- نقطة تمكين/تعطيل، ونطاق المشاركة (كامل/جزئي/مؤشرات محددة).

## 4) نموذج البيانات (High-Level Data Model)
> **العزل:** لكل عميل قاعدة تشغيلية مستقلة (**per-DB isolation**)، ويُستخلص إلى Warehouse مع **Tenant Partitioning**.  
> **التحصين:** طبقة Benchmark منفصلة بهويات مجهّلة (Pseudonymization/Anonymization).

- **dim_tenant, dim_org_unit, dim_user (PII-safe)**
- **dim_time, dim_geo, dim_job, dim_channel (Email/Slack/M365)**
- **fact_campaign_delivery, fact_quiz_results, fact_policy_ack**
- **fact_gamification_points, fact_escalations**
- **fact_phishing_events (sent, opened, clicked, reported)**
- **fact_incidents, fact_risk_scores, fact_loss_events**
- **fact_onboarding (HR/JIT), fact_access_review**
- **kpi_snapshots** (Culture Index, E/L/B/P/C، MTTD/MTTR، TTP90، …)

## 5) التدفقات (Data Flows & Pipelines)
- **ELT Batch (Every 15–60 min):** استخلاص من قواعد التشغيل (per-DB) → Staging (raw) → Curated (cleansing/typing) → Marts.
- **Change Data Capture (CDC) خفيف:** على جداول حرجة (phishing, incidents, kpi_snapshots) لتقارير قريبة من الزمن الحقيقي.
- **Data Quality Gates:** فحوص completeness, uniqueness, referential integrity قبل نشر الـMarts.
- **Reconciliation Jobs:** مقارنة أعداد السجلات والمجاميع مع الأنظمة التشغيلية، وتسجيل الفروقات.
- **Benchmark Build:** تجميع مجهول + تصنيف Sector/Size/Region + نشر مؤشرات المقارنة.

## 6) الحوكمة والأمن (Governance & Security)
- **Data Classification:** تصنيف PII/Confidential/Restricted وحصرها في طبقات مأمونة.
- **Access Control:** مبدأ Least Privilege، فصل صلاحيات **Ops vs. Analysts**، و**RLS** على العروض (Views) الخاصة بكل Tenant.
- **Encryption:** تشفير في السكون والحركة، ومفاتيح إدارة مفصولة.
- **Anonymization & k-Anonymity:** تطبيق **Generalization/Noise** حيث يلزم قبل إدراج البيانات في طبقة Benchmark.
- **Lineage & Auditability:** تتبع مصادر الحقول عبر **Data Catalog/Lineage** وسِجل تغييرات Schema.
- **Retention:** سياسات احتفاظ مختلفة (تشغيلي vs. Warehouse) وتوافق قانوني (Right to be Forgotten عبر مفاتيح Surrogate مع De-reference).

## 7) معايير القبول (Acceptance Criteria — أمثلة)
- **AC-01 | Curated Freshness:**  
  *Given* تشغيل ELT كل 30 دقيقة، *Then* تكون Marts الحرجة محدثة خلال ≤ **35 دقيقة** مع مؤشّر Freshness ظاهر في الـBI.
- **AC-02 | DQ Gates:**  
  لا يُنشر أي Mart إذا فشل **≥ 1** فحص **Critical DQ** (uniqueness, referential integrity) وتُسجّل تذكرة تلقائيًا.
- **AC-03 | Benchmark Privacy:**  
  عند تمكين Benchmark، لا تحتوي طبقة المقارنة أي **PII**، وتُحترم **k-Anonymity ≥ 10** لكل بُعد تحليلي.
- **AC-04 | Semantic Consistency:**  
  المقاييس الموحّدة (Completion, Phish-prone %, TTP90) تُنتَج من **Semantic Layer** نفسها لجميع التقارير.
- **AC-05 | Tenant Isolation in BI:**  
  لا يمكن لمستخدم Tenant A رؤية بيانات Tenant B على أي View/Report (اختبارات RLS ناجحة).
- **AC-06 | Reconciliation:**  
  الفروقات بين التشغيلية وWarehouse ≤ **0.5%** لكل fact حرِج أو موثّقة مع سبب.

## 8) تحسينات خفيفة (Quick Wins)
- **One-Click Executive Board Pack:** توليد ملف PDF رُبع سنوي موحّد (KPI + Trends + Benchmarks).
- **Anomaly Radar:** تنبيهات إحصائية على تغيّرات غير اعتيادية (z-score/prophet) لمعدلات النقر على التصيد وإكمال الدورات.
- **Sector Templates:** حِزم مؤشرات جاهزة حسب قطاع (Finance, Gov, Legal).
- **Self-Service Data Dictionary:** كتالوج تفاعلي للمقاييس والجداول.

## 9) KPIs (Warehouse & Benchmark)
- **Pipeline Success Rate:** ≥ **99%** شهريًا.
- **Data Freshness (P95):** ≤ **40 دقيقة** للـMarts الحرجة.
- **DQ Pass Rate:** ≥ **98%** من اختبارات الجودة.
- **Benchmark Coverage:** ≥ **60%** من العملاء المفعّلين يشاركون Opt-in خلال 6 أشهر.
- **BI Adoption:** ≥ **70%** من الأدوار الإدارية تستخدم لوحة تنفيذية مرة أسبوعيًا على الأقل.

## 10) قيود وافتراضات (Constraints & Assumptions)
- **Compute/Storage على Google Cloud داخل السعودية** بما يتوافق مع سياسة العزل، مع إمكانية توسيع التخزين البارد (Cold Storage) للأدلة.
- **لا مشاركة في Benchmark إلا Opt-in** وبنطاق متّفق عليه تعاقديًا.
- **بداية بدون Streaming كامل**؛ NRT محدود على جداول حرجة فقط.
- **استقلالية Schema لكل إصدار:** ترحيلات (Migrations) محسوبة مع Backward-compatible Views عند الإمكان.
- **عدم الاعتماد على أداة BI محددة**؛ يجب دعم وصلات قياسية (JDBC/ODBC/Service Account).

---

**ملحوظة تنفيذية:** هذا الملف يلتزم بشخصية ودور المساعد (Senior Systems/Product Analyst) ونمط العمل: مراجعة → اعتماد → تصدير Markdown. وهو امتداد مباشر للموديولات السابقة (M1–M13)، ويركّز على التراصّ البياني، الحوكمة، ومؤشرات القياس المقارن.
