# 🔄 دليل استعادة المشروع - Romuz Awareness GRC

## 📋 نظرة عامة

هذه النسخة الاحتياطية الكاملة للمشروع تحتوي على:
- ✅ 174 ملف migration (البنية الكاملة)
- ✅ جميع الجداول والعلاقات
- ✅ جميع RLS Policies
- ✅ جميع Functions و Triggers
- ✅ بيانات الإنتاج (55 tenant, 5 users, 10 campaigns)

**تاريخ النسخة الاحتياطية:** 2025-11-20  
**المشروع الأصلي:** Lovable Cloud (varbgkrfwbgzmkkxpqjg)  
**المشروع المستهدف:** https://xovzmzokmpemvxcpzmuh.supabase.co

---

## ⚙️ المتطلبات

قبل البدء، تأكد من توفر:

1. **حساب Supabase مدفوع** (مُنشأ مسبقاً)
2. **Service Role Key** (ليس anon key)
3. **أداة psql** أو SQL Editor في Supabase Dashboard
4. **صلاحيات كاملة** على المشروع

---

## 🚀 خطوات الاستعادة

### **المرحلة 1: تطبيق Schema (10-15 دقيقة)**

#### الخيار أ: استخدام Supabase Dashboard (موصى به)

1. افتح مشروعك على: https://supabase.com/dashboard/project/xovzmzokmpemvxcpzmuh
2. اذهب إلى **SQL Editor**
3. افتح ملف `backup/migrations-combined.sql`
4. انسخ والصق المحتوى كاملاً
5. اضغط **Run** أو **F5**
6. انتظر حتى ينتهي التنفيذ (قد يستغرق 5-10 دقائق)

#### الخيار ب: استخدام CLI

```bash
# قم بتسجيل الدخول
supabase login

# اربط المشروع
supabase link --project-ref xovzmzokmpemvxcpzmuh

# طبق جميع migrations
cd backup
psql "postgresql://postgres:[YOUR_PASSWORD]@db.xovzmzokmpemvxcpzmuh.supabase.co:5432/postgres" \
  -f migrations-combined.sql
```

---

### **المرحلة 2: استيراد البيانات (5 دقائق)**

1. في **SQL Editor**، افتح ملف `backup/data-export.sql`
2. انسخ والصق المحتوى
3. اضغط **Run**
4. تحقق من استيراد البيانات:

```sql
-- التحقق من البيانات
SELECT 
  (SELECT COUNT(*) FROM public.tenants) as tenants,
  (SELECT COUNT(*) FROM public.user_roles) as roles,
  (SELECT COUNT(*) FROM public.policies) as policies,
  (SELECT COUNT(*) FROM public.awareness_campaigns) as campaigns;
```

**النتيجة المتوقعة:**
- tenants: 55
- roles: 8
- policies: 5
- campaigns: 10

---

### **المرحلة 3: إعداد Authentication (3 دقائق)**

1. اذهب إلى **Authentication > Providers**
2. فعّل **Email** provider
3. في **Authentication > Settings**:
   - ✅ Enable Email Confirmations = **OFF** (للتطوير)
   - ✅ Enable Email Change Confirmations = OFF
   - ✅ Disable Signup = OFF

4. **استيراد المستخدمين:**
   - الخيار أ: استخدام ملف `backup/users-export.csv`
   - الخيار ب: دعوة المستخدمين يدوياً

---

### **المرحلة 4: التحقق من RLS Policies (2 دقيقة)**

قم بتشغيل هذا الاستعلام للتأكد من تفعيل RLS:

```sql
-- التحقق من RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;
```

**يجب أن ترى:**
- ✅ awareness_campaigns
- ✅ policies
- ✅ user_roles
- ✅ tenants
- وجداول أخرى...

---

### **المرحلة 5: اختبار الاتصال (5 دقائق)**

قم بإنشاء ملف `test-connection.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xovzmzokmpemvxcpzmuh.supabase.co',
  'YOUR_ANON_KEY'
);

async function testConnection() {
  // Test 1: Check tenants
  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('count');
  
  console.log('Tenants:', tenants, tenantsError);
  
  // Test 2: Check auth
  const { data: session, error: authError } = await supabase.auth.getSession();
  console.log('Auth:', session, authError);
}

testConnection();
```

```bash
# تشغيل الاختبار
npx tsx test-connection.ts
```

---

## 🔐 إعداد Environment Variables

في مشروعك الجديد، حدّث `.env`:

```env
VITE_SUPABASE_URL=https://xovzmzokmpemvxcpzmuh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvdnptem9rbXBlbXZ4Y3B6bXVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MTE2MDgsImV4cCI6MjA3OTE4NzYwOH0.Ylpx2OdK8YTTJ2bwgcJwhEVJP1FgpCjFaQYAcrAo8yI
VITE_SUPABASE_PROJECT_ID=xovzmzokmpemvxcpzmuh
```

---

## 📊 ملفات النسخة الاحتياطية

```
backup/
├── RESTORE.md                 (هذا الملف)
├── migrations-combined.sql     (جميع migrations - 174 ملف)
├── data-export.sql            (بيانات الإنتاج الحالية)
├── users-export.csv           (المستخدمين للاستيراد)
├── rls-policies.sql           (نسخة احتياطية للـ RLS)
└── functions.sql              (جميع Functions و Triggers)
```

---

## ⚠️ مشاكل شائعة وحلولها

### مشكلة: "relation already exists"
**الحل:** قم بحذف الجداول الموجودة أو ابدأ بمشروع فارغ

### مشكلة: "permission denied for schema"
**الحل:** تأكد من استخدام Service Role Key وليس anon key

### مشكلة: "function does not exist"
**الحل:** تأكد من تطبيق ملف `functions.sql` بعد Schema

### مشكلة: "RLS policy violation"
**الحل:** تحقق من تفعيل RLS وتطبيق جميع policies

---

## 📞 الدعم

إذا واجهت أي مشكلة:
1. راجع logs في Supabase Dashboard
2. تحقق من postgres_logs
3. قارن Schema بين المشروعين

---

## 🎯 الخطوات التالية

بعد الاستعادة الناجحة:

1. ✅ اختبر تسجيل الدخول
2. ✅ تحقق من جميع الصفحات
3. ✅ اختبر CRUD operations
4. ✅ راقب performance
5. ✅ أعد إنشاء Edge Functions (إن وجدت)

---

## 📅 جدول الصيانة

- **نسخ احتياطي يومي:** للبيانات فقط
- **نسخ احتياطي أسبوعي:** Schema + Data كامل
- **نسخ احتياطي شهري:** نسخة أرشيفية طويلة الأمد

---

**ملاحظة:** هذه النسخة الاحتياطية تم إنشاؤها تلقائياً من Lovable AI  
**التوافق:** Supabase PostgreSQL 15+  
**الترخيص:** ملكية خاصة - مشروع Romuz Awareness GRC
