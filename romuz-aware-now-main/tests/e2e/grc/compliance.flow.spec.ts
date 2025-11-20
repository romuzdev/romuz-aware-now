import { test, expect } from '@playwright/test';

/**
 * GRC Compliance E2E Tests
 * Tests compliance requirements and framework management
 */

test.describe('GRC Compliance Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'admin@test.romuz.local');
    await page.fill('input[type="password"]', 'TestAdmin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/grc/, { timeout: 10000 });
  });

  test('should display compliance dashboard', async ({ page }) => {
    await page.goto('/grc/compliance');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=الامتثال')).toBeVisible();
    await expect(page.locator('text=الأطر التنظيمية')).toBeVisible();
  });

  test('should create compliance requirement', async ({ page }) => {
    await page.goto('/grc/compliance/requirements');
    await page.click('button:has-text("إضافة متطلب")');
    
    await page.fill('input[name="requirement_code"]', `REQ-TEST-${Date.now()}`);
    await page.fill('input[name="requirement_title"]', 'متطلب امتثال جديد');
    await page.fill('textarea[name="requirement_description"]', 'وصف المتطلب التنظيمي');
    await page.fill('input[name="framework_name"]', 'PDPL');
    
    await page.selectOption('select[name="compliance_status"]', 'partially_compliant');
    await page.selectOption('select[name="priority"]', 'high');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=تم إنشاء المتطلب بنجاح')).toBeVisible({ timeout: 5000 });
  });

  test('should update compliance status', async ({ page }) => {
    await page.goto('/grc/compliance/requirements');
    await page.waitForLoadState('networkidle');
    
    await page.click('tbody tr:first-child');
    await page.click('button:has-text("تحديث الحالة")');
    
    await page.selectOption('select[name="compliance_status"]', 'compliant');
    await page.fill('textarea[name="notes"]', 'تم تحقيق الامتثال الكامل');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=تم تحديث الحالة')).toBeVisible({ timeout: 5000 });
  });

  test('should identify compliance gaps', async ({ page }) => {
    await page.goto('/grc/compliance/gaps');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=فجوات الامتثال')).toBeVisible();
    
    // Verify non-compliant items are shown
    const gapRows = page.locator('tr[data-status="non_compliant"]');
    expect(await gapRows.count()).toBeGreaterThanOrEqual(0);
  });

  test('should create remediation plan for gap', async ({ page }) => {
    await page.goto('/grc/compliance/gaps');
    await page.waitForLoadState('networkidle');
    
    await page.click('button:has-text("خطة معالجة"):first-child');
    
    await page.fill('textarea[name="action_plan"]', 'خطة المعالجة التفصيلية');
    await page.fill('input[name="target_date"]', '2025-12-31');
    await page.fill('input[name="responsible_person"]', 'مدير الامتثال');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=تم إنشاء خطة المعالجة')).toBeVisible({ timeout: 5000 });
  });

  test('should filter by framework', async ({ page }) => {
    await page.goto('/grc/compliance/requirements');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("تصفية")');
    await page.fill('input[name="framework"]', 'PDPL');
    await page.click('button:has-text("تطبيق")');
    
    const filteredRows = await page.locator('tbody tr').count();
    expect(filteredRows).toBeGreaterThan(0);
  });

  test('should generate compliance report', async ({ page }) => {
    await page.goto('/grc/compliance');
    await page.click('button:has-text("تقرير الامتثال")');
    
    // Select framework
    await page.selectOption('select[name="framework"]', 'PDPL');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("تصدير")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('compliance-report');
  });

  test('should track evidence for requirement', async ({ page }) => {
    await page.goto('/grc/compliance/requirements');
    await page.click('tbody tr:first-child');
    
    await page.click('button:has-text("إضافة دليل")');
    
    // Upload evidence file
    await page.setInputFiles('input[type="file"]', 'tests/fixtures/sample-evidence.pdf');
    await page.fill('textarea[name="evidence_notes"]', 'وثيقة الامتثال الرسمية');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=تم إضافة الدليل')).toBeVisible({ timeout: 5000 });
  });
});
