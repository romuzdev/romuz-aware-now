# Gate-N Tests Setup Guide

هذا الدليل يشرح كيفية إعداد وتشغيل مجموعة اختبارات Gate-N.

## ملفات الاختبار التي تم إنشاؤها

### 1. اختبارات Backend
- ✅ `tests/gate-n-rpc.test.ts` - اختبارات دوال RPC
- ✅ `tests/gate-n-edge-functions.test.ts` - اختبارات Edge Functions HTTP
- ✅ `tests/gate-n-api-wrapper.test.ts` - اختبارات API wrapper

### 2. اختبارات E2E
- ✅ `cypress/e2e/gate-n-admin-console.cy.ts` - اختبارات End-to-end في Cypress

### 3. التوثيق
- ✅ `docs/gate-n-admin-console_test-plan_v1.md` - خطة الاختبار الكاملة

## المتطلبات الأساسية

### تثبيت المكتبات
تم تثبيت المكتبات التالية:
```bash
✅ @testing-library/react
✅ @testing-library/jest-dom
✅ @testing-library/user-event
✅ jsdom
✅ vitest (مُثبت مسبقاً)
```

### إعداد Vitest
تم إنشاء الملفات التالية:
- ✅ `vitest.setup.ts` - ملف الإعداد
- ✅ تحديث `vite.config.ts` مع إعدادات test

## تشغيل الاختبارات

### اختبارات Backend (Unit Tests)
```bash
# تشغيل جميع اختبارات Gate-N
npm test -- tests/gate-n

# تشغيل ملف اختبار محدد
npm test -- tests/gate-n-rpc.test.ts

# تشغيل مع تغطية الكود
npm test -- --coverage tests/gate-n
```

### اختبارات E2E (Cypress)
```bash
# فتح واجهة Cypress
npx cypress open

# تشغيل بدون واجهة
npx cypress run --spec "cypress/e2e/gate-n-admin-console.cy.ts"
```

## ⚠️ ملاحظة هامة: اختبارات UI Components

اختبارات React components (RTL) **لم يتم تضمينها** بسبب تعقيدات التوافق مع البيئة الحالية.

### لإضافة اختبارات UI لاحقاً:

1. **تثبيت المكتبات الإضافية:**
```bash
npm install --save-dev @testing-library/dom
```

2. **تحديث vitest.setup.ts:**
```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// تنظيف بعد كل اختبار
afterEach(() => {
  cleanup();
});

// إضافة matchers مخصصة
expect.extend({
  toBeInTheDocument(received) {
    // منطق الاختبار
  }
});
```

3. **مثال على اختبار UI:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import GateNStatusPanel from '@/features/gateN/GateNStatusPanel';

describe('GateNStatusPanel', () => {
  it('should render status panel', () => {
    render(<GateNStatusPanel />);
    expect(screen.getByText(/الحالة/i)).toBeVisible();
  });
});
```

### البديل المتاح حالياً:
- ✅ **Cypress E2E Tests** - توفر اختبار شامل للواجهة
- ✅ **Backend Tests** - تغطية كاملة للطبقات الخلفية

## إعداد بيئة الاختبار

### 🌱 إنشاء بيانات الاختبار (Test Data Seeding)

يوفر المشروع **seed scripts** جاهزة لإضافة بيانات اختبار بشكل تلقائي:

#### الطريقة الأولى: SQL Seed Script (مُوصى بها)

📁 استخدم الملف: `tests/seed/gate-n-test-data.sql`

**الخطوات:**
1. افتح Lovable Backend (Settings → Backend)
2. انتقل إلى SQL Editor
3. انسخ والصق محتويات `tests/seed/gate-n-test-data.sql`
4. عدّل القيم التالية قبل التنفيذ:
   ```sql
   DECLARE
     v_admin_user_id UUID := 'YOUR-USER-ID-HERE'; -- استبدل بـ UUID المستخدم الفعلي
     v_tenant_id UUID := 'YOUR-TENANT-ID-HERE';   -- استبدل بـ UUID الـ tenant الفعلي
   ```
5. نفّذ الـ script
6. تحقق من الرسالة: `✅ Gate-N test data seeded successfully!`

**ماذا سينشئ الـ script:**
- ✅ دور `admin` للمستخدم الاختباري
- ✅ إعدادات admin (SLA config، feature flags، limits)
- ✅ 6 وظائف نظام (system_jobs) متنوعة
- ✅ 3 job runs تاريخية (succeeded، failed، running)

#### الطريقة الثانية: TypeScript Helper (للاختبارات الآلية)

📁 استخدم الملف: `tests/helpers/seed-test-data.ts`

**مثال:**
```typescript
import { 
  createTestSupabaseClient, 
  seedAllGateNData,
  cleanupTestData 
} from '../helpers/seed-test-data';

// في beforeAll
const supabase = createTestSupabaseClient();
await seedAllGateNData(supabase);

// في afterAll
await cleanupTestData(supabase);
```

#### الدوال المتاحة:
- `seedAdminSettings()` - إضافة admin_settings
- `seedSystemJobs()` - إضافة 6 وظائف نظام
- `seedUserRole()` - إعطاء دور admin
- `seedJobRuns()` - إضافة job runs تاريخية
- `seedAllGateNData()` - **إضافة كل شيء دفعة واحدة** ⭐
- `cleanupTestData()` - حذف جميع البيانات
- `verifyTestData()` - التحقق من البيانات

### البيانات المطلوبة

قبل تشغيل الاختبارات، تأكد من وجود:

1. **مستخدم اختباري**: 
   - يمكن إنشاؤه عبر Backend → Authentication → Users
   - Email: `admin-test@gate-n.local` (أو أي email آخر)
   - Password: كلمة سر قوية
   - احفظ UUID المستخدم

2. **Tenant ID**: 
   - استخدم `00000000-0000-0000-0000-000000000000` (الافتراضي)
   - أو أي tenant_id موجود في قاعدة البيانات

3. **دور Admin**: 
   - سيُضاف تلقائياً عبر seed script إلى جدول `user_roles`

### التحقق من البيانات

بعد تشغيل seed script:

```sql
-- تحقق من admin_settings
SELECT COUNT(*) FROM admin_settings WHERE tenant_id = 'YOUR-TENANT-ID';

-- تحقق من system_jobs
SELECT job_key, is_enabled FROM system_jobs WHERE tenant_id = 'YOUR-TENANT-ID';

-- تحقق من job_runs
SELECT status, COUNT(*) FROM system_job_runs 
WHERE tenant_id = 'YOUR-TENANT-ID' GROUP BY status;

-- تحقق من user_roles
SELECT role FROM user_roles WHERE user_id = 'YOUR-USER-ID';
```

أو استخدم TypeScript helper:
```typescript
const results = await verifyTestData(supabase);
console.log(results); // { admin_settings: 1, system_jobs: 6, ... }
```

📖 **للمزيد من التفاصيل**: راجع `tests/seed/README.md`

## إعدادات الاختبار

### متغيرات البيئة
أنشئ `.env.test`:
```
VITE_SUPABASE_URL=your-test-supabase-url
VITE_SUPABASE_ANON_KEY=your-test-anon-key
```

### بيانات Mock
اختبارات Backend تستخدم استجابات مُحاكاة. حدّث بيانات mock في ملفات الاختبار حسب الحاجة.

## التكامل مع CI/CD

### مثال GitHub Actions
```yaml
name: Gate-N Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- tests/gate-n
      - run: npx cypress run --spec "cypress/e2e/gate-n-admin-console.cy.ts"
```

## استكشاف الأخطاء

### المشاكل الشائعة

1. **الاختبارات تفشل بسبب مكتبات مفقودة**
   - قم بتشغيل `npm install` لضمان تثبيت جميع المكتبات

2. **اختبارات RPC تفشل مع TENANT_REQUIRED**
   - تأكد من أن المستخدم الاختباري لديه ارتباط مستأجر صحيح
   - تحقق من أن دالة `get_user_tenant_id()` تعمل

3. **اختبارات Edge Function تُرجع 401**
   - تحقق من صحة JWT tokens الاختبارية
   - تأكد من إعداد auth helper بشكل صحيح

4. **اختبارات Cypress لا تجد العناصر**
   - زد قيم المهلة (timeout)
   - تحقق من أن selectors تطابق النص العربي/الإنجليزي

### وضع التصحيح
تفعيل logging مفصّل:
```bash
DEBUG=* npm test -- tests/gate-n-rpc.test.ts
```

## الخطوات التالية

1. ✅ راجع خطة الاختبار: `docs/gate-n-admin-console_test-plan_v1.md`
2. ✅ أعد بيئة الاختبار مع seed data
3. ✅ شغّل اختبارات backend للتحقق من طبقات RPC/Edge/API
4. ✅ شغّل اختبارات E2E للتحقق من تدفقات UI
5. ⚠️ أضف اختبارات UI components عند الحاجة (اختياري)
6. ✅ ادمج في CI/CD pipeline

## أهداف التغطية

أهداف تغطية الاختبار لـ Gate-N:
- RPC Functions: 90%+
- Edge Functions: 85%+
- API Wrapper: 90%+
- UI Components: 70%+ (عند الإضافة)

شغّل تقرير التغطية:
```bash
npm test -- --coverage tests/gate-n
```

## الدعم

للأسئلة أو المشاكل مع الاختبارات:
1. راجع توثيق خطة الاختبار
2. راجع أمثلة الاختبارات الموجودة
3. استشر قاعدة معرفة المشروع (Knowledge)
4. اسأل في chat الفريق/Discord

---

**آخر تحديث:** 2025-11-11  
**الحالة:** ✅ Backend Tests + E2E Ready | ⚠️ UI Component Tests Optional
