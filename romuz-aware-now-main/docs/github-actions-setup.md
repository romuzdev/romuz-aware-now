# دليل إعداد GitHub Actions للمشروع

هذا الدليل يشرح كيفية إعداد وتشغيل GitHub Actions workflows للاختبارات التلقائية.

## 📋 المتطلبات الأساسية

### 1. ربط المشروع بـ GitHub

إذا لم يكن المشروع مربوطاً بـ GitHub بعد:

1. في Lovable Editor، انقر **GitHub** في الشريط العلوي
2. انقر **Connect to GitHub**
3. أذِن لـ Lovable GitHub App
4. اختر الحساب/المنظمة
5. انقر **Create Repository**

**ملاحظة:** Lovable يدعم مزامنة ثنائية الاتجاه مع GitHub!

### 2. إضافة Secrets في GitHub

بعد ربط المشروع:

1. انتقل إلى GitHub repository
2. **Settings → Secrets and variables → Actions**
3. انقر **New repository secret**
4. أضف الـ secrets التالية:

#### Secrets المطلوبة:

| Secret Name | القيمة | كيفية الحصول عليها |
|-------------|--------|---------------------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Lovable: Settings → Backend → Project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | Lovable: Settings → Backend → Anon Key |

#### Secrets الاختيارية:

| Secret Name | القيمة | متى تحتاجها |
|-------------|--------|--------------|
| `CYPRESS_RECORD_KEY` | من Cypress Cloud | إذا أردت تسجيل الاختبارات في Cypress Cloud |
| `SLACK_WEBHOOK` | Slack Webhook URL | لإرسال إشعارات Slack |
| `DISCORD_WEBHOOK` | Discord Webhook URL | لإرسال إشعارات Discord |

### 3. التحقق من الملفات

تأكد من وجود الملفات التالية:

```
.github/
  workflows/
    cypress-e2e.yml        ✅
    gate-n-tests.yml       ✅
    README.md              ✅
cypress/
  e2e/
    gate-n-admin-console.cy.ts  ✅
  support/
    e2e.ts                 ✅
    commands.ts            ✅
cypress.config.ts          ✅
tests/
  gate-n-*.test.ts         ✅
```

---

## 🚀 تشغيل الـ Workflows

### التشغيل التلقائي

الـ workflows تعمل تلقائياً في الحالات التالية:

#### 1. `cypress-e2e.yml` - اختبارات Cypress الشاملة
**يعمل عند:**
- ✅ Push إلى `main` أو `develop`
- ✅ فتح Pull Request إلى `main` أو `develop`
- ✅ تشغيل يدوي

#### 2. `gate-n-tests.yml` - اختبارات Gate-N
**يعمل عند:**
- ✅ تعديل ملفات Gate-N فقط:
  - `src/features/gateN/**`
  - `src/lib/api/gateN.ts`
  - `supabase/functions/gate-n-*/**`
  - `tests/gate-n-*.test.ts`
  - `cypress/e2e/gate-n-*.cy.ts`

### التشغيل اليدوي

لتشغيل workflow يدوياً:

1. انتقل إلى GitHub repository
2. **Actions** tab
3. اختر الـ workflow (مثلاً: "Cypress E2E Tests")
4. انقر **Run workflow**
5. اختر Branch (مثلاً: `main`)
6. انقر **Run workflow** (الأخضر)

---

## 📊 مراقبة النتائج

### 1. الحالة العامة

في صفحة الـ repository الرئيسية، سترى:
- ✅ أخضر = الاختبارات نجحت
- ❌ أحمر = الاختبارات فشلت
- 🟡 أصفر = الاختبارات قيد التشغيل

### 2. التفاصيل الكاملة

1. انقر **Actions** tab
2. اختر الـ workflow run
3. شاهد:
   - وقت كل خطوة
   - سجل الأوامر (logs)
   - حالة كل job

### 3. تحميل الـ Artifacts

بعد انتهاء الـ workflow:

1. اذهب إلى الـ workflow run
2. انزل إلى **Artifacts** section
3. حمّل ما تريد:
   - `cypress-videos-chrome` - فيديوهات الاختبارات
   - `cypress-screenshots-chrome` - لقطات شاشة (عند الفشل)
   - `gate-n-coverage` - تقرير تغطية الكود

**مدة الحفظ:** 7 أيام (يمكن تعديلها في الـ workflow)

### 4. Test Summary

في نهاية كل workflow run، سيظهر ملخص:

```
# Gate-N Test Report

## Test Results
- Backend Tests: ✅ success
- E2E Tests: ✅ success

## Artifacts
- Coverage report available
- Test videos available
```

---

## 🎬 سيناريوهات الاستخدام

### سيناريو 1: تطوير ميزة جديدة

```bash
# 1. أنشئ branch جديد
git checkout -b feature/gate-n-enhancements

# 2. عدّل الكود
# ...

# 3. Commit & Push
git add .
git commit -m "Add new Gate-N features"
git push origin feature/gate-n-enhancements

# 4. افتح Pull Request على GitHub
# ✅ الاختبارات ستعمل تلقائياً
```

### سيناريو 2: التحقق من اختبارات PR

عند فتح Pull Request:

1. اذهب إلى PR page
2. شاهد **Checks** section
3. انتظر حتى تنتهي الاختبارات
4. إذا فشلت:
   - انقر **Details**
   - راجع الأخطاء
   - حمّل الـ artifacts
5. إصلح المشاكل و push مرة أخرى

### سيناريو 3: Debugging فشل اختبار

إذا فشل اختبار في CI:

1. **حمّل الفيديو:**
   - Artifacts → `cypress-videos-chrome`
   - شاهد الفيديو لفهم المشكلة

2. **راجع Screenshots:**
   - Artifacts → `cypress-screenshots-chrome`
   - شاهد لقطات الشاشة عند الفشل

3. **راجع Logs:**
   - انقر على الـ step الفاشل
   - اقرأ رسائل الخطأ

4. **شغّل محلياً:**
   ```bash
   npm run dev
   npx cypress open
   # شغّل نفس الاختبار
   ```

---

## ⚙️ تخصيص الـ Workflows

### تغيير المتصفحات

في `.github/workflows/cypress-e2e.yml`:

```yaml
strategy:
  matrix:
    browser: [chrome, firefox, edge]
```

### تغيير Node.js version

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # غيّر هنا
```

### إضافة خطوة جديدة

```yaml
- name: Custom Step
  run: |
    echo "Running custom script"
    npm run my-custom-script
```

### تعديل Retry count

```yaml
# في cypress.config.ts
retries: {
  runMode: 3,  # غيّر هنا
  openMode: 0,
}
```

---

## 🔔 إضافة إشعارات

### Slack

1. أنشئ Incoming Webhook في Slack
2. أضف secret: `SLACK_WEBHOOK`
3. في الـ workflow:

```yaml
- name: Slack Notification
  uses: 8398a7/action-slack@v3
  if: always()
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
    text: 'Gate-N Tests Completed!'
```

### Discord

1. أنشئ Webhook في Discord Server
2. أضف secret: `DISCORD_WEBHOOK`
3. في الـ workflow:

```yaml
- name: Discord Notification
  uses: sarisia/actions-status-discord@v1
  if: always()
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    status: ${{ job.status }}
    title: "Gate-N Tests"
```

---

## 🐛 استكشاف الأخطاء

### المشكلة 1: "Secrets not found"

**الأعراض:**
```
Error: Required secret VITE_SUPABASE_URL not found
```

**الحل:**
1. تحقق من Settings → Secrets
2. تأكد من الأسماء **مطابقة تماماً**
3. أعد تشغيل الـ workflow

### المشكلة 2: "ECONNREFUSED localhost:4173"

**الأعراض:**
Cypress لا يستطيع الاتصال بالتطبيق

**الحل:**
في الـ workflow:
```yaml
wait-on-timeout: 180  # زد الوقت
```

### المشكلة 3: Tests تنجح محلياً لكن تفشل في CI

**الأسباب المحتملة:**
1. بيانات اختبار مفقودة
2. Environment variables مختلفة
3. توقيت مختلف (timeouts)

**الحل:**
1. أضف خطوة seed data:
```yaml
- name: Seed Test Data
  run: npm run test:seed
```

2. راجع الفيديوهات والـ logs

### المشكلة 4: Workflow بطيء جداً

**الحل:**
1. فعّل Caching:
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    cache: 'npm'  # ✅ مُفعّل
```

2. قلل عدد المتصفحات:
```yaml
matrix:
  browser: [chrome]  # فقط Chrome
```

---

## 📈 أفضل الممارسات

### 1. Branch Protection Rules

في GitHub Settings:

1. **Settings → Branches → Add rule**
2. Branch name pattern: `main`
3. فعّل:
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date

### 2. Code Review

- لا تدمج PR إلا بعد نجاح الاختبارات
- راجع Coverage report قبل الدمج
- اطلب review من زميل آخر

### 3. Monitoring

- راجع الـ workflows بانتظام
- تتبع الاختبارات الفاشلة
- حسّن التغطية تدريجياً

---

## 📚 موارد إضافية

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Cypress CI Docs](https://docs.cypress.io/guides/continuous-integration/introduction)
- [Lovable GitHub Integration](https://docs.lovable.dev/)
- [خطة اختبار Gate-N](./gate-n-admin-console_test-plan_v1.md)

---

## ✅ Checklist الإعداد

- [ ] المشروع مربوط بـ GitHub
- [ ] Secrets مُضافة في GitHub
- [ ] Workflow files موجودة
- [ ] بيانات الاختبار جاهزة
- [ ] تم تشغيل workflow يدوياً بنجاح
- [ ] تم تحميل artifacts بنجاح
- [ ] Branch protection مُفعّل (اختياري)

---

**آخر تحديث:** 2025-11-11  
**الحالة:** ✅ جاهز للاستخدام
