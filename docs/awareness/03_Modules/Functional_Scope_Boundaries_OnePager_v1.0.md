
# Functional Scope Boundaries — One-Pager (v1.0)
**Date:** 2025-11-08 • **Owner:** Senior Systems/Product Analyst  
**Product:** Romuz Cybersecurity Culture Platform (M1 → M25 + Appendix-I, Appendices v1.1)

---

## 1) الغرض (Purpose)
تثبيت **حدود النطاق الوظيفي** (What’s In / What’s Out) لضمان وضوح التنفيذ، تقليل تغيّر المتطلبات، ومحاذاة الفرق عبر الموديولات **M1→M25** والملاحق (Appendix-I, Appendices v1.1).

## 2) In-Scope (MVP+)
- **Multi-Tenant + per-DB isolation** مع **RBAC/RLS** على كل الطبقات.
- **Awareness & Phishing**: حملات، قوالب، تتبّع، تصعيد (M2, M9, M8) بمحتوى من M4.
- **Gamified Micro-learning** و**Training 2.0** حسب الدور/المخاطر (M5, M22) مع Micro-quiz متكيفة.
- **Culture KPIs & AI Insights** (M3, M11) تغذي التقارير والتنبيهات.
- **Content Hub** بإصدارات/لغات/حالات ونشر مجدول (M4).
- **Simulation Studio + A/B** للرسائل والقوالب (M23).
- **Compliance Calendar & Pre-Audit Snapshot** مرتبط بالأدلة والاختبارات (M21 + Appendix-I ↔ M10/M18/M17).
- **Data Warehouse & Semantic Layer** كمصدر الحقيقة للمقاييس (M14).
- **Self-Service Analytics (Explorations) + DQ Gates** (M24).
- **Tenant Success Toolkit** (Wizard, Health, Playbooks) (M25).
- **Public API & Webhooks v1** لعقود: calendar/snapshot, training, studio A/B, explorations, health (M15).
- **Privacy/Retention Matrix** وسياسات التصدير بدون PII افتراضيًا (M16).
- **Integrations (Phase 1)**: Entra SSO, M365, Email, Slack Pilot (M6).

## 3) Out-of-Scope (المرحلة الحالية)
- تطبيقات موبايل **Native** (iOS/Android).
- تكاملات **SIEM/SOAR** العميقة وإجراءات استجابة أوتوماتيكية.
- **ML Recommender** متقدم للتخصيص الكامل (نستخدم قواعد + إشارات مخاطرة حالياً).
- تحرير مباشر لجداول الـ **DWH** (القراءة عبر Views فقط).
- تقارير مخصّصة خارج إطار الـ Semantic Layer.

## 4) الافتراضات (Assumptions)
- جميع المقاييس تُستخرج عبر **Semantic Layer (M14)** حصراً.
- **per-DB isolation** إلزامي؛ لا مزج بين بيانات المستأجرين.
- قنوات الإرسال عبر **M6** فقط ضمن نطاق المرحلة (Email/M365/Slack Pilot).
- التدويل **AR/EN**، **RTL** كامل، وامتثال **WCAG** الأساسي.

## 5) الواجهات/العقود (Interfaces/APIs)
- **REST + Webhooks (M15)**:
  - Calendar/Snapshot (M21)، Training (M22)، Studio A/B (M23)، Explorations (M24)، Health/Playbooks (M25).
- **التوقيع (HMAC)** و**Rate-Limits** و**TTL للروابط** (snapshots/exports).

## 6) اللاتاريخية/اللاحق (Non-Goals الآن)
- Dashboards خارج طبقة M14 أو دون امتثال تعاريف KPIs (Appendices-S).
- محرّكات توصية محتوى قائمة على سلوك خارجي غير مُمَوْضَع داخل المنصّة.
- أتمتة تغييرات صلاحيات حساسة من Playbooks دون موافقة مشرف موثّقة.

## 7) معايير القبول (AC)
- بيان **In/Out** واضح ومطابق لما تم اعتماده في وثائق **M21→M25**.
- الإشارة إلى **Appendix-I** و**Appendices v1.1** كمراجع دلالية.
- قصر المقاييس والتحليلات على **M14**، وسياسة **No-PII by default** للتصدير.
- تضمين قنوات التكامل المُمكّنة حالياً فقط (M6 Phase 1).

## 8) مخاطر مختصرة + تخفيف
- **Scope Creep:** إضافة قنوات/تكاملات غير مخططة → **Gate عبر M15** وتخطيط سبرنت لاحق.
- **Metric Drift:** اختلاف تعريفات KPIs بين الوحدات → **Appendices-S** + توحيد Views في M14.
- **Export Leakage:** تسريب PII عبر التصدير → **Redaction افتراضي + TTL + Watermark/Correlation-ID**.

---

**ملاحظة تنفيذية:** هذا الـ One-Pager هو المرجع الرسمي لحدود النطاق قبل الانتقال إلى Phase 3 (ERDs & Flows) ثم Phase 4 (Lovable Packs).
