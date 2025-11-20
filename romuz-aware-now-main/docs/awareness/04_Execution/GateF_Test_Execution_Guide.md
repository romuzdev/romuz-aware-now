# Gate-F: دليل تشغيل الاختبارات
## Test Execution Guide

**التاريخ**: 2025-11-10  
**الإصدار**: 1.0  
**الغرض**: دليل شامل لتشغيل جميع اختبارات Gate-F وتوليد التقارير

---

## 🚀 التشغيل السريع (Quick Start)

### الطريقة 1: تشغيل تلقائي كامل (موصى به)

#### Linux/Mac:
```bash
# إعطاء صلاحيات التنفيذ
chmod +x scripts/run-gatef-tests.sh

# تشغيل جميع الاختبارات
./scripts/run-gatef-tests.sh
```

#### Windows (PowerShell):
```powershell
# تشغيل جميع الاختبارات
.\scripts\run-gatef-tests.ps1
```

**النتيجة**: 
- سيتم تشغيل جميع الاختبارات تلقائياً
- سيتم توليد تقرير مفصل في `test-reports/gatef_test_report_[timestamp].md`
- سيظهر ملخص النتائج في الـ console

---

### الطريقة 2: تشغيل يدوي (خطوة بخطوة)

#### 1. Integration Tests: API & RBAC
```bash
# اختبارات API + RBAC + RLS
npm run test:integration tests/reports_exports_api.test.ts

# عرض نتائج مفصلة
npm run test:integration tests/reports_exports_api.test.ts -- --reporter=verbose
```

**المتوقع**: 12 اختبار يمر بنجاح

---

#### 2. Integration Tests: Format Validation
```bash
# اختبارات تنسيقات CSV/JSON
npm run test:integration tests/reports_exports_format.test.ts

# عرض نتائج مفصلة
npm run test:integration tests/reports_exports_format.test.ts -- --reporter=verbose
```

**المتوقع**: 11 اختبار يمر بنجاح

---

#### 3. E2E Tests: Dashboard UI
```bash
# اختبارات واجهة المستخدم
npx playwright test tests/e2e/reports_dashboard.e2e.ts

# عرض التقرير التفاعلي
npx playwright show-report
```

**المتوقع**: 15-17 اختبار (2 قد يكونا skipped)

---

## 📊 فهم النتائج

### نموذج مخرجات ناجحة:

```
🚀 Starting Gate-F Test Suite...
================================

================================
📊 Test Suite 1: API & RBAC
================================
Running: Reports Export API (RBAC + RLS)

 ✓ RBAC: 403 for user without export_reports
 ✓ RBAC: 200 for user with export_reports
 ✓ Sync Export: Dataset < 250k rows
 ✓ Sync Export: Download URL immediate
 ✓ Sync Export: Formats (CSV, JSON, XLSX)
 ✓ Async Export: Dataset ≥ 250k rows
 ✓ Async Export: Batch ID + Status
 ✓ RLS: Tenant isolation TenantA vs TenantB
 ✓ RLS: Policy verification
 ✓ Validation: Invalid reportType → 400
 ✓ Validation: Invalid format → 400
 ✓ Filters: Recorded in source_views

✅ PASSED (12/12 tests)

================================
📄 Test Suite 2: Format Validation
================================
Running: Reports Export Format (CSV/JSON)

 ✓ CSV: Bilingual headers (EN/AR)
 ✓ CSV: UTF-8 encoding
 ✓ CSV: RFC4180 compliance
 ✓ CSV: Numeric accuracy (±1%)
 ✓ JSON: Valid structure
 ✓ JSON: Required fields
 ✓ JSON: Numeric accuracy (±1%)
 ✓ Lineage: batch_id populated
 ✓ Lineage: source_views metadata
 ✓ Lineage: refresh_at timestamp
 ✓ Cross-format: CSV = JSON

✅ PASSED (11/11 tests)

================================
🖥️  Test Suite 3: Dashboard UI
================================
Running: Reports Dashboard E2E

 ✓ adminA: Full access
 ⊘ analystA: View + Export (SKIPPED: user not in setup)
 ⊘ employeeB: No permission (SKIPPED: user not in setup)
 ✓ Filters: Date range (Asia/Riyadh)
 ✓ Filters: Campaign dropdown
 ✓ Filters: Include test toggle
 ✓ Filters: Timezone validation
 ✓ Export: CSV trigger + toast
 ✓ Export: JSON trigger
 ✓ Export: XLSX trigger
 ✓ Export History: Display + Delete
 ✓ Performance: Load < 1200ms
 ✓ Performance: Loading state
 ✓ Data: KPI cards display
 ✓ Data: Table rows present
 ✓ Responsive: Mobile
 ✓ Responsive: Tablet

✅ PASSED (15/17 tests, 2 skipped)

================================
📈 FINAL RESULTS
================================
Total Suites: 3
Passed: 3
Failed: 0
Success Rate: 100.0%

📄 Full report saved to: test-reports/gatef_test_report_20251110_143052.md
```

---

## 🔍 تشخيص الأخطاء

### حالة: اختبار فشل في RBAC

**الخطأ**: 
```
❌ RBAC: 403 for user without export_reports
Expected: 403, Received: 200
```

**السبب المحتمل**: 
- RLS policy مفقودة أو غير صحيحة
- RBAC permissions غير محددة

**الحل**:
1. تحقق من جدول `user_roles`:
   ```sql
   SELECT * FROM user_roles WHERE user_id = '<user_id>';
   ```
2. تحقق من RLS policies على `report_exports`:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'report_exports';
   ```
3. راجع `docs/awareness/02_ERD/07-Platform-v-Tenant-RBAC-Playbook.md`

---

### حالة: اختبار فشل في Format Validation

**الخطأ**:
```
❌ CSV: Bilingual headers (EN/AR)
Expected header: "campaign_name / اسم الحملة"
Received: "campaign_name"
```

**السبب المحتمل**:
- Edge function لا يولد headers ثنائية اللغة
- UTF-8 encoding غير مفعّل

**الحل**:
1. راجع `supabase/functions/export-report/index.ts`
2. تأكد من استخدام UTF-8 في CSV headers:
   ```typescript
   const headers = [
     'campaign_name / اسم الحملة',
     'date / التاريخ',
     // ...
   ];
   ```
3. تأكد من `Content-Type: text/csv; charset=utf-8`

---

### حالة: E2E Test فشل في Timeout

**الخطأ**:
```
❌ Dashboard load timeout after 5000ms
```

**السبب المحتمل**:
- Network latency
- Database query بطيء
- Missing data في seeded fixtures

**الحل**:
1. زيادة timeout مؤقتاً للتشخيص:
   ```typescript
   await page.waitFor({ timeout: 10000 });
   ```
2. تحقق من console logs:
   ```bash
   npx playwright test --debug
   ```
3. تحقق من seeded data:
   ```bash
   npm run seed:reports
   ```

---

## 📈 تحليل التقرير المُولّد

التقرير يُحفظ في: `test-reports/gatef_test_report_[timestamp].md`

### أقسام التقرير:

#### 1. Test Results Summary
- كل test suite مع حالته (PASSED/FAILED)
- آخر 50 سطر من مخرجات كل test

#### 2. Overall Summary
| Metric | Value |
|--------|-------|
| Total Test Suites | 3 |
| Passed | 3 |
| Failed | 0 |
| Success Rate | 100.0% |

#### 3. Next Steps
- توصيات بناءً على النتائج
- خطوات التصحيح إن وُجدت أخطاء

---

## 🎯 معايير النجاح

للنظر في Gate-F جاهزاً للإنتاج:

✅ **Required (يجب تحققها جميعاً)**:
- [ ] Integration Tests: 23/23 PASSED
- [ ] Format Tests: 11/11 PASSED
- [ ] E2E Tests: ≥15/17 PASSED (2 skipped مقبول)
- [ ] Security scan: 0 critical issues
- [ ] Performance: p95 ≤ 1.2s (dashboard load)

🟠 **Recommended (موصى بها)**:
- [ ] Manual QA Checklist: 100% مكتمل
- [ ] Load testing: 1M+ rows
- [ ] Staging deployment: ناجح

---

## 🔄 CI/CD Integration

### إضافة إلى GitHub Actions:

```yaml
# .github/workflows/gatef-tests.yml
name: Gate-F Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run Gate-F Tests
        run: ./scripts/run-gatef-tests.sh
      
      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: gatef-test-report
          path: test-reports/
```

---

## 📞 الحصول على المساعدة

إذا واجهت مشاكل:

1. **راجع الوثائق**:
   - `docs/GateF_Reports_QA_Checklist_v1.md`
   - `docs/awareness/04_Execution/GateF_Testing_Complete_Report_v1.0.md`

2. **تحقق من Logs**:
   ```bash
   # Integration test logs
   npm run test:integration -- --reporter=verbose
   
   # E2E test logs
   npx playwright test --debug
   ```

3. **اختبار يدوي**:
   - افتح `/admin/reports` في المتصفح
   - افتح DevTools → Console
   - حاول trigger export يدوياً

---

## 📚 الموارد الإضافية

| المورد | الرابط |
|--------|--------|
| Test Matrix | `docs/awareness/05_QA/Test_Matrix.md` |
| QA Strategy | `docs/awareness/05_QA/QA_Strategy_README.md` |
| RBAC Playbook | `docs/awareness/02_ERD/07-Platform-v-Tenant-RBAC-Playbook.md` |
| Audit Design | `docs/awareness/02_ERD/05-Audit-Log-Design.md` |

---

**آخر تحديث**: 2025-11-10  
**المسؤول**: AI + Solution Architect  
**الحالة**: 🟢 Ready for Use
