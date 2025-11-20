
# M20 — Vendor Risk & Awareness Exchange (Third Parties)
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
9. [المؤشرات (KPIs)](#9-kpis-vendor--awareness)
10. [قيود وافتراضات (Constraints & Assumptions)](#10-قيود-وافتراضات-constraints--assumptions)

---

## 1) الغرض (Purpose)
إدارة مخاطر المورّدين (Third Parties) وربطها مباشرةً بثقافة الأمن السيبراني والامتثال عبر: سجل مورّدين موحّد، تقييمات خفيفة للمخاطر/الضوابط، تتبّع التزامات التوعية (Awareness Obligations)، تبادل أدلة (Evidence Exchange)، وتنبيهات تغيّر المخاطر—مع تكامل وثيق مع M13 (Incident↔Risk) وM14 (Warehouse) وM15 (APIs/Webhooks).

## 2) نطاق الـMVP (Scope)
- **Vendor Registry:** ملفات مورّدين + تصنيف حرجية (Criticality) + مجالات الخدمة + بيانات التعاقد الأساسية.
- **Light VRM Assessments:** استبيانات قصيرة حسب الفئة (Email Security, Awareness, Access, Incident Handling).
- **Obligations Tracking:** التزامات تعاقدية: تدريب موظفي المورّد، إقرار سياسات، زمن إشعار الحوادث (X ساعات).
- **Evidence Exchange:** رفع/طلب أدلة (تقارير تدريب، نتائج تصيّد، شهادات، سياسات).
- **Risk Scoring:** درجة مخاطرة المورد (Inherent/Residual) + عوامل: نتائج تقييم/حوادث/أدلة مفقودة.
- **Awareness Link:** ربط مؤشرات المورّد بثقافة المؤسسة (Culture Index Extensions).

## 3) العقود/التكاملات (Integration Contracts)
### 3.1 Inbound
- Imports CSV/JSON للمورّدين والعقود.
- API (M15): `POST /v1/vendors`, `/v1/vendors/assessments`, `/v1/vendors/evidence`.

### 3.2 Outbound/Webhooks
- `vendor.assessment.requested`, `vendor.evidence.submitted`, `vendor.breach.notified`, `vendor.risk.updated`.

### 3.3 Data Contracts
- **Vendor**: `{id, name, tier, criticality, services[], contact, contract_refs[], dpa?}`
- **Assessment**: `{template_id, status, score, gaps[], due_date}`
- **Obligation**: `{type, metric, target, due, status}`
- **Evidence**: `{type, file_ref/hash, issued_at, expires_at, verifier}`

## 4) نموذج البيانات (High-Level Data Model)
> **per-DB isolation** لكل عميل.

- **vendors**: تعريف المورّد، التصنيف، نقاط الاتصال، القطاعات.
- **vendor_contracts**: معلومات أساسية، SLAs، بنود أمن/خصوصية.
- **vendor_obligations**: التزامات التوعية/الأمن مع الأهداف والمواعيد.
- **vendor_assessment_templates**: قوالب مختصرة حسب الفئة.
- **vendor_assessments**: نتائج الاستبيانات، الدرجات، الفجوات.
- **vendor_evidence**: أدلة مرفوعة، تجزئة/ختم زمني.
- **vendor_risk_scores**: inherent/residual + عوامل.
- **vendor_incident_links**: ربط حوادث المورد بـ M13.
- **kpi_snapshots**: مؤشرات أداء الموردين/الالتزامات.
- **audit_logs**: أثر تدقيقي كامل.

## 5) التدفقات (Key Flows)
### F1 | Onboard Vendor
إضافة مورّد → تصنيف Criticality/Tier → تعيين التزامات/قالب تقييم.

### F2 | Assessment
إرسال استبيان مختصر → استلام نتائج/أدلة → حساب درجة المخاطر وتوليد فجوات (Gaps).

### F3 | Evidence Exchange
طلب أدلة (تدريب، تقارير تصيّد) → رفع وتحقق توقيع/تجزئة → قبول/رفض.

### F4 | Incident Notification
إشعار من المورّد (Webhook/API/Email) → فتح رابط Incident في M13 + تحديث المخاطر + تنبيه تنفيذي.

### F5 | Obligation Monitoring
تتبّع حالة التزامات الوعي (مثلاً ≥90% تدريب سنوي) مع تصعيد آلي (M8) عند التعثر.

## 6) الحوكمة والأمن (Governance & Security)
- **RLS:** فصل بيانات المورّدين لكل عميل وأدوار محددة (Procurement/Legal/Security).
- **Third-Party Access:** بوابة خارجية آمنة (optional) أو تبادل عبر API موقّع + روابط رفع قصيرة الأجل.
- **PII/Confidential Handling:** تنقيح تلقائي للحقول الحساسة في المستندات؛ الالتزام بـ M16 (Retention/Legal Holds).
- **Tamper-evident Evidence:** تجزئة/ختم زمني وسلسلة تجزئة لمستندات المورد.
- **Conflict & Independence:** منع المورد من اعتماد أدلته دون مراجعة داخلية.

## 7) معايير القبول (Acceptance Criteria — أمثلة)
- **AC-01 | Assessment Turnaround:** ≥ **90%** من الاستبيانات تُختم خلال ≤ **14 يومًا** من الإرسال.
- **AC-02 | Evidence Verifiability:** كل دليل يحتوي `hash + timestamp` وقابل للتحقق.
- **AC-03 | Risk Update:** تغيير شديد (High Gap/Incident) يحدّث **Residual Score** ويُصدر تنبيهًا خلال ≤ **1h**.
- **AC-04 | Obligation Compliance:** يمكن إثبات تحقيق التزامات الوعي (نسبة تدريب/إقرارات) أو يُرفع تصعيد تلقائي.
- **AC-05 | Incident Linkage:** حوادث المورد تُسجّل وتُربط بـ M13 مع أثر على شهية المخاطر (M19 view).
- **AC-06 | BI Consistency:** مؤشرات المورد تظهر في لوحات M14/M19 من نفس **Semantic Layer**.

## 8) تحسينات خفيفة (Quick Wins)
- **Starter Vendor Kits:** قوالب تقييم/التزامات جاهزة حسب الفئة (SaaS Email, MSP, SOC-as-a-Service).
- **One-Click Reminder:** تذكير آلي للمورّدين المتأخرين مع رابط رفع آمن.
- **Score Explainability:** بطاقة توضح أسباب الدرجة وتأثير كل عامل.
- **Shared Evidence Vault:** نافذة مشاركة آمنة تنتهي صلاحيتها تلقائيًا.

## 9) KPIs (Vendor & Awareness)
- **Assessment Completion (on-time):** ≥ **90%**.
- **Evidence Freshness:** ≥ **95%** من الأدلة ضمن فترة الصلاحية.
- **Residual Risk Reduction (Q/Q):** تحسّن ≥ **10%** للمورّدين الحرجين.
- **Obligation Adherence:** ≥ **90%** للالتزامات الحرجة (تدريب/إقرارات).
- **Vendor Incident MTTA:** ≤ **4 ساعات** للاستلام والتسجيل.

## 10) قيود وافتراضات (Constraints & Assumptions)
- لا تكامل عميق GRC خارجي في الـMVP؛ يتم عبر Imports/APIs (M15).
- بوابة المورّدين اختيارية في البداية؛ يمكن الاكتفاء بروابط رفع/ويبهوك.
- تشغيل على **Google Cloud (KSA)** مع **per-DB isolation**.
- احترام سياسات الخصوصية والاحتفاظ M16، وربط المخاطر M13، والتقارير M10/M14/M19.

---

**ملحوظة تنفيذية:** هذا الملف يلتزم بشخصية ودور المساعد (Senior Systems/Product Analyst) ونمط العمل: مراجعة → اعتماد → تصدير Markdown. وهو امتداد مباشر للموديولات السابقة (M1–M19) ويركّز على مورّدين الطرف الثالث والتكامل مع حلقات الوعي والمخاطر.
