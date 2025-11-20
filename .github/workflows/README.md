# GitHub Actions Workflows للمشروع

هذا المجلد يحتوي على GitHub Actions workflows لأتمتة الاختبارات والنشر.

## 📋 الـ Workflows المتوفرة

### 1. `cypress-e2e.yml` - اختبارات Cypress الشاملة
**الغرض:** تشغيل جميع اختبارات E2E مع Cypress

**متى يعمل:**
- عند Push إلى `main` أو `develop`
- عند فتح Pull Request
- يدوياً من GitHub Actions UI

**الميزات:**
- ✅ تشغيل على متصفحات متعددة
- ✅ تسجيل فيديوهات لكل اختبار
- ✅ حفظ screenshots عند الفشل
- ✅ تشغيل اختبارات Backend أولاً
- ✅ تقرير Coverage
- ✅ Caching للتسريع

**Artifacts المُنتجة:**
- `cypress-videos-{browser}` - فيديوهات الاختبارات
- `cypress-screenshots-{browser}` - screenshots عند الفشل
- `coverage-report` - تقرير تغطية الكود

### 2. `gate-n-tests.yml` - اختبارات Gate-N المخصصة
**الغرض:** تشغيل اختبارات Gate-N فقط (Backend + E2E)

**متى يعمل:**
- عند تعديل ملفات Gate-N:
  - `src/features/gateN/**`
  - `src/lib/api/gateN.ts`
  - `supabase/functions/gate-n-*/**`
  - `tests/gate-n-*.test.ts`
  - `cypress/e2e/gate-n-*.cy.ts`

**الخطوات:**
1. **Backend Tests:**
   - Seed test data
   - RPC tests
   - Edge Function tests
   - API Wrapper tests
   - Coverage report

2. **E2E Tests:**
   - Build application
   - Run Cypress tests
   - Upload videos & screenshots

3. **Report:**
   - Generate test summary
   - Upload all artifacts

---

## ⚙️ إعداد GitHub Secrets

لتشغيل الـ workflows، أضف الـ secrets التالية في GitHub:

1. انتقل إلى: **Settings → Secrets and variables → Actions**
2. أضف الـ secrets التالية:

| Secret Name | القيمة | المصدر |
|-------------|--------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | Lovable Backend |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | Lovable Backend |
| `CYPRESS_RECORD_KEY` | Cypress Cloud key (اختياري) | Cypress Dashboard |

### كيفية الحصول على القيم:

#### Supabase URL & Key:
1. في Lovable: **Settings → Backend**
2. انسخ Project URL و Anon Key

#### Cypress Record Key (اختياري):
1. سجّل في [Cypress Cloud](https://cloud.cypress.io/)
2. أنشئ مشروع جديد
3. انسخ Record Key

---

## 🚀 تشغيل الـ Workflows

### تلقائياً:
- الـ workflows تعمل تلقائياً عند Push أو Pull Request

### يدوياً:
1. انتقل إلى: **Actions** في GitHub
2. اختر الـ workflow (مثلاً: Cypress E2E Tests)
3. انقر **Run workflow**
4. اختر Branch
5. انقر **Run workflow**

---

## 📊 عرض النتائج

### 1. الحالة الإجمالية:
- شاهد الحالة في **Actions** tab
- ✅ نجح = أخضر
- ❌ فشل = أحمر

### 2. تفاصيل الاختبارات:
- انقر على الـ workflow run
- شاهد كل خطوة ووقت التنفيذ

### 3. الـ Artifacts:
- انتقل إلى الـ workflow run
- انزل في الصفحة إلى **Artifacts**
- حمّل:
  - فيديوهات الاختبارات
  - Screenshots
  - تقرير Coverage

### 4. Test Summary:
- مُضاف تلقائياً في نهاية كل workflow run
- يعرض ملخص النتائج

---

## 🎬 أمثلة على الاستخدام

### مثال 1: تشغيل يدوي
```bash
# على GitHub.com:
# Actions → Cypress E2E Tests → Run workflow
```

### مثال 2: التحقق من نتائج PR
```bash
# عند فتح Pull Request:
# 1. الـ workflows تعمل تلقائياً
# 2. شاهد الحالة في PR page
# 3. انقر "Details" لرؤية التفاصيل
```

### مثال 3: تحميل الفيديوهات
```bash
# بعد انتهاء الـ workflow:
# 1. Actions → اختر الـ run
# 2. Artifacts → cypress-videos-chrome
# 3. Download
# 4. فك ضغط الملف
```

---

## 🛠️ تخصيص الـ Workflows

### تغيير المتصفحات:
في `cypress-e2e.yml`:
```yaml
strategy:
  matrix:
    browser: [chrome, firefox, edge]
```

### تغيير فترة حفظ الـ Artifacts:
```yaml
retention-days: 7  # غيّر إلى عدد الأيام المطلوب
```

### إضافة اختبارات إضافية:
```yaml
- name: Run Additional Tests
  run: npm test -- tests/my-new-tests.test.ts
```

### تفعيل Cypress Cloud Recording:
في `cypress-e2e.yml`:
```yaml
record: true
key: ${{ secrets.CYPRESS_RECORD_KEY }}
```

---

## 🔔 إضافة إشعارات

### Slack:
```yaml
- name: Slack Notification
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Discord:
```yaml
- name: Discord Notification
  uses: sarisia/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
```

---

## 📈 أهداف التغطية

حسب خطة الاختبار:

| Component | Target Coverage |
|-----------|-----------------|
| RPC Functions | 90%+ |
| Edge Functions | 85%+ |
| API Wrapper | 90%+ |
| UI Components | 70%+ |

---

## 🐛 استكشاف الأخطاء

### المشكلة: Workflow يفشل بـ "ECONNREFUSED"
**الحل:**
- تأكد من `wait-on` في cypress-io/github-action
- زد `wait-on-timeout` إلى 180 ثانية

### المشكلة: Secrets غير موجودة
**الحل:**
- تحقق من إضافة Secrets في GitHub Settings
- تأكد من الأسماء مطابقة تماماً

### المشكلة: Tests تفشل في CI لكن تنجح محلياً
**الحل:**
- تحقق من بيانات الاختبار (seed data)
- تأكد من Environment Variables صحيحة
- راجع الفيديوهات والـ screenshots

---

## 📚 موارد إضافية

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Cypress GitHub Action](https://github.com/cypress-io/github-action)
- [Cypress Cloud](https://cloud.cypress.io/)
- [خطة اختبار Gate-N](../../docs/gate-n-admin-console_test-plan_v1.md)

---

**آخر تحديث:** 2025-11-11  
**الحالة:** ✅ جاهز للاستخدام
