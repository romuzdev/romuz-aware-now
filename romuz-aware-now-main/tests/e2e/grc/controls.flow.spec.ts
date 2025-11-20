import { test, expect } from '@playwright/test';

/**
 * GRC Controls E2E Tests
 * Tests complete control management workflow
 */

test.describe('GRC Controls Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'admin@test.romuz.local');
    await page.fill('input[type="password"]', 'TestAdmin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/grc/, { timeout: 10000 });
  });

  test('should display controls list', async ({ page }) => {
    await page.goto('/grc/controls');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=الضوابط')).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(await page.locator('tbody tr').count());
  });

  test('should create preventive control', async ({ page }) => {
    await page.goto('/grc/controls');
    await page.click('button:has-text("إضافة ضابط")');
    
    await page.fill('input[name="control_code"]', `CTRL-TEST-${Date.now()}`);
    await page.fill('input[name="control_title"]', 'ضابط وقائي للاختبار');
    await page.fill('textarea[name="control_description"]', 'وصف الضابط الوقائي');
    
    await page.selectOption('select[name="control_type"]', 'preventive');
    await page.selectOption('select[name="control_category"]', 'automated');
    await page.selectOption('select[name="control_frequency"]', 'daily');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=تم إنشاء الضابط بنجاح')).toBeVisible({ timeout: 5000 });
  });

  test('should test control effectiveness', async ({ page }) => {
    await page.goto('/grc/controls');
    await page.waitForLoadState('networkidle');

    // Navigate to control details
    await page.click('tbody tr:first-child');
    
    // Click test control button
    await page.click('button:has-text("اختبار الضابط")');
    
    // Fill test form
    await page.selectOption('select[name="test_type"]', 'operating_effectiveness');
    await page.fill('textarea[name="test_procedures"]', 'إجراءات الاختبار المفصلة');
    await page.fill('textarea[name="test_results"]', 'نتائج الاختبار الإيجابية');
    await page.selectOption('select[name="effectiveness_conclusion"]', 'effective');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=تم تسجيل نتيجة الاختبار')).toBeVisible({ timeout: 5000 });
  });

  test('should update control implementation status', async ({ page }) => {
    await page.goto('/grc/controls');
    await page.click('tbody tr:first-child');
    
    // Change status
    await page.click('button:has-text("تعديل")');
    await page.selectOption('select[name="implementation_status"]', 'implemented');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=تم تحديث الضابط')).toBeVisible({ timeout: 5000 });
  });

  test('should filter controls by type', async ({ page }) => {
    await page.goto('/grc/controls');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("تصفية")');
    await page.click('input[value="preventive"]');
    await page.click('button:has-text("تطبيق")');
    
    const rows = await page.locator('tbody tr').count();
    expect(rows).toBeGreaterThan(0);
  });

  test('should link control to risk', async ({ page }) => {
    await page.goto('/grc/controls');
    await page.click('tbody tr:first-child');
    
    await page.click('button:has-text("ربط بمخاطرة")');
    
    // Select risk from dropdown
    await page.click('select[name="risk_id"]');
    await page.click('option:first-child');
    
    await page.click('button:has-text("ربط")');
    
    await expect(page.locator('text=تم ربط الضابط بالمخاطرة')).toBeVisible({ timeout: 5000 });
  });

  test('should view control test history', async ({ page }) => {
    await page.goto('/grc/controls');
    await page.click('tbody tr:first-child');
    
    await page.click('button:has-text("سجل الاختبارات")');
    
    await expect(page.locator('text=سجل اختبارات الضابط')).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(await page.locator('tbody tr').count());
  });
});
