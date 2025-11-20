
# M21 — Compliance Calendar & Audit Readiness
**Version:** v1.0 • **Date:** 2025-11-08 • **Owner:** Senior Systems/Product Analyst  
**Context:** Romuz Cybersecurity Culture Platform — Sub-conversation continuation (multi-tenant SaaS, per-DB isolation).

---

## جدول المحتويات (Table of Contents)
1. [الغرض](#1-الغرض)
2. [نطاق الـMVP](#2-نطاق-الـmvp)
3. [نموذج البيانات](#3-نموذج-البيانات-موجز)
4. [التدفقات](#4-التدفقات)
5. [معايير القبول (AC)](#5-معايير-القبول-ac)
6. [المؤشرات (KPIs)](#6-المؤشرات-kpis)
7. [قيود/افتراضات](#7-قيودافتراضات)

---

## 1) الغرض
تقويم امتثال مركزي + **Pre-Audit Snapshot** يجمّع تلقائياً الجاهزية للتدقيق ويربط العناصر بالأدلة والاختبارات ومراجعات الوصول.

## 2) نطاق الـMVP
- **Calendar UI:** حالات (Ready / At-Risk / Overdue) مع فلاتر (الإطار، القسم، المالك، النوع).
- **Pre-Audit Snapshot:** توليد حزمة جاهزية (PDF/MD) بفهرس أدلة وروابط **Evidence Packs**.
- **Checklist Engine:** عناصر قابلة للتخصيص مرتبطة بـ M10/M17/M18/M14.
- **تنبيهات وتصعيد:** عبر M8 للمتأخرات.

## 3) نموذج البيانات (موجز)
- `compliance_calendar_items(id, type, framework, owner_id, org_unit, due_at, status, evidence_ref, last_verified_at, sla_days)`
- `audit_checklists(id, name, framework, items[])`
- `audit_snapshots(id, period, scope, status, artifact_url, created_at, created_by)`

## 4) التدفقات
- **F1 تقويم:** توليد/تحديث تلقائي من الـSemantic Layer (M14) + إدخالات يدوية.
- **F2 Snapshot:** مهمة توليد تجمع الأدلة وتُصدر مخرجات موقّعة للتحميل.
- **F3 تصعيد:** `Overdue > 48h` يصعد للمالك + المدير + التنفيذيين.

## 5) معايير القبول (AC)
- كل عنصر تقويم يحتوي **Owner/Due/Evidence/Last-Verified**.
- إنشاء Snapshot مكتمل ≤ **10 دقائق** مع فهرس أدلة قابل للتتبّع.
- اتساق المؤشرات مع **M14** باختبار مقارنة.
- احترام **RLS/RBAC** والتصعيد الآلي.

## 6) المؤشرات (KPIs)
- **Audit Snapshot Time:** ≤ **10m**
- **Overdue:** انخفاض أسبوعياً
- **Evidence Freshness:** ≥ **95%**
- **Coverage:** ≥ **90%** لعناصر الإطار المستهدف

## 7) قيود/افتراضات
مصدر المؤشرات الوحيد **M14** • لا مشاركة خارجية دون سياسات **M16** • تشغيل على **GCP (KSA)** مع **per-DB isolation**.

---

**ملاحظة تنفيذية:** هذا الملف يلتزم بنمط العمل (مراجعة → اعتماد → تصدير Markdown) ويمثّل الأساس لتفعيل الجاهزية للتدقيق وربطها تلقائيًا بالأدلة والاختبارات.
