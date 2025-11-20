# 🚀 دليل البدء السريع - GitHub Actions للاختبارات التلقائية

## 📊 الوضع الحالي

✅ **جاهز ومُجهّز:**
- ✅ جميع ملفات workflows موجودة وجاهزة
- ✅ ملفات الاختبارات (121 اختبار وحدة + E2E tests)
- ✅ vitest.config.ts مُكوّن بشكل صحيح
- ✅ GitHub Actions workflows:
  - `ci.yml` - CI/CD شامل
  - `test.yml` - اختبارات عامة
  - `cypress-e2e.yml` - اختبارات E2E
  - `security-scan.yml` - فحص أمني
  - وملفات أخرى متقدمة

⚠️ **يحتاج تفعيل:**
- ⚠️ إضافة سكريبتات الاختبار في `package.json`

---

## 🎯 خطوة واحدة للتفعيل

### الطريقة الأولى: عبر GitHub مباشرة (الأسهل)

1. **افتح repository على GitHub:**
   ```
   https://github.com/romuzdev/romuz-aware-now
   ```

2. **عدّل ملف package.json:**
   - اضغط على ملف `package.json`
   - اضغط على أيقونة القلم (Edit) ✏️
   - ابحث عن قسم `"scripts"` (حوالي السطر 6)

3. **استبدل القسم بالكامل:**
   ```json
   "scripts": {
     "dev": "vite",
     "build": "vite build",
     "build:dev": "vite build --mode development",
     "lint": "eslint .",
     "preview": "vite preview",
     "test": "vitest",
     "test:ui": "vitest --ui",
     "test:coverage": "vitest run --coverage",
     "test:run": "vitest run",
     "test:unit": "vitest run tests/unit",
     "test:int": "vitest run tests/integration",
     "test:e2e": "cypress run"
   }
   ```

4. **احفظ التغييرات:**
   - اضغط **Commit changes**
   - أضف رسالة: `✅ Add test scripts for GitHub Actions`
   - اضغط **Commit changes**

5. **✅ انتهيت!** الآن GitHub Actions ستعمل تلقائياً!

---

### الطريقة الثانية: عبر Terminal محلياً

```bash
# 1. استنسخ المشروع
git clone https://github.com/romuzdev/romuz-aware-now.git
cd romuz-aware-now

# 2. افتح package.json بأي محرر نصوص
# أضف السكريبتات أعلاه في قسم "scripts"

# 3. ارفع التغييرات
git add package.json
git commit -m "✅ Add test scripts for GitHub Actions"
git push origin main
```

---

## 🧪 اختبار التفعيل

### الطريقة 1: تشغيل يدوي

1. اذهب إلى: [Actions على GitHub](https://github.com/romuzdev/romuz-aware-now/actions)
2. اختر workflow: **🧪 Tests & Security Checks**
3. اضغط **Run workflow**
4. اختر Branch: `main`
5. اضغط **Run workflow**
6. انتظر 5-10 دقائق
7. ستشاهد النتائج:
   ```
   ✅ Tests Passed (121/121)
   ✅ Security Checks Passed
   ✅ Lint Passed
   ✅ Build Successful
   ```

### الطريقة 2: commit جديد

```bash
# اعمل أي تعديل بسيط
echo "# Test GitHub Actions" >> README.md

# ارفع التعديل
git add README.md
git commit -m "🧪 Test GitHub Actions"
git push

# اذهب إلى Actions على GitHub لمشاهدة النتائج
```

---

## 📊 ماذا سيحدث الآن؟

### عند كل Push أو Pull Request، سيتم تلقائياً:

#### 1️⃣ **Pre-Checks (5 دقائق)**
```
✅ ESLint: فحص جودة الكود
✅ TypeScript: فحص الأنواع
```

#### 2️⃣ **Unit Tests (10 دقائق)**
```
✅ تشغيل 121 اختبار وحدة
✅ إنشاء تقرير التغطية (Coverage)
✅ رفع النتائج كـ artifacts
```

#### 3️⃣ **Integration Tests (15 دقيقة)**
```
✅ اختبارات RLS Policies
✅ اختبارات Database Constraints
✅ اختبارات Views & Functions
```

#### 4️⃣ **E2E Tests (30 دقيقة)**
```
✅ اختبارات Playwright/Cypress
✅ تسجيل فيديوهات
✅ حفظ Screenshots عند الفشل
```

#### 5️⃣ **Security Scans (10 دقائق)**
```
✅ فحص الثغرات الأمنية (Trivy)
✅ فحص التبعيات
✅ فحص صلاحيات RBAC
```

#### 6️⃣ **Build & Deploy (5 دقائق)**
```
✅ بناء المشروع للإنتاج
✅ فحص حجم الملفات
✅ التحقق من البناء
```

---

## 🎬 Artifacts المُنتجة

بعد كل workflow run، ستجد:

### 1. **Test Coverage Report**
- مسار: Actions → Workflow Run → Artifacts → `unit-test-coverage`
- يحتوي على: HTML report للتغطية

### 2. **Integration Test Results**
- مسار: Artifacts → `integration-test-results`
- يحتوي على: نتائج اختبارات RLS وقاعدة البيانات

### 3. **E2E Screenshots & Videos**
- مسار: Artifacts → `playwright-report` أو `cypress-videos`
- يحتوي على: فيديوهات وصور للاختبارات

### 4. **Security Scan Results**
- مسار: Artifacts → `trivy-results`
- يحتوي على: تقرير الثغرات الأمنية

---

## 🔧 تخصيص متقدم (اختياري)

### تفعيل Cypress Cloud (لعرض نتائج أفضل)

1. سجّل في: [Cypress Cloud](https://cloud.cypress.io/)
2. أنشئ مشروع جديد
3. احصل على Record Key
4. أضف Secret في GitHub:
   - اذهب إلى: Settings → Secrets → Actions
   - أضف: `CYPRESS_RECORD_KEY`
   - القيمة: Record Key من Cypress
5. في `.github/workflows/cypress-e2e.yml`، غيّر:
   ```yaml
   record: false  # غيّرها إلى true
   ```

### إضافة Slack/Discord Notifications

1. احصل على Webhook URL من Slack/Discord
2. أضف Secret: `SLACK_WEBHOOK_URL`
3. أضف في نهاية workflow:
   ```yaml
   - name: Send Notification
     uses: 8398a7/action-slack@v3
     with:
       status: ${{ job.status }}
       webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
   ```

---

## 📚 ملفات إضافية مفيدة

- **README.md**: [.github/workflows/README.md](./README.md) - دليل شامل للـ workflows
- **SETUP_GUIDE.md**: [.github/workflows/SETUP_GUIDE.md](./SETUP_GUIDE.md) - دليل الإعداد المفصّل
- **Testing Docs**: `docs/awareness/04_Execution/` - توثيق الاختبارات

---

## 🆘 حل المشاكل الشائعة

### ❌ "npm run test: command not found"
**السبب:** لم تضف سكريبتات الاختبار في package.json
**الحل:** راجع القسم "خطوة واحدة للتفعيل" أعلاه

### ❌ "Error: Cannot find module 'vitest'"
**السبب:** dependencies غير مثبتة
**الحل:** في workflow، تأكد من وجود خطوة `npm ci`

### ❌ "Secrets not found"
**السبب:** لم تضف Secrets في GitHub
**الحل:** اذهب إلى Settings → Secrets → Actions وأضف:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### ❌ "Timeout during E2E tests"
**السبب:** E2E tests تستغرق وقتاً طويلاً
**الحل:** في workflow file، زد timeout:
```yaml
timeout-minutes: 60  # بدلاً من 30
```

---

## ✅ Checklist سريع

قبل أن تبدأ، تأكد من:

- [ ] المشروع مرتبط بـ GitHub ✅ (تم بالفعل)
- [ ] جميع workflows files موجودة ✅ (تم بالفعل)
- [ ] أضفت سكريبتات الاختبار في package.json ⚠️ (يحتاج تفعيل)
- [ ] GitHub Secrets مُضافة (اختياري للبيئة المحلية)
- [ ] اختبرت بـ commit أو تشغيل يدوي

---

## 🎯 النتيجة النهائية

بعد التفعيل، عند كل commit:

```
📊 GitHub Actions Dashboard:

✅ 🧪 Tests & Security Checks
   ├─ ✅ Run Tests (121 passed)
   ├─ ✅ RBAC Security Check
   ├─ ✅ Code Quality Check
   └─ ✅ Build Check

✅ CI/CD - Awareness Module Tests
   ├─ ✅ Pre-Checks (Lint & Type)
   ├─ ✅ Unit Tests
   ├─ ✅ Integration Tests
   ├─ ✅ E2E Tests
   ├─ ✅ Security Scans
   └─ ✅ Build & Deploy

✅ Cypress E2E Tests
   ├─ ✅ Backend Tests
   └─ ✅ Cypress Run (Chrome)

✅ Security Scan
   └─ ✅ Trivy Security Scan
```

---

## 📞 الدعم

إذا واجهت أي مشاكل:
1. راجع [SETUP_GUIDE.md](./SETUP_GUIDE.md)
2. راجع [README.md](./README.md)
3. تحقق من [GitHub Actions logs](https://github.com/romuzdev/romuz-aware-now/actions)
4. راجع docs في `docs/awareness/`

---

**آخر تحديث:** 2025-01-17  
**الإصدار:** 1.0.0  
**الحالة:** ✅ جاهز للتشغيل (يحتاج إضافة scripts فقط)
