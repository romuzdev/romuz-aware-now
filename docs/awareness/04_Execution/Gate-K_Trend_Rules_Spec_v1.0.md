# Gate-K — Trend & Anomaly Rules Specification (v1.0)

**التاريخ:** 2025-01-11  
**النسخة:** v1.0  
**المسؤول:** فريق Gate-K Analytics  
**الحالة:** نشط (Active)

---

## 1) الغرض (Purpose)

### 1.1 لماذا Rule-Based في الإصدار الأول؟

في الإصدار الأول (v1.0) من Gate-K، اعتمدنا على **نظام قواعد ثابتة (Rule-Based)** لاكتشاف الانحرافات والشذوذ في مؤشرات الأداء الرئيسية (KPIs) بدلاً من الذكاء الاصطناعي (ML) للأسباب التالية:

1. **الشفافية والوضوح:**
   - قواعد واضحة يمكن فهمها من قبل المدراء والمستخدمين النهائيين
   - سهولة تدقيق القرارات والتفسير للجهات المعنية

2. **السرعة في التنفيذ:**
   - لا حاجة لبيانات تاريخية كبيرة لتدريب النماذج
   - إطلاق سريع وبداية فورية في التشغيل

3. **التحكم الدقيق:**
   - إمكانية ضبط العتبات (Thresholds) حسب احتياجات كل عميل (Tenant)
   - تخصيص القواعد لكل مؤشر KPI بشكل مستقل

4. **الأساس للمراحل القادمة:**
   - بناء Baseline بيانات تاريخية صحيحة
   - استخدامها كـ Ground Truth لتدريب نماذج ML في الإصدارات القادمة

---

## 2) مصادر البيانات (Data Sources)

### 2.1 الجداول والـ Materialized Views

| المصدر | النوع | الوصف |
|--------|------|-------|
| `mv_kpi_trends_weekly` | MV | اتجاهات أسبوعية مع إحصائيات كاملة |
| `mv_kpi_trends_monthly` | MV | اتجاهات شهرية مع إحصائيات كاملة |
| `mv_kpi_trends_quarterly` | MV | اتجاهات ربع سنوية مع إحصائيات كاملة |
| `mv_kpi_monthly_delta` | MV | التغييرات الشهرية (Delta %) |
| `mv_kpi_monthly_anomalies` | MV | اكتشاف الشذوذ عبر Z-Score |
| `mv_kpi_monthly_flags` | MV | الأعلام النهائية (warn/alert/ok) |
| `kpi_thresholds` | Table | تكوين العتبات لكل مؤشر |

### 2.2 مصدر البيانات الخام

```sql
kpi_series → mv_kpi_trends_* → mv_kpi_monthly_delta
                              → mv_kpi_monthly_anomalies
                              → mv_kpi_monthly_flags (النهائي)
```

---

## 3) التعريفات (Definitions)

### 3.1 Delta Percentage (%)

**التعريف:**
```
delta_pct = ((current_value - previous_value) / previous_value) * 100
```

- **إيجابي:** زيادة في القيمة
- **سالب:** انخفاض في القيمة
- **NULL:** لا توجد قيمة سابقة للمقارنة

**مثال:**
- القيمة السابقة: 80
- القيمة الحالية: 92
- Delta: ((92-80)/80)*100 = **+15%**

### 3.2 Z-Score (درجة المعيارية)

**التعريف:**
```
z_score = (current_value - baseline_mean) / baseline_stddev
```

- **Z-Score > +3.0:** شذوذ موجب (Positive Anomaly)
- **Z-Score < -3.0:** شذوذ سالب (Negative Anomaly)
- **-3.0 ≤ Z-Score ≤ +3.0:** ضمن الحدود الطبيعية

**Baseline Window:** 6 أشهر سابقة

### 3.3 Control Bands (نطاقات التحكم)

**Upper Control Limit (UCL):**
```
UCL = baseline_mean + (3 * baseline_stddev)
```

**Lower Control Limit (LCL):**
```
LCL = baseline_mean - (3 * baseline_stddev)
```

أي قيمة خارج هذه الحدود تُعتبر خارج السيطرة (Out of Control).

### 3.4 Min Sample Size

**الحد الأدنى لعدد العينات:**
- **افتراضي:** 10 سجلات
- **الغرض:** ضمان موثوقية الإحصائيات (Mean, Stddev)
- **السياسة:** إذا كان `sample_count < min_sample` → Flag = `insufficient_data`

---

## 4) الضبط (Configuration)

### 4.1 جدول kpi_thresholds

**الحقول:**

| الحقل | النوع | الوصف |
|-------|------|-------|
| `id` | UUID | معرف فريد |
| `tenant_id` | UUID | معرف العميل (NULL = إعدادات افتراضية) |
| `kpi_key` | TEXT | معرف المؤشر (مثل: `engagement_rate`) |
| `trend_window` | ENUM | النافذة الزمنية (`monthly`, `weekly`, `quarterly`) |
| `min_sample` | INTEGER | الحد الأدنى لعدد العينات (افتراضي: 10) |
| `warn_delta` | NUMERIC | عتبة التحذير (%) (افتراضي: 5.0) |
| `alert_delta` | NUMERIC | عتبة التنبيه (%) (افتراضي: 15.0) |
| `zscore_alert` | NUMERIC | عتبة Z-Score (افتراضي: 3.0) |
| `notes` | TEXT | ملاحظات تفسيرية |
| `created_at` | TIMESTAMPTZ | تاريخ الإنشاء |
| `updated_at` | TIMESTAMPTZ | تاريخ آخر تحديث |
| `created_by` | UUID | المستخدم المنشئ |
| `updated_by` | UUID | المستخدم المعدّل |

### 4.2 القيم الافتراضية (Defaults)

```sql
-- للمؤشرات العامة (Global Defaults)
tenant_id = NULL
min_sample = 10
warn_delta = 5.0   -- تحذير عند تغيير ±5%
alert_delta = 15.0 -- تنبيه عند تغيير ±15%
zscore_alert = 3.0 -- تنبيه عند Z-Score خارج ±3σ
```

### 4.3 سياسة التغيير

1. **التخصيص على مستوى Tenant:**
   - يمكن لـ `tenant_admin` تخصيص العتبات لمؤسسته
   - القيم المخصصة تُستخدم بدلاً من الافتراضية

2. **التخصيص على مستوى KPI:**
   - يمكن تحديد عتبات مختلفة لكل `kpi_key`
   - مثال: `completion_rate` قد يحتاج `alert_delta = 10%` بينما `engagement_rate` يحتاج `20%`

3. **التدقيق (Audit):**
   - كل تغيير يُسجل في `audit_log`
   - `created_by` و `updated_by` إلزاميان

---

## 5) منطق الأعلام (Flags Logic)

### 5.1 تعريف الأعلام

| Flag | المعنى | الشرط |
|------|--------|-------|
| `ok` | طبيعي | `abs(delta_pct) < warn_delta` AND `abs(zscore) < zscore_alert` |
| `warn` | تحذير | `warn_delta ≤ abs(delta_pct) < alert_delta` |
| `alert` | تنبيه حرج | `abs(delta_pct) ≥ alert_delta` OR `abs(zscore) ≥ zscore_alert` |
| `no_reference` | لا توجد مقارنة | `prev_avg IS NULL` |
| `insufficient_data` | بيانات غير كافية | `sample_count < min_sample` |

### 5.2 أولوية التقييم (Priority Order)

```sql
CASE
  WHEN sample_count < min_sample THEN 'insufficient_data'
  WHEN prev_avg IS NULL THEN 'no_reference'
  WHEN ABS(delta_pct) >= alert_delta THEN 'alert'
  WHEN ABS(zscore) >= zscore_alert THEN 'alert'
  WHEN ABS(delta_pct) >= warn_delta THEN 'warn'
  ELSE 'ok'
END
```

### 5.3 أمثلة عملية

**مثال 1: حالة طبيعية**
```
delta_pct = +2.5%
zscore = +0.8
warn_delta = 5.0
alert_delta = 15.0
zscore_alert = 3.0
→ Flag = 'ok'
```

**مثال 2: تحذير**
```
delta_pct = +7.8%
zscore = +1.2
→ Flag = 'warn' (لأن 5.0 ≤ 7.8 < 15.0)
```

**مثال 3: تنبيه حرج**
```
delta_pct = +18.5%
zscore = +2.1
→ Flag = 'alert' (لأن 18.5 ≥ 15.0)
```

**مثال 4: شذوذ إحصائي**
```
delta_pct = +12.0%
zscore = +3.8
→ Flag = 'alert' (لأن 3.8 ≥ 3.0)
```

---

## 6) الأداء والتشغيل (Performance & Operations)

### 6.1 سياسة REFRESH

**جدول التحديث:**

| View | تكرار التحديث | التوقيت الموصى به |
|------|---------------|-------------------|
| `mv_kpi_trends_weekly` | أسبوعياً | الإثنين 02:00 صباحاً |
| `mv_kpi_trends_monthly` | شهرياً | اليوم الأول 03:00 صباحاً |
| `mv_kpi_trends_quarterly` | ربع سنوي | اليوم الأول من الربع 04:00 صباحاً |
| `mv_kpi_monthly_delta` | شهرياً | اليوم الأول 05:00 صباحاً |
| `mv_kpi_monthly_anomalies` | شهرياً | اليوم الأول 05:30 صباحاً |
| `mv_kpi_monthly_flags` | شهرياً | اليوم الأول 06:00 صباحاً |

**التسلسل الموصى به:**
```sql
1. mv_kpi_trends_weekly
2. mv_kpi_trends_monthly  
3. mv_kpi_trends_quarterly
4. mv_kpi_monthly_delta    (يعتمد على monthly)
5. mv_kpi_monthly_anomalies (يعتمد على monthly)
6. mv_kpi_monthly_flags     (يعتمد على delta + anomalies)
```

### 6.2 Edge Function للتحديث التلقائي

**استخدام:**
```typescript
// supabase/functions/refresh-gate-k-views/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  )
  
  // استدعاء دالة الـ Refresh
  const { error } = await supabase.rpc('refresh_gate_k_views')
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### 6.3 مراقبة Freshness

**استخدام `refresh_log`:**

```sql
-- عرض آخر تحديث لكل View
SELECT * FROM public.get_last_refresh_status();

-- عرض سجل التحديثات خلال آخر 7 أيام
SELECT 
  view_name,
  refreshed_at,
  duration_ms,
  status
FROM public.refresh_log
WHERE refreshed_at >= NOW() - INTERVAL '7 days'
ORDER BY refreshed_at DESC;
```

**مؤشرات الأداء المتوقعة:**
- `mv_kpi_trends_weekly`: < 2 ثانية
- `mv_kpi_trends_monthly`: < 3 ثوانٍ
- `mv_kpi_monthly_flags`: < 5 ثوانٍ

---

## 7) الأمن والامتثال (Security & Compliance)

### 7.1 Row-Level Security (RLS)

**سياسات الوصول:**

```sql
-- 1) Direct MV Access: REVOKED
REVOKE ALL ON mv_kpi_trends_weekly FROM PUBLIC, anon, authenticated;
GRANT SELECT ON mv_kpi_trends_weekly TO service_role;

-- 2) RPC Functions: SECURITY DEFINER + Tenant Guard
CREATE FUNCTION get_kpi_trends_weekly(...)
RETURNS TABLE (...)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_tenant UUID;
BEGIN
  v_tenant := app_current_tenant_id();
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'TENANT_REQUIRED';
  END IF;
  
  RETURN QUERY
  SELECT * FROM mv_kpi_trends_weekly
  WHERE tenant_id = v_tenant
    AND (p_kpi_key IS NULL OR kpi_key = p_kpi_key);
END;
$$ LANGUAGE plpgsql;
```

### 7.2 تسجيل الوصول (Audit Logging)

**المعلومات المُسجلة:**
- `actor`: المستخدم الذي استدعى الـ RPC
- `entity_type`: نوع الكيان (`kpi_analytics`)
- `action`: الإجراء (`read`, `refresh`)
- `payload`: معلومات إضافية (KPI key, date range)

**مثال:**
```json
{
  "actor": "user-uuid",
  "entity_type": "kpi_analytics",
  "action": "read",
  "payload": {
    "function": "get_kpi_monthly_flags",
    "kpi_key": "engagement_rate",
    "from_month": "2025-01-01"
  }
}
```

### 7.3 الامتثال لـ PDPL/GDPR

- **تشفير البيانات:** جميع البيانات مُشفرة (at rest & in transit)
- **حقوق المستخدم:** يمكن للمستخدمين طلب حذف أو تصدير بياناتهم
- **الاحتفاظ بالبيانات:** سجلات `refresh_log` تُحفظ لمدة 90 يوماً فقط

---

## 8) خارطة التطوير (Development Roadmap)

### 8.1 الإصدار الحالي (v1.0) ✅

- [x] بنية Materialized Views الأساسية
- [x] قواعد Delta & Z-Score
- [x] جدول kpi_thresholds
- [x] Secure RPCs مع Tenant Isolation
- [x] نظام Refresh Logging

### 8.2 الإصدار القادم (v1.1) 🔄

- [ ] **Partial Indexes:** لتحسين الأداء على الأعلام الحرجة
  ```sql
  CREATE INDEX idx_flags_critical 
    ON mv_kpi_monthly_flags(tenant_id, kpi_key)
    WHERE flag IN ('alert', 'warn');
  ```
- [ ] **Incremental Refresh:** تحديث البيانات الجديدة فقط بدلاً من إعادة الحساب الكامل
- [ ] **Alert Notifications:** إرسال تنبيهات تلقائية عند اكتشاف `alert` flags

### 8.3 الإصدار 2.0 (v2.0) 🎯

- [ ] **Seasonal Baselines:** حساب Baseline مختلف لكل موسم/شهر
  - مثال: معدلات التفاعل في رمضان مختلفة عن باقي الأشهر
- [ ] **Adaptive Thresholds:** تعديل تلقائي للعتبات بناءً على الأداء التاريخي
- [ ] **Multi-Tenant Benchmarking:** مقارنة أداء Tenant مع متوسط الصناعة

### 8.4 الإصدار 3.0 (v3.0) 🚀

- [ ] **ML Anomaly Detection:**
  - استخدام Isolation Forest أو LSTM للكشف عن الشذوذ
  - تدريب نماذج مخصصة لكل Tenant
- [ ] **Predictive Analytics:**
  - التنبؤ بقيم KPIs المستقبلية
  - اكتشاف الانحرافات المحتملة قبل حدوثها
- [ ] **Root Cause Analysis:**
  - تحليل تلقائي لأسباب الانحرافات
  - ربط الأسباب بالأحداث التاريخية

---

## 9) Change Log (سجل التغييرات)

| التاريخ | النسخة | التغييرات | المسؤول |
|---------|--------|-----------|---------|
| 2025-01-11 | v1.0 | إطلاق النسخة الأولى من الوثيقة | فريق Gate-K |
| - | - | - | - |

---

## 10) Sign-off (الاعتماد)

### الموافقة الفنية:

- **Technical Lead:** ___________________  
  التاريخ: ___________

- **Data Engineer:** ___________________  
  التاريخ: ___________

### الموافقة الإدارية:

- **Product Manager:** ___________________  
  التاريخ: ___________

- **Compliance Officer:** ___________________  
  التاريخ: ___________

---

**نهاية المستند**

*هذا المستند حي (Living Document) ويُحدّث بشكل دوري مع تطور النظام.*
