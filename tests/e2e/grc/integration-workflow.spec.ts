import { test, expect } from '@playwright/test';

/**
 * GRC End-to-End Integration Workflow Test
 * Tests complete workflow from risk identification to treatment
 */

test.describe('GRC Complete Workflow Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'admin@test.romuz.local');
    await page.fill('input[type="password"]', 'TestAdmin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/grc/, { timeout: 10000 });
  });

  test('should complete full risk management lifecycle', async ({ page }) => {
    const timestamp = Date.now();
    const riskCode = `RISK-E2E-${timestamp}`;
    const controlCode = `CTRL-E2E-${timestamp}`;

    // Step 1: Identify Risk
    await page.goto('/grc/risks');
    await page.click('button:has-text("إضافة مخاطرة")');
    
    await page.fill('input[name="risk_code"]', riskCode);
    await page.fill('input[name="risk_title"]', 'مخاطرة اختراق البيانات');
    await page.fill('textarea[name="risk_description"]', 'احتمالية اختراق قاعدة بيانات العملاء');
    await page.selectOption('select[name="risk_category"]', 'technology');
    await page.fill('input[name="inherent_likelihood_score"]', '4');
    await page.fill('input[name="inherent_impact_score"]', '5');
    
    await page.click('button[type="submit"]');
    await expect(page.locator('text=تم إنشاء المخاطرة بنجاح')).toBeVisible({ timeout: 5000 });

    // Step 2: Create Control
    await page.goto('/grc/controls');
    await page.click('button:has-text("إضافة ضابط")');
    
    await page.fill('input[name="control_code"]', controlCode);
    await page.fill('input[name="control_title"]', 'تشفير البيانات الحساسة');
    await page.fill('textarea[name="control_description"]', 'تطبيق تشفير AES-256 لجميع البيانات الحساسة');
    await page.selectOption('select[name="control_type"]', 'preventive');
    await page.selectOption('select[name="control_category"]', 'automated');
    await page.selectOption('select[name="control_frequency"]', 'continuous');
    
    await page.click('button[type="submit"]');
    await expect(page.locator('text=تم إنشاء الضابط بنجاح')).toBeVisible({ timeout: 5000 });

    // Step 3: Link Control to Risk via Treatment Plan
    await page.goto('/grc/risks');
    await page.click(`tr:has-text("${riskCode}")`);
    
    await page.click('button:has-text("خطة معالجة")');
    await page.selectOption('select[name="strategy"]', 'mitigate');
    await page.click('select[name="control_ids"]');
    await page.click(`option:has-text("${controlCode}")`);
    await page.fill('input[name="target_likelihood_score"]', '2');
    await page.fill('input[name="target_impact_score"]', '3');
    await page.fill('input[name="target_completion_date"]', '2025-12-31');
    
    await page.click('button[type="submit"]');
    await expect(page.locator('text=تم إنشاء خطة المعالجة')).toBeVisible({ timeout: 5000 });

    // Step 4: Test Control Effectiveness
    await page.goto('/grc/controls');
    await page.click(`tr:has-text("${controlCode}")`);
    
    await page.click('button:has-text("اختبار الضابط")');
    await page.selectOption('select[name="test_type"]', 'both');
    await page.fill('textarea[name="test_procedures"]', 'تحقق من تطبيق التشفير على جميع الحقول الحساسة');
    await page.fill('textarea[name="test_results"]', 'التشفير يعمل بشكل صحيح على جميع البيانات');
    await page.selectOption('select[name="effectiveness_conclusion"]', 'effective');
    
    await page.click('button[type="submit"]');
    await expect(page.locator('text=تم تسجيل نتيجة الاختبار')).toBeVisible({ timeout: 5000 });

    // Step 5: Update Treatment Plan Status
    await page.goto('/grc/risks');
    await page.click(`tr:has-text("${riskCode}")`);
    await page.click('tab:has-text("خطط المعالجة")');
    
    await page.click('button:has-text("تحديث الحالة")');
    await page.selectOption('select[name="status"]', 'completed');
    await page.fill('textarea[name="completion_notes"]', 'تم تطبيق الضابط بنجاح');
    
    await page.click('button[type="submit"]');
    await expect(page.locator('text=تم تحديث خطة المعالجة')).toBeVisible({ timeout: 5000 });

    // Step 6: Reassess Risk (Residual Risk)
    await page.click('button:has-text("إعادة تقييم")');
    await page.fill('input[name="current_likelihood_score"]', '2');
    await page.fill('input[name="current_impact_score"]', '3');
    await page.fill('textarea[name="assessment_notes"]', 'انخفضت المخاطرة بعد تطبيق الضابط');
    
    await page.click('button[type="submit"]');
    await expect(page.locator('text=تم تحديث التقييم')).toBeVisible({ timeout: 5000 });

    // Step 7: Verify Risk Status Changed
    await expect(page.locator('text=تم المعالجة')).toBeVisible();
    
    // Step 8: Verify in Dashboard
    await page.goto('/grc/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Risk should now show in treated risks section
    await expect(page.locator(`text=${riskCode}`)).toBeVisible();
  });

  test('should track compliance requirement through audit', async ({ page }) => {
    const timestamp = Date.now();
    const reqCode = `REQ-E2E-${timestamp}`;
    const auditCode = `AUD-E2E-${timestamp}`;

    // Step 1: Create Compliance Requirement
    await page.goto('/grc/compliance/requirements');
    await page.click('button:has-text("إضافة متطلب")');
    
    await page.fill('input[name="requirement_code"]', reqCode);
    await page.fill('input[name="requirement_title"]', 'حماية البيانات الشخصية');
    await page.fill('textarea[name="requirement_description"]', 'يجب تشفير جميع البيانات الشخصية');
    await page.fill('input[name="framework_name"]', 'PDPL');
    await page.selectOption('select[name="compliance_status"]', 'not_assessed');
    
    await page.click('button[type="submit"]');
    await expect(page.locator('text=تم إنشاء المتطلب بنجاح')).toBeVisible({ timeout: 5000 });

    // Step 2: Create Audit
    await page.goto('/grc/audits');
    await page.click('button:has-text("إنشاء مراجعة")');
    
    await page.fill('input[name="audit_code"]', auditCode);
    await page.fill('input[name="audit_title"]', 'مراجعة امتثال PDPL');
    await page.fill('textarea[name="audit_scope"]', `فحص الامتثال للمتطلب ${reqCode}`);
    await page.selectOption('select[name="audit_type"]', 'compliance');
    
    await page.click('button[type="submit"]');
    await expect(page.locator('text=تم إنشاء المراجعة بنجاح')).toBeVisible({ timeout: 5000 });

    // Step 3: Conduct Audit - Record Finding
    await page.click(`tr:has-text("${auditCode}")`);
    await page.click('button:has-text("بدء المراجعة")');
    await page.click('button[type="submit"]');
    
    await page.click('button:has-text("إضافة ملاحظة")');
    await page.fill('input[name="finding_title"]', 'بيانات غير مشفرة');
    await page.fill('textarea[name="finding_description"]', 'وجدت بيانات شخصية غير مشفرة في قاعدة البيانات القديمة');
    await page.selectOption('select[name="severity"]', 'high');
    
    await page.click('button[type="submit"]');
    await expect(page.locator('text=تم تسجيل الملاحظة')).toBeVisible({ timeout: 5000 });

    // Step 4: Update Compliance Status
    await page.goto('/grc/compliance/requirements');
    await page.click(`tr:has-text("${reqCode}")`);
    await page.click('button:has-text("تحديث الحالة")');
    
    await page.selectOption('select[name="compliance_status"]', 'non_compliant');
    await page.fill('textarea[name="notes"]', `ملاحظات من المراجعة ${auditCode}`);
    
    await page.click('button[type="submit"]');
    await expect(page.locator('text=تم تحديث الحالة')).toBeVisible({ timeout: 5000 });

    // Step 5: Create Remediation Plan
    await page.goto('/grc/compliance/gaps');
    await page.click('button:has-text("خطة معالجة"):first-child');
    
    await page.fill('textarea[name="action_plan"]', 'تشفير جميع البيانات في القاعدة القديمة');
    await page.fill('input[name="target_date"]', '2025-06-30');
    
    await page.click('button[type="submit"]');
    await expect(page.locator('text=تم إنشاء خطة المعالجة')).toBeVisible({ timeout: 5000 });
  });
});
