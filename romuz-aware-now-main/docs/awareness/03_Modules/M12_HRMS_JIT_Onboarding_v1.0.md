
# M12 — HRMS & JIT Onboarding (Phase 2)
**Version:** v1.0 • **Date:** 2025-11-08 • **Owner:** Senior Systems/Product Analyst  
**Context:** Romuz Cybersecurity Culture Platform — Sub-conversation continuation (multi-tenant SaaS, per-DB isolation).

---

## جدول المحتويات (Table of Contents)
1. [الغرض (Purpose)](#1-الغرض-purpose)
2. [نطاق الـMVP (Scope)](#2-نطاق-المvp-scope)
3. [العقود/التكاملات (Integration Contracts)](#3-العقودالتكاملات-integration-contracts)
4. [نموذج البيانات (High-Level Data Model)](#4-نموذج-البيانات-high-level-data-model)
5. [التدفقات (Key Flows)](#5-التدفقات-key-flows)
6. [الحوكمة والأمن (Governance & Security)](#6-الحوكمة-والأمن-governance--security)
7. [معايير القبول (Acceptance Criteria)](#7-معايير-القبول-acceptance-criteria--أمثلة)
8. [تحسينات خفيفة (Quick Wins)](#8-تحسينات-خفيفة-quick-wins)
9. [المؤشرات (KPIs)](#9-kpis-phase-2)
10. [قيود وافتراضات (Constraints & Assumptions)](#10-قيود-وافتراضات-constraints--assumptions)

---

## 1) الغرض (Purpose)
تمكين ربط المنصّة مع أنظمة الموارد البشرية (HRMS) وتفعيل **Just-in-Time (JIT) Onboarding** بحيث يتم إنشاء حسابات المستخدمين وتعيين الصلاحيات آليًا عند أول دخول (أو عند وصول حدث HR)، مع تشغيل باقة مهام الاستقبال (Pre-boarding/Onboarding) وربطها ببرامج التوعية والثقافة السيبرانية.

## 2) نطاق الـMVP (Scope)
- **تكامل HRMS – مرحلة أولى:**
  - مصادر بيانات مدعومة: CSV Secure Upload، تكامل أولي مع **Microsoft Entra/M365** لسمات الهوية، و**Slack Pilot** للمراسلة.
  - خريطة سمات (Attribute Mapping) أساسية: الاسم، البريد، الوظيفة، القسم، المقر، المدير المباشر، الحالة الوظيفية.
- **JIT Provisioning:** إنشاء مستخدم وProfile داخل المنصّة عند أول SSO/Email Login أو عند ورود **Joiner Event**.
- **JML Lifecycle (Joiner/Mover/Leaver):** مشغّلات قواعد (Rules) لتحديث الدور والقسم عند النقل، وتعطيل الوصول عند إنهاء الخدمة.
- **Onboarding Packs:** تشغيل حزمة مهام تلقائية حسب **الوظيفة/القسم/الموقع** (سياسات للقراءة والتوقيع، Micro-Quiz إلزامي، دورة Phishing 101).
- **Approvals Light:** موافقة مدير/HR على الحالات الشاذة (Missing attributes / High-privilege).
- **Evidence:** لقطات امتثال للتوظيف: Policy Acknowledgment، إكمال تدريب البداية، ختم تاريخ الإنشاء والتفعيل.

## 3) العقود/التكاملات (Integration Contracts)
### 3.1 Ingestion Contract (CSV/API)
- تنسيق CSV آمن (UTF-8), أعمدة إلزامية:  
  `employee_id, email, first_name, last_name, department, job_title, location, manager_email, employment_status (active|terminated), start_date, end_date?`
- التحقق: uniqueness للبريد/employee_id، تواريخ صحيحة، التوافق مع مخطط الأقسام/المناصب.

### 3.2 Attribute Mapping Policy
- HRMS → Identity Store (Platform) → Tenant RBAC/Capabilities.
- قواعد تحويل (Normalizers): casing للبريد، تعريب/ترميز الأقسام، fallback للموقع.

### 3.3 Events/Webhooks (Phase 2/3)
- أحداث داخلية: `hr.joiner.created`, `hr.mover.updated`, `hr.leaver.deactivated`, `onboarding.completed`.
- Webhooks خارجية (Phase 3): دفع إشعارات للمصادر المتكاملة/نظم ITSM.

### 3.4 SCIM/SSO (Phase 3)
- مواصفة SCIM لاحقًا، مع استمرار **Entra SSO** كقناة هوية أساسية.

## 4) نموذج البيانات (High-Level Data Model)
> **مبدأ العزل:** قاعدة بيانات مستقلة لكل عميل (**per-DB isolation**).

- **employees**: الملف الوظيفي (PII مشفّرة)، مفاتيح: `employee_id`, `email` (Unique).
- **org_units**: الأقسام مع هيكل هرمي (parent_id).
- **positions**: المسمّيات الوظيفية وربطها بقدرات (Capabilities).
- **employment_records**: الحالة (active/terminated/leave), تواريخ، نوع التوظيف.
- **identity_accounts**: ربط المستخدم بحسابات المصادقة (local/email/Entra).
- **access_grants**: ربط المستخدم بأدوار/Capabilities مع مصدر المنح (HR/JIT/Admin).
- **onboarding_packages**: قوالب مهام حسب (department/position/location).
- **onboarding_tasks**: مهام فعلية لكل مستخدم (policy_read, micro_quiz, phishing_basics).
- **acknowledgments**: توقيعات/اقرارات سياسات مع البصمة الزمنية.
- **jml_events**: سجلات Joiner/Mover/Leaver مع السبب والمصدر.
- **audit_logs**: كل تغيير على الهوية/الوصول/المهام.
- **kpi_snapshots**: مؤشرات السرعة والامتثال (time_to_provision, completion_rate).

## 5) التدفقات (Key Flows)
### 5.1 Joiner (JIT)
1) وصول سجل HR جديد أو أول تسجيل دخول عبر SSO → إنشاء `employee` + `identity_account`.
2) تعيين `org_unit` و`position` من السمات.
3) تطبيق قواعد الدور/القدرات (Baseline + Position/Dept).
4) تفعيل حزمة Onboarding المناسبة وإشعار المستخدم (Email/Slack).

### 5.2 Mover
- تحديث القسم/الوظيفة → إعادة احتساب الصلاحيات (Reconciliation) + إغلاق/فتح مهام إضافية.

### 5.3 Leaver
- تعطيل الوصول، إلغاء الجلسات، إيقاف الـnotifications، أرشفة الأدلة، الاحتفاظ حسب سياسة العميل.

### 5.4 Exception Handling
- نقص سمات حرجة → توجيه للموافقة/الإكمال اليدوي.

### 5.5 Evidence Trail
- كل خطوة تُسجّل مع بصمة زمنية وربط بالسياسات والتدريب.

## 6) الحوكمة والأمن (Governance & Security)
- **RLS** على جميع جداول PII، ونطاق الوصول حسب Tenant + Least Privilege.
- **PII Encryption at Rest** (عمودياً للحساسات) + **TLS in Transit**.
- **Audit & Tamper-proofing:** سجلات غير قابلة للتعديل مع توقيع/سلسلة هاش.
- **Data Retention:** سياسات احتفاظ حسب البلد/العميل، حق النسيان (عند الطلب القانوني).
- **Access Reviews:** مراجعات دورية لأذونات الحسّاسة (Quarterly).
- **Rate-limits & Input Validation** لملفات CSV وواجهات الإدخال.
- **Security Posture Hooks:** ربط النتائج المبكرة بـ M3 (Culture KPIs) وM11 (AI Insights) للتوصيات.

## 7) معايير القبول (Acceptance Criteria — أمثلة)
- **AC-01 | JIT Creation:**  
  *Given* سجل HR صالح، *When* يصل أو يحدث أول Login، *Then* يُنشأ المستخدم، تُعيَّن صلاحياته، وتُنشّط حزمة Onboarding المناسبة خلال ≤ **60s**.
- **AC-02 | Mover Reconciliation:**  
  *Given* تغيير قسم/وظيفة، *When* تحديث السمات، *Then* تُسحب الأذونات غير الملائمة ويُمنح الجديد خلال ≤ **5m** مع سجل تدقيق.
- **AC-03 | Leaver Deactivation:**  
  *Given* حالة Leaver، *When* end_date ≤ اليوم، *Then* يُعطّل الحساب فورًا وتُزال الجلسات ويُوقف الإشعار.
- **AC-04 | Evidence Pack:**  
  عند إتمام Onboarding، يتوافر **Evidence Pack** يحتوي: Policy Acknowledgments + Micro-Quiz Result + Timestamps.
- **AC-05 | Exceptions:**  
  حالات attributes الناقصة تدخل مسار موافقات، ولا تُمنح صلاحيات مرتفعة إلا بعد موافقة HR/Manager.

## 8) تحسينات خفيفة (Quick Wins)
- **Pre-boarding Portal:** صفحة ترحيب للمُعينين الجدد لأكتمال البيانات والاطلاع على السياسات قبل يومهم الأول.
- **Smart Forms:** التحقّق الفوري من المدير/القسم (Lookup)، ورفع وثائق الهوية داخليًا بشكل آمن.
- **Coaching Nudges:** تلميحات قصيرة داخل المهام لتعزيز الامتثال.
- **Bilingual Templates (AR/EN):** للإشعارات، سياسات البداية، وتعليمات الوصول.
- **Slack/Email Alerts:** تنبيهات للمدير عند تأخر مهام الموظف الجديد.

## 9) KPIs (Phase 2)
- **Time-to-Provision (TTP90):** 90th percentile ≤ **2 دقائق** من أول Login/حدث HR.
- **Onboarding Completion (D+7):** ≥ **85%** إكمال خلال 7 أيام.
- **Exception Rate:** ≤ **5%** من السجلات تحتاج تدخّل يدوي.
- **Orphan Access after Leaver (D+1):** = **0**.
- **Mover Drift:** % المستخدمين الذين احتفظوا بصلاحيات قديمة بعد 24 ساعة ≤ **1%**.
- **Data Quality Score:** ≥ **98%** حقول إلزامية متوفرة وصحيحة.

## 10) قيود وافتراضات (Constraints & Assumptions)
- **مرحلة أولى بدون SCIM كامل**؛ الاعتماد على CSV + Entra/M365 Attributes + Slack Pilot.
- **اعتماد per-DB isolation** في الإنتاج على GCP داخل السعودية.
- **الهوية المحلية + Entra** (كما في الخريطة العامة)؛ SSO إلزامي لاحقًا لبعض العملاء.
- **HR Ownership:** صحة البيانات مسؤولية HR؛ المنصّة توفّر تحققًا وواجهات تنبيه.
- **Latency Windows:** JIT ≤ 60s، مزامنة دورية (Poll/Webhook) كل 5 دقائق حدًا أقصى في الـMVP.

---

**ملحوظة تنفيذية:** هذا الملف يلتزم بشخصية ودور المساعد (Senior Systems/Product Analyst) ونمط العمل: مراجعة → اعتماد → تصدير Markdown. وهو امتداد مباشر للموديولات M1–M11، ويستند إلى معمارية SaaS متعددة العملاء مع عزل per-DB، وبيئة تطوير Supabase وإنتاج على Google Cloud داخل السعودية.
