# Gate-F: دليل إعداد CI/CD
## GitHub Actions Setup Guide

**التاريخ**: 2025-11-10  
**الإصدار**: 1.0  
**الغرض**: دليل شامل لإعداد CI/CD لاختبارات Gate-F

---

## 📋 الملخص

تم إنشاء 2 GitHub Actions workflows:

1. **`gatef-tests.yml`** - تشغيل تلقائي عند كل push/PR
2. **`gatef-manual-run.yml`** - تشغيل يدوي حسب الحاجة

---

## 🚀 الإعداد الأولي

### الخطوة 1: إعداد GitHub Secrets

يجب إضافة الـ secrets التالية في GitHub Repository Settings:

```
Settings → Secrets and variables → Actions → New repository secret
```

#### Required Secrets:

| Secret Name | Description | مثال |
|-------------|-------------|------|
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anon/public key | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (للـ tests) | `eyJhbGc...` |
| `SUPABASE_DB_URL` | Database connection URL | `postgresql://...` |

#### Optional Secrets:

| Secret Name | Description | متى تحتاجه |
|-------------|-------------|-------------|
| `SLACK_WEBHOOK_URL` | Slack notification webhook | للإشعارات على Slack |

---

### الخطوة 2: التحقق من الملفات

تأكد من وجود الملفات التالية:

```
.github/
└── workflows/
    ├── gatef-tests.yml          ✅ Auto-trigger workflow
    └── gatef-manual-run.yml     ✅ Manual workflow

scripts/
├── run-gatef-tests.sh           ✅ Linux/Mac test runner
└── run-gatef-tests.ps1          ✅ Windows test runner

tests/
├── reports_exports_api.test.ts      ✅ Integration tests
├── reports_exports_format.test.ts   ✅ Format tests
└── e2e/
    └── reports_dashboard.e2e.ts     ✅ E2E tests
```

---

## 🔄 Workflow 1: Auto-Trigger (gatef-tests.yml)

### متى يعمل؟

- ✅ عند push إلى `main`, `develop`, `master`
- ✅ عند فتح Pull Request
- ✅ عند تعديل أي ملف في `src/`, `tests/`, `supabase/`

### ماذا يفعل؟

#### Job 1: Integration Tests (15 دقيقة)
```yaml
- Run API & RBAC tests (12 scenarios)
- Run Format validation tests (11 scenarios)
- Upload results as artifacts
- Generate summary in PR
```

#### Job 2: E2E Tests (20 دقيقة)
```yaml
- Install Playwright browsers
- Run Dashboard UI tests (17 scenarios)
- Upload Playwright report
- Generate summary
```

#### Job 3: Security Scan (10 دقائق)
```yaml
- Verify RLS policies
- Run security sanity tests
- Generate security summary
```

#### Job 4: Performance Check (10 دقائق)
```yaml
- Run performance sanity tests
- Validate p50/p95 targets
- Comment on PR if thresholds exceeded
```

#### Job 5: Test Report (5 دقائق)
```yaml
- Download all artifacts
- Generate comprehensive report
- Comment on PR with results
- Upload unified report
```

#### Job 6: Notify Team (2 دقيقة)
```yaml
- Send Slack notification (if configured)
- Only runs on main branch
```

---

### مثال: PR Comment

عند فتح PR، سيتم إضافة comment تلقائي:

```markdown
# 📋 Gate-F Test Report

**Run**: #42
**Commit**: abc123def
**Branch**: feature/new-export-format
**Triggered by**: developer-name

---

## Summary

| Test Suite | Status |
|------------|--------|
| Integration Tests | ✅ Passed |
| E2E Tests | ✅ Passed |
| Security Scan | ✅ Passed |

---

## Details

### Integration Tests
- API & RBAC: 12 scenarios
- Format Validation: 11 scenarios

### E2E Tests
- Dashboard UI: 17 scenarios

### Security
- RLS policies verified
- RBAC configuration validated

---

📄 Full test reports available in workflow artifacts
```

---

## 🎯 Workflow 2: Manual Run (gatef-manual-run.yml)

### كيف تستخدمه؟

1. افتح GitHub Repository
2. اذهب إلى **Actions** tab
3. اختر **Gate-F Tests (Manual)**
4. اضغط **Run workflow**
5. اختر:
   - **Test Suite**: all, integration, e2e, security, performance
   - **Environment**: staging, production, development
6. اضغط **Run workflow**

### حالات الاستخدام:

| الحالة | Test Suite | Environment |
|--------|------------|-------------|
| اختبار شامل قبل الإطلاق | `all` | `production` |
| اختبار سريع للـ UI | `e2e` | `staging` |
| فحص أمني فقط | `security` | `production` |
| قياس الأداء | `performance` | `staging` |

---

## 📊 قراءة النتائج

### في GitHub Actions UI:

#### ✅ Success (كل الاختبارات نجحت)
```
✅ integration-tests
✅ e2e-tests
✅ security-scan
✅ test-report
```

#### ❌ Failure (بعض الاختبارات فشلت)
```
✅ integration-tests
❌ e2e-tests  ← انقر هنا لرؤية التفاصيل
✅ security-scan
⚠️ test-report
```

---

### في Artifacts:

بعد كل run، ستجد الـ artifacts التالية:

| Artifact Name | المحتوى | متى تستخدمه |
|---------------|---------|-------------|
| `integration-test-results` | JSON outputs | تحليل فشل Integration tests |
| `e2e-test-results` | Playwright results | تحليل فشل E2E tests |
| `playwright-report` | HTML report تفاعلي | مشاهدة screenshots + videos |
| `comprehensive-test-report` | Markdown summary | نظرة سريعة شاملة |

**تحميل Artifacts**:
1. افتح الـ workflow run
2. Scroll لأسفل → **Artifacts** section
3. انقر على الاسم للتحميل (ZIP file)

---

## 🔧 استكشاف الأخطاء

### Problem: Workflow لا يعمل

**الأسباب المحتملة**:
1. Secrets غير محددة
2. Workflow file syntax خطأ
3. Branch protection rules

**الحل**:
```bash
# 1. تحقق من الـ secrets
Settings → Secrets → Actions → تأكد من وجودها جميعاً

# 2. تحقق من syntax
npx yaml-validator .github/workflows/gatef-tests.yml

# 3. تحقق من permissions
Settings → Actions → General → Workflow permissions
→ ✅ Read and write permissions
```

---

### Problem: Integration Tests تفشل

**الأعراض**:
```
❌ RBAC: 403 for user without export_reports
```

**الحل**:
1. تحقق من RLS policies في Supabase:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'report_exports';
   ```
2. تحقق من test seed data:
   ```bash
   npm run seed:reports
   ```
3. تحقق من `SUPABASE_SERVICE_ROLE_KEY` في Secrets

---

### Problem: E2E Tests timeout

**الأعراض**:
```
❌ Timeout 30000ms exceeded
```

**الحل**:
```yaml
# في gatef-tests.yml، زد الـ timeout:
jobs:
  e2e-tests:
    timeout-minutes: 30  # من 20 إلى 30
```

أو في test file:
```typescript
test('dashboard loads', async ({ page }) => {
  await page.goto('/admin/reports', { timeout: 60000 }); // زيادة timeout
});
```

---

### Problem: Playwright report فارغ

**السبب**: الـ tests لم تكمل بسبب error مبكر

**الحل**:
```yaml
# تأكد من continue-on-error في workflow
- name: Run E2E Tests
  continue-on-error: true  # ✅ هذا يضمن upload الـ report حتى لو فشل
```

---

## 📈 تحسينات متقدمة

### 1. Parallel Test Execution

لتسريع الـ tests، قسمها:

```yaml
jobs:
  api-tests:
    # ...
    run: npm run test:integration tests/reports_exports_api.test.ts
  
  format-tests:
    # ...
    run: npm run test:integration tests/reports_exports_format.test.ts
  
  # كلاهما يعملان في نفس الوقت
```

---

### 2. Test Caching

لتسريع الـ setup:

```yaml
- name: Cache node_modules
  uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
```

---

### 3. Matrix Testing (Multiple Environments)

```yaml
jobs:
  test:
    strategy:
      matrix:
        environment: [staging, production]
        node-version: [18, 20]
    # ...
```

---

### 4. Conditional Slack Notifications

فقط عند الفشل:

```yaml
- name: Notify on Failure
  if: failure()
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
  run: |
    curl -X POST $SLACK_WEBHOOK_URL \
    -d '{"text": "🚨 Gate-F Tests FAILED!"}'
```

---

## 🎓 أفضل الممارسات

### ✅ DO:
- ✅ احفظ جميع الـ secrets في GitHub Secrets (لا تضعها في الكود)
- ✅ استخدم `continue-on-error: true` للـ upload steps
- ✅ اضبط timeouts معقولة (15-30 دقيقة)
- ✅ احفظ الـ artifacts لمدة 30 يوم على الأقل
- ✅ أضف PR comments للنتائج

### ❌ DON'T:
- ❌ لا تضع service role keys في الكود
- ❌ لا تجعل الـ workflow يعمل على كل commit (استخدم paths filter)
- ❌ لا تتجاهل فشل Security tests
- ❌ لا تنسى update الـ retention-days للـ artifacts

---

## 📚 الموارد الإضافية

| المورد | الرابط |
|--------|--------|
| GitHub Actions Docs | [docs.github.com/actions](https://docs.github.com/en/actions) |
| Playwright in CI | [playwright.dev/docs/ci](https://playwright.dev/docs/ci) |
| Vitest in CI | [vitest.dev/guide/ci](https://vitest.dev/guide/ci.html) |
| Supabase CI Testing | [supabase.com/docs/guides/cli/testing](https://supabase.com/docs/guides/cli#testing) |

---

## 🔄 Maintenance

### شهرياً:
- [ ] تحقق من Artifact storage usage
- [ ] راجع failed runs وحدد patterns
- [ ] حدّث Node version في workflow

### ربع سنوي:
- [ ] راجع timeout settings
- [ ] حدّث Playwright browsers
- [ ] حسّن test execution time

---

**آخر تحديث**: 2025-11-10  
**المسؤول**: DevOps + QA Team  
**الحالة**: 🟢 Production Ready
