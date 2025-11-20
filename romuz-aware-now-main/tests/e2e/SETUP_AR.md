# دليل اختبار E2E - منصة Romuz

## 📋 المتطلبات الأساسية

### 1. تثبيت Playwright
```bash
npx playwright install
```

### 2. إعداد متغيرات البيئة
أنشئ ملف `.env.test` في جذر المشروع:
```env
E2E_SUPABASE_URL=https://varbgkrfwbgzmkkxpqjg.supabase.co
E2E_SUPABASE_SERVICE_KEY=your-service-key
E2E_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
E2E_BASE_URL=http://localhost:5173
```

### 3. إعداد المستخدمين الاختباريين
قبل تشغيل الاختبارات، يجب إنشاء المستخدمين التاليين في قاعدة البيانات:

#### Admin User
- Email: `admin@test.romuz.local`
- Password: `TestAdmin123!`
- Role: `admin`
- Permissions: `campaigns.manage`, `campaigns.view`

#### Manager User
- Email: `manager@test.romuz.local`
- Password: `TestManager123!`
- Role: `manager`
- Permissions: `campaigns.manage`, `campaigns.view`

#### Reader User
- Email: `reader@test.romuz.local`
- Password: `TestReader123!`
- Role: `reader`
- Permissions: `campaigns.view`

## 🚀 تشغيل الاختبارات

### تشغيل جميع الاختبارات
```bash
npx playwright test
```

### تشغيل اختبارات UI فقط
```bash
npx playwright test admin.flow.spec.ts manager.flow.spec.ts reader.flow.spec.ts
```

### تشغيل اختبارات API فقط
```bash
npx playwright test api.*.spec.ts
```

### تشغيل اختبار محدد
```bash
# اختبار Admin Flow
npx playwright test admin.flow.spec.ts

# اختبار Manager Flow
npx playwright test manager.flow.spec.ts

# اختبار Reader Flow (RBAC Guards)
npx playwright test reader.flow.spec.ts
```

### تشغيل مع واجهة المستخدم
```bash
npx playwright test --ui
```

### وضع التصحيح
```bash
npx playwright test --debug
```

### تشغيل بالتوازي (أسرع)
```bash
npx playwright test --workers=3
```

## 📊 نتائج الاختبارات

### عرض التقرير HTML
```bash
npx playwright show-report test-results/html
```

### عرض التتبع (Trace)
```bash
npx playwright show-trace test-results/trace.zip
```

### الملفات المُنتجة
- **Screenshots**: `test-results/screenshots/`
- **Videos**: `test-results/videos/`
- **Traces**: `test-results/traces/`
- **HTML Report**: `test-results/html/index.html`

## 🧪 محتوى الاختبارات

### 1. Admin Flow (8 خطوات)
✅ إنشاء حملة جديدة  
✅ إضافة محتوى (فيديو + مستند)  
✅ إرفاق اختبار (Quiz)  
✅ استيراد المشاركين من CSV  
✅ تحديث حالة المشاركين بشكل جماعي  
✅ إرسال إشعارات  
✅ التحقق من المؤشرات (KPIs)  
✅ التحقق من سجل التدقيق (Audit Log)

### 2. Manager Flow (7 خطوات)
✅ فتح حملة موجودة  
✅ تحديث جماعي للمشاركين  
✅ تصدير CSV  
✅ الانتقال إلى لوحات المعلومات  
✅ التحقق من المؤشرات والرسوم البيانية  
✅ الانتقال التفصيلي (Drill-down)  
✅ التحقق من صلاحيات المدير

### 3. Reader Flow (11 خطوة - RBAC Guards)
✅ عرض قائمة الحملات  
✅ زر "حملة جديدة" معطل  
✅ عرض التفاصيل (قراءة فقط)  
✅ استيراد CSV معطل  
✅ زر "إضافة محتوى" معطل  
✅ منع الوصول المباشر لـ /new  
✅ منع الوصول المباشر لـ /edit  
✅ الإجراءات الجماعية معطلة  
✅ عدم وجود RBAC flash  
✅ التصدير مسموح (قراءة)  
✅ لوحات المعلومات متاحة

### 4. API Tests
✅ **Campaigns API**: CRUD, RLS, Constraints  
✅ **Participants API**: Operations, Metrics, Analytics  
✅ **Saved Views API**: CRUD, Constraints, Isolation

## 🔒 اختبارات الأمان (RBAC)

### Matrix الصلاحيات
| الإجراء | Admin | Manager | Reader |
|---------|-------|---------|--------|
| إنشاء حملة | ✅ | ✅ | ❌ |
| تعديل حملة | ✅ | ✅ | ❌ |
| عرض حملة | ✅ | ✅ | ✅ |
| حذف حملة | ✅ | ✅ | ❌ |
| استيراد CSV | ✅ | ✅ | ❌ |
| تصدير CSV | ✅ | ✅ | ✅ |
| إجراءات جماعية | ✅ | ✅ | ❌ |
| لوحات المعلومات | ✅ | ✅ | ✅ |
| إرسال إشعارات | ✅ | ✅ | ❌ |

## 🐛 التصحيح (Debugging)

### عرض السجلات
تُسجل Playwright سجلات المتصفح تلقائياً. يمكن عرضها في Trace Viewer.

### لقطات الشاشة
يتم حفظ لقطات الشاشة تلقائياً عند الفشل في:
```
test-results/screenshots/
```

### تتبع الإجراءات
عند الفشل، يتم حفظ تتبع كامل للإجراءات:
```bash
npx playwright show-trace test-results/trace.zip
```

## ⚙️ الإعدادات المتقدمة

### تغيير المهلات الزمنية
في `playwright.config.ts`:
```typescript
timeout: 60 * 1000, // 60 ثانية لكل اختبار
actionTimeout: 10 * 1000, // 10 ثوانٍ لكل إجراء
```

### تغيير المنفذ
```bash
E2E_BASE_URL=http://localhost:3000 npx playwright test
```

### تشغيل على CI/CD
```bash
CI=1 npx playwright test --reporter=html
```

## 📝 ملاحظات مهمة

### بيانات الاختبار
- جميع البيانات المُنشأة في الاختبارات تُعلَّم بـ `is_test: true`
- يمكن حذفها باستخدام edge function: `clear-test-data`

### عزل Tenant
- كل دور اختباري ينتمي إلى tenant منفصل
- لا يوجد وصول عبر tenants
- التنظيف بعد كل تشغيل

### منع التقلب (Flakiness)
- انتظار network idle قبل التحققات
- استخدام انتظار صريح (explicit waits)
- عدد إعادة المحاولة: 1 على CI، 0 محلياً
- worker واحد للتنفيذ المتسلسل

## 🎯 معايير النجاح

### اختبارات UI
✅ 8 خطوات admin مكتملة  
✅ 7 خطوات manager مكتملة  
✅ 11 خطوة reader مكتملة (RBAC enforced)

### اختبارات API
✅ 10+ اختبارات campaigns API  
✅ 8+ اختبارات participants API  
✅ 9+ اختبارات saved views API

### بوابات الجودة
✅ عدم وجود تقلب (retries ≤ 1)  
✅ لقطات شاشة عند الفشل  
✅ جميع سياسات RLS مُفعَّلة  
✅ جميع القيود مُطبَّقة

## 📚 موارد إضافية

- [Playwright Documentation](https://playwright.dev/)
- [Test Isolation](https://playwright.dev/docs/test-isolation)
- [Authentication](https://playwright.dev/docs/auth)
- [Selectors Best Practices](https://playwright.dev/docs/selectors)
- [CI/CD Integration](https://playwright.dev/docs/ci)

## 🆘 المشاكل الشائعة

### Problem: "Timeout waiting for element"
**Solution**: زيادة المهلة الزمنية أو التأكد من أن العنصر موجود في الصفحة

### Problem: "No storage state found"
**Solution**: تشغيل `auth.setup.ts` أولاً لإنشاء حالات المصادقة

### Problem: "Test data not found"
**Solution**: التأكد من إنشاء المستخدمين الاختباريين في قاعدة البيانات

### Problem: "RLS policy violation"
**Solution**: التحقق من أن المستخدم لديه الصلاحيات المطلوبة في الجدول المناسب

## 🔧 أوامر سريعة

```bash
# تثبيت
npx playwright install

# تشغيل جميع الاختبارات
npx playwright test

# تشغيل مع UI
npx playwright test --ui

# تشغيل اختبار واحد فقط
npx playwright test admin.flow.spec.ts

# عرض التقرير
npx playwright show-report

# تصحيح
npx playwright test --debug

# تحديث snapshots
npx playwright test --update-snapshots
```

---

**نصيحة**: ابدأ بتشغيل `admin.flow.spec.ts` أولاً للتأكد من أن الإعداد صحيح!
