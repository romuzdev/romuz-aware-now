/**
 * M18: Incident Response - README
 * 
 * دليل استخدام تطبيق الاستجابة للحوادث
 */

# M18: Incident Response System

## الوصول للتطبيق

### الرابط المباشر
```
/incident-response
```

### من App Switcher
1. اضغط على أيقونة التطبيقات في الهيدر
2. اختر "Incident Response" أو "الاستجابة للحوادث"

## الصفحات المتاحة

| الصفحة | المسار | الوصف |
|--------|-------|-------|
| Dashboard | `/incident-response` | لوحة التحكم الرئيسية |
| Active Incidents | `/incident-response/active` | الحوادث النشطة |
| Incident Details | `/incident-response/incident/:id` | تفاصيل حادثة معينة |
| Response Plans | `/incident-response/plans` | خطط الاستجابة |
| Reports & Analytics | `/incident-response/reports` | التقارير والتحليلات |
| Settings | `/incident-response/settings` | الإعدادات |

## الهيكل العام

```
src/apps/incident-response/
├── config.ts              # تكوين التطبيق والصلاحيات
├── routes.tsx             # تعريف المسارات
├── index.ts               # Barrel export
├── pages/                 # صفحات التطبيق
│   ├── IncidentDashboard.tsx
│   ├── ActiveIncidents.tsx
│   ├── IncidentDetails.tsx
│   ├── ResponsePlans.tsx
│   ├── IncidentReports.tsx
│   └── IncidentSettings.tsx
└── hooks/                 # React Query hooks
    ├── useIncidents.ts
    └── index.ts
```

## المميزات الحالية

✅ **Database Schema**: جداول الحوادث والجداول الزمنية وخطط الاستجابة
✅ **Edge Functions**: 
  - `incident-auto-detect`: كشف تلقائي للحوادث
  - `incident-notify`: إرسال الإشعارات
✅ **React Hooks**: hooks لإدارة الحوادث عبر React Query
✅ **UI Pages**: صفحات أساسية لجميع المميزات
✅ **App Registry**: مسجل في نظام التطبيقات
✅ **AppShell Integration**: يستخدم القائمة الجانبية الموحدة

## القائمة الجانبية

القائمة الجانبية (`AppSidebar`) تعمل بشكل ديناميكي:
- تقرأ القوائم من `config.ts` → `features` array
- تعرض فقط القوائم التي `showInSidebar: true`
- تدعم RTL/LTR
- تدعم الوضع المصغر (collapsed)

## الخطوات القادمة

المطلوب لإكمال التطبيق:
1. ✅ إنشاء صفحات UI متقدمة
2. ⏳ إضافة مكونات التفاعل (Forms, Tables, Charts)
3. ⏳ ربط الصفحات بالـ hooks
4. ⏳ إضافة التحليلات والتقارير
5. ⏳ اختبارات شاملة

## الملاحظات

- جميع الصفحات تستخدم نفس نظام الـ theme والألوان
- جميع النصوص تدعم العربية والإنجليزية
- القائمة الجانبية تظهر تلقائياً عند الدخول للتطبيق
