
# M16 — Privacy, Retention & Legal Holds (Phase 3)
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
9. [المؤشرات (KPIs)](#9-kpis)
10. [قيود وافتراضات (Constraints & Assumptions)](#10-قيود-وافتراضات-constraints--assumptions)

---

## 1) الغرض (Purpose)
تأسيس طبقة حوكمة خصوصية موحّدة تضبط **تصنيف البيانات، سياسات الاحتفاظ (Retention), حقوق أصحاب البيانات (DSRs), الإخفاء/التنقيح (Redaction/Anonymization), والتجميد القانوني (Legal Hold)** عبر كل الموديولات (M1–M15) مع أثر تدقيقي قوي وامتثال لأنظمة KSA (PDPL) ومعايير عالمية.

## 2) نطاق الـMVP (Scope)
- **Data Classification** على مستوى الحقول والجداول (PII/Confidential/Restricted/Public) مع ملصقات (Tags).
- **Retention Policies** على الكيانات الحرجة: incidents, evidence, phishing, training records, HR/JIT, audit_logs.
- **DSRs (Data Subject Requests)**: طلبات **Access / Rectification / Erasure** قابلة للتتبع والموافقة.
- **Redaction & Anonymization**: تنقيح حقول حساسة في الاستعلامات/التقارير و**Anonymized Views** للـBenchmark (تكامل مع M14).
- **Legal Hold**: تعليق سياسات الحذف لِسجلات محددة مع سبب ومالك وفترة.
- **Consent Registry (خفيف)**: تتبّع أساس المعالجة (lawful basis) وإثبات الموافقة حيث يلزم.

## 3) العقود/التكاملات (Integration Contracts)
### 3.1 Policy Registry API
- `POST /v1/privacy/policies` تعريف/تحديث سياسة احتفاظ/تصنيف.
- `POST /v1/privacy/legal-holds` إنشاء/رفع التجميد القانوني.
- `POST /v1/privacy/dsrs` تسجيل طلبات الأفراد وتتبع حالتها.

### 3.2 Execution Engine
- Jobs مجدولة للحذف/الطمس/الأرشفة مع **Dry-Run** وتقرير تأثير.

### 3.3 Events/Webhooks
- `privacy.retention.executed`, `privacy.legal_hold.enforced`, `privacy.dsr.updated`.

## 4) نموذج البيانات (High-Level Data Model)
> **per-DB isolation** لكل عميل + طبقة سياسات مركزية داخل نفس قاعدة العميل.

- **privacy_policies**: نوع السياسة (retention/classification/redaction), النطاق (entity/field), المدد، الاستثناءات.
- **privacy_legal_holds**: الهدف (entity/id range/query), السبب، الفترة، المالك، حالة التفعيل.
- **privacy_dsrs**: نوع الطلب، صاحب البيانات (user/employee), المدى، المهل الزمنية، القرارات، الأدلة.
- **privacy_executions**: سجلات تنفيذ الحذف/الطمس/الأرشفة (قبل/بعد/نتائج/أخطاء).
- **privacy_consents** (اختياري): نوع الموافقة، القناة، الطابع الزمني، المصدر.
- **privacy_catalog**: خريطة الحقول الحساسة وروابط lineage (تكامل مع M14).

## 5) التدفقات (Key Flows)
### F1 | Retention Enforcement
1) جدولة يومية تفحص السياسات الفعّالة →  
2) تحديد السجلات المؤهلة للحذف/الطمس (باستثناء Legal Hold) →  
3) **Dry-Run Report** (عدد السجلات/الكيانات) → موافقة مالك البيانات → تنفيذ آمن مع أثر تدقيقي.

### F2 | Legal Hold
إنشاء تجميد قانوني على incident/evidence/risks وفق تحقيق جاري → يمنع أي حذف/طمس حتى الرفع.

### F3 | DSR — Access/Erasure
استقبال الطلب → التحقق من الهوية/الصلاحية → تجميع البيانات من الجداول ذات الصلة → توليد حزمة **Access Package** أو تنفيذ محو انتقائي مع استثناءات قانونية موثّقة.

### F4 | Redaction in Reports
تطبيق قواعد تنقيح على العروض/التصدير (M10/M14/M15) حسب الدور والنطاق.

## 6) الحوكمة والأمن (Governance & Security)
- **RLS + Field-Level Security** للحقول الحساسة.
- **Key Management** منفصل لأعمدة مشفّرة (PII) مع تدوير مفاتيح دوري.
- **Tamper-evident Auditing** لكل تغييرات السياسات والتنفيذ (hash chain).
- **Dual Control** لعمليات المحو الجماعي (يتطلب موافَقتين).
- **Policy Exceptions** موثّقة بزمن محدد وموافقة مسؤول الامتثال.
- **Localization/Regulatory Profiles**: قوالب سياسات حسب القطاع/الدولة، مع تنبيهات عدم التوافق.

## 7) معايير القبول (Acceptance Criteria — أمثلة)
- **AC-01 | Retention Execution Safety**
  تشغيل **Dry-Run** يُظهر عدد السجلات المتأثرة، ولا يسمح بالحذف دون موافقة مالك البيانات + عدم وجود Legal Hold نشط.
- **AC-02 | Legal Hold Precedence**
  عند وجود Legal Hold على سجل، تُمنع عمليات الحذف/الطمس وتُسجّل محاولة التنفيذ المرفوضة.
- **AC-03 | DSR Timelines**
  تلبية طلب وصول (Access) خلال ≤ **15 يومًا** وطلب محو خلال ≤ **30 يومًا** أو مبرّر تمديد.
- **AC-04 | Redaction Enforcement**
  التصدير عبر API/Reports يحترم قواعد التنقيح حسب الدور، وتُرفَض الطلبات المخالفة.
- **AC-05 | Audit Completeness**
  جميع عمليات المحو/التنقيح/الاحتفاظ تولّد سجلًا قابلًا للتدقيق مع `who/when/what/why`.

## 8) تحسينات خفيفة (Quick Wins)
- **Retention Starter Kits** لقوالب جاهزة (Incidents/Evidence/Phishing/Training).
- **DSR Wizard** موجّه بخطوات بديهية ومدد SLA مرئية.
- **One-Click Redact** في واجهات البحث/التقارير لحقل حساس محدد.
- **Policy Drift Alerts** عند اختلاف التطبيق الفعلي عن السياسة المعلنة.

## 9) KPIs
- **DSR SLA Compliance:** ≥ **95%** ضمن المهل.
- **Retention Execution Success:** ≥ **99%** jobs بلا أخطاء حرجة.
- **Redaction Coverage:** ≥ **98%** من التقارير/التصدير الحسّاس خاضعة لقواعد التنقيح.
- **Legal Hold Integrity:** 0 حالات حذف مخالفة أثناء التجميد.
- **Policy Drift Rate:** ≤ **1%** شهريًا.

## 10) قيود وافتراضات (Constraints & Assumptions)
- التنفيذ على **Google Cloud (KSA)** مع **per-DB isolation**.
- التكامل مع **M14** للـCatalog/Lineage وطبقة الـBenchmark المجهّلة.
- اعتماد **M15** لتفعيل واجهات DSR/Retention API وWebhooks.
- لا حذف لسجلات **audit_logs**، فقط أرشفة باردة بعد المدة القانونية.
- يبدأ التطبيق تدريجيًا على الجداول الأكثر حساسية ثم التوسعة.

---

**ملحوظة تنفيذية:** هذا الملف يلتزم بشخصية ودور المساعد (Senior Systems/Product Analyst) ونمط العمل: مراجعة → اعتماد → تصدير Markdown. وهو امتداد مباشر للموديولات السابقة (M1–M15) ويركّز على الخصوصية والامتثال عبر المنصّة.
