
# M17 — Access Reviews & Certifications (IGA-Light)
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
تمكين مراجعات دورية ومنضبطة للوصول (**Access Reviews/Certifications**) عبر الأدوار والقدرات والمجموعات الحسّاسة، للتأكد من تطبيق مبدأ **Least Privilege**، خفض **Access Drift**، والامتثال لمتطلبات التدقيق.

## 2) نطاق الـMVP (Scope)
- **حملات مراجعة وصول** على مستوى: المستخدم، الدور، القدرة، القسم، الأصول الحسّاسة.
- **أنواع القرارات:** Approve / Revoke / Mitigate (مؤقت مع تاريخ انتهاء) / Reassign Owner.
- **نماذج المراجعين:** Line Manager, App Owner, Control Owner, Risk Owner.
- **Sampling & Scoping:** كامل أو عيّنة ذكية حسب المخاطر (High-Privilege، Dormant > 90d، توارث صلاحيات).
- **Evidence Capture:** لقطات قبل/بعد + سبب القرار + الأثر على RBAC.
- **التكاملات:** الاستفادة من RBAC (M1), Incident/Risk (M13), Warehouse (M14), Privacy (M16).

## 3) العقود/التكاملات (Integration Contracts)
### 3.1 Inputs
- Users/Roles/Capabilities من موديولات الهوية (M1).
- Signals: حوادث مرتبطة بالمستخدم/الدور (M13)، مؤشرات امتثال وثقافة (M3)، نشاط خامل.

### 3.2 Outputs
- **Access Changes** إلى `access_grants` (منح/سحب/انتهاء).
- **Review Evidence** إلى M10 (Reports/Evidence Packs).

### 3.3 APIs (M15)
- `POST /v1/access-reviews/campaigns` إنشاء حملة.
- `POST /v1/access-reviews/decisions` قرارات المراجعين.
- Webhooks: `access.review.created`, `access.review.completed`.

## 4) نموذج البيانات (High-Level Data Model)
> **per-DB isolation** لكل عميل.

- **access_review_campaigns**: النطاق، نوع المراجع، نافذة الزمن، قواعد الاختيار.
- **access_review_items**: كيان المراجعة (user/role/capability/asset)، الحالة الحالية، جهة المراجعة.
- **access_review_decisions**: القرار، المبررات، المرفقات/الأدلة، الطابع الزمني.
- **access_grant_changes**: عمليات السحب/المنح الناتجة، حالة التنفيذ، مرجع القرار.
- **access_signals**: مؤشرات خطر (dormant, privileged, incident_linked).
- **audit_logs**: أثر تدقيقي كامل لكل خطوة.

## 5) التدفقات (Key Flows)
### F1 | Campaign Setup
مسؤول الامتثال يحدد النطاق والقواعد (مثلاً: جميع الأدوار الإدارية + المستخدمون الخاملون > 90 يومًا) → إنشاء عناصر المراجعة.

### F2 | Reviewer Assignment
توزيع العناصر على Line Managers أو App Owners حسب القاعدة.

### F3 | Decision & Enforcement
المراجع يقرّر → تُنشأ **access_grant_changes** → تنفَّذ بأمان (Idempotent) مع Rollback عند الفشل.

### F4 | Evidence & Reporting
توثيق القرارات وتوليد **Evidence Pack** تلقائي (M10).

### F5 | Drift Watch
إنشاء إشعارات تلقائية عند ارتفاع **Access Drift** أو تأخّر الإغلاق.

## 6) الحوكمة والأمن (Governance & Security)
- **Segregation of Duties:** لا يراجع المستخدم صلاحياته، وحظر المراجعة الذاتية.
- **RLS/Field-Level Security:** إظهار العناصر ضمن نطاق المراجع فقط.
- **Dual Control (اختياري):** لقرارات الحسّاسة يتطلب موافقتين.
- **SLA:** مهل افتراضية (7/14 يومًا) مع تصعيد (M8).
- **Tamper-evident Audit:** تجزئة قرارات المراجعة وربطها بسلسلة تدقيق.

## 7) معايير القبول (Acceptance Criteria)
- **AC-01 | Scope Correctness:** إنشاء عناصر المراجعة يتبع القواعد المحددة بدقة (عينات + قيود المخاطر).
- **AC-02 | Decision Integrity:** لا يمكن إتمام الحملة ما لم تُحسم ≥ **95%** من العناصر ضمن SLA.
- **AC-03 | Enforcement Safety:** تطبيق قرارات السحب/المنح يولّد **before/after snapshot** ويمكن التراجع خلال **24h**.
- **AC-04 | RLS Isolation:** المراجعون لا يرون سوى عناصر نطاقهم.
- **AC-05 | Evidence Pack:** عند إغلاق الحملة، يتوفر تقرير موقّع يتضمن القرارات والمبررات والتغييرات.
- **AC-06 | Drift Reduction:** انخفاض **Access Drift** بنسبة **≥ 20%** بعد حملتين فصليتين.

## 8) تحسينات خفيفة (Quick Wins)
- **One-click “Revoke Dormant > 180d”** مع مسار استثناءات.
- **Risk-Prioritized Queue**: ترتيب العناصر حسب شدة الإخطار.
- **Reviewer Hints** من M11 (AI) لاقتراح القرار بالمبررات.
- **Manager Digest** أسبوعي بالعناصر المتأخرة.

## 9) KPIs
- **Campaign Completion (on-time):** ≥ **90%**.
- **Drift Rate:** نسبة الصلاحيات غير المبرّرة إلى إجمالي المنح.
- **Dormant Privileged Accounts:** انخفاض شهري مستمر.
- **Mean Time to Enforce (MTTE):** ≤ **1 يوم** بعد القرار.
- **Re-grant Rate (30d):** ≤ **5%** (قياس جودة القرارات).

## 10) قيود وافتراضات (Constraints & Assumptions)
- الاعتماد على RBAC/Capabilities من M1، والتقارير من M10، والبيانات من M14.
- التنفيذ على **Google Cloud (KSA)** مع **per-DB isolation**.
- البدء بـ **Review by Manager/App Owner** قبل التوسّع إلى Certifier متعدد الطبقات.
- لا مراجعة للأذونات عبر أنظمة خارجية في الـMVP إلا عبر Imports/Views عند الحاجة.

---

**ملحوظة تنفيذية:** هذا الملف يلتزم بشخصية ودور المساعد (Senior Systems/Product Analyst) ونمط العمل: مراجعة → اعتماد → تصدير Markdown. وهو امتداد مباشر للموديولات السابقة (M1–M16) ويركّز على ضبط الصلاحيات وتقليل الانحراف مع أدلة تدقيقية كاملة.
