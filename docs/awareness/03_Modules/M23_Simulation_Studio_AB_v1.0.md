
# M23 — Simulation Studio (Phishing/Awareness + A/B)
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
إنشاء **استوديو قوالب محاكاة** لحملات التصيّد/التوعية مع **A/B Testing**، يمكّن الفرق من بناء قوالب غنيّة متعددة القنوات (Email/M365/Slack) وقياس التأثير بدقة لتحسين **Phish-prone%** ورفع جودة المحتوى التدريبي (M22).

## 2) نطاق الـMVP (Scope)
- **Template Studio:** محرّر بصري مع Blocks (Subject, Body, CTA, Landing, Attachment, Sender Profile).
- **Variants & A/B:** إنشاء متغيرات A/B بنِسَب توزيع + مقاييس مقارنة.
- **Channel Support:** Email أساسي + Hooks لـ M365/Slack (Pilot وفق M6).
- **Safety & Compliance Mode:** علامات واضحة + بيئة Sandboxed للروابط والمرفقات.
- **Library & Tagging:** مكتبة قوالب مع وسوم (brand, sector, ttp, language AR/EN).
- **Campaign Push:** نشر القوالب إلى M2/M9 مع تتبّع نتائج متكامل.

## 3) العقود/التكاملات (Integration Contracts)
### 3.1 Inputs
- من **M4** محتوى/أصول، من **M22** خرائط رحلات/مواضيع، من **M3** مؤشرات الثقافة، من **M13** سيناريوهات مخاطر.

### 3.2 APIs (M15)
- `POST /v1/studio/templates` إنشاء/تحديث قالب.
- `POST /v1/studio/templates/<built-in function id>/variants` إدارة A/B.
- `POST /v1/studio/publish` نشر إلى حملات (M2/M9).
- Webhooks: `studio.template.published`, `studio.ab.results.ready`.

### 3.3 Outbound → M14
- لقطات نتائج A/B (open/click/report/submit/form) + أفضل متغير.

## 4) نموذج البيانات (High-Level Data Model)
> **per-DB isolation** لكل عميل.

- **studio_templates**: `{id, name, channel, locale, tags[], status, version}`
- **studio_template_blocks**: `{id, template_id, type, content, order}`
- **studio_variants**: `{id, template_id, label, split_pct, hypothesis}`
- **studio_ab_runs**: `{id, template_id, variant_ids[], started_at, ended_at}`
- **studio_ab_metrics**: `{run_id, variant_id, delivered, opened, clicked, reported, converted}`
- **studio_publish_links**: `{template_id, campaign_id, published_by, published_at}`

## 5) التدفقات (Key Flows)
### F1 | Build
إنشاء قالب → إضافة Blocks → إعداد اللغات/العلامات.

### F2 | A/B Setup
إنشاء متغيرات مع نسب توزيع + فرضية لكل متغير.

### F3 | Publish
نشر إلى M2/M9 → تكوين الجمهور/المواعيد.

### F4 | Measure
جمع نتائج A/B تلقائيًا → حساب المقاييس وتحليل الدلالة البسيط.

### F5 | Promote Winner
ترقية المتغير الفائز تلقائيًا أو حسب موافقة إلى القالب الافتراضي.

## 6) الحوكمة والأمن (Governance & Security)
- **RLS:** عزل القوالب لكل مستأجر مع أدوار (Creator/Reviewer/Publisher).
- **Brand Safety:** قواعد لمنع محاكاة حساسة غير مصرح بها.
- **PII Guardrails:** عدم حقن بيانات فعلية في نماذج الهبوط.
- **Audit Logs:** لكل إنشاء/تعديل/نشر/حذف.
- **Retention:** أرشفة نتائج A/B وفق مصفوفة M16.

## 7) معايير القبول (Acceptance Criteria)
- **AC-01 | A/B Integrity:** توزيع حقيقي يطابق `split_pct` ± 2% لكل متغير.
- **AC-02 | Metrics:** إتاحة مقاييس (delivered/open/click/report/convert) لكل متغير مع فترة وتجميعة.
- **AC-03 | Winner Promotion:** زر ترقية المتغير الفائز يظهر بعد اكتمال عتبة العينة (min N) أو زمن الحد الأدنى.
- **AC-04 | Publishing Safety:** لا نشر بدون مراجعة Reviewer لدور Publisher المصرّح.
- **AC-05 | Multilingual:** دعم AR/EN في القوالب والصفحات المرتبطة.
- **AC-06 | BI Consistency:** نتائج A/B متاحة في M14 ومتطابقة مع لوحات M19.

## 8) تحسينات خفيفة (Quick Wins)
- **Starter Packs:** حِزم قوالب حسب القطاع (Finance, Legal, Healthcare, Education).  
- **Subject Line Generator:** اقتراحات من M11 مع تقييم احتمالية الفتح.  
- **CTA Analyzer:** تلميحات لتحسين نسب التحويل.  
- **One-click Clone:** استنساخ قالب/حملة كأساس لتجربة جديدة.

## 9) KPIs
- **Campaign Throughput:** مضاعفة الإنتاجية ≥ **2x** خلال 60 يوم.  
- **Phish-prone% Accuracy:** تحسّن دقة القياس عبر A/B.  
- **Winner Adoption Rate:** ≥ **80%** من الحملات تستخدم متغيرًا فائزًا.  
- **Time-to-Publish:** ≤ **15 دقيقة** من إنشاء القالب إلى جاهزية النشر.

## 10) قيود وافتراضات
- القناة الأساسية Email؛ M365/Slack Pilot وفق جاهزية M6.  
- تحليلات دلالة مبسطة (z-test/chi-square) في المرحلة الأولى.  
- التنفيذ على الويب مع RTL وWCAG؛ دعم الأجهزة المحمولة أساسي.

---

**ملاحظة تنفيذية:** هذا الملف يلتزم بنمط العمل (مراجعة → اعتماد → تصدير Markdown) ويكمل M22 بتحسين تصميم التجارب وقياس التأثير بدقة عبر A/B.
