
# M19 — Executive Governance & Board Reporting (EGRC Alignment)
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
7. [معايير القبول (Acceptance Criteria)](#7-معايير-القبول-acceptance-criteria--أمثلة)
8. [تحسينات خفيفة (Quick Wins)](#8-تحسينات-خفيفة-quick-wins)
9. [المؤشرات (KPIs)](#9-kpis-executive-layer)
10. [قيود وافتراضات (Constraints & Assumptions)](#10-قيود-وافتراضات-constraints--assumptions)

---

## 1) الغرض (Purpose)
توفير طبقة حوكمة تنفيذية تربط أداء **الثقافة والتوعية السيبرانية** بنتائج الأعمال والمخاطر، عبر **لوحات وتقارير مجلس الإدارة** موحّدة، وسردٍ إداري (Narratives) قابل للتنفيذ، متوافق مع نماذج EGRC وبروفايلات الشهية للمخاطر (Risk Appetite Profiles).

## 2) نطاق الـMVP (Scope)
- **Executive Dashboards:** نظرة 1–3 صفحات (Quarterly/Monthly) تربط: Culture Index, Completion, Phish-prone%, Incidents, Control Effectiveness, Access Drift, DSR SLA.
- **Board Report Pack:** قالب تقرير مجلس جاهز (PDF/MD) مع ملخّص المخاطر العُليا، اتجاهات، توصيات، وخارطة قرارات.
- **Risk Appetite View:** حالة الالتزام بكل حدّ شهية (Green/Amber/Red) وتأثيره على الأولويات.
- **Narratives & Talking Points:** توليد سرد تنفيذي مختصر (Auto-generated via M11) قابل للتدقيق اليدوي.
- **Action Register:** تتبّع قرارات المجلس/اللجان ومسؤوليات التنفيذ (Owner, Due Date, Status).

## 3) العقود/التكاملات (Integration Contracts)
### 3.1 Inputs
- KPIs من M3، حملات M2/M9، أدلة وتقارير M10، مستودع البيانات M14، المخاطر/الحوادث M13، الخصوصية/الاحتفاظ M16، المراجعات M17، اختبارات الضوابط M18.

### 3.2 APIs (M15)
- `GET /v1/exec/kpis` لالتقاط المؤشرات الموحدة.
- `POST /v1/reports/board-pack` توليد حزمة مجلس (Async Job).
- Webhooks: `board.pack.ready`, `exec.action.updated`.

### 3.3 Data Contracts
- اتساق دلالي عبر **Semantic Layer** (M14) مع طوابع زمنية وخانات مصدر.

## 4) نموذج البيانات (High-Level Data Model)
> **per-DB isolation** لكل عميل + Marts تنفيذية للعرض فقط.

- **exec_kpis**: لقطة مجمّعة للمؤشرات الأساسية مع الأهداف/الحدود.
- **exec_rap_status**: حالة Risk Appetite لكل بُعد/مجال.
- **exec_board_actions**: سجل قرارات واجتماعات، مالك، تاريخ مستهدف، حالة.
- **exec_narratives**: نصوص سردية مُنشأة + نسخة مُراجعة بشرية.
- **exec_report_runs**: طلبات توليد التقارير، المخرجات، روابط الأدلة.
- **audit_logs**: أثر تدقيقي كامل لإصدارات التقارير والتعديلات.

## 5) التدفقات (Key Flows)
### F1 | KPI Consolidation
سحب KPIs من M14 → تحقق جودة → تجهيز عرض تنفيذي.

### F2 | Board Pack Generation
اختيار الفترة والنطاق → إنشاء PDF/MD مع جداول/رسوم → إرفاق روابط الأدلة (M10).

### F3 | Narrative Draft
توليد سرد آلي (M11) → مراجعة وتحرير → غلق الإصدار.

### F4 | Decision Tracking
تسجيل قرارات المجلس → إنشاء Actions مع ملاك ومواعيد → متابعة والتصعيد (M8).

### F5 | Appetite Breaches
كشف أي تجاوز → توصية تلقائية (Treatment/Control Test/Training Burst).

## 6) الحوكمة والأمن (Governance & Security)
- **RLS:** الوصول للّوحات/التقارير مقصور على الأدوار التنفيذية/اللجان.
- **PII Minimization:** عرض مجمّع (Aggregated) وخالٍ من PII افتراضيًا.
- **Watermark & Integrity:** ختم تقارير المجلس بطابع Integrity وCorrelation-ID.
- **Versioning:** كل إصدار تقرير يُؤرشف بإصدار فريد وقابل للاسترجاع.
- **Approval Workflow:** اعتماد إصدار التقرير قبل النشر الخارجي/المشاركة.

## 7) معايير القبول (Acceptance Criteria — أمثلة)
- **AC-01 | Consistent KPIs:** كل مؤشّر في التقرير يأتي من **Semantic Layer** وبنفس التعريف عبر اللوحات والتقارير.
- **AC-02 | Board Pack Ready:** إنشاء حزمة مجلس مكتملة ≤ **10 دقائق** مع روابط أدلة صالحة (TTL ≥ 15m) وأثر تدقيقي.
- **AC-03 | Appetite Signals:** أي تجاوز لحدّ شهية يُبرز بعلامة واضحة ويولد توصية آلية واحدة على الأقل.
- **AC-04 | Action Traceability:** 100% من قرارات المجلس لديها **Owner** و**Due Date** وتتبع حالة.
- **AC-05 | PII Guardrails:** التقارير التنفيذية خالية من PII ما لم يُصرّح دورياً وبحد أدنى.

## 8) تحسينات خفيفة (Quick Wins)
- **One-Page Executive Snapshot** قابل للطباعة والمشاركة.
- **Quarterly Trends Strip**: شريط اتجاهات مختصر (12 شهرًا) لكل KPI أساسي.
- **What-Changed Indicator** بين إصدارين متتالين.
- **Scenario Cards**: بطاقات “ماذا لو” (رفع/خفض شهية، زيادة تدريب، اختبار ضوابط إضافي).

## 9) KPIs (Executive Layer)
- **Report Timeliness:** نسبة التقارير المسلّمة ضمن الوقت ≥ **95%**.
- **Action Closure (on-time):** ≥ **90%** خلال الربع.
- **Appetite Breach Mean-Time-to-Action:** ≤ **5 أيام**.
- **Narrative Approval Cycle:** ≤ **2 أيام** للإصدار.
- **Stakeholder Adoption:** ≥ **80%** من اللجنة تفتح اللوحة شهريًا.

## 10) قيود وافتراضات (Constraints & Assumptions)
- الاعتماد على **M14** للمجاميع والدلالات، و**M10** للأدلة، و**M11** للسرد الآلي.
- النشر على **Google Cloud (KSA)** مع **per-DB isolation**.
- التصدير الافتراضي PDF/MD؛ دعم PowerPoint لاحقًا إن لزم.
- لا مشاركة خارجية إلا وفق سياسات الخصوصية M16 وواجهات M15.

---

**ملحوظة تنفيذية:** هذا الملف يلتزم بشخصية ودور المساعد (Senior Systems/Product Analyst) ونمط العمل: مراجعة → اعتماد → تصدير Markdown. وهو امتداد مباشر للموديولات السابقة (M1–M18)، ويركّز على الحوكمة التنفيذية وربط المؤشرات بقرارات المجلس.
