
# M25 — Tenant Success Toolkit (Playbooks, Health Scores, Setup Wizard)
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
رفع سرعة التفعيل (Time-to-Value) وجودة التبنّي لكل عميل عبر **Setup Wizard موجّه**، **Health Scores** قابلة للتنفيذ، و**Playbooks** آلية توصّي بخطوات تحسين مستمرة.

## 2) نطاق الـMVP (Scope)
- **Setup Wizard:** خطوات موجهة: Identity/RBAC، Branding، Integrations (Entra/M365/Email/Slack)، Program Defaults (M2/M9/M22).
- **Health Score (Tenant & Org-Unit):** سِلال واضحة (Adoption, Data Quality, Compliance Readiness, Risk Hygiene).
- **Playbooks:** وصفات تحسين جاهزة مرتبطة بالنقاط الضعيفة (e.g., “رفع Evidence Freshness” أو “تقليل Access Drift”).
- **Success Dashboard:** نظرة موحّدة للمؤشرات والمهام والتوصيات.
- **Nudges:** تذكيرات دورية للمالكين لتنفيذ الخطوات الحرجة.

## 3) العقود/التكاملات (Integration Contracts)
### 3.1 Inputs
- KPIs من **M14**، أدلة/تقارير **M10/M19**، اختبارات **M18**، مراجعات وصول **M17**، حملات/تدريب **M2/M22/M23**، تكاملات **M6**.

### 3.2 APIs (مع M15)
- `POST /v1/success/health/recompute`
- `POST /v1/success/playbooks/run`
- `POST /v1/success/wizard/state`
- Webhooks: `success.health.updated`, `success.playbook.suggested`.

### 3.3 Outbound → M21/M19
- تلخيص تأثير التحسينات على الجاهزية والتقارير التنفيذية.

## 4) نموذج البيانات (High-Level Data Model)
> **per-DB isolation** لكل عميل + قراءات من Semantic Layer (M14).

- **success_wizard_states**: `{tenant_id, step, status, meta}`
- **success_health_snapshots**: `{tenant_id, org_unit?, score_overall, adoption, dq, readiness, risk_hygiene, snapshot_at}`
- **success_playbooks**: `{id, name, category, trigger, actions[], est_impact}`
- **success_actions**: `{id, playbook_id, owner_id, due_at, status, result}`
- **success_nudges**: `{id, owner_id, channel, sent_at, outcome}`

## 5) التدفقات (Key Flows)
### F1 | Wizard
يلتقط المعطيات الأساسية ويُشغّل توصيات Playbooks المناسبة.

### F2 | Health Recompute
مهمة مجدولة تجمع KPIs وتنتج Score وبطاقات توصية.

### F3 | Playbook Run
تنفيذ آلي/يدوي لمجموعة مهام (e.g., تفعيل تقارير، جدولة اختبارات، إعداد رحلة تدريب).

### F4 | Tracking
تتبّع تنفيذ التوصيات وتأثيرها على Health Score وM21 Readiness.

### F5 | Coaching
رسائل موجّهة للمالكين مع روابط مباشرة لتنفيذ الخطوات.

## 6) الحوكمة والأمن (Governance & Security)
- **RLS/RBAC:** صلاحيات المشرفين ومدراء البرامج فقط للتعديلات؛ المشاركة عرضية للمدراء التنفيذيين.
- **PII Minimization:** عرض صحة التبنّي مجمّعة دون كشف أسماء الأفراد.
- **Auditability:** كل تشغيل Playbook وكل تغيير على Health مسجّل في audit_logs.
- **Rate Limits:** لحماية عمليات recompute ونداءات التوصية.

## 7) معايير القبول (Acceptance Criteria)
- **AC-01 | Wizard Completion:** تقليص زمن الإعداد الأولي ≥ **30%** مقارنة بخط الأساس.
- **AC-02 | Health Score Integrity:** يُحتسب من مصادر Semantic (M14) بضمان اتساق الصيغ (Appendices-B/S).
- **AC-03 | Playbook Efficacy:** على 3 عملاء تجريبيين، ينخفض **Overdue (M21)** ≥ **20%** خلال 30 يوم.
- **AC-04 | Traceability:** كل توصية لها Owner/Due/Impact وتظهر في لوحة النجاح.
- **AC-05 | Safety:** لا توصية تغيّر صلاحيات/سياسات دون موافقة مشرف.

## 8) تحسينات خفيفة (Quick Wins)
- **Starter Playbooks:** “Quick Start (14 يوم)”، “Audit Readiness Boost”، “Phishing Hygiene”.
- **One-click Integrations Check:** فحص تلقائي لتوصيات الربط الناقصة.
- **Score Explainability:** بطاقة توضّح بالضبط لماذا انخفض/ارتفع المؤشر وكيفية معالجته.
- **Manager Digest:** ملخّص أسبوعي بالأثر والتقدم.

## 9) KPIs
- **Onboarding Time ↓:** ≥ **30%**.
- **Readiness Overdue ↓ (30d):** ≥ **20%**.
- **Adoption Lift (60d):** ≥ **15%** في استخدام اللوحات/الرحلات.
- **DQ Alerts MTTR:** ≤ **24h** لإغلاق تنبيه الجودة.
- **Playbook Adoption:** ≥ **70%** من العملاء يشغّلون 2+ Playbooks في 30 يوم.

## 10) قيود وافتراضات
- حسابات Health تعتمد على **Semantic Layer** وتعريفات Appendices-S.
- بعض Playbooks تتطلب أذونات تكامل (M6) أو سياسات احتفاظ (M16).
- التنفيذ Web-first مع دعم RTL/WCAG؛ تطبيقات أصلية لاحقًا.

---

**ملاحظة تنفيذية:** هذا الملف يلتزم بنمط العمل (مراجعة → اعتماد → تصدير Markdown) ويكمل M21–M24 برفع نجاح العملاء وتسريع الوصول للقيمة.
