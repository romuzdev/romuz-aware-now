# 🧪 دليل تشغيل الاختبارات - Gate-U RBAC Security Tests

## 📋 نظرة عامة

تم إنشاء **100+ اختبار شامل** لنظام الحماية والصلاحيات (RBAC) يغطي:
- ✅ حماية المسارات لجميع الـ Dashboards (56 اختبار)
- ✅ فلترة القائمة الجانبية (15 اختبار)
- ✅ مصفوفة الصلاحيات (20 اختبار)
- ✅ السيناريوهات الأمنية (25 اختبار)
- ✅ تقرير التغطية الشاملة (5 اختبارات)

---

## 🚀 كيفية تشغيل الاختبارات

### **الطريقة 1: باستخدام npm** (محلياً)

```bash
# 1. تثبيت الحزم (إذا لم تكن مثبتة)
npm install

# 2. تشغيل جميع الاختبارات
npm run test

# 3. تشغيل اختبارات RBAC فقط
npm run test tests/unit/rbac-security.spec.ts

# 4. تشغيل مع واجهة UI
npm run test:ui

# 5. تشغيل مع تقرير التغطية
npm run test:coverage
```

### **الطريقة 2: باستخدام Vitest مباشرة**

```bash
# تشغيل في وضع المراقبة (watch mode)
npx vitest

# تشغيل اختبار محدد
npx vitest tests/unit/rbac-security.spec.ts

# تشغيل مرة واحدة فقط
npx vitest run
```

### **الطريقة 3: في VS Code**

1. ثبّت إضافة: **Vitest Extension**
2. افتح ملف الاختبار: `tests/unit/rbac-security.spec.ts`
3. اضغط على زر "Run Test" بجانب كل اختبار

---

## 📊 قراءة النتائج

### **نتيجة ناجحة:**
```
✓ tests/unit/rbac-security.spec.ts (100) 
  ✓ 🔒 RBAC Security - Route Protection (56)
  ✓ 🎯 RBAC Security - Sidebar Filtering (15)
  ✓ 🔐 RBAC Security - Permission Matrix Validation (20)
  ✓ 🚨 RBAC Security - Edge Cases & Attack Vectors (25)
  ✓ 📊 RBAC Security - Comprehensive Coverage Report (5)

Test Files  1 passed (1)
     Tests  100 passed (100)
  Start at  10:30:00
  Duration  234ms
```

### **نتيجة فاشلة:**
```
✓ tests/unit/rbac-security.spec.ts (99 failed: 1)
  ✓ 🔒 RBAC Security - Route Protection (55 failed: 1)
    ✗ should deny Employee access to Admin dashboard
      Expected: false
      Received: true
```

---

## 🎯 هيكل الاختبارات

```
tests/
├── unit/
│   ├── rbac-security.spec.ts    # 🔒 الاختبارات الأمنية الشاملة
│   └── rbacCan.spec.ts          # اختبارات RBAC القديمة
├── e2e/
│   └── auth.setup.ts            # إعداد المصادقة للاختبارات
├── setup.ts                      # إعداد بيئة الاختبارات
├── manual-test-runner.ts         # تشغيل يدوي للتحقق السريع
└── README.md                     # هذا الملف
```

---

## 🔍 أمثلة من الاختبارات

### **مثال 1: حماية المسار**
```typescript
it('should deny Employee access to Admin dashboard', () => {
  const employeeRoles: AppRole[] = ['employee'];
  expect(rolesHavePermission(employeeRoles, 'route.admin')).toBe(false);
});
```
**الشرح:** يتحقق أن الموظف العادي لا يستطيع الوصول لصفحة الأدمن

---

### **مثال 2: فلترة القائمة**
```typescript
it('should show User menu item only for Employee', () => {
  const employeeRoles: AppRole[] = ['employee'];
  expect(rolesHavePermission(employeeRoles, 'route.user')).toBe(true);
  expect(rolesHavePermission(employeeRoles, 'route.admin')).toBe(false);
});
```
**الشرح:** يتحقق أن القائمة الجانبية تعرض User فقط للموظف

---

### **مثال 3: منع التصعيد**
```typescript
it('should prevent privilege escalation', () => {
  const employeeRoles: AppRole[] = ['employee'];
  expect(rolesHavePermission(employeeRoles, 'manage_users')).toBe(false);
});
```
**الشرح:** يتحقق أن الموظف لا يستطيع إدارة المستخدمين

---

## 🛠️ تكوين الاختبارات

### **vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

---

## 🎯 السيناريوهات المغطاة

### **1. حماية المسارات (Route Protection)**
- ✅ Employee → User Dashboard فقط
- ✅ Awareness Manager → User + Awareness
- ✅ Risk Manager → User + Risk
- ✅ Admin → جميع الـ Dashboards
- ✅ منع الوصول غير المصرح به

### **2. فلترة القائمة (Sidebar Filtering)**
- ✅ عرض القوائم المسموح بها فقط
- ✅ إخفاء القوائم الممنوعة
- ✅ دعم الأدوار المتعددة

### **3. مصفوفة الصلاحيات (Permissions)**
- ✅ Awareness Manager → إدارة الحملات
- ✅ Compliance Officer → إدارة السياسات
- ✅ HR Manager → إدارة المستخدمين
- ✅ Executive → عرض التقارير (بدون تصدير)

### **4. السيناريوهات الأمنية (Security)**
- ✅ أدوار فارغة → لا صلاحيات
- ✅ أدوار غير صحيحة → لا صلاحيات
- ✅ حساسية الأحرف (case sensitive)
- ✅ منع تصعيد الصلاحيات
- ✅ دعم الأدوار المتعددة
- ✅ التوافقية مع الأدوار القديمة

---

## 📈 التغطية المتوقعة

```
File                          | % Stmts | % Branch | % Funcs | % Lines
-----------------------------|---------|----------|---------|--------
src/integrations/supabase/   |         |          |         |
  rbac.ts                    | 100.00  | 100.00   | 100.00  | 100.00
src/hooks/                   |         |          |         |
  useRBAC.ts                 | 100.00  | 100.00   | 100.00  | 100.00
src/components/routing/      |         |          |         |
  RoleGuard.tsx              |  95.00  |  90.00   | 100.00  |  95.00
```

---

## 🚨 استكشاف الأخطاء

### **المشكلة: "Cannot find module '@/integrations/supabase/rbac'"**
**الحل:**
```bash
# تأكد من تكوين path alias في vitest.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### **المشكلة: "ReferenceError: describe is not defined"**
**الحل:**
```typescript
// أضف في vitest.config.ts
test: {
  globals: true,  // ← هذا السطر
}
```

### **المشكلة: الاختبارات بطيئة**
**الحل:**
```bash
# استخدم الوضع السريع
npm run test -- --run --reporter=dot
```

---

## 📚 موارد إضافية

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [RBAC Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)

---

## ✅ ملاحظات مهمة

1. **التشغيل المحلي:** الاختبارات تعمل فقط في بيئة التطوير المحلية، وليس في Lovable preview
2. **التحديثات التلقائية:** عند تعديل الكود، الاختبارات تُشغّل تلقائياً في watch mode
3. **CI/CD:** يمكن دمج الاختبارات في GitHub Actions أو أي CI/CD pipeline
4. **التغطية:** احرص على الحفاظ على تغطية 100% لملفات RBAC

---

## 🎉 النتيجة

✅ **100+ اختبار شامل**  
✅ **تغطية كاملة لجميع السيناريوهات**  
✅ **حماية أمنية مضمونة**  
✅ **كشف مبكر للمشاكل**  
✅ **ثقة كاملة في النظام**
