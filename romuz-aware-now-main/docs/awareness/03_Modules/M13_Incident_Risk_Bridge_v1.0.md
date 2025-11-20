
# M13 — Incident & Risk Bridge (Phase 3)
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
9. [المؤشرات (KPIs)](#9-kpis-phase-3)
10. [قيود وافتراضات (Constraints & Assumptions)](#10-قيود-وافتراضات-constraints--assumptions)

---

## 1) الغرض (Purpose)
بناء جسر تشغيلي وتحليلي بين **إدارة الحوادث (Incidents)** و**إدارة المخاطر (Risk Register/Treatments)** لربط كل حادث بمخاطر/ضوابط/خسائر، وتوليد **تعلّم مؤسسي** يغذّي برامج التوعية والثقافة، ويُحدِّث شهية المخاطر (Risk Appetite) ومقاييس الفعالية.

## 2) نطاق الـMVP (Scope)
- **ربط ثنائي الاتجاه Incident ⇄ Risk:**
  - إنشاء/ربط **Risk Item** تلقائيًا أو يدويًا عند تسجيل Incident.
  - إسناد **Controls** ذات العلاقة (Policies, Procedures, Technical).
- **RCA & Loss Events:** نموذج **Root Cause Analysis** موحّد، وتوثيق **خسائر مباشرة/غير مباشرة**.
- **Risk Impact Feedback:** تحديث تلقائي لدرجة المخاطر (Likelihood/Impact) وفق شدة الحادث وأدلته.
- **Playbooks:** قوالب بروتوكولات (Containment, Eradication, Recovery) مع نقاط تحقق امتثالية.
- **Awareness Loop:** توليد **Learning Items** تُغذّي M2/M5 (حملات/مسارات قصيرة) وM11 (AI Insights).
- **Evidence Packs:** ربط أدلة الحادث بخطة المعالجة (Treatment) وتقارير M10.

## 3) العقود/التكاملات (Integration Contracts)
### 3.1 Inbound (Phase 3)
- **ITSM Connectors:** Jira Service Management / ServiceNow (اختياري MVP عبر CSV/API خفيف).
- **Security Tools (خيار):** SIEM/EDR ملخّص تنبيهات (severity, source, asset).

### 3.2 Data Contracts
- **Incident →** `{id, title, severity, status, detected_at, contained_at?, resolved_at?, category, asset, reporter, evidence[]}`
- **Risk Link →** `{risk_id?, create_if_missing: bool, initial_score?, related_controls[], loss_events[]}`
- **RCA →** `{method (5Whys/Ishikawa), root_cause, contributing_factors[], lessons[], owner}`

### 3.3 Events/Webhooks
- **داخلي:** `incident.created`, `incident.severity.changed`, `incident.closed`, `risk.score.updated`, `lesson.created`.
- **خارجي (Phase 3):** `risk.updated`, `treatment.approved`, `evidence.bundle.ready`.

## 4) نموذج البيانات (High-Level Data Model)
> **مبدأ العزل:** قاعدة مستقلة لكل عميل (**per-DB isolation**).

- **incidents**: بيانات الحوادث وسيرها (severity, status, SLA).
- **incident_evidence**: مرفقات/روابط، تجزئة Hash، أختام زمنية.
- **risks**: سجل المخاطر (category, owner, inherent/residual score, appetite).
- **risk_incident_links**: جدول وسيط يحدد نوع العلاقة (root, contributing, near-miss).
- **controls**: ضوابط مرتبطة بالأطر (NCA/ISO…) وحالات الفعالية.
- **risk_controls**: ربط المخاطر بالضوابط.
- **treatments**: خطط المعالجة (accept/avoid/transfer/mitigate) مع مهام ومواعيد.
- **rca_cases**: تفاصيل التحليل الجذري والنتائج والدروس.
- **loss_events**: نوع/قيمة الخسارة (مباشرة/سمعة/قانونية).
- **lessons_learned**: عناصر تعلّم قابلة للتحويل إلى محتوى توعوي.
- **kpi_snapshots**: مؤشرات MTTD/MTTR/closure quality.
- **audit_logs**: أثر تدقيقي لكافة التغييرات.

## 5) التدفقات (Key Flows)
### F1 | Incident → Risk Link (Auto/Manual)
عند تسجيل Incident (sev ≥ مذكور في السياسات) → اقتراح ربط بمخاطر قائمة (via matching: asset/category/tags) أو إنشاء Risk جديد **(create_if_missing)** مع score أولي.

### F2 | RCA & Lessons
بعد الاحتواء/الإغلاق، يفتح **RCA Case** إجباري لدرجات شدة محددة → استخراج **Lessons Learned** → تُحوَّل إلى عناصر **Awareness Content** (M2/M5) عبر queue.

### F3 | Risk Scoring Feedback
تحديث Likelihood/Impact/Residual تلقائيًا وفق شدة وتكرار الحوادث، وتأثير الضوابط (control effectiveness delta).

### F4 | Treatment Orchestration
عند تجاوز المخاطر سقف الشهية (Appetite Threshold) → إنشاء/تحديث **Treatment** + مهام متابعة + إشعارات M8.

### F5 | Evidence Pack & Reports
توليد حزمة أدلة (timeline, approvals, artifacts) متاحة في M10 ومربوطة بالمعالجة.

## 6) الحوكمة والأمن (Governance & Security)
- **RLS** صارمة على incidents/risks/evidence حسب الدور والقسم وحساسية الأصل (asset sensitivity).
- **PII/Secrets Handling:** تشفير مستندات الحساسية العالية، وضوابط تنزيل/عرض بحدود.
- **Tamper-evident Evidence:** تجزئة وchain-of-custody.
- **SLA & Duty of Care:** سياسات زمنية لكل حالة شدة مع تنبيهات وتَصعيد (M8).
- **Segregation of Duties:** فصل أدوار Incident Owner عن Risk Approver عند الحاجة.
- **Retention & Legal Hold:** قواعد احتفاظ ودعم التحقيقات القانونية.

## 7) معايير القبول (Acceptance Criteria — أمثلة)
- **AC-01 | Auto Link Suggestion:**  
  *Given* Incident sev ≥ Medium، *When* يُسجّل، *Then* تظهر اقتراحات ربط بمخاطر قائمة بنسبة مطابقة ≥ **0.7** أو خيار **Create & Link** خلال ≤ **30s**.
- **AC-02 | RCA Mandatory:**  
  *Given* Incident sev ≥ High، *Then* لا يُمكن الإغلاق دون **RCA Case** مكتمل ودروس موثّقة ≥ **2** بنود.
- **AC-03 | Risk Score Update:**  
  *When* Incident مرتبط يُغلق مع Loss > 0، *Then* يُحدّث **Residual Score** ويُسجّل السبب والأثر في **risk_incident_links**.
- **AC-04 | Appetite Breach:**  
  *Given* تجاوز Residual > Appetite، *Then* تُنشأ **Treatment** مع مالك وموعد نهائي وتنبيهات تصعيد.
- **AC-05 | Evidence Pack:**  
  عند الإغلاق، تتوفر **حزمة أدلة** تشمل: التسلسل الزمني، الموافقات، المرفقات، خلاصة RCA، وقرارات المعالجة.
- **AC-06 | Awareness Sync:**  
  *When* تُنشأ **Lessons Learned**، *Then* تُضاف تلقائيًا إلى قائمة **Awareness Backlog** للمراجعة في M2/M5 خلال ≤ **1h**.

## 8) تحسينات خفيفة (Quick Wins)
- **Risk-from-Template:** إنشاء مخاطر قياسية جاهزة حسب فئة الحادث (Phishing, Malware, Data Leak).
- **Control Effectiveness Survey:** نموذج خفيف لتقييم فعالية الضوابط بعد كل حادث.
- **Near-Miss Capture:** نموذج مبسّط لتسجيل شبه-حادث لتغذية احتمالية المخاطر.
- **One-Click Executive Brief:** ملخص إداري تلقائي (1 صفحة) مع توصيات واضحة.

## 9) KPIs (Phase 3)
- **MTTD/MTTR:** اتجاهات زمن الاكتشاف والمعالجة حسب الفئة والشدة.
- **% Incidents with RCA:** ≥ **95%** للحوادث High خلال 7 أيام.
- **Risk Mapping Coverage:** ≥ **90%** من الحوادث الموثّقة مرتبطة بمخاطر.
- **Control Effectiveness Δ:** تحسّن ربع سنوي ≥ **15%** في الضوابط المتكررة ذات الصلة.
- **Repeat Incident Rate (90d):** ≤ **5%** لنفس الفئة على نفس الأصل.
- **Time-to-Risk-Update:** ≤ **24h** من إغلاق الحادث.

## 10) قيود وافتراضات (Constraints & Assumptions)
- **Connectors خفيفة** في الـMVP (CSV/API مبسّط لـ Jira/ServiceNow) قبل موصلات رسمية.
- **لا يعتمد على SIEM كامل**؛ يتم قبول ملخّصات فقط في المرحلة الأولى.
- **التصنيف المبدئي** يدوي مع اقتراحات ذكية لاحقًا (M11).
- **بيئة:** Supabase للتطوير، إنتاج على **Google Cloud (KSA)** مع **per-DB isolation**.
- **RBAC/Capabilities** كما في M1 وموديولات الهوية.

---

**ملحوظة تنفيذية:** هذا الملف يلتزم بشخصية ودور المساعد (Senior Systems/Product Analyst) ونمط العمل: مراجعة → اعتماد → تصدير Markdown. وهو امتداد مباشر للموديولات السابقة (M1–M12) ويركّز على الربط التشغيلي والتحليلي بين الحوادث والمخاطر مع مخرجات قابلة للتفعيل في الوعي والثقافة.
