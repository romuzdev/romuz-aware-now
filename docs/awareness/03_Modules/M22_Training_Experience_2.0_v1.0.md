
# M22 — Training Experience 2.0 (Role/Risk-based Micro-Learning)
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
تقديم تجربة تدريب **مُشخّصة حسب الدور والمخاطر** مع **Micro-learning** و**Micro-quiz متكيفة**، بهدف رفع معدلات الإكمال، تعزيز الاحتفاظ بالمعرفة، وتقليل السلوكيات عالية المخاطر (Phish-prone, Misconfig, Shadow-IT).

## 2) نطاق الـMVP (Scope)
- **Role/Risk Journeys:** رحلات تدريب قصيرة (2–5 دقائق/وحدة) مبنية على الدور (HR/Legal/IT/Exec) ومستوى الخطر.
- **Adaptive Micro-quiz:** أسئلة متدرجة الصعوبة مع Feedback فوري وروابط تعلّم مصغّرة.
- **Content Bundles:** حزم محتوى من **M4** (Draft → Published) مع إصدارات ولغات (AR/EN).
- **Nudges & Reminders:** تذكيرات ذكية عبر Email/Slack/M365 (تكامل M6/M8).
- **In-Product Coaching:** بطاقات مساعدة سياقية من **M11** (Hints/Explainers).
- **Accessibility & RTL:** دعم كامل لـ RTL وWCAG أساسيات.

## 3) العقود/التكاملات (Integration Contracts)
### 3.1 Inputs
- Signals من M3 (Culture Index)، مخاطر من M13، ملفات تعريف المستخدمين من M1/M12، محتوى من M4.

### 3.2 APIs (مع M15)
- `POST /v1/training/journeys` إنشاء رحلة.
- `POST /v1/training/assignments` إسناد.
- `POST /v1/training/progress` تحديث تقدّم/نتيجة.
- Webhooks: `training.assignment.created`, `training.progress.updated`, `training.completed`.

### 3.3 Outbound Data → M14
- لقطات KPIs (completion, TTP90, score, retention).

## 4) نموذج البيانات (High-Level Data Model)
> **per-DB isolation** لكل عميل.

- **training_journeys**: `{id, name, role, risk_level, version, locale, status}`
- **training_modules**: `{id, journey_id, type(video/html/quiz), duration, order}`
- **training_assignments**: `{id, user_id, journey_id, due_at, status}`
- **training_progress**: `{assignment_id, module_id, started_at, completed_at, score}`
- **training_quiz_items**: `{id, module_id, difficulty, tags[], correct_answer}`
- **training_nudges**: `{id, assignment_id, channel, sent_at, result}`
- **kpi_snapshots** (تكامل M14): مؤشرات التجميع.

## 5) التدفقات (Key Flows)
### F1 | Journey Build
اختيار دور/مستوى خطر → اقتراح تلقائي للمحتوى من M4 + ضبط اللغة/المدد.

### F2 | Assignment
إسناد تلقائي حسب الدور/الوحدة التنظيمية/مستوى الخطر + Due/SLA.

### F3 | Adaptive Quiz
زيادة/خفض صعوبة الأسئلة حسب الأداء مع Feedback فوري وروابط تعلّم.

### F4 | Nudges
تذكيرات ذكية عبر M8 (تواتر يعتمد على القرب من الموعد النهائي).

### F5 | Reporting
رفع مؤشرات إلى M14 وظهور أثرها في M3/M19.

## 6) الحوكمة والأمن (Governance & Security)
- **RLS:** عرض التقدّم ضمن نطاق المستأجر + وحدة منظمة/مدير سطر.
- **PII Minimization:** تقارير تنفيذية مجمّعة افتراضيًا (بدون أسماء إلا للصلاحيات المصرّح بها).
- **Localization QA:** مراجعة بشرية للمحتوى الحساس قانونيًا (Legal/HR) قبل النشر.
- **Retention:** سجلات التدريب تتبع مصفوفة M16.
- **Audit:** كل تغيير على Journeys/Assignments مسجّل في audit_logs.

## 7) معايير القبول (Acceptance Criteria)
- **AC-01 | Personalization:** عند اختيار دور ومخاطر، تُبنى Journey تلقائيًا بقائمة Modules مناسبة ≥ 80% تطابق توصيات القالب.
- **AC-02 | Completion Lift:** على عيّنة تجريبية، زيادة الإكمال **≥ 10%** خلال 60 يومًا مقابل خط أساس.
- **AC-03 | TTP90:** تقليل **TTP90** بواقع **≥ 15%** مقارنةً بالرحلات القديمة.
- **AC-04 | Adaptive Quiz Integrity:** يحفظ النظام سجل مستوى الصعوبة ومسار الأسئلة لكل مستخدم.
- **AC-05 | Accessibility:** اجتياز فحوص WCAG الأساسية (تباين/بدائل صور/لوحة مفاتيح).
- **AC-06 | BI Consistency:** تطابق مؤشرات M22 مع Semantic Layer (M14) بنسبة 100%.

## 8) تحسينات خفيفة (Quick Wins)
- **Starter Role Packs:** قوالب جاهزة (Exec, Finance, IT, HR, Legal) AR/EN.
- **Micro-Bursts:** وحدات 90–120 ثانية تُحقن كعلاج فوري بعد فشل Quiz.
- **Just-in-Time Cards:** من **M12** عند Onboarding/Transfer/Promotion.
- **Manager Digest:** رسالة أسبوعية بملخص الإكمال والتأخر لكل فريق.

## 9) KPIs
- **Completion Rate (role/risk):** هدف ≥ **85%**.
- **TTP90:** انخفاض ≥ **15%**.
- **Average Quiz Score:** ≥ **80%** للوحدات الأساسية.
- **Nudge Effectiveness:** ≥ **20%** رفع في الإكمال لمن تلقوا Nudges.
- **Content Freshness:** ≥ **90%** من المحتوى محدّث خلال 12 شهرًا.

## 10) قيود وافتراضات
- الاعتماد على محتوى M4، هوية M1/M12، مؤشرات M3، تكاملات M6، تقارير M14/M19.
- تنفيذ أولي على الويب (Mobile-friendly)، تطبيقات أصلية لاحقًا.
- مسارات **A/B** المتقدمة ستُكمّل عبر **M23 Simulation Studio**.

---

**ملاحظة تنفيذية:** هذا الملف يلتزم بنمط العمل (مراجعة → اعتماد → تصدير Markdown) ويمثّل الأساس لتشغيل تجربة تدريب مُشخصنة قائمة على الدور/المخاطر.
