# إعداد Seed Scripts في package.json

## الخطوة الأخيرة: إضافة npm scripts

لتشغيل seed scripts بسهولة، أضف السطور التالية إلى `package.json`:

```json
{
  "scripts": {
    "test:seed": "tsx tests/seed/run-seed.ts",
    "test:cleanup": "tsx tests/seed/run-cleanup.ts",
    "test:verify": "tsx -e \"import {createTestSupabaseClient, verifyTestData} from './tests/helpers/seed-test-data'; verifyTestData(createTestSupabaseClient()).then(console.log)\""
  }
}
```

## الاستخدام

بعد إضافة الـ scripts:

```bash
# إضافة جميع بيانات الاختبار
npm run test:seed

# حذف جميع بيانات الاختبار
npm run test:cleanup

# التحقق من البيانات الموجودة
npm run test:verify
```

## المتطلبات

تأكد من تثبيت `tsx`:

```bash
npm install -D tsx
```

## إعداد متغيرات البيئة

أنشئ ملف `.env.test`:

```env
E2E_SUPABASE_URL=your-supabase-url
E2E_SUPABASE_ANON_KEY=your-supabase-anon-key
```

أو استخدم المتغيرات الموجودة في `.env`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

**ملاحظة:** لا يمكن تعديل `package.json` تلقائياً. يجب إضافة الـ scripts يدوياً.
