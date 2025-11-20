# M14 - Unified KPI Dashboard: LMS Enhancement
**التاريخ:** 2025-11-18  
**النسخة:** 1.1  
**الحالة:** ✅ مكتمل

---

## 📊 نظرة عامة

تم توسيع **M14 - Unified KPI Dashboard** ليشمل مقاييس الأداء الرئيسية (KPIs) من تطبيق **LMS (Learning Management System)**. هذا التحسين يتيح رؤية شاملة لجميع مقاييس النظام بما في ذلك التدريب والتطوير في لوحة قيادة واحدة.

---

## 🎯 الأهداف المحققة

1. ✅ دمج مقاييس LMS في لوحة القيادة الموحدة
2. ✅ إضافة 3 أنواع من KPIs للتدريب:
   - معدل إنجاز الدورات (Course Completion Rate)
   - متوسط تقدم الطلاب (Average Student Progress)
   - معدل إصدار الشهادات (Certificate Issuance Rate)
3. ✅ تحديث واجهة المستخدم لدعم موديول التدريب
4. ✅ توفير رؤية تنفيذية شاملة عبر جميع الموديولات

---

## 🗄️ التغييرات في قاعدة البيانات

### View المحدّث: `vw_unified_kpis`

تم إضافة 3 استعلامات جديدة للموديول `training`:

#### 1️⃣ معدل إنجاز الدورات
```sql
SELECT c.tenant_id,
    'training'::text AS module,
    'training_course_' || c.code AS kpi_key,
    c.name || ' - معدل الإنجاز' AS kpi_name,
    -- حساب نسبة الطلاب المنجزين
    COALESCE((SELECT ROUND((COUNT(*) FILTER (WHERE e.status = 'completed')::numeric 
              / NULLIF(COUNT(*), 0) * 100)::numeric, 2)
              FROM lms_enrollments e WHERE e.course_id = c.id), 0) AS current_value,
    80::numeric AS target_value
FROM lms_courses c
WHERE c.status = 'published' AND c.deleted_at IS NULL
```

**المقاييس:**
- القيمة الحالية: نسبة الطلاب الذين أنهوا الدورة
- الهدف: 80%
- النوع: `completion_rate`

#### 2️⃣ متوسط تقدم الطلاب
```sql
SELECT c.tenant_id,
    'training'::text AS module,
    'training_progress_' || c.code AS kpi_key,
    c.name || ' - متوسط التقدم' AS kpi_name,
    -- حساب متوسط نسبة التقدم للطلاب النشطين
    COALESCE((SELECT ROUND(AVG(e.progress_percentage)::numeric, 2) 
              FROM lms_enrollments e 
              WHERE e.course_id = c.id AND e.status IN ('in_progress', 'completed')), 0) AS current_value,
    90::numeric AS target_value
FROM lms_courses c
WHERE c.status = 'published' AND c.deleted_at IS NULL
```

**المقاييس:**
- القيمة الحالية: متوسط نسبة التقدم عبر جميع الطلاب
- الهدف: 90%
- النوع: `progress_average`

#### 3️⃣ معدل إصدار الشهادات
```sql
SELECT c.tenant_id,
    'training'::text AS module,
    'training_cert_' || c.code AS kpi_key,
    c.name || ' - إصدار الشهادات' AS kpi_name,
    -- حساب نسبة الطلاب الحاصلين على شهادة من المنجزين
    COALESCE((SELECT ROUND((COUNT(cert.id)::numeric / NULLIF(COUNT(e.id), 0) * 100)::numeric, 2)
              FROM lms_enrollments e
              LEFT JOIN lms_certificates cert ON cert.enrollment_id = e.id
              WHERE e.course_id = c.id AND e.status = 'completed'), 0) AS current_value,
    95::numeric AS target_value
FROM lms_courses c
WHERE c.status = 'published' AND c.deleted_at IS NULL
```

**المقاييس:**
- القيمة الحالية: نسبة الطلاب الذين حصلوا على شهادة بعد الإنجاز
- الهدف: 95%
- النوع: `certificate_rate`

---

## 📊 البيانات الحالية

حسب آخر استعلام (2025-11-18):

| Module | Total KPIs | Avg Current | Avg Target |
|--------|-----------|-------------|------------|
| training | 12 | 0.00 | 88.33 |

**ملاحظة:** البيانات الحالية تظهر قيمة 0 لأن النظام في مرحلة الإعداد الأولي وليس هناك تسجيلات طلاب بعد.

---

## 💻 التغييرات في الكود

### 1. Integration Layer
**الملف:** `src/modules/analytics/integration/unified-kpis.integration.ts`

التعديلات:
- ✅ إضافة `training` في moduleInfo مع الأيقونة `BookOpen`
- ✅ دعم الموديول الجديد في جميع الاستعلامات
- ✅ لا حاجة لتغييرات في الكود - يدعم جميع الموديولات تلقائياً

### 2. Types
**الملف:** `src/modules/analytics/types/unified-kpis.types.ts`

```typescript
export type KPIModule = 'risk' | 'compliance' | 'campaign' | 'audit' | 'objective' | 'training';
```

- ✅ `training` كان موجوداً مسبقاً في التعريف

### 3. UI Components

**الملف:** `src/apps/admin/pages/UnifiedDashboardPage.tsx`

التعديلات:
```typescript
import { Shield, CheckCircle, Users, FileCheck, Target, AlertTriangle, BookOpen } from 'lucide-react';

const iconMap: Record<string, any> = {
  Shield,      // risk
  CheckCircle, // compliance
  Users,       // campaign
  FileCheck,   // audit
  Target,      // objective
  BookOpen     // ✨ training (جديد)
};
```

---

## 📈 المقاييس والأهداف

### معدلات الإنجاز المستهدفة

| KPI Type | Target Value | وصف |
|----------|--------------|------|
| Course Completion | 80% | معدل الطلاب الذين ينهون الدورة |
| Progress Average | 90% | متوسط التقدم عبر جميع الطلاب |
| Certificate Rate | 95% | نسبة الحاصلين على شهادات من المنجزين |

### الحد الأدنى للأداء (Critical Threshold)

- 🔴 **Critical**: أقل من 70% من الهدف
- 🟡 **Warning**: 70-80% من الهدف
- 🟢 **Good**: 80% فما فوق من الهدف

---

## 🔍 استعلامات التحليل

### عرض جميع KPIs للتدريب
```sql
SELECT 
  kpi_key,
  kpi_name,
  entity_name AS course_name,
  current_value,
  target_value,
  ROUND((current_value / target_value * 100), 2) AS achievement_pct,
  status,
  metadata->>'kpi_type' AS kpi_type,
  last_updated
FROM vw_unified_kpis
WHERE module = 'training'
ORDER BY achievement_pct DESC;
```

### ملخص أداء التدريب
```sql
SELECT 
  metadata->>'kpi_type' AS kpi_type,
  COUNT(*) AS total_courses,
  ROUND(AVG(current_value), 2) AS avg_current,
  ROUND(AVG(target_value), 2) AS avg_target,
  ROUND(AVG(current_value / target_value * 100), 2) AS avg_achievement
FROM vw_unified_kpis
WHERE module = 'training'
GROUP BY metadata->>'kpi_type'
ORDER BY avg_achievement DESC;
```

### أفضل الدورات أداءً
```sql
SELECT 
  entity_name AS course_name,
  kpi_name,
  current_value,
  target_value,
  ROUND((current_value / target_value * 100), 2) AS achievement_pct
FROM vw_unified_kpis
WHERE module = 'training' AND metadata->>'kpi_type' = 'completion_rate'
ORDER BY achievement_pct DESC
LIMIT 10;
```

---

## 🎨 واجهة المستخدم

### لوحة القيادة الموحدة
**المسار:** `/platform/admin/unified-dashboard`

المكونات:
1. **بطاقات الموديولات** - عرض سريع لجميع الموديولات بما في ذلك التدريب
2. **الملخص التنفيذي** - إحصائيات شاملة عبر جميع الموديولات
3. **التنبيهات** - إشعارات للمقاييس التي تحتاج انتباه
4. **الاتجاهات** - مقارنات تاريخية والتحليلات

### أيقونة التدريب
```typescript
<BookOpen className="h-4 w-4" />
```

### عرض الدورات في Dashboard
```typescript
{moduleGroups?.map((group) => (
  <Card key={group.module}>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {group.moduleName}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{group.achievementRate.toFixed(0)}%</div>
      <p className="text-xs text-muted-foreground">{group.totalKPIs} مؤشر</p>
      {group.criticalCount > 0 && (
        <Badge variant="destructive">{group.criticalCount} حرج</Badge>
      )}
    </CardContent>
  </Card>
))}
```

---

## 🧪 الاختبارات

### اختبار قراءة بيانات LMS
```sql
-- التحقق من وجود بيانات LMS
SELECT COUNT(*) FROM vw_unified_kpis WHERE module = 'training';

-- التحقق من الملخص التنفيذي
SELECT * FROM vw_kpi_executive_summary WHERE module = 'training';
```

### اختبار UI
1. ✅ فتح `/platform/admin/unified-dashboard`
2. ✅ التحقق من ظهور بطاقة "التدريب" مع أيقونة BookOpen
3. ✅ التحقق من عرض 12 KPI للتدريب في نظرة عامة
4. ✅ التحقق من الملخص التنفيذي يشمل التدريب

---

## 🔄 Integration مع باقي النظام

### Hooks المستخدمة
```typescript
// جلب مجموعات KPIs حسب الموديول
const { data: moduleGroups } = useModuleKPIGroups();

// جلب الملخص التنفيذي
const { data: summary } = useExecutiveSummary();

// جلب التنبيهات
const { data: alerts } = useKPIAlerts({ acknowledged: false });
```

### Automatic Updates
- ✅ عند إضافة دورة جديدة → تظهر تلقائياً في Dashboard
- ✅ عند تسجيل طالب → تحديث معدل الإنجاز تلقائياً
- ✅ عند إصدار شهادة → تحديث معدل الشهادات

---

## 📝 TODO / Tech Debt

### مطلوب لاحقاً

1. **🔔 Alerts للتدريب**
   - تفعيل التنبيهات التلقائية عند انخفاض معدل الإنجاز
   - تنبيهات للدورات التي لم تصدر شهادات

2. **📊 تقارير متقدمة**
   - مقارنة أداء الدورات عبر الزمن
   - تحليل الاتجاهات الموسمية

3. **🎯 Snapshots تلقائية**
   - تفعيل Snapshots يومية لمقاييس التدريب
   - الاحتفاظ بالبيانات التاريخية

4. **🔗 Cross-Module Insights**
   - ربط مقاييس التدريب بمقاييس الامتثال
   - تحليل تأثير التدريب على المخاطر

---

## ✅ الحالة النهائية

| Feature | Status | Notes |
|---------|--------|-------|
| Database View | ✅ Complete | 3 KPI types added |
| Integration Layer | ✅ Complete | Fully compatible |
| Types | ✅ Complete | No changes needed |
| UI Components | ✅ Complete | BookOpen icon added |
| Testing | ✅ Complete | Queries verified |
| Documentation | ✅ Complete | This file |

---

## 🎉 النتيجة النهائية

**M14 - Unified KPI Dashboard** الآن يدعم **6 موديولات كاملة:**

1. ✅ Risk (المخاطر)
2. ✅ Compliance (الامتثال)
3. ✅ Campaign (الحملات)
4. ✅ Audit (التدقيق)
5. ✅ Objective (الأهداف)
6. ✅ **Training (التدريب)** ← جديد!

**إجمالي المقاييس في النظام:**
- Risk: ~15 KPIs
- Compliance: ~8 KPIs
- Campaign: ~10 KPIs
- Audit: ~12 KPIs
- Objective: ~20 KPIs
- **Training: 12 KPIs** ← جديد!

**المجموع: ~77 مؤشر أداء موحد في لوحة قيادة واحدة!** 🚀

---

## 📚 المراجع

- [M14 Original Plan](./M14_Unified_KPI_Dashboard_Summary.md)
- [Project Roadmap](../06_Execution/Project_Completion_Roadmap_v1.0.md)
- [LMS Module Documentation](../../lms/)

---

**آخر تحديث:** 2025-11-18  
**المطور:** Lovable AI  
**المراجع:** Solution Architect
