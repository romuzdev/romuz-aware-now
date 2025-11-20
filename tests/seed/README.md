# Gate-N Test Data Seeding Guide

هذا الدليل يشرح كيفية إنشاء بيانات اختبار لـ Gate-N.

## الملفات المتاحة

### 1. SQL Seed Script
📁 `tests/seed/gate-n-test-data.sql`

**الاستخدام:**
```bash
# عبر Supabase SQL Editor
# 1. افتح Lovable Backend
# 2. انتقل إلى SQL Editor
# 3. انسخ والصق محتويات gate-n-test-data.sql
# 4. نفّذ الـ script

# أو عبر psql (إذا كان لديك وصول مباشر)
psql -h your-db-host -U postgres -d postgres -f tests/seed/gate-n-test-data.sql
```

**ماذا ينشئ:**
- ✅ دور admin للمستخدم الاختباري
- ✅ إعدادات admin (SLA، feature flags، limits)
- ✅ 6 وظائف نظام (system_jobs):
  - `refresh_kpis` - تحديث KPIs (يومي)
  - `generate_reports` - توليد التقارير (يومي)
  - `send_reminders` - إرسال تذكيرات (يومي)
  - `validate_impact_scores` - التحقق من النتائج (يدوي)
  - `archive_old_campaigns` - أرشفة الحملات (شهري)
  - `test_disabled_job` - وظيفة معطلة (للاختبار)
- ✅ 3 تشغيلات وظائف (job_runs):
  - نجحت (succeeded)
  - فشلت (failed)
  - قيد التنفيذ (running)

### 2. TypeScript Seed Helper
📁 `tests/helpers/seed-test-data.ts`

**الاستخدام في الاختبارات:**

```typescript
import { 
  createTestSupabaseClient, 
  seedAllGateNData,
  cleanupTestData,
  verifyTestData 
} from '../helpers/seed-test-data';

describe('Gate-N Tests', () => {
  let supabase: SupabaseClient;

  beforeAll(async () => {
    supabase = createTestSupabaseClient();
    await seedAllGateNData(supabase);
  });

  afterAll(async () => {
    await cleanupTestData(supabase);
  });

  it('should have test data', async () => {
    const results = await verifyTestData(supabase);
    expect(results.system_jobs).toBeGreaterThan(0);
  });
});
```

**الدوال المتاحة:**
- `createTestSupabaseClient()` - إنشاء Supabase client للاختبار
- `seedAdminSettings()` - إضافة admin_settings
- `seedSystemJobs()` - إضافة system_jobs
- `seedUserRole()` - إعطاء دور للمستخدم
- `seedJobRuns()` - إضافة job runs تاريخية
- `seedAllGateNData()` - إضافة كل البيانات دفعة واحدة
- `cleanupTestData()` - حذف جميع بيانات الاختبار
- `verifyTestData()` - التحقق من وجود البيانات

## التكوين (Configuration)

### المتغيرات المطلوبة

أنشئ ملف `.env.test` في الجذر:

```env
# Supabase Test Configuration
E2E_SUPABASE_URL=your-test-supabase-url
E2E_SUPABASE_ANON_KEY=your-test-anon-key

# Test User Configuration
TEST_TENANT_ID=00000000-0000-0000-0000-000000000000
TEST_ADMIN_USER_ID=bc32716f-3b0d-413d-9315-0c1b0b468f8f
TEST_ADMIN_EMAIL=admin-test@gate-n.local
```

### تعديل المعرّفات (UUIDs)

إذا كنت تستخدم tenant_id أو user_id مختلف:

#### في SQL Script:
```sql
-- عدّل السطر 71
DECLARE
  v_admin_user_id UUID := 'YOUR-USER-ID-HERE';
  v_tenant_id UUID := 'YOUR-TENANT-ID-HERE';
```

#### في TypeScript Helper:
```typescript
// في tests/helpers/seed-test-data.ts، عدّل:
export const TEST_CONFIG = {
  TENANT_ID: 'YOUR-TENANT-ID-HERE',
  ADMIN_USER_ID: 'YOUR-USER-ID-HERE',
  TEST_EMAIL: 'your-test-email@domain.com',
};
```

## إنشاء مستخدم اختبار

إذا لم يكن لديك مستخدم اختباري:

### عبر Lovable Backend:
1. افتح Backend (Settings → Backend)
2. انتقل إلى Authentication → Users
3. أنشئ مستخدم جديد:
   - Email: `admin-test@gate-n.local`
   - Password: `Test@123456` (أو كلمة سر قوية)
4. انسخ UUID المستخدم
5. عدّل الـ seed scripts بالـ UUID الجديد

### عبر SQL:
```sql
-- لا يُنصح به (فقط للبيئات التطويرية)
-- استخدم واجهة Supabase Auth بدلاً من ذلك
```

## التحقق من البيانات

### عبر SQL:
```sql
-- التحقق من admin_settings
SELECT * FROM public.admin_settings 
WHERE tenant_id = '00000000-0000-0000-0000-000000000000';

-- التحقق من system_jobs
SELECT job_key, job_type, is_enabled, gate_code 
FROM public.system_jobs 
WHERE tenant_id = '00000000-0000-0000-0000-000000000000';

-- التحقق من job_runs
SELECT sjr.status, sj.job_key, sjr.started_at, sjr.finished_at
FROM public.system_job_runs sjr
JOIN public.system_jobs sj ON sjr.job_id = sj.id
WHERE sjr.tenant_id = '00000000-0000-0000-0000-000000000000';

-- التحقق من user_roles
SELECT * FROM public.user_roles 
WHERE user_id = 'bc32716f-3b0d-413d-9315-0c1b0b468f8f';
```

### عبر TypeScript:
```typescript
import { createTestSupabaseClient, verifyTestData } from './helpers/seed-test-data';

const supabase = createTestSupabaseClient();
const results = await verifyTestData(supabase);

console.log('Test Data Status:');
console.log(`- Admin Settings: ${results.admin_settings}`);
console.log(`- System Jobs: ${results.system_jobs}`);
console.log(`- Job Runs: ${results.system_job_runs}`);
console.log(`- User Roles: ${results.user_roles}`);
```

## حذف البيانات (Cleanup)

### عبر SQL:
```sql
-- تشغيل cleanup script من gate-n-test-data.sql
DO $$
DECLARE
  v_tenant_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  DELETE FROM public.system_job_runs WHERE tenant_id = v_tenant_id;
  DELETE FROM public.system_jobs WHERE tenant_id = v_tenant_id;
  DELETE FROM public.admin_settings WHERE tenant_id = v_tenant_id;
  RAISE NOTICE '🧹 Test data cleaned up successfully!';
END $$;
```

### عبر TypeScript:
```typescript
import { createTestSupabaseClient, cleanupTestData } from './helpers/seed-test-data';

const supabase = createTestSupabaseClient();
await cleanupTestData(supabase);
```

## استكشاف الأخطاء

### المشكلة: "TENANT_REQUIRED"
**الحل:**
- تأكد من أن المستخدم لديه tenant_id في get_user_tenant_id()
- تحقق من أن المستخدم مرتبط بـ tenant في جدول user_tenants (إذا كان موجود)

### المشكلة: "Foreign key violation"
**الحل:**
- تأكد من تشغيل الـ script بالترتيب الصحيح
- تحقق من وجود المستخدم في auth.users قبل إضافة الأدوار

### المشكلة: "Row already exists"
**الحل:**
- الـ script يستخدم `ON CONFLICT` للتحديث التلقائي
- إذا أردت إعادة البدء، شغّل cleanup script أولاً

### المشكلة: "Permission denied"
**الحل:**
- تأكد من أن RLS policies تسمح بـ INSERT/UPDATE
- جرّب تشغيل الـ script كـ postgres user أو service_role

## الاستخدام في CI/CD

### GitHub Actions مثال:
```yaml
- name: Seed Test Data
  run: |
    npm run test:seed
  env:
    E2E_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
    E2E_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
```

### في package.json:
```json
{
  "scripts": {
    "test:seed": "tsx tests/seed/run-seed.ts",
    "test:cleanup": "tsx tests/seed/run-cleanup.ts"
  }
}
```

## الأسئلة الشائعة

**س: هل يجب إعادة seed البيانات قبل كل اختبار؟**  
ج: لا. قم بـ seed مرة واحدة، ثم استخدم cleanup/re-seed فقط عند الحاجة.

**س: هل يمكنني استخدام seed script في الـ production؟**  
ج: **لا!** هذه البيانات للاختبار فقط. لا تشغلها في production.

**س: كيف أضيف المزيد من البيانات؟**  
ج: عدّل الـ SQL script أو استخدم الدوال TypeScript لإضافة المزيد من jobs أو settings.

---

**آخر تحديث:** 2025-11-11  
**الحالة:** ✅ جاهز للاستخدام
