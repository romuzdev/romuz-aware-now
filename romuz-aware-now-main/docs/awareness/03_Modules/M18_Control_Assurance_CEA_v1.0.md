
# M18 — Control Assurance & Continuous Testing (CEA)
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
بناء طبقة **Assurance** لقياس فعالية الضوابط (Controls) بشكل مستمر عبر **اختبارات دورية/آلية** وربط النتائج بالمخاطر والحوادث ومؤشرات الثقافة؛ بهدف خفض المخاطر التشغيلية ورفع نضج الامتثال وتحسين الأولويات التنفيذية.

## 2) نطاق الـMVP (Scope)
- **Control Library Mapping:** استيراد/تعريف ضوابط NCA/ISO وربطها بالمخاطر والأصول والمالكين.
- **Test Catalog:** أنواع اختبارات خفيفة (Design, Operating, Evidence-only, Automated Signal).
- **Sampling & Scheduling:** جداول شهرية/ربع سنوية + عينات مبنية على المخاطر.
- **Finding Lifecycle:** فتح ملاحظة (Finding) بدرجات شدة، توصية، وخطة معالجة (Treatment).
- **Evidence Attachments:** ربط أدلة الاختبارات بـ M10 وإضافة توقيع زمني وتجزئة.
- **Feedback Loops:** تغذية النتائج إلى M13 (Risk) وM14 (Warehouse) وM11 (AI Insights).

## 3) العقود/التكاملات (Integration Contracts)
### 3.1 Inputs
- مكتبة الضوابط، ربط المخاطر (M13)، مؤشرات الثقافة (M3)، بيانات الحملات/التصيد (M2/M9).

### 3.2 Automated Signals (اختياري)
- Hooks من SIEM/IdP/Email/Slack لقياس مؤشرات التبني والامتثال.

### 3.3 APIs (M15)
- `POST /v1/controls/tests/run` تشغيل اختبار.
- `POST /v1/controls/findings` تسجيل ملاحظة.
- Webhooks: `control.test.completed`, `control.finding.opened`, `control.finding.closed`.

## 4) نموذج البيانات (High-Level Data Model)
> **per-DB isolation** لكل عميل.

- **control_library**: التعريف، الإطار، المالك، نطاق التطبيق.
- **control_tests**: قالب الاختبار، النوع، التكرار، معايير النجاح (AC).
- **control_test_runs**: تنفيذات فعلية بنتيجة (pass/fail/partial), وقت التشغيل، المنفّذ.
- **control_evidence**: الروابط/الملفات، التجزئة، التوقيع الزمني.
- **control_findings**: الشدة، السبب الجذري، الحالة، التوصيات.
- **control_treatments**: المهام والمواعيد والمسؤولين.
- **kpi_snapshots**: تغذية مؤشرات فعالية الضوابط.
- **audit_logs**: أثر تدقيقي كامل.

## 5) التدفقات (Key Flows)
### F1 | Test Scheduling
جدولة/تشغيل تلقائي → جمع أدلة → تقييم المعيار → نتيجة.

### F2 | Finding Management
فشل اختبار → فتح Finding → تعيين مالك → خطة معالجة + مواعيد + تصعيد (M8).

### F3 | Auto-Closure
نجاح متكرر لعدد N من الدورات يغلق Finding منخفض الشدة تلقائيًا مع موافقة.

### F4 | Reporting
لوحات فعالية لكل إطار/قسم + تصدير Evidence Pack (M10).

### F5 | Risk Feedback
نتائج الاختبار تعدّل **Control Effectiveness** وتؤثر على **Residual Risk** (M13).

## 6) الحوكمة والأمن (Governance & Security)
- **Segregation of Duties:** منفّذ الاختبار ≠ مالك الضابط عند الإمكان.
- **RLS:** عزل حسب القسم/نطاق الضابط.
- **Tamper-evident Evidence:** تجزئة/ختم زمني + سلسلة تجزئة.
- **Quality Gates:** لا يُغلق Finding دون دليل كافٍ وReview ثانٍ للـHigh.
- **Retention:** أدلة الاختبارات تتبع سياسات M16.

## 7) معايير القبول (Acceptance Criteria — أمثلة)
- **AC-01 | Test Run Integrity:** كل تشغيل اختبار يسجّل دليلاً وقرارًا واضحًا مع مبرر.
- **AC-02 | SLA on Findings:** ≥ **90%** من ملاحظات High تُغلق خلال **30 يومًا** أو لها تمديد مبرر.
- **AC-03 | Evidence Verifiability:** أي ملف دليل قابل للتحقق عبر قيمة التجزئة وتاريخ الإضافة.
- **AC-04 | Risk Linkage:** فتح Finding يرتبط تلقائيًا بالمخاطر/الضوابط المعنية ويظهر أثره في لوحة المخاطر.
- **AC-05 | Automation Safety:** الاختبارات المؤتمتة تعمل بصلاحيات محدودة ومحدّدات معدل.
- **AC-06 | BI Consistency:** مؤشرات فعالية الضوابط في BI تأتي من **Semantic Layer** (M14).

## 8) تحسينات خفيفة (Quick Wins)
- **Starter Test Kits:** حِزم اختبارات جاهزة لأكثر الضوابط شيوعًا (Email Security, Phishing, Policy Acks).
- **Evidence Hints:** قوالب أدلة (لقطات، تقارير CSV) لكل نوع اختبار.
- **Auto-Suggest RCA:** اقتراح سبب جذري أولي عبر M11 عند تكرار الفشل.
- **Manager Digest:** ملخص أسبوعي بالملاحظات الحرجة المفتوحة.

## 9) KPIs
- **Control Pass Rate (Critical):** ≥ **85%** ربع سنوي.
- **Finding Closure On-time:** ≥ **90%** ضمن SLA.
- **Repeat Findings (90d):** ≤ **5%** لنفس الضابط.
- **Coverage:** ≥ **70%** من الضوابط ذات المخاطر العالية لديها اختبارات فعّالة.
- **MTTA (Finding):** ≤ **3 أيام** لتعيين مالك وخطة معالجة.

## 10) قيود وافتراضات (Constraints & Assumptions)
- التنفيذ على **Google Cloud (KSA)** بعزل **per-DB**.
- لا تكامل SIEM كامل في الـMVP؛ إشارات خفيفة فقط.
- الاعتماد على M10/M14 للتقارير والقياس، وM13 لتأثير المخاطر، وM16 للاحتفاظ/الخصوصية.
- بدءًا باختبارات تشغيلية بسيطة قبل المؤتمتة العميقة.

---

**ملحوظة تنفيذية:** هذا الملف يلتزم بشخصية ودور المساعد (Senior Systems/Product Analyst) ونمط العمل: مراجعة → اعتماد → تصدير Markdown. وهو امتداد مباشر للموديولات السابقة (M1–M17) ويركّز على قياس فعالية الضوابط والأتمتة الآمنة.
