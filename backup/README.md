# 📦 Romuz Awareness GRC - Full Backup Package

**تاريخ النسخة:** 2025-11-20  
**المشروع الأصلي:** Lovable Cloud  
**المشروع المستهدف:** https://xovzmzokmpemvxcpzmuh.supabase.co

---

## 📋 محتويات النسخة الاحتياطية

### ملفات أساسية:

| الملف | الوصف | الحجم التقريبي |
|------|-------|----------------|
| `RESTORE.md` | **دليل الاستعادة الكامل** (ابدأ هنا!) | - |
| `migrations-combined.sql` | جميع migrations (174 ملف مدمج) | ~500 KB |
| `data-export.sql` | البيانات الحالية (55 tenant, 5 users) | ~100 KB |
| `quick-start.sh` | سكريبت استعادة تلقائي (Linux/Mac) | - |
| `users-list.md` | قائمة المستخدمين الحاليين | - |
| `README.md` | هذا الملف | - |

---

## 🚀 البدء السريع

### للمبتدئين (استخدام Dashboard):

1. افتح [RESTORE.md](./RESTORE.md) واتبع التعليمات خطوة بخطوة
2. انسخ محتوى `migrations-combined.sql` إلى SQL Editor في Supabase
3. اضغط Run وانتظر الانتهاء
4. انسخ محتوى `data-export.sql` وكرر العملية

### للمحترفين (استخدام CLI):

```bash
# امنح صلاحيات التنفيذ
chmod +x quick-start.sh

# نفذ السكريبت
./quick-start.sh
```

---

## 📊 إحصائيات النسخة الاحتياطية

### البيانات المُصدرة:

- 👥 **المستخدمين:** 5 users
  - 3 admins (Test Tenant 050)
  - 1 tenant_admin (T-SUSPENDED)
  - 1 user بدون tenant (يحتاج تعيين)

- 🏢 **Tenants:** 55 tenant
  - 44 نشط (ACTIVE)
  - 9 معلق (SUSPENDED)
  - 1 مؤرشف (ARCHIVED)
  - 1 قيد الإلغاء (DEPROVISIONING)

- 📄 **السياسات:** 5 policies
- 📢 **الحملات:** 10 awareness campaigns
- ⚡ **الإجراءات:** 11 action items
- 👔 **الأدوار:** 8 user roles

### الهيكل:

- 🗂️ **Schemas:** public, gate_h, gate_i, gate_j, gate_l
- 📋 **الجداول:** 50+ table
- 🔒 **RLS Policies:** 20+ policy
- ⚙️ **Functions:** 15+ function
- 🔄 **Triggers:** 10+ trigger
- 📑 **Indexes:** 30+ index

---

## 🎯 حالات الاستخدام

### 1️⃣ نسخة احتياطية فقط (Backup Only)
- احتفظ بهذه الملفات كنسخة احتياطية
- لا تحتاج لفعل أي شيء الآن
- استخدمها عند الحاجة للاستعادة

### 2️⃣ نقل كامل (Full Migration)
- اتبع دليل RESTORE.md
- انقل كل البيانات لمشروعك المدفوع
- حدّث .env في التطبيق

### 3️⃣ استنساخ للتطوير (Dev Clone)
- أنشئ مشروع جديد للتطوير
- طبق migrations فقط (بدون data)
- اختبر التغييرات قبل النشر

---

## ⚠️ ملاحظات مهمة

### ❌ ما لا يشمله Backup:

- ❌ Users من auth.users (يجب إنشاؤهم يدوياً)
- ❌ Passwords (لأسباب أمنية)
- ❌ Edge Functions (إن وجدت)
- ❌ Storage files (الملفات المرفوعة)
- ❌ Realtime subscriptions config

### ✅ ما يشمله:

- ✅ كامل structure (tables, types, schemas)
- ✅ جميع RLS policies
- ✅ جميع Functions & Triggers
- ✅ البيانات الأساسية (tenants, roles, campaigns, etc.)
- ✅ Indexes و Constraints

---

## 🔐 الأمان

### معلومات حساسة تم حذفها:

- 🔒 Passwords (محذوفة)
- 🔒 API Keys (محذوفة)
- 🔒 Service Role Keys (محذوفة)
- 🔒 Private user data (مخفية)

### ما تم تضمينه:

- ✅ أسماء المستخدمين (emails فقط)
- ✅ أسماء Tenants
- ✅ Structure فقط

**⚠️ تحذير:** احفظ هذه الملفات في مكان آمن!

---

## 📞 الدعم والمساعدة

### إذا واجهت مشاكل:

1. **راجع RESTORE.md** - يحتوي على حلول للمشاكل الشائعة
2. **تحقق من Logs:**
   - `migration.log` (إن وجد)
   - `data.log` (إن وجد)
   - Supabase Dashboard > Logs
3. **تحقق من postgres_logs** في Supabase

### أخطاء شائعة:

| الخطأ | الحل |
|------|-----|
| "relation already exists" | استخدم مشروع فارغ أو احذف الجداول |
| "permission denied" | استخدم Service Role Key |
| "function does not exist" | طبق migrations بالترتيب |
| "RLS policy violation" | تحقق من تفعيل RLS |

---

## 📅 جدول الصيانة الموصى به

- **يومياً:** نسخ احتياطي للبيانات فقط
- **أسبوعياً:** نسخ احتياطي كامل (Schema + Data)
- **شهرياً:** نسخ أرشيفية طويلة الأمد

---

## 🔄 تحديث النسخة الاحتياطية

لإنشاء نسخة احتياطية محدثة:

```bash
# استخدم هذا الأمر لتصدير Schema الحالي
pg_dump --schema-only "postgresql://postgres:[PASSWORD]@db.xovzmzokmpemvxcpzmuh.supabase.co:5432/postgres" > schema-new.sql

# لتصدير البيانات
pg_dump --data-only "postgresql://postgres:[PASSWORD]@db.xovzmzokmpemvxcpzmuh.supabase.co:5432/postgres" > data-new.sql
```

---

## ✅ التحقق من نجاح الاستعادة

بعد الاستعادة، نفذ هذا الاستعلام:

```sql
SELECT 
  (SELECT COUNT(*) FROM public.tenants) as tenants,
  (SELECT COUNT(*) FROM public.user_roles) as roles,
  (SELECT COUNT(*) FROM public.policies) as policies,
  (SELECT COUNT(*) FROM public.awareness_campaigns) as campaigns,
  (SELECT COUNT(*) FROM gate_h.action_items) as actions,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as rls_tables;
```

**النتيجة المتوقعة:**
- tenants: 55
- roles: 8
- policies: 5
- campaigns: 10
- actions: 11
- rls_tables: 15+

---

## 📖 مراجع إضافية

- [Supabase Docs - Database Backups](https://supabase.com/docs/guides/database/backups)
- [Supabase Docs - Migrations](https://supabase.com/docs/guides/cli/migrations)
- [Supabase Docs - RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Docs - pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)

---

## 📄 الترخيص

هذه النسخة الاحتياطية ملكية خاصة لمشروع **Romuz Awareness GRC**.  
غير مصرح باستخدامها أو نسخها بدون إذن.

---

**تم إنشاؤها بواسطة:** Lovable AI  
**التاريخ:** 2025-11-20  
**الإصدار:** 1.0.0
