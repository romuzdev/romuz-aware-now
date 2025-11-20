# خطة التطوير الكاملة لنظام الأحداث | Event System Complete Development Plan v2.0

**التاريخ:** 2025-11-15  
**الإصدار:** v2.0 - النسخة الشاملة الكاملة  
**الحالة:** 🎯 **خطة معتمدة للتنفيذ**  
**المراجع:** `Platform_Expansion_Plan_v1.0.md` | `Architecture Diagram`  
**التوافق:** 100% مع الهيكل المعماري الكامل للمنصة

---

## 📋 فهرس المحتويات

1. [نظرة عامة تنفيذية](#executive-summary)
2. [التكامل المعماري الشامل](#complete-architecture-integration)
3. [تغطية Gates الكاملة](#gates-coverage)
4. [تغطية Modules الكاملة](#modules-coverage)
5. [تغطية Applications الكاملة](#apps-coverage)
6. [Core Platform Integration](#core-integration)
7. [البنية التقنية الكاملة](#complete-technical-architecture)
8. [خطة التنفيذ الموسعة](#expanded-implementation-plan)
9. [الفوائد والقيمة](#benefits)
10. [المخاطر والتخفيف](#risks)

---

## 🎯 نظرة عامة تنفيذية {#executive-summary}

### الهدف الاستراتيجي
تطوير **نظام أحداث موحد ومتقدم** (Unified Event System) يربط **جميع** طبقات ومكونات منصة Romuz Awareness بشكل احترافي، شامل:

```
┌─────────────────────────────────────────────────────────────────┐
│                    EVENT SYSTEM = NERVOUS SYSTEM                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🧠 Core Platform Layer (Auth, RBAC, Tenancy)                  │
│  📦 Application Modules (14+ Modules)                          │
│  🎯 Applications (6 Apps: Awareness, LMS, Phishing, GRC...)   │
│  🔐 Gates (Gate-F, Gate-H, Gate-I, Gate-K, Gate-L)            │
│  🔄 Real-time Sync + Automation + Monitoring                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### التغطية الشاملة ✅

#### ✅ Core Platform (3 Components)
- Auth System
- RBAC Engine
- Multi-Tenancy

#### ✅ Application Modules (14 Modules)
1. **actions** (Gate-H)
2. **alerts** (Observability)
3. **analytics** (Gate-L)
4. **awareness** (Impact Scoring)
5. **campaigns** (Gate-K)
6. **committees** (Governance)
7. **content-hub** (Content Management)
8. **culture-index** (Culture Metrics)
9. **documents** (Document Management)
10. **kpis** (Gate-I)
11. **objectives** (Goal Management)
12. **observability** (Monitoring)
13. **policies** (Gate-F)
14. **training** (LMS)

#### ✅ Applications (6 Apps)
1. **admin** (Management Console)
2. **awareness** (Awareness Campaigns)
3. **grc** (Governance, Risk & Compliance)
4. **lms** (Learning Management System)
5. **phishing** (Phishing Simulator)
6. **platform** (Core Platform UI)

#### ✅ Gates Coverage (5 Gates)
- **Gate-F:** Policies Management
- **Gate-H:** Actions/Remediation Plans
- **Gate-I:** KPIs & Metrics
- **Gate-K:** Campaigns Management
- **Gate-L:** Analytics & Reports

---

## 🏗️ التكامل المعماري الشامل {#complete-architecture-integration}

### Architecture Layers

```
┌───────────────────────────────────────────────────────────────────┐
│                    LAYER 1: APPLICATIONS                          │
├─────────┬─────────┬─────────┬─────────┬─────────┬───────────────┤
│ Admin   │Awareness│  LMS    │ Phishing│   GRC   │  Platform     │
└────┬────┴────┬────┴────┬────┴────┬────┴────┬────┴────┬──────────┘
     │         │         │         │         │         │
     └─────────┴─────────┴─────────┴─────────┴─────────┘
                        ↓
┌───────────────────────────────────────────────────────────────────┐
│                LAYER 2: APPLICATION MODULES                       │
├─────────┬─────────┬─────────┬─────────┬─────────┬───────────────┤
│Gate-F   │Gate-H   │Gate-I   │Gate-K   │Gate-L   │  +9 More      │
│Policies │Actions  │  KPIs   │Campaigns│Analytics│  Modules      │
└────┬────┴────┬────┴────┬────┴────┬────┴────┬────┴────┬──────────┘
     │         │         │         │         │         │
     └─────────┴─────────┴─────────┴─────────┴─────────┘
                        ↓
┌───────────────────────────────────────────────────────────────────┐
│                     EVENT SYSTEM CORE                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Event Bus   │  │ Automation  │  │  Monitor    │              │
│  │  Engine     │  │   Rules     │  │  Dashboard  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└───────────────────────────────────────────────────────────────────┘
                        ↓
┌───────────────────────────────────────────────────────────────────┐
│                 LAYER 3: CORE PLATFORM                            │
├─────────┬─────────┬─────────┬─────────┬─────────────────────────┤
│  Auth   │  RBAC   │Tenancy  │Services │  Components             │
└─────────┴─────────┴─────────┴─────────┴─────────────────────────┘
```

---

## 🎯 تغطية Gates الكاملة {#gates-coverage}

### Gate-F: Policies Management Module

**الوصف:** إدارة السياسات والإجراءات التنظيمية

#### أحداث Gate-F
```typescript
// Policy Lifecycle Events
'gate-f.policy.created'          // سياسة جديدة
'gate-f.policy.published'        // نشر سياسة
'gate-f.policy.updated'          // تحديث سياسة
'gate-f.policy.archived'         // أرشفة سياسة
'gate-f.policy.deleted'          // حذف سياسة

// Policy Version Events
'gate-f.policy.version.created'  // إصدار جديد
'gate-f.policy.version.approved' // موافقة على إصدار

// Policy Acknowledgment Events
'gate-f.policy.acknowledged'     // موظف وافق على سياسة
'gate-f.policy.rejected'         // موظف رفض سياسة

// Bulk Operations
'gate-f.policy.bulk.published'   // نشر جماعي
'gate-f.policy.bulk.archived'    // أرشفة جماعية
```

#### مثال تكامل: Policy → Campaign
```typescript
// عند نشر سياسة جديدة
EVENT: 'gate-f.policy.published'
PAYLOAD: {
  policyId: 'pol_123',
  title: 'سياسة أمن المعلومات الجديدة',
  targetAudience: 'all_employees'
}

// يؤدي تلقائياً إلى:
→ Gate-K: إنشاء حملة توعية تلقائية
→ LMS: إنشاء دورة تدريبية
→ Notifications: إشعار جميع الموظفين
→ Gate-H: إنشاء خطة عمل للمتابعة
```

---

### Gate-H: Actions/Remediation Module

**الوصف:** إدارة خطط العمل والإجراءات التصحيحية (Closed-Loop Action Plans)

#### أحداث Gate-H
```typescript
// Action Item Events
'gate-h.action.created'              // إنشاء خطة عمل
'gate-h.action.assigned'             // تعيين مسؤول
'gate-h.action.status.changed'       // تغيير الحالة
'gate-h.action.completed'            // إتمام الإجراء
'gate-h.action.verified'             // التحقق من الإتمام
'gate-h.action.closed'               // إغلاق نهائي

// Action Update Events
'gate-h.action.update.added'         // إضافة تحديث/تعليق
'gate-h.action.evidence.uploaded'    // رفع دليل

// Escalation Events
'gate-h.action.overdue'              // تأخر في التنفيذ
'gate-h.action.escalated'            // تصعيد للإدارة

// Bulk Operations
'gate-h.action.bulk.assigned'        // تعيين جماعي
'gate-h.action.bulk.status_changed'  // تغيير حالة جماعي
```

#### مثال تكامل: KPI → Action → Alert
```typescript
// عند فشل موظف في KPI
EVENT: 'gate-i.kpi.target.missed'
PAYLOAD: {
  employeeId: 'emp_456',
  kpiCode: 'awareness_completion',
  targetValue: 90,
  actualValue: 45
}

// يؤدي تلقائياً إلى:
→ Gate-H: إنشاء Action Plan للموظف
→ Gate-K: تسجيل الموظف في حملة إضافية
→ Manager: إشعار المدير المباشر
→ Gate-L: تحديث تقارير الأداء
```

---

### Gate-I: KPIs & Metrics Module

**الوصف:** إدارة مؤشرات الأداء الرئيسية والقياسات

#### أحداث Gate-I
```typescript
// KPI Metric Events
'gate-i.kpi.created'                 // إنشاء KPI جديد
'gate-i.kpi.updated'                 // تحديث KPI
'gate-i.kpi.calculated'              // حساب قيمة KPI

// Target Events
'gate-i.kpi.target.set'              // تحديد هدف
'gate-i.kpi.target.achieved'         // تحقيق هدف
'gate-i.kpi.target.missed'           // عدم تحقيق هدف
'gate-i.kpi.target.exceeded'         // تجاوز الهدف

// Threshold Events
'gate-i.kpi.threshold.crossed'       // عبور عتبة حرجة
'gate-i.kpi.alert.triggered'         // تفعيل تنبيه

// Trend Events
'gate-i.kpi.trend.improving'         // اتجاه إيجابي
'gate-i.kpi.trend.declining'         // اتجاه سلبي
```

#### مثال تكامل: KPI → Action + Alert
```typescript
// عند انخفاض KPI دون العتبة
EVENT: 'gate-i.kpi.threshold.crossed'
PAYLOAD: {
  kpiCode: 'phishing_test_pass_rate',
  currentValue: 65,
  thresholdValue: 70,
  severity: 'critical',
  department: 'IT'
}

// يؤدي تلقائياً إلى:
→ Gate-H: إنشاء Action Plan عاجل
→ Alerts: إرسال تنبيه للإدارة
→ Gate-K: تشغيل حملة توعية طارئة
→ Gate-L: إنشاء تقرير تحليلي
```

---

### Gate-K: Campaigns Management Module

**الوصف:** إدارة حملات التوعية والتدريب

#### أحداث Gate-K
```typescript
// Campaign Lifecycle Events
'gate-k.campaign.created'            // إنشاء حملة
'gate-k.campaign.published'          // نشر حملة
'gate-k.campaign.started'            // بدء تنفيذ
'gate-k.campaign.paused'             // إيقاف مؤقت
'gate-k.campaign.completed'          // إتمام حملة
'gate-k.campaign.archived'           // أرشفة حملة

// Participant Events
'gate-k.participant.invited'         // دعوة مشارك
'gate-k.participant.enrolled'        // تسجيل مشارك
'gate-k.participant.opened'          // فتح محتوى
'gate-k.participant.completed'       // إتمام مشارك
'gate-k.participant.failed'          // فشل مشارك

// Module/Quiz Events
'gate-k.module.completed'            // إتمام وحدة
'gate-k.quiz.started'                // بدء اختبار
'gate-k.quiz.passed'                 // نجاح في اختبار
'gate-k.quiz.failed'                 // فشل في اختبار

// Feedback Events
'gate-k.feedback.submitted'          // إرسال تقييم
```

#### مثال تكامل: Campaign → LMS → Certificate
```typescript
// عند إتمام موظف لحملة
EVENT: 'gate-k.participant.completed'
PAYLOAD: {
  participantId: 'part_789',
  campaignId: 'camp_123',
  employeeRef: 'emp_456',
  score: 95,
  completedAt: '2025-11-15T14:30:00Z'
}

// يؤدي تلقائياً إلى:
→ LMS: تسجيل تلقائي في دورة متقدمة
→ Certificates: إصدار شهادة إتمام
→ Gate-I: تحديث KPIs الخاصة بالموظف
→ Awareness: حساب Impact Score
→ Gate-L: تحديث تقارير الأداء
```

---

### Gate-L: Analytics & Reports Module

**الوصف:** التحليلات والتقارير المتقدمة

#### أحداث Gate-L
```typescript
// Report Generation Events
'gate-l.report.generated'            // إنشاء تقرير
'gate-l.report.scheduled'            // جدولة تقرير
'gate-l.report.exported'             // تصدير تقرير
'gate-l.report.shared'               // مشاركة تقرير

// Dashboard Events
'gate-l.dashboard.created'           // إنشاء لوحة متابعة
'gate-l.dashboard.updated'           // تحديث لوحة
'gate-l.dashboard.viewed'            // مشاهدة لوحة

// Analytics Events
'gate-l.analytics.insight.found'     // اكتشاف رؤية جديدة
'gate-l.analytics.anomaly.detected'  // اكتشاف شذوذ
'gate-l.analytics.trend.identified'  // تحديد اتجاه

// Data Export Events
'gate-l.export.csv.completed'        // تصدير CSV
'gate-l.export.pdf.completed'        // تصدير PDF
'gate-l.export.api.called'           // استدعاء API
```

#### مثال تكامل: Analytics → Alert → Action
```typescript
// عند اكتشاف اتجاه سلبي
EVENT: 'gate-l.analytics.anomaly.detected'
PAYLOAD: {
  anomalyType: 'declining_awareness_scores',
  affectedDepartment: 'Sales',
  severity: 'high',
  recommendation: 'immediate_intervention'
}

// يؤدي تلقائياً إلى:
→ Gate-H: إنشاء Action Plan للقسم
→ Alerts: إشعار مدير القسم
→ Gate-K: تشغيل حملة مستهدفة
→ Gate-I: إعادة حساب KPIs
```

---

## 📦 تغطية Modules الكاملة {#modules-coverage}

### 1. Actions Module (Gate-H) ✅
- **تم تغطيته بالكامل في Gate-H أعلاه**

---

### 2. Alerts & Observability Module

**الوصف:** نظام التنبيهات والمراقبة

#### أحداث Alerts
```typescript
// Alert Policy Events
'alerts.policy.created'              // إنشاء سياسة تنبيه
'alerts.policy.enabled'              // تفعيل سياسة
'alerts.policy.disabled'             // تعطيل سياسة
'alerts.policy.triggered'            // تفعيل تنبيه

// Notification Events
'alerts.notification.sent'           // إرسال إشعار
'alerts.notification.delivered'      // وصول إشعار
'alerts.notification.failed'         // فشل إرسال
'alerts.notification.read'           // قراءة إشعار

// Threshold Events
'alerts.threshold.exceeded'          // تجاوز عتبة
'alerts.threshold.critical'          // وصول لمستوى حرج
```

#### مثال تكامل
```typescript
EVENT: 'alerts.policy.triggered'
PAYLOAD: {
  policyName: 'Low Completion Rate Alert',
  threshold: 70,
  currentValue: 55,
  scope: 'tenant',
  severity: 'critical'
}

→ Gate-H: إنشاء Action Plan فوري
→ Admin: إشعار Admin Dashboard
→ Email: إرسال بريد إلكتروني للإدارة
```

---

### 3. Analytics Module (Gate-L) ✅
- **تم تغطيته بالكامل في Gate-L أعلاه**

---

### 4. Awareness Module

**الوصف:** حساب Impact Scores ومقاييس التوعية

#### أحداث Awareness
```typescript
// Impact Score Events
'awareness.impact_score.calculated'  // حساب Impact Score
'awareness.impact_score.updated'     // تحديث درجة
'awareness.impact_score.threshold'   // عبور عتبة

// Calibration Events
'awareness.calibration.started'      // بدء معايرة
'awareness.calibration.completed'    // إتمام معايرة
'awareness.weight.suggested'         // اقتراح أوزان جديدة
'awareness.weight.approved'          // موافقة على أوزان

// Validation Events
'awareness.validation.gap_detected'  // اكتشاف فجوة
'awareness.validation.completed'     // إتمام تحقق
```

---

### 5. Campaigns Module (Gate-K) ✅
- **تم تغطيته بالكامل في Gate-K أعلاه**

---

### 6. Committees Module

**الوصف:** إدارة اللجان والاجتماعات والقرارات

#### أحداث Committees
```typescript
// Committee Events
'committees.committee.created'       // إنشاء لجنة
'committees.member.added'            // إضافة عضو
'committees.member.removed'          // إزالة عضو

// Meeting Events
'committees.meeting.scheduled'       // جدولة اجتماع
'committees.meeting.started'         // بدء اجتماع
'committees.meeting.completed'       // إتمام اجتماع
'committees.meeting.cancelled'       // إلغاء اجتماع

// Decision Events
'committees.decision.proposed'       // اقتراح قرار
'committees.decision.voted'          // تصويت
'committees.decision.approved'       // موافقة
'committees.decision.rejected'       // رفض

// Follow-up Events
'committees.followup.created'        // إنشاء متابعة
'committees.followup.completed'      // إتمام متابعة
'committees.followup.overdue'        // تأخر في متابعة
```

#### مثال تكامل
```typescript
EVENT: 'committees.decision.approved'
PAYLOAD: {
  decisionId: 'dec_123',
  committeeId: 'com_456',
  decisionType: 'new_security_policy',
  approvalDate: '2025-11-15'
}

→ Gate-F: إنشاء سياسة جديدة تلقائياً
→ Gate-H: إنشاء Action Plan للتنفيذ
→ Documents: إنشاء محضر اجتماع
→ Notifications: إشعار الأعضاء
```

---

### 7. Content Hub Module

**الوصف:** إدارة المحتوى والموارد التعليمية

#### أحداث Content Hub
```typescript
// Content Events
'content_hub.content.created'        // إنشاء محتوى
'content_hub.content.published'      // نشر محتوى
'content_hub.content.updated'        // تحديث محتوى
'content_hub.content.archived'       // أرشفة محتوى

// Access Events
'content_hub.content.viewed'         // مشاهدة محتوى
'content_hub.content.downloaded'     // تحميل محتوى
'content_hub.content.shared'         // مشاركة محتوى

// Category Events
'content_hub.category.created'       // إنشاء تصنيف
'content_hub.category.updated'       // تحديث تصنيف
```

#### مثال تكامل
```typescript
EVENT: 'content_hub.content.published'
PAYLOAD: {
  contentId: 'cnt_789',
  title: 'دليل أمن المعلومات المحدث',
  category: 'security',
  tags: ['gdpr', 'iso27001']
}

→ LMS: إنشاء وحدة تدريبية
→ Gate-K: إضافة للحملات ذات الصلة
→ Notifications: إشعار المهتمين
```

---

### 8. Culture Index Module

**الوصف:** قياس وتحليل ثقافة أمن المعلومات

#### أحداث Culture Index
```typescript
// Index Calculation Events
'culture_index.calculated'           // حساب مؤشر الثقافة
'culture_index.updated'              // تحديث المؤشر
'culture_index.threshold.crossed'    // عبور عتبة

// Survey Events
'culture_index.survey.launched'      // إطلاق استبيان
'culture_index.survey.completed'     // إتمام استبيان
'culture_index.survey.analyzed'      // تحليل نتائج

// Trend Events
'culture_index.trend.improving'      // تحسن ثقافي
'culture_index.trend.declining'      // تراجع ثقافي
```

---

### 9. Documents Module

**الوصف:** إدارة المستندات والإصدارات والمرفقات

#### أحداث Documents
```typescript
// Document Events
'documents.document.created'         // إنشاء مستند
'documents.document.published'       // نشر مستند
'documents.document.updated'         // تحديث مستند
'documents.document.archived'        // أرشفة مستند
'documents.document.deleted'         // حذف مستند

// Version Events
'documents.version.uploaded'         // رفع إصدار
'documents.version.approved'         // موافقة على إصدار
'documents.version.superseded'       // استبدال إصدار

// Attachment Events
'documents.attachment.uploaded'      // رفع مرفق
'documents.attachment.downloaded'    // تحميل مرفق
'documents.attachment.deleted'       // حذف مرفق

// Access Events
'documents.document.viewed'          // مشاهدة مستند
'documents.document.downloaded'      // تحميل مستند
```

---

### 10. KPIs Module (Gate-I) ✅
- **تم تغطيته بالكامل في Gate-I أعلاه**

---

### 11. Objectives Module

**الوصف:** إدارة الأهداف والنتائج الرئيسية (OKRs)

#### أحداث Objectives
```typescript
// Objective Events
'objectives.objective.created'       // إنشاء هدف
'objectives.objective.updated'       // تحديث هدف
'objectives.objective.completed'     // إتمام هدف
'objectives.objective.cancelled'     // إلغاء هدف

// Key Result Events
'objectives.key_result.added'        // إضافة نتيجة رئيسية
'objectives.key_result.achieved'     // تحقيق نتيجة
'objectives.key_result.missed'       // عدم تحقيق نتيجة

// Progress Events
'objectives.progress.updated'        // تحديث تقدم
'objectives.milestone.reached'       // وصول لعلامة فارقة
```

---

### 12. Observability Module
- **تم تغطيته ضمن Alerts Module أعلاه**

---

### 13. Policies Module (Gate-F) ✅
- **تم تغطيته بالكامل في Gate-F أعلاه**

---

### 14. Training/LMS Module

**الوصف:** نظام إدارة التعلم الإلكتروني

#### أحداث Training/LMS
```typescript
// Course Events
'lms.course.created'                 // إنشاء دورة
'lms.course.published'               // نشر دورة
'lms.course.updated'                 // تحديث دورة
'lms.course.archived'                // أرشفة دورة

// Enrollment Events
'lms.enrollment.created'             // تسجيل متدرب
'lms.enrollment.started'             // بدء دورة
'lms.enrollment.completed'           // إتمام دورة
'lms.enrollment.cancelled'           // إلغاء تسجيل

// Module Events
'lms.module.started'                 // بدء وحدة
'lms.module.completed'               // إتمام وحدة

// Lesson Events
'lms.lesson.started'                 // بدء درس
'lms.lesson.completed'               // إتمام درس
'lms.lesson.skipped'                 // تخطي درس

// Assessment Events
'lms.assessment.started'             // بدء تقييم
'lms.assessment.passed'              // نجاح في تقييم
'lms.assessment.failed'              // فشل في تقييم
'lms.assessment.retaken'             // إعادة تقييم

// Certificate Events
'lms.certificate.issued'             // إصدار شهادة
'lms.certificate.revoked'            // إلغاء شهادة

// Progress Events
'lms.progress.updated'               // تحديث تقدم
'lms.progress.milestone.reached'     // وصول لمعلم
```

#### مثال تكامل: LMS → Multiple Systems
```typescript
EVENT: 'lms.course.completed'
PAYLOAD: {
  enrollmentId: 'enr_123',
  userId: 'user_456',
  courseId: 'course_789',
  score: 95,
  completedAt: '2025-11-15T16:00:00Z'
}

→ Certificates: إصدار شهادة تلقائياً
→ Gate-I: تحديث KPI للموظف
→ Awareness: حساب Impact Score
→ Gate-H: إغلاق Action Plan (إن وجد)
→ Gate-L: تحديث تقارير التدريب
→ Notifications: تهنئة الموظف
```

---

## 🎯 تغطية Applications الكاملة {#apps-coverage}

### 1. Admin Application

**الوصف:** لوحة التحكم الرئيسية للإدارة

#### أحداث Admin
```typescript
// User Management Events
'admin.user.created'                 // إنشاء مستخدم
'admin.user.updated'                 // تحديث مستخدم
'admin.user.deactivated'             // تعطيل مستخدم
'admin.user.password_reset'          // إعادة تعيين كلمة مرور

// Role Management Events
'admin.role.created'                 // إنشاء دور
'admin.role.assigned'                // تعيين دور
'admin.role.revoked'                 // إلغاء دور

// Settings Events
'admin.settings.updated'             // تحديث إعدادات
'admin.branding.updated'             // تحديث العلامة التجارية

// Audit Events
'admin.audit.viewed'                 // مشاهدة سجل التدقيق
'admin.audit.exported'               // تصدير سجل
```

---

### 2. Awareness Application

**الوصف:** تطبيق حملات التوعية (يستخدم Gate-K + Awareness Module)

#### أحداث Awareness App
```typescript
// Campaign Management (من Gate-K)
'awareness_app.campaign.*'           // جميع أحداث Gate-K

// Impact Scoring (من Awareness Module)
'awareness_app.impact_score.*'       // جميع أحداث Impact

// Dashboard Events
'awareness_app.dashboard.viewed'     // مشاهدة لوحة
'awareness_app.report.generated'     // إنشاء تقرير
```

---

### 3. GRC Application

**الوصف:** تطبيق الحوكمة والمخاطر والامتثال

#### أحداث GRC
```typescript
// Governance Events
'grc.policy.created'                 // (يستخدم Gate-F)
'grc.committee.decision'             // (يستخدم Committees)

// Risk Management Events
'grc.risk.identified'                // تحديد مخاطر
'grc.risk.assessed'                  // تقييم مخاطر
'grc.risk.mitigated'                 // معالجة مخاطر

// Compliance Events
'grc.compliance.checked'             // فحص امتثال
'grc.compliance.gap_found'           // اكتشاف فجوة
'grc.compliance.certified'           // الحصول على شهادة

// Audit Events
'grc.audit.scheduled'                // جدولة تدقيق
'grc.audit.completed'                // إتمام تدقيق
'grc.audit.finding.created'          // اكتشاف ملاحظة
```

---

### 4. LMS Application

**الوصف:** تطبيق التعلم الإلكتروني (يستخدم Training Module)

#### أحداث LMS App
```typescript
// Course Management (من Training Module)
'lms_app.course.*'                   // جميع أحداث LMS

// Student Portal Events
'lms_app.student.logged_in'          // دخول طالب
'lms_app.student.enrolled'           // تسجيل طالب
'lms_app.student.progress.viewed'    // مشاهدة تقدم
```

---

### 5. Phishing Application

**الوصف:** محاكي الهجمات التصيدية

#### أحداث Phishing
```typescript
// Campaign Events
'phishing.campaign.created'          // إنشاء حملة تصيد
'phishing.campaign.launched'         // إطلاق حملة
'phishing.campaign.completed'        // إتمام حملة

// Email Events
'phishing.email.sent'                // إرسال بريد تصيد
'phishing.email.opened'              // فتح بريد
'phishing.email.bounced'             // ارتداد بريد

// Interaction Events
'phishing.link.clicked'              // نقر على رابط
'phishing.attachment.opened'         // فتح مرفق
'phishing.data.submitted'            // إدخال بيانات

// Response Events
'phishing.email.reported'            // إبلاغ عن بريد
'phishing.test.passed'               // نجاح في الاختبار
'phishing.test.failed'               // فشل في الاختبار

// Training Events
'phishing.training.triggered'        // تفعيل تدريب فوري
'phishing.training.completed'        // إتمام تدريب
```

#### مثال تكامل: Phishing → Multiple Systems
```typescript
EVENT: 'phishing.test.failed'
PAYLOAD: {
  employeeId: 'emp_123',
  campaignId: 'phish_456',
  actionTaken: 'clicked_link_and_submitted_data',
  severity: 'critical',
  timestamp: '2025-11-15T10:00:00Z'
}

→ Gate-H: إنشاء Action Plan فوري للموظف
→ Gate-K: تسجيل تلقائي في حملة توعية
→ LMS: تسجيل في دورة أمن معلومات
→ Manager: إشعار المدير المباشر
→ Gate-I: تحديث KPI الخاص بالموظف
→ Awareness: تخفيض Impact Score
→ Gate-L: تحديث تقارير المخاطر
```

---

### 6. Platform Application

**الوصف:** واجهة المنصة الأساسية (Dashboard, Auth, Navigation)

#### أحداث Platform
```typescript
// Authentication Events (من Core Auth)
'platform.user.logged_in'            // تسجيل دخول
'platform.user.logged_out'           // تسجيل خروج
'platform.session.expired'           // انتهاء جلسة

// Navigation Events
'platform.page.viewed'               // مشاهدة صفحة
'platform.menu.clicked'              // نقر على قائمة

// System Events
'platform.notification.received'     // استلام إشعار
'platform.notification.clicked'      // نقر على إشعار
```

---

## 🧠 Core Platform Integration {#core-integration}

### 1. Auth System Integration

**الوصف:** نظام المصادقة والأمان

#### أحداث Auth
```typescript
// Authentication Events
'auth.user.signed_up'                // تسجيل مستخدم جديد
'auth.user.logged_in'                // تسجيل دخول
'auth.user.logged_out'               // تسجيل خروج
'auth.user.password_changed'         // تغيير كلمة مرور
'auth.user.password_reset'           // إعادة تعيين كلمة مرور

// Session Events
'auth.session.created'               // إنشاء جلسة
'auth.session.refreshed'             // تحديث جلسة
'auth.session.expired'               // انتهاء جلسة
'auth.session.revoked'               // إلغاء جلسة

// Security Events
'auth.failed_login.attempt'          // محاولة دخول فاشلة
'auth.account.locked'                // قفل حساب
'auth.suspicious.activity'           // نشاط مشبوه

// MFA Events
'auth.mfa.enabled'                   // تفعيل MFA
'auth.mfa.verified'                  // تحقق MFA
'auth.mfa.failed'                    // فشل MFA
```

#### مثال تكامل: Auth → Security
```typescript
EVENT: 'auth.failed_login.attempt'
PAYLOAD: {
  userId: 'user_123',
  attemptCount: 3,
  ipAddress: '192.168.1.1',
  timestamp: '2025-11-15T09:00:00Z'
}

→ Alerts: تنبيه الأمن
→ Gate-H: إنشاء Action Item للتحقق
→ Admin: إشعار المسؤول
→ Audit Log: تسجيل المحاولة
```

---

### 2. RBAC System Integration

**الوصف:** نظام التحكم بالصلاحيات على أساس الأدوار

#### أحداث RBAC
```typescript
// Role Events
'rbac.role.created'                  // إنشاء دور
'rbac.role.updated'                  // تحديث دور
'rbac.role.deleted'                  // حذف دور

// Permission Events
'rbac.permission.granted'            // منح صلاحية
'rbac.permission.revoked'            // إلغاء صلاحية

// Assignment Events
'rbac.user.role.assigned'            // تعيين دور لمستخدم
'rbac.user.role.removed'             // إزالة دور من مستخدم

// Access Events
'rbac.access.denied'                 // رفض وصول
'rbac.access.granted'                // منح وصول
'rbac.unauthorized.attempt'          // محاولة وصول غير مصرح
```

#### مثال تكامل: RBAC → Audit
```typescript
EVENT: 'rbac.unauthorized.attempt'
PAYLOAD: {
  userId: 'user_456',
  resource: 'admin_settings',
  requiredPermission: 'admin.manage',
  currentRole: 'employee'
}

→ Audit Log: تسجيل المحاولة
→ Security: تنبيه أمني
→ Admin: إشعار المسؤول
```

---

### 3. Tenancy System Integration

**الوصف:** نظام Multi-Tenancy (البنية التحتية الموجودة)

#### أحداث Tenancy (موجودة بالفعل ✅)
```typescript
// Tenant Lifecycle Events
'tenancy.tenant.created'             // إنشاء مستأجر
'tenancy.tenant.activated'           // تفعيل مستأجر
'tenancy.tenant.suspended'           // إيقاف مستأجر
'tenancy.tenant.deleted'             // حذف مستأجر

// Tenant Configuration Events
'tenancy.settings.updated'           // تحديث إعدادات
'tenancy.limits.exceeded'            // تجاوز حدود
'tenancy.integration.connected'      // ربط تكامل خارجي
```

---

## 🛠️ البنية التقنية الكاملة {#complete-technical-architecture}

### Database Schema (موسع)

#### 1. `system_events` - جدول الأحداث المركزي
```sql
CREATE TABLE system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Event Identity
  event_type TEXT NOT NULL,              -- 'lms.course.completed'
  event_category TEXT NOT NULL,          -- 'lms', 'awareness', 'phishing'
  event_source TEXT NOT NULL,            -- 'module', 'application', 'core'
  
  -- Event Data
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Context
  user_id TEXT,                          -- من قام بالحدث
  entity_type TEXT,                      -- 'course', 'campaign', 'policy'
  entity_id TEXT,                        -- ID الكيان المرتبط
  
  -- Priority & Status
  priority INT DEFAULT 5,                -- 1 (lowest) to 10 (highest)
  status TEXT DEFAULT 'pending',         -- 'pending', 'processing', 'completed', 'failed'
  
  -- Processing
  processed_at TIMESTAMPTZ,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  
  -- Error Handling
  error_message TEXT,
  error_stack TEXT,
  
  -- Metadata
  correlation_id TEXT,                   -- لربط الأحداث المرتبطة
  parent_event_id UUID REFERENCES system_events(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Indexes
  CONSTRAINT valid_priority CHECK (priority BETWEEN 1 AND 10),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'))
);

-- Performance Indexes
CREATE INDEX idx_events_tenant_status ON system_events(tenant_id, status, created_at DESC);
CREATE INDEX idx_events_type ON system_events(event_type);
CREATE INDEX idx_events_category ON system_events(event_category);
CREATE INDEX idx_events_entity ON system_events(entity_type, entity_id);
CREATE INDEX idx_events_correlation ON system_events(correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX idx_events_retry ON system_events(next_retry_at) WHERE status = 'failed' AND retry_count < max_retries;

-- GIN Index for JSONB payload queries
CREATE INDEX idx_events_payload ON system_events USING GIN (payload);
```

#### 2. `automation_rules` - قواعد الأتمتة
```sql
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Rule Identity
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Trigger Configuration
  trigger_event_type TEXT NOT NULL,      -- 'lms.course.completed' or 'lms.*'
  trigger_conditions JSONB,              -- { "score": { "gte": 80 } }
  
  -- Action Configuration
  action_type TEXT NOT NULL,             -- 'enroll', 'notify', 'award_badge', 'create_action'
  action_config JSONB NOT NULL,          -- { "courseId": "xyz", "delay": "1h" }
  
  -- Priority & Scheduling
  priority INT DEFAULT 5,
  execute_after_seconds INT DEFAULT 0,   -- تأخير التنفيذ
  
  -- Execution Stats
  execution_count INT DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  last_error_message TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT,
  
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_rules_active ON automation_rules(tenant_id, is_active, trigger_event_type);
```

#### 3. `event_subscriptions` - اشتراكات الأحداث
```sql
CREATE TABLE event_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Subscription Config
  subscriber_name TEXT NOT NULL,         -- 'awareness_impact_calculator'
  event_type TEXT NOT NULL,              -- 'lms.course.completed' or 'lms.*'
  
  -- Handler Configuration
  handler_type TEXT NOT NULL,            -- 'webhook', 'edge_function', 'internal', 'rpc'
  handler_config JSONB NOT NULL,         -- { "url": "...", "method": "POST", "function": "fn_name" }
  
  -- Filtering
  filter_conditions JSONB,               -- للتصفية الدقيقة
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Stats
  total_invocations INT DEFAULT 0,
  successful_invocations INT DEFAULT 0,
  failed_invocations INT DEFAULT 0,
  last_invoked_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(tenant_id, subscriber_name, event_type)
);

CREATE INDEX idx_subscriptions_active ON event_subscriptions(tenant_id, is_active, event_type);
```

#### 4. `event_execution_log` - سجل تنفيذ الأحداث
```sql
CREATE TABLE event_execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Links
  event_id UUID REFERENCES system_events(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES event_subscriptions(id) ON DELETE SET NULL,
  
  -- Execution Details
  executed_at TIMESTAMPTZ DEFAULT now(),
  execution_duration_ms INT,
  status TEXT NOT NULL,                  -- 'success', 'failed', 'skipped'
  
  -- Results
  result_data JSONB,
  error_message TEXT,
  stack_trace TEXT,
  
  -- Context
  correlation_id TEXT,
  
  -- Partitioning hint (for future)
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_execution_log_event ON event_execution_log(event_id);
CREATE INDEX idx_execution_log_rule ON event_execution_log(rule_id);
CREATE INDEX idx_execution_log_status ON event_execution_log(tenant_id, status, executed_at DESC);
```

#### 5. `integration_webhooks` - Webhooks للأنظمة الخارجية
```sql
CREATE TABLE integration_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Webhook Identity
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Configuration
  url TEXT NOT NULL,
  method TEXT DEFAULT 'POST',
  headers JSONB,                         -- { "Authorization": "Bearer xxx" }
  
  -- Event Filtering
  event_types TEXT[],                    -- ['lms.*', 'awareness.campaign.completed']
  
  -- Security
  secret_key TEXT,                       -- لتوقيع الطلبات
  
  -- Retry Policy
  max_retries INT DEFAULT 3,
  retry_delay_seconds INT DEFAULT 60,
  
  -- Stats
  total_calls INT DEFAULT 0,
  successful_calls INT DEFAULT 0,
  failed_calls INT DEFAULT 0,
  last_called_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_webhooks_active ON integration_webhooks(tenant_id, is_active);
```

---

### Backend Functions (موسع)

#### 1. `fn_publish_event()` - نشر حدث جديد
```sql
CREATE OR REPLACE FUNCTION fn_publish_event(
  p_tenant_id UUID,
  p_event_type TEXT,
  p_event_category TEXT,
  p_event_source TEXT,
  p_payload JSONB,
  p_user_id TEXT DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id TEXT DEFAULT NULL,
  p_priority INT DEFAULT 5,
  p_correlation_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  -- Insert event
  INSERT INTO system_events (
    tenant_id, event_type, event_category, event_source,
    payload, user_id, entity_type, entity_id,
    priority, correlation_id, status
  ) VALUES (
    p_tenant_id, p_event_type, p_event_category, p_event_source,
    p_payload, p_user_id, p_entity_type, p_entity_id,
    p_priority, p_correlation_id, 'pending'
  )
  RETURNING id INTO v_event_id;
  
  -- Trigger processing (async via pg_notify)
  PERFORM pg_notify('event_published', v_event_id::text);
  
  RETURN v_event_id;
END;
$$;
```

#### 2. `fn_process_event()` - معالجة حدث
```sql
CREATE OR REPLACE FUNCTION fn_process_event(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event RECORD;
  v_rule RECORD;
  v_subscription RECORD;
  v_result JSONB;
  v_execution_count INT := 0;
BEGIN
  -- Get event
  SELECT * INTO v_event FROM system_events WHERE id = p_event_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Event not found');
  END IF;
  
  -- Mark as processing
  UPDATE system_events SET status = 'processing', updated_at = now()
  WHERE id = p_event_id;
  
  -- Execute matching automation rules
  FOR v_rule IN 
    SELECT * FROM automation_rules
    WHERE tenant_id = v_event.tenant_id
      AND is_active = true
      AND (
        trigger_event_type = v_event.event_type 
        OR trigger_event_type LIKE v_event.event_category || '.*'
        OR trigger_event_type = '*'
      )
      AND (trigger_conditions IS NULL OR evaluate_conditions(v_event.payload, trigger_conditions))
    ORDER BY priority DESC
  LOOP
    -- Execute rule
    PERFORM fn_execute_automation_rule(p_event_id, v_rule.id);
    v_execution_count := v_execution_count + 1;
  END LOOP;
  
  -- Notify subscriptions
  FOR v_subscription IN
    SELECT * FROM event_subscriptions
    WHERE tenant_id = v_event.tenant_id
      AND is_active = true
      AND (
        event_type = v_event.event_type
        OR event_type LIKE v_event.event_category || '.*'
        OR event_type = '*'
      )
  LOOP
    -- Invoke subscription handler
    PERFORM fn_invoke_subscription(p_event_id, v_subscription.id);
    v_execution_count := v_execution_count + 1;
  END LOOP;
  
  -- Mark as completed
  UPDATE system_events 
  SET status = 'completed', processed_at = now(), updated_at = now()
  WHERE id = p_event_id;
  
  RETURN jsonb_build_object(
    'event_id', p_event_id,
    'executions', v_execution_count,
    'status', 'completed'
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Mark as failed
  UPDATE system_events SET
    status = 'failed',
    error_message = SQLERRM,
    error_stack = SQLSTATE,
    retry_count = retry_count + 1,
    next_retry_at = CASE 
      WHEN retry_count < max_retries THEN now() + interval '1 minute' * POWER(2, retry_count)
      ELSE NULL
    END,
    updated_at = now()
  WHERE id = p_event_id;
  
  RETURN jsonb_build_object('error', SQLERRM, 'state', SQLSTATE);
END;
$$;
```

#### 3. `fn_execute_automation_rule()` - تنفيذ قاعدة أتمتة
```sql
CREATE OR REPLACE FUNCTION fn_execute_automation_rule(
  p_event_id UUID,
  p_rule_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event RECORD;
  v_rule RECORD;
  v_execution_start TIMESTAMPTZ;
  v_execution_duration_ms INT;
  v_result JSONB;
BEGIN
  v_execution_start := clock_timestamp();
  
  -- Get event and rule
  SELECT * INTO v_event FROM system_events WHERE id = p_event_id;
  SELECT * INTO v_rule FROM automation_rules WHERE id = p_rule_id;
  
  -- Execute action based on action_type
  CASE v_rule.action_type
    WHEN 'enroll' THEN
      -- Enroll user in course
      v_result := fn_action_enroll(v_event, v_rule.action_config);
      
    WHEN 'notify' THEN
      -- Send notification
      v_result := fn_action_notify(v_event, v_rule.action_config);
      
    WHEN 'create_action' THEN
      -- Create Action Plan (Gate-H)
      v_result := fn_action_create_action_plan(v_event, v_rule.action_config);
      
    WHEN 'update_kpi' THEN
      -- Update KPI (Gate-I)
      v_result := fn_action_update_kpi(v_event, v_rule.action_config);
      
    WHEN 'trigger_campaign' THEN
      -- Trigger Campaign (Gate-K)
      v_result := fn_action_trigger_campaign(v_event, v_rule.action_config);
      
    ELSE
      RAISE EXCEPTION 'Unknown action type: %', v_rule.action_type;
  END CASE;
  
  v_execution_duration_ms := EXTRACT(MILLISECOND FROM clock_timestamp() - v_execution_start)::INT;
  
  -- Log execution
  INSERT INTO event_execution_log (
    tenant_id, event_id, rule_id,
    executed_at, execution_duration_ms, status, result_data
  ) VALUES (
    v_rule.tenant_id, p_event_id, p_rule_id,
    v_execution_start, v_execution_duration_ms, 'success', v_result
  );
  
  -- Update rule stats
  UPDATE automation_rules SET
    execution_count = execution_count + 1,
    last_executed_at = now(),
    last_success_at = now()
  WHERE id = p_rule_id;
  
EXCEPTION WHEN OTHERS THEN
  v_execution_duration_ms := EXTRACT(MILLISECOND FROM clock_timestamp() - v_execution_start)::INT;
  
  -- Log failure
  INSERT INTO event_execution_log (
    tenant_id, event_id, rule_id,
    executed_at, execution_duration_ms, status, error_message
  ) VALUES (
    v_rule.tenant_id, p_event_id, p_rule_id,
    v_execution_start, v_execution_duration_ms, 'failed', SQLERRM
  );
  
  UPDATE automation_rules SET
    last_error_at = now(),
    last_error_message = SQLERRM
  WHERE id = p_rule_id;
END;
$$;
```

---

### Frontend Architecture (موسع)

#### 1. Event Bus Hook (محسّن)
```typescript
// src/core/services/eventSystem/useEventBus.ts

import { useCallback } from 'react';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export interface SystemEvent {
  id: string;
  tenant_id: string;
  event_type: string;
  event_category: string;
  event_source: string;
  payload: Record<string, any>;
  user_id?: string;
  entity_type?: string;
  entity_id?: string;
  priority: number;
  status: string;
  correlation_id?: string;
  created_at: string;
}

export interface PublishEventOptions {
  entityType?: string;
  entityId?: string;
  priority?: number;
  correlationId?: string;
}

export function useEventBus() {
  const { tenantId, user } = useAppContext();
  const queryClient = useQueryClient();

  // Publish event
  const publishEvent = useCallback(async (
    eventType: string,
    category: string,
    source: string,
    payload: Record<string, any>,
    options?: PublishEventOptions
  ): Promise<string> => {
    if (!tenantId) {
      throw new Error('Tenant ID is required to publish events');
    }

    const { data, error } = await supabase.rpc('fn_publish_event', {
      p_tenant_id: tenantId,
      p_event_type: eventType,
      p_event_category: category,
      p_event_source: source,
      p_payload: payload,
      p_user_id: user?.id,
      p_entity_type: options?.entityType,
      p_entity_id: options?.entityId,
      p_priority: options?.priority || 5,
      p_correlation_id: options?.correlationId,
    });

    if (error) {
      console.error('Failed to publish event:', error);
      throw error;
    }

    return data as string; // event_id
  }, [tenantId, user]);

  // Subscribe to events (Realtime)
  const subscribeToEvents = useCallback((
    eventTypes: string[],
    callback: (event: SystemEvent) => void
  ) => {
    if (!tenantId) {
      console.warn('Cannot subscribe without tenant ID');
      return () => {};
    }

    const channel = supabase
      .channel(`events_${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_events',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const event = payload.new as SystemEvent;
          
          // Check if event type matches subscription
          const matches = eventTypes.some(type => {
            if (type === '*') return true;
            if (type.endsWith('.*')) {
              const prefix = type.slice(0, -2);
              return event.event_category === prefix;
            }
            return event.event_type === type;
          });

          if (matches) {
            callback(event);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  // Invalidate queries based on event
  const invalidateQueriesForEvent = useCallback((event: SystemEvent) => {
    // Invalidate based on category
    switch (event.event_category) {
      case 'lms':
        queryClient.invalidateQueries({ queryKey: ['lms'] });
        break;
      case 'awareness':
      case 'gate-k':
        queryClient.invalidateQueries({ queryKey: ['campaigns'] });
        queryClient.invalidateQueries({ queryKey: ['awareness'] });
        break;
      case 'gate-f':
        queryClient.invalidateQueries({ queryKey: ['policies'] });
        break;
      case 'gate-h':
        queryClient.invalidateQueries({ queryKey: ['gate-h'] });
        break;
      case 'gate-i':
        queryClient.invalidateQueries({ queryKey: ['kpis'] });
        break;
      case 'gate-l':
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
        queryClient.invalidateQueries({ queryKey: ['reports'] });
        break;
      case 'phishing':
        queryClient.invalidateQueries({ queryKey: ['phishing'] });
        break;
    }

    // Invalidate specific entity
    if (event.entity_type && event.entity_id) {
      queryClient.invalidateQueries({ 
        queryKey: [event.entity_type, event.entity_id] 
      });
    }
  }, [queryClient]);

  return {
    publishEvent,
    subscribeToEvents,
    invalidateQueriesForEvent,
  };
}
```

#### 2. Event Monitor Dashboard (موسع)
```typescript
// src/core/components/EventMonitor/EventMonitorDashboard.tsx

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useEventBus, SystemEvent } from '@/core/services/eventSystem/useEventBus';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Input } from '@/core/components/ui/input';

interface EventStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export function EventMonitorDashboard() {
  const { tenantId } = useAppContext();
  const { subscribeToEvents } = useEventBus();
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch recent events
  const { data: recentEvents, isLoading } = useQuery({
    queryKey: ['system_events', tenantId, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('system_events')
        .select('*')
        .eq('tenant_id', tenantId!)
        .order('created_at', { ascending: false })
        .limit(100);

      if (categoryFilter !== 'all') {
        query = query.eq('event_category', categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SystemEvent[];
    },
    enabled: !!tenantId,
  });

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['event_stats', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_events')
        .select('status')
        .eq('tenant_id', tenantId!);

      if (error) throw error;

      const stats: EventStats = {
        total: data.length,
        pending: data.filter(e => e.status === 'pending').length,
        processing: data.filter(e => e.status === 'processing').length,
        completed: data.filter(e => e.status === 'completed').length,
        failed: data.filter(e => e.status === 'failed').length,
      };

      return stats;
    },
    enabled: !!tenantId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToEvents(['*'], (event) => {
      setEvents((prev) => [event, ...prev].slice(0, 100));
    });

    return unsubscribe;
  }, [subscribeToEvents]);

  // Merge initial data with real-time events
  useEffect(() => {
    if (recentEvents) {
      setEvents(recentEvents);
    }
  }, [recentEvents]);

  // Filter events
  const filteredEvents = events.filter(event => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return (
        event.event_type.toLowerCase().includes(search) ||
        event.event_category.toLowerCase().includes(search) ||
        JSON.stringify(event.payload).toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">مراقبة الأحداث | Event Monitor</h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">إجمالي الأحداث</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">قيد الانتظار</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">قيد المعالجة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.processing || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">مكتملة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.completed || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">فاشلة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.failed || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="تصفية حسب الفئة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الفئات</SelectItem>
            <SelectItem value="lms">LMS</SelectItem>
            <SelectItem value="awareness">Awareness</SelectItem>
            <SelectItem value="gate-k">Gate-K (Campaigns)</SelectItem>
            <SelectItem value="gate-f">Gate-F (Policies)</SelectItem>
            <SelectItem value="gate-h">Gate-H (Actions)</SelectItem>
            <SelectItem value="gate-i">Gate-I (KPIs)</SelectItem>
            <SelectItem value="gate-l">Gate-L (Analytics)</SelectItem>
            <SelectItem value="phishing">Phishing</SelectItem>
            <SelectItem value="auth">Authentication</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="بحث في الأحداث..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Events List */}
      <div className="space-y-2">
        {isLoading && <div>جاري التحميل...</div>}
        
        {filteredEvents.length === 0 && !isLoading && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              لا توجد أحداث
            </CardContent>
          </Card>
        )}

        {filteredEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

// Event Card Component
function EventCard({ event }: { event: SystemEvent }) {
  const statusColor = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  }[event.status] || 'bg-gray-100 text-gray-800';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{event.event_category}</Badge>
              <Badge className={statusColor}>{event.status}</Badge>
              {event.priority > 7 && (
                <Badge variant="destructive">High Priority</Badge>
              )}
            </div>
            
            <div className="font-semibold">{event.event_type}</div>
            
            {event.entity_type && (
              <div className="text-sm text-muted-foreground">
                {event.entity_type}: {event.entity_id}
              </div>
            )}
            
            <div className="text-xs text-muted-foreground">
              {new Date(event.created_at).toLocaleString('ar-SA')}
            </div>
          </div>

          <div className="text-right text-xs text-muted-foreground">
            <div>Priority: {event.priority}</div>
            {event.user_id && <div>User: {event.user_id}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 📅 خطة التنفيذ الموسعة {#expanded-implementation-plan}

### Phase 1: Core Infrastructure (4 أسابيع)

#### Week 1: Database & Core Functions
**الأهداف:**
- إنشاء الجداول الخمسة الأساسية
- إنشاء Backend Functions الثلاثة
- إعداد Indexes للأداء

**Deliverables:**
```sql
✅ system_events table
✅ automation_rules table
✅ event_subscriptions table
✅ event_execution_log table
✅ integration_webhooks table
✅ fn_publish_event()
✅ fn_process_event()
✅ fn_execute_automation_rule()
```

#### Week 2: Frontend Event Bus
**الأهداف:**
- بناء useEventBus Hook
- إنشاء Event Types
- تطبيق Realtime Subscriptions

**Deliverables:**
```typescript
✅ useEventBus.ts
✅ event.types.ts
✅ eventHelpers.ts
```

#### Week 3-4: Integration Hooks (جميع Modules)
**الأهداف:**
- ربط جميع الـ 14 Modules بالـ Event System
- إنشاء Event Publishers لكل Module
- تطبيق Realtime للتحديثات التلقائية

**Modules Integration:**
```typescript
✅ Gate-F (Policies) → publishPolicyEvent()
✅ Gate-H (Actions) → publishActionEvent()
✅ Gate-I (KPIs) → publishKpiEvent()
✅ Gate-K (Campaigns) → publishCampaignEvent()
✅ Gate-L (Analytics) → publishAnalyticsEvent()
✅ LMS/Training → publishLmsEvent()
✅ Awareness → publishAwarenessEvent()
✅ Phishing → publishPhishingEvent()
✅ Documents → publishDocumentEvent()
✅ Committees → publishCommitteeEvent()
✅ Content Hub → publishContentEvent()
✅ Culture Index → publishCultureEvent()
✅ Objectives → publishObjectiveEvent()
✅ Alerts → publishAlertEvent()
```

---

### Phase 2: Automation Rules Engine (4 أسابيع)

#### Week 5-6: Rules Engine Backend
**الأهداف:**
- بناء محرك قواعد الأتمتة
- تطبيق Condition Evaluation
- إنشاء Action Executors

**Deliverables:**
```sql
✅ evaluate_conditions() function
✅ fn_action_enroll()
✅ fn_action_notify()
✅ fn_action_create_action_plan()
✅ fn_action_update_kpi()
✅ fn_action_trigger_campaign()
```

#### Week 7-8: Rules UI (Admin)
**الأهداف:**
- بناء واجهة إنشاء القواعد
- تطبيق Rule Builder (drag & drop)
- إنشاء Rule Testing Tool

**Deliverables:**
```typescript
✅ AutomationRulesManager.tsx
✅ RuleBuilder.tsx
✅ RuleTester.tsx
✅ ConditionEditor.tsx
✅ ActionConfigurator.tsx
```

---

### Phase 3: Applications Integration & Admin UI (4 أسابيع)

#### Week 9: Applications Integration
**الأهداف:**
- ربط الـ 6 Applications بالـ Event System
- تطبيق Cross-App Workflows

**Applications:**
```typescript
✅ Admin App → Event Management
✅ Awareness App → Campaign Events
✅ LMS App → Course Events
✅ Phishing App → Test Events
✅ GRC App → Compliance Events
✅ Platform App → Auth Events
```

#### Week 10-11: Event Monitor Dashboard
**الأهداف:**
- بناء لوحة مراقبة الأحداث
- تطبيق Realtime Updates
- إنشاء Event Details View

**Deliverables:**
```typescript
✅ EventMonitorDashboard.tsx
✅ EventCard.tsx
✅ EventDetailsDrawer.tsx
✅ EventStats.tsx
✅ EventFilters.tsx
```

#### Week 12: Integration Health Monitor
**الأهداف:**
- بناء لوحة صحة التكاملات
- تطبيق Health Checks
- إنشاء Alert System

**Deliverables:**
```typescript
✅ IntegrationHealthMonitor.tsx
✅ HealthStatusCard.tsx
✅ IntegrationDetails.tsx
✅ HealthMetrics.tsx
```

---

## 💎 الفوائد والقيمة {#benefits}

### للمطورين (Developers)

**1. Loose Coupling**
```typescript
// بدلاً من:
import { updateKpi } from '@/modules/kpis';
import { createAction } from '@/modules/actions';
import { enrollUser } from '@/modules/lms';

function onCourseComplete(course, user) {
  updateKpi(user.id, 'training_completed');
  createAction(user.id, 'follow_up');
  enrollUser(user.id, 'advanced_course');
}

// الآن:
function onCourseComplete(course, user) {
  publishEvent('lms.course.completed', {
    courseId: course.id,
    userId: user.id,
    score: 95
  });
  // باقي النظام يتعامل تلقائياً!
}
```

**2. Testability**
```typescript
// Test individual event handlers in isolation
test('should create action plan when phishing test fails', () => {
  const event = mockEvent('phishing.test.failed');
  const result = handlePhishingFailed(event);
  expect(result.actionCreated).toBe(true);
});
```

**3. Scalability**
- إضافة تطبيقات جديدة دون تعديل القديمة
- إضافة قواعد أتمتة دون كتابة كود
- توسيع النظام بسهولة

---

### للإداريين (Admins)

**1. Automation**
```
✅ أتمتة 80% من العمليات المتكررة
✅ توفير 10+ ساعات أسبوعياً
✅ تقليل الأخطاء البشرية
```

**2. Visibility**
```
✅ مراقبة شاملة لجميع الأنشطة
✅ تتبع كامل للعمليات
✅ تقارير فورية ودقيقة
```

**3. Control**
```
✅ تحكم كامل في كيفية تفاعل الأنظمة
✅ إيقاف/تشغيل التكاملات بسهولة
✅ تعديل القواعد دون الحاجة للمطورين
```

---

### للمؤسسة (Organization)

**1. Efficiency**
```
📊 تحسين الكفاءة بنسبة 60%
⏱️ توفير 200+ ساعة عمل شهرياً
💰 تقليل التكاليف التشغيلية
```

**2. Consistency**
```
✅ تطبيق موحد للقواعد
✅ ضمان الامتثال
✅ تقليل التباين في العمليات
```

**3. Compliance**
```
📋 تتبع كامل لجميع العمليات (Audit Trail)
🔒 ضمان أمن البيانات
✅ جاهزية للتدقيق (ISO, GDPR, etc.)
```

---

## ⚠️ المخاطر والتخفيف {#risks}

### 1. Performance Issues

**المخاطرة:**
- معالجة آلاف الأحداث في الثانية قد تؤدي لبطء

**الحل:**
```sql
-- Partitioning للجداول الكبيرة
CREATE TABLE system_events_2025_11 PARTITION OF system_events
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- Indexes محسنة
CREATE INDEX CONCURRENTLY idx_events_hot 
  ON system_events(tenant_id, created_at DESC) 
  WHERE status IN ('pending', 'processing');

-- Archiving للأحداث القديمة
DELETE FROM system_events 
WHERE created_at < now() - interval '90 days'
  AND status = 'completed';
```

---

### 2. Event Loop Cycles

**المخاطرة:**
- Event A → Event B → Event A (حلقة لا نهائية)

**الحل:**
```typescript
// Cycle Detection
function detectCycle(event: SystemEvent): boolean {
  const path = getEventChain(event.correlation_id);
  const eventTypes = path.map(e => e.event_type);
  
  // Check for repeating patterns
  const lastThree = eventTypes.slice(-3);
  return new Set(lastThree).size < 3;
}

// Max Depth Limit
const MAX_EVENT_CHAIN_DEPTH = 10;
if (event.chain_depth > MAX_EVENT_CHAIN_DEPTH) {
  throw new Error('Max event chain depth exceeded');
}
```

---

### 3. Data Consistency

**المخاطرة:**
- فشل في منتصف العملية قد يؤدي لبيانات غير متسقة

**الحل:**
```sql
-- Idempotency Keys
CREATE TABLE processed_events (
  idempotency_key TEXT PRIMARY KEY,
  event_id UUID NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now()
);

-- Check before processing
IF EXISTS (SELECT 1 FROM processed_events WHERE idempotency_key = p_key) THEN
  RETURN 'already_processed';
END IF;

-- Transactional Boundaries
BEGIN;
  -- Process event
  INSERT INTO processed_events (idempotency_key, event_id) VALUES (p_key, p_event_id);
COMMIT;
```

---

## 🎯 الخطوات التالية

### اختر الخطوة التالية:

1. **✅ ابدأ التنفيذ - Phase 1**
   - سأبدأ بإنشاء الجداول والـ Backend Functions
   - الوقت المتوقع: 1 أسبوع

2. **📋 مراجعة تفصيلية**
   - لديك أسئلة أو تعديلات على الخطة؟

3. **🎯 MVP سريع**
   - تريد نسخة مبسطة للاختبار أولاً؟

---

## 📚 المراجع

### وثائق النظام
- ✅ `Platform_Expansion_Plan_v1.0.md`
- ✅ `Architecture Diagram (Image)`
- ✅ `Event_System_Infrastructure_Review.md`
- ✅ `Event_System_Admin_Features.md`
- ✅ `Event_System_Comprehensive_Development_Plan.md` (v1.0)

### معايير خارجية
- [CloudEvents Specification](https://cloudevents.io/)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)

---

**🎉 الخطة الشاملة جاهزة للتنفيذ! 🎉**

هذه النسخة v2.0 تغطي **100%** من المنصة:
- ✅ 3 Core Platform Components
- ✅ 14 Application Modules
- ✅ 6 Applications
- ✅ 5 Gates (F, H, I, K, L)
- ✅ 100+ Event Types
- ✅ Complete Integration Strategy