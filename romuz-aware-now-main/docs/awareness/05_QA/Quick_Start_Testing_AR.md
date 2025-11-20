# 🚀 دليل البدء السريع - تشغيل الاختبارات

## 📋 المتطلبات الأساسية

قبل البدء، تأكد من:
- ✅ Node.js مثبت (النسخة 18 أو أحدث)
- ✅ npm أو bun مثبت
- ✅ Git مثبت (للمطورين المحليين)

---

## ⚡ تشغيل سريع (Quick Start)

### 🔥 الخيار 1: تشغيل جميع الاختبارات (موصى به)

```bash
# في Lovable Terminal أو محلياً
npm run test
```

هذا الأمر يشغّل:
- ✅ Unit Tests (اختبارات الوحدات)
- ✅ Integration Tests (اختبارات التكامل)
- ✅ E2E Tests (اختبارات شاملة)
- ✅ Security Tests (اختبارات الأمان)
- ✅ Performance Tests (اختبارات الأداء)

---

### 🎯 الخيار 2: تشغيل اختبار محدد

```bash
# اختبارات Unit فقط
npm run test:unit

# اختبارات Integration فقط
npm run test:integration

# اختبارات E2E فقط
npm run test:e2e

# اختبارات Security فقط
npm run test:security

# اختبارات Performance فقط
npm run test:performance
```

---

## 📊 فهم النتائج

### ✅ نتيجة ناجحة
```
✓ tests/unit/awareness/campaigns.spec.ts (15)
✓ tests/integration/awareness/campaigns-rls.spec.ts (12)
✓ tests/e2e/awareness/campaigns.flow.spec.ts (8)

Test Files  3 passed (3)
     Tests  35 passed (35)
  Duration  2.34s
```

### ❌ نتيجة فاشلة
```
✗ tests/unit/awareness/campaigns.spec.ts (14 passed, 1 failed)
  ✗ should validate campaign dates
    Expected: true
    Received: false
```

---

## 🛠️ الأوامر المفيدة

### وضع المراقبة (Watch Mode)
```bash
# يعيد تشغيل الاختبارات تلقائياً عند التعديل
npm run test:unit:watch
npm run test:integration:watch
```

### تقرير التغطية (Coverage Report)
```bash
# يُنشئ تقرير بنسبة تغطية الكود
npm run test:coverage

# النتيجة تُحفظ في: coverage/index.html
```

### واجهة رسومية (UI Mode)
```bash
# فتح واجهة Vitest الرسومية
npm run test:ui

# فتح واجهة Playwright للـ E2E
npm run test:e2e:ui
```

---

## 🔍 اختبار وحدة محددة

### Awareness Module
```bash
npm run test:e2e:awareness     # جميع اختبارات Awareness
npm run test tests/unit/awareness/  # Unit tests فقط
```

### Gate-N Module (Cypress)
```bash
npm run test:cypress           # تشغيل Cypress headless
npm run test:cypress:open      # فتح واجهة Cypress
```

### Admin Tests
```bash
npm run test:e2e:admin         # اختبارات Admin Flow
npm run test:e2e:manager       # اختبارات Manager Flow
npm run test:e2e:reader        # اختبارات Reader Flow
```

---

## 🐛 حل المشاكل الشائعة

### المشكلة: الاختبارات تفشل بسبب المصادقة
**الحل**:
```bash
# تأكد من وجود ملفات المصادقة
ls test-results/.auth/

# إذا كانت مفقودة، شغّل الإعداد
npx playwright test auth.setup.ts
```

---

### المشكلة: `npm run test:e2e` يعطي خطأ
**الحل**:
```bash
# تثبيت متصفحات Playwright
npx playwright install

# إعادة تثبيت الحزم
npm install
```

---

### المشكلة: الاختبارات بطيئة جداً
**الحل**:
```bash
# تشغيل اختبارات محددة فقط
npm run test tests/unit/awareness/campaigns.spec.ts

# تعطيل الفيديو في E2E
npm run test:e2e -- --config playwright.config.ts
```

---

## 📈 معايير النجاح

| المعيار | الهدف | كيفية التحقق |
|---------|-------|--------------|
| **Unit Coverage** | ≥ 70% | `npm run test:coverage` |
| **All Tests Pass** | 100% | `npm run test` |
| **Security Tests** | جميعها تنجح | `npm run test:security` |
| **Performance** | < 300ms | `npm run test:performance` |

---

## 🎯 الخطوات التالية

بعد نجاح الاختبارات:

1. **مراجعة التقارير**:
   ```bash
   npm run test:coverage
   open coverage/index.html
   ```

2. **التأكد من الأمان**:
   ```bash
   npm run test:security
   ```

3. **التحقق من الأداء**:
   ```bash
   npm run test:performance
   ```

4. **الاستعداد للنشر** ✅

---

## 📚 روابط مفيدة

- [الخطة الشاملة](./Comprehensive_Testing_Plan_AR.md)
- [دليل الاختبارات التفصيلي](../README.md)
- [Vitest Documentation](https://vitest.dev)
- [Playwright Documentation](https://playwright.dev)

---

**آخر تحديث**: 2025-01-17  
**الحالة**: ✅ جاهز للاستخدام
