# ⏰ دليل إعداد Cron Jobs للنسخ الاحتياطي التلقائي

## 📋 نظرة عامة
هذا الدليل يشرح كيفية إعداد وإدارة Cron Jobs في Supabase لتنفيذ النسخ الاحتياطية التلقائية.

---

## 🔧 الإعداد الأولي

### 1. تفعيل Extensions المطلوبة

يجب تنفيذ هذه الخطوة **مرة واحدة فقط**:

```sql
-- تفعيل pg_cron للجدولة
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- تفعيل pg_net للمكالمات HTTP
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### 2. التحقق من التفعيل

```sql
-- التحقق من Extensions
SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
```

---

## 📝 إنشاء Cron Jobs

### النسخة الأساسية - نسخة يومية كاملة

```sql
SELECT cron.schedule(
  'daily-full-backup',           -- اسم الـ Job (يجب أن يكون فريد)
  '0 2 * * *',                   -- كل يوم الساعة 2 صباحاً
  $$
  SELECT net.http_post(
    url:='https://varbgkrfwbgzmkkxpqjg.supabase.co/functions/v1/backup-database',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhcmJna3Jmd2Jnem1ra3hwcWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0ODgwMjYsImV4cCI6MjA3ODA2NDAyNn0.Gak-v2bGOtViwnMjfIJSSkHavNvBxZd5bsyH878b3h4"}'::jsonb,
    body:='{"jobType": "full", "backupName": "daily-auto-backup", "description": "نسخة يومية تلقائية"}'::jsonb
  );
  $$
);
```

### نسخة أسبوعية (كل أحد)

```sql
SELECT cron.schedule(
  'weekly-full-backup',
  '0 3 * * 0',                   -- كل أحد الساعة 3 صباحاً
  $$
  SELECT net.http_post(
    url:='https://varbgkrfwbgzmkkxpqjg.supabase.co/functions/v1/backup-database',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhcmJna3Jmd2Jnem1ra3hwcWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0ODgwMjYsImV4cCI6MjA3ODA2NDAyNn0.Gak-v2bGOtViwnMjfIJSSkHavNvBxZd5bsyH878b3h4"}'::jsonb,
    body:='{"jobType": "full", "backupName": "weekly-auto-backup", "description": "نسخة أسبوعية تلقائية"}'::jsonb
  );
  $$
);
```

### نسخة كل 6 ساعات

```sql
SELECT cron.schedule(
  'six-hourly-incremental-backup',
  '0 */6 * * *',                 -- كل 6 ساعات
  $$
  SELECT net.http_post(
    url:='https://varbgkrfwbgzmkkxpqjg.supabase.co/functions/v1/backup-database',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhcmJna3Jmd2Jnem1ra3hwcWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0ODgwMjYsImV4cCI6MjA3ODA2NDAyNn0.Gak-v2bGOtViwnMjfIJSSkHavNvBxZd5bsyH878b3h4"}'::jsonb,
    body:='{"jobType": "incremental", "backupName": "hourly-incremental", "description": "نسخة تزايدية كل 6 ساعات"}'::jsonb
  );
  $$
);
```

---

## 📅 جداول Cron Expression

### الصيغة الأساسية
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
* * * * *
```

### أمثلة شائعة

| التوقيت | Cron Expression | الوصف |
|---------|-----------------|-------|
| كل ساعة | `0 * * * *` | في الدقيقة 0 من كل ساعة |
| كل يوم 2 صباحاً | `0 2 * * *` | في الساعة 2:00 صباحاً |
| كل أحد 3 صباحاً | `0 3 * * 0` | الأحد الساعة 3:00 صباحاً |
| كل 6 ساعات | `0 */6 * * *` | كل 6 ساعات (0, 6, 12, 18) |
| كل 12 ساعة | `0 */12 * * *` | مرتين يومياً (0, 12) |
| أول كل شهر | `0 0 1 * *` | منتصف ليل أول يوم من الشهر |
| أول يوم عمل | `0 8 1-7 * 1` | الإثنين الأول من الشهر 8 صباحاً |

### أدوات مساعدة
- [Crontab Guru](https://crontab.guru/) - للتحقق من Cron expressions
- [Cron Expression Generator](https://crontab-generator.org/)

---

## 🔍 إدارة Cron Jobs

### 1. عرض جميع الـ Jobs

```sql
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  nodename,
  nodeport
FROM cron.job
ORDER BY jobname;
```

### 2. عرض تاريخ التنفيذ

```sql
SELECT 
  runid,
  jobid,
  job_name,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details
WHERE job_name = 'daily-full-backup'
ORDER BY start_time DESC
LIMIT 10;
```

### 3. تعطيل Job مؤقتاً

```sql
UPDATE cron.job 
SET active = false 
WHERE jobname = 'daily-full-backup';
```

### 4. تفعيل Job

```sql
UPDATE cron.job 
SET active = true 
WHERE jobname = 'daily-full-backup';
```

### 5. حذف Job

```sql
SELECT cron.unschedule('daily-full-backup');
```

### 6. تحديث Job

```sql
-- حذف القديم
SELECT cron.unschedule('daily-full-backup');

-- إنشاء جديد بالإعدادات المحدثة
SELECT cron.schedule(
  'daily-full-backup',
  '0 3 * * *',  -- غيّرنا الوقت من 2 إلى 3 صباحاً
  $$
  SELECT net.http_post(
    url:='https://varbgkrfwbgzmkkxpqjg.supabase.co/functions/v1/backup-database',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhcmJna3Jmd2Jnem1ra3hwcWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0ODgwMjYsImV4cCI6MjA3ODA2NDAyNn0.Gak-v2bGOtViwnMjfIJSSkHavNvBxZd5bsyH878b3h4"}'::jsonb,
    body:='{"jobType": "full"}'::jsonb
  );
  $$
);
```

---

## 🔐 الأمان

### ⚠️ ملاحظات هامة

1. **استخدم Service Role Key للـ Production**
   - المفتاح المستخدم في الأمثلة هو Anon Key
   - للإنتاج، استخدم Service Role Key

2. **لا تشارك المفاتيح**
   - احتفظ بالمفاتيح سرية
   - لا تضعها في أكواد عامة

3. **راجع الصلاحيات**
   - تأكد من أن الـ Edge Function محمية
   - استخدم RLS policies

---

## 🧪 اختبار الـ Cron Jobs

### اختبار فوري (بدون انتظار الجدولة)

```sql
-- تنفيذ Job يدوياً للاختبار
SELECT net.http_post(
  url:='https://varbgkrfwbgzmkkxpqjg.supabase.co/functions/v1/backup-database',
  headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhcmJna3Jmd2Jnem1ra3hwcWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0ODgwMjYsImV4cCI6MjA3ODA2NDAyNn0.Gak-v2bGOtViwnMjfIJSSkHavNvBxZd5bsyH878b3h4"}'::jsonb,
  body:='{"jobType": "full", "backupName": "test-manual-backup"}'::jsonb
);
```

### التحقق من النتائج

```sql
-- هل تم إنشاء النسخة؟
SELECT * FROM backup_jobs 
WHERE backup_name = 'test-manual-backup'
ORDER BY created_at DESC LIMIT 1;
```

---

## 📊 مراقبة الأداء

### الفحص اليومي

```sql
-- الـ Jobs التي فشلت خلال آخر 24 ساعة
SELECT 
  job_name,
  start_time,
  status,
  return_message
FROM cron.job_run_details
WHERE status = 'failed'
  AND start_time > now() - interval '24 hours'
ORDER BY start_time DESC;
```

### إحصائيات الأداء

```sql
-- معدل نجاح الـ Cron Jobs
SELECT 
  job_name,
  COUNT(*) as total_runs,
  SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END) as successful,
  ROUND(
    100.0 * SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END) / COUNT(*), 
    2
  ) as success_rate_pct
FROM cron.job_run_details
WHERE start_time > now() - interval '30 days'
GROUP BY job_name
ORDER BY job_name;
```

---

## 🚨 استكشاف الأخطاء

### المشكلة: Job لا يعمل

**الحلول:**
1. تأكد من أن `active = true`
```sql
SELECT * FROM cron.job WHERE jobname = 'your-job-name';
```

2. تحقق من الـ logs
```sql
SELECT * FROM cron.job_run_details 
WHERE job_name = 'your-job-name'
ORDER BY start_time DESC LIMIT 5;
```

3. اختبر الـ URL يدوياً
```sql
SELECT net.http_post(...);
```

### المشكلة: Job يفشل باستمرار

**الحلول:**
1. تحقق من صلاحيات الـ Authorization token
2. تأكد من أن الـ Edge Function يعمل
3. راجع Edge Function logs
4. تحقق من RLS policies

---

## ✅ Checklist التنفيذ

- [ ] تفعيل pg_cron و pg_net
- [ ] إنشاء Cron Job للنسخ اليومية
- [ ] اختبار Job يدوياً
- [ ] مراقبة أول تنفيذ تلقائي
- [ ] إعداد تنبيهات للفشل
- [ ] توثيق جميع الـ Jobs المُنشأة
- [ ] مراجعة دورية للأداء

---

**تم إنشاء هذا الدليل في:** 2025-11-18  
**الإصدار:** 1.0  
**آخر تحديث:** 2025-11-18
