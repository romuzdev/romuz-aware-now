# 🚀 دليل إعداد GitHub Actions - خطوة بخطوة

هذا الدليل يشرح كيفية تفعيل الاختبارات التلقائية على GitHub.

## 📋 الخطوات المطلوبة

### 1️⃣ ربط المشروع بـ GitHub

إذا لم تكن قد ربطت المشروع بعد:

1. في Lovable، اضغط على **GitHub** → **Connect to GitHub**
2. اختر حسابك على GitHub
3. اضغط **Create Repository**
4. سيتم إنشاء repository تلقائياً مع جميع الملفات

### 2️⃣ إضافة Test Scripts في package.json

⚠️ **مهم:** package.json هو ملف read-only في Lovable، لذلك تحتاج لإضافة الـ scripts يدوياً عبر GitHub.

**الطريقة 1: عبر GitHub مباشرة:**

1. افتح repository الخاص بك على GitHub
2. انتقل إلى ملف `package.json`
3. اضغط على زر "Edit" (أيقونة القلم)
4. أضف هذه الأسطر في قسم `"scripts"`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:run": "vitest run"
  }
}
```

5. اضغط **Commit changes**

**الطريقة 2: عبر Terminal محلياً:**

```bash
# 1. استنسخ المشروع
git clone YOUR_REPO_URL
cd YOUR_PROJECT_NAME

# 2. افتح package.json وأضف الـ scripts أعلاه

# 3. ارفع التغييرات
git add package.json
git commit -m "Add test scripts"
git push
```

### 3️⃣ التحقق من الملفات

تأكد أن هذه الملفات موجودة في repository:

```
✅ .github/workflows/test.yml
✅ .github/workflows/security-scan.yml
✅ .github/PULL_REQUEST_TEMPLATE.md
✅ tests/unit/rbac-security.spec.ts
✅ vitest.config.ts
✅ tests/setup.ts
✅ README.md
```

### 4️⃣ اختبار الـ Workflow

الآن، عند أي commit جديد، ستعمل الاختبارات تلقائياً!

لاختبار الآن:

```bash
# 1. اعمل تعديل بسيط (مثلاً أضف سطر في README.md)
echo "# Test" >> README.md

# 2. ارفع التعديل
git add README.md
git commit -m "Test GitHub Actions"
git push
```

### 5️⃣ مشاهدة النتائج

1. افتح repository على GitHub
2. انتقل إلى تبويب **Actions**
3. ستشاهد الـ workflow يعمل!

```
🟢 Tests & Security Checks
   ✅ Run Tests
   ✅ RBAC Security Check
   ✅ Code Quality Check
   ✅ Build Check
```

## 📊 ما يحدث عند كل Commit

### المرحلة 1: تشغيل الاختبارات (Tests)
```
📥 تحميل الكود
🟢 تثبيت Node.js
📦 تثبيت الحزم
🧪 تشغيل 121 اختبار
📊 إنشاء تقرير التغطية
```

### المرحلة 2: فحص الأمان (Security)
```
🔒 فحص صلاحيات RBAC
🛡️ فحص الثغرات الأمنية
🔍 فحص التبعيات
```

### المرحلة 3: فحص الجودة (Quality)
```
📝 فحص ESLint
🔍 فحص TypeScript
```

### المرحلة 4: البناء (Build)
```
🏗️ بناء المشروع
📊 فحص حجم الملفات
```

## 🎯 النتائج المتوقعة

### ✅ إذا نجحت جميع الاختبارات:

```
✅ All Checks Passed!
   ✅ Tests: 121/121 passed
   ✅ Security: No issues
   ✅ Lint: Clean
   ✅ Build: Success

🚀 Ready to merge!
```

### ❌ إذا فشل اختبار:

```
❌ Tests failed
   ❌ RBAC Security - Route Protection
      Employee should not access Admin dashboard
      Expected: false
      Received: true

🔧 Fix required before merge
```

## 📈 إضافة Badge في README

بعد أول commit ناجح:

1. افتح repository على GitHub
2. اذهب إلى **Actions** → اضغط على workflow
3. انسخ الـ badge markdown
4. الصق في `README.md`:

```markdown
[![Tests](https://github.com/USERNAME/REPO/actions/workflows/test.yml/badge.svg)](https://github.com/USERNAME/REPO/actions/workflows/test.yml)
```

استبدل `USERNAME` و `REPO` باسمك واسم المشروع.

## 🔔 تفعيل الإشعارات

لتلقي إشعارات عند فشل الاختبارات:

1. في GitHub، اذهب إلى **Settings** → **Notifications**
2. فعّل: **Actions** → **Send notifications for failed workflows**

## 🎛️ تخصيص الـ Workflows

### تغيير متى يشتغل:

افتح `.github/workflows/test.yml` وعدّل:

```yaml
on:
  push:
    branches:
      - main        # يشتغل على main
      - develop     # ويشتغل على develop
  pull_request:     # ويشتغل على كل PR
```

### تغيير إصدارات Node.js:

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]  # اختبر على إصدارين
```

### إضافة خطوة جديدة:

```yaml
- name: 🎨 Run Prettier
  run: npm run format:check
```

## 🐛 استكشاف الأخطاء

### المشكلة: "npm: command not found"
**الحل:** تأكد من `setup-node@v4` موجود في الـ workflow

### المشكلة: "test script not found"
**الحل:** أضف test scripts في package.json (راجع الخطوة 2)

### المشكلة: الـ workflow لا يشتغل
**الحل:** 
1. تأكد أن الملف موجود في `.github/workflows/`
2. تأكد أن اسم الملف ينتهي بـ `.yml` أو `.yaml`
3. تحقق من صحة الـ YAML syntax

### المشكلة: الاختبارات تفشل على GitHub لكن تنجح محلياً
**الحل:**
1. تأكد من تزامن dependencies: `npm ci` بدلاً من `npm install`
2. تحقق من متغيرات البيئة
3. تأكد من صحة الـ paths

## 📚 موارد إضافية

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vitest Documentation](https://vitest.dev/)
- [Lovable GitHub Integration](https://docs.lovable.dev/features/github)

## ✅ Checklist النهائي

- [ ] ربط المشروع بـ GitHub
- [ ] إضافة test scripts في package.json
- [ ] التحقق من وجود workflow files
- [ ] اختبار بـ commit جديد
- [ ] مشاهدة النتائج في Actions tab
- [ ] إضافة badge في README
- [ ] تفعيل الإشعارات

---

**🎉 تهانينا!** الآن لديك CI/CD كامل مع 121 اختبار أمني يشتغل تلقائياً!
