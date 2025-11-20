# 👥 قائمة المستخدمين الحاليين

**تاريخ التصدير:** 2025-11-20  
**المجموع:** 5 users

---

## 📋 المستخدمون النشطون

### 1️⃣ info@primestudio.media
- **User ID:** `4b5dffc9-5ff3-4f30-bba4-24f6cb04f822`
- **Role:** `admin`
- **Tenant:** Test Tenant 050 (`976e0f1c-63b4-47d8-b5c3-6d2aa4e78ae5`)
- **Status:** ✅ Active
- **Created:** 2025-11-19

### 2️⃣ info@exposinsider.com
- **User ID:** `08781532-b5b4-4199-97b3-794c1742f6e4`
- **Role:** `admin`
- **Tenant:** Test Tenant 050 (`976e0f1c-63b4-47d8-b5c3-6d2aa4e78ae5`)
- **Status:** ✅ Active
- **Created:** 2025-11-19

### 3️⃣ romuzdev@gmail.com
- **User ID:** `88c60307-f771-4c7b-8c03-0bdb52c929f7`
- **Role:** `admin`
- **Tenant:** Test Tenant 050 (`976e0f1c-63b4-47d8-b5c3-6d2aa4e78ae5`)
- **Status:** ✅ Active
- **Created:** 2025-11-19

### 4️⃣ drtalal46@gmail.com
- **User ID:** `bc32716f-3b0d-413d-9315-0c1b0b468f8f`
- **Role:** `tenant_admin`, `platform_admin`, `platform_support`
- **Tenant:** T-SUSPENDED (`fae7dcf4-76ae-47c1-9e9e-13947d525351`)
- **Status:** ✅ Active (Multiple roles)
- **Created:** 2025-11-10

### 5️⃣ info@expos.news ⚠️
- **User ID:** `e2d15c9c-7ec5-4ce9-9398-8c6375c211b7`
- **Role:** `platform_admin`
- **Tenant:** ❌ **لا يوجد** (يحتاج تعيين!)
- **Status:** ⚠️ بدون tenant
- **Created:** 2025-11-13
- **ملاحظة:** هذا المستخدم سبب مشكلة "Loading..." اللانهائية!

---

## 🔄 خطوات إعادة إنشاء المستخدمين

### الطريقة 1: Supabase Dashboard (موصى بها)

1. اذهب إلى: https://supabase.com/dashboard/project/xovzmzokmpemvxcpzmuh/auth/users
2. اضغط "Add user"
3. أدخل Email
4. أدخل Password مؤقت
5. أرسل دعوة للمستخدم
6. بعد إنشاء المستخدم، خذ الـ UUID الجديد
7. نفذ SQL لربطه بالـ Tenant:

```sql
-- مثال لربط info@primestudio.media
-- استبدل NEW_USER_ID بالـ UUID الجديد

-- إضافة للـ tenant
INSERT INTO public.user_tenants (user_id, tenant_id)
VALUES ('NEW_USER_ID', '976e0f1c-63b4-47d8-b5c3-6d2aa4e78ae5')
ON CONFLICT DO NOTHING;

-- إضافة الدور
INSERT INTO public.user_roles (user_id, tenant_id, role)
VALUES ('NEW_USER_ID', '976e0f1c-63b4-47d8-b5c3-6d2aa4e78ae5', 'admin')
ON CONFLICT DO NOTHING;
```

### الطريقة 2: API (متقدم)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xovzmzokmpemvxcpzmuh.supabase.co',
  'YOUR_SERVICE_ROLE_KEY' // استخدم Service Role Key وليس anon key
);

// إنشاء مستخدم جديد
const { data, error } = await supabase.auth.admin.createUser({
  email: 'info@primestudio.media',
  password: 'temporary-password-123',
  email_confirm: true, // تأكيد تلقائي
  user_metadata: {
    full_name: 'Prime Studio'
  }
});

if (data.user) {
  console.log('User created:', data.user.id);
  
  // ربط بالـ tenant
  await supabase.from('user_tenants').insert({
    user_id: data.user.id,
    tenant_id: '976e0f1c-63b4-47d8-b5c3-6d2aa4e78ae5'
  });
  
  // إضافة الدور
  await supabase.from('user_roles').insert({
    user_id: data.user.id,
    tenant_id: '976e0f1c-63b4-47d8-b5c3-6d2aa4e78ae5',
    role: 'admin'
  });
}
```

---

## ⚠️ حل مشكلة info@expos.news

هذا المستخدم بدون tenant، مما يسبب مشكلة في AppContext. الحلول:

### الخيار 1: ربطه بـ Tenant موجود

```sql
-- ربطه بـ Test Tenant 050
INSERT INTO public.user_tenants (user_id, tenant_id)
VALUES ('e2d15c9c-7ec5-4ce9-9398-8c6375c211b7', '976e0f1c-63b4-47d8-b5c3-6d2aa4e78ae5')
ON CONFLICT DO NOTHING;

-- إضافة دور admin
INSERT INTO public.user_roles (user_id, tenant_id, role)
VALUES ('e2d15c9c-7ec5-4ce9-9398-8c6375c211b7', '976e0f1c-63b4-47d8-b5c3-6d2aa4e78ae5', 'admin')
ON CONFLICT DO NOTHING;
```

### الخيار 2: إنشاء Tenant جديد له

```sql
-- إنشاء tenant جديد
INSERT INTO public.tenants (id, name, status)
VALUES (gen_random_uuid(), 'Expos News Tenant', 'ACTIVE')
RETURNING id;

-- ثم ربطه (استبدل NEW_TENANT_ID)
INSERT INTO public.user_tenants (user_id, tenant_id)
VALUES ('e2d15c9c-7ec5-4ce9-9398-8c6375c211b7', 'NEW_TENANT_ID');

INSERT INTO public.user_roles (user_id, tenant_id, role)
VALUES ('e2d15c9c-7ec5-4ce9-9398-8c6375c211b7', 'NEW_TENANT_ID', 'tenant_admin');
```

### الخيار 3: حذفه

```sql
-- حذف المستخدم من Auth (يحذف تلقائياً من الجداول الأخرى)
-- استخدم Dashboard أو:
DELETE FROM auth.users WHERE id = 'e2d15c9c-7ec5-4ce9-9398-8c6375c211b7';
```

---

## 📊 توزيع الأدوار

| الدور | العدد | المستخدمون |
|------|------|-----------|
| `admin` | 4 | info@primestudio.media, info@exposinsider.com, romuzdev@gmail.com, drtalal46@gmail.com |
| `tenant_admin` | 1 | drtalal46@gmail.com |
| `platform_admin` | 2 | info@expos.news, drtalal46@gmail.com |
| `platform_support` | 1 | drtalal46@gmail.com |

**ملاحظة:** drtalal46@gmail.com لديه أدوار متعددة!

---

## 🔐 كلمات المرور

❌ **لم يتم تصدير كلمات المرور** لأسباب أمنية!

**يجب على كل مستخدم:**
1. إعادة تعيين كلمة المرور عبر "Forgot Password"
2. أو سيتم إرسال رابط تعيين كلمة مرور عند الدعوة

---

## ✅ التحقق بعد الاستعادة

بعد إنشاء جميع المستخدمين، نفذ:

```sql
-- التحقق من المستخدمين والأدوار
SELECT 
  u.email,
  ut.tenant_id,
  t.name as tenant_name,
  ur.role::TEXT
FROM auth.users u
LEFT JOIN public.user_tenants ut ON u.id = ut.user_id
LEFT JOIN public.tenants t ON ut.tenant_id = t.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id AND ur.tenant_id = ut.tenant_id
ORDER BY u.email;
```

**النتيجة المتوقعة:** جميع المستخدمين لديهم tenant_id و role!

---

## 📝 ملاحظات إضافية

- ✅ جميع Emails مؤكدة في المشروع الأصلي
- ✅ لا يوجد MFA مفعل
- ✅ Auth Provider: Email فقط (لا Google/GitHub)
- ⚠️ تذكر تحديث كلمات المرور بعد الاستعادة

---

**آخر تحديث:** 2025-11-20
