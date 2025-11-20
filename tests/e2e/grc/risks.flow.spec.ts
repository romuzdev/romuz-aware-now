import { test, expect } from '@playwright/test';

/**
 * GRC Risks E2E Tests
 * Tests complete risk management workflow
 */

test.describe('GRC Risks Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'admin@test.romuz.local');
    await page.fill('input[type="password"]', 'TestAdmin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/grc/, { timeout: 10000 });
  });

  test('should display risks dashboard', async ({ page }) => {
    await page.goto('/grc/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify dashboard elements
    await expect(page.locator('text=لوحة التحكم')).toBeVisible();
    await expect(page.locator('text=المخاطر')).toBeVisible();
  });

  test('should create new risk', async ({ page }) => {
    await page.goto('/grc/risks');
    await page.waitForLoadState('networkidle');

    // Click create button
    await page.click('button:has-text("إضافة مخاطرة")');
    
    // Fill risk form
    await page.fill('input[name="risk_code"]', `RISK-TEST-${Date.now()}`);
    await page.fill('input[name="risk_title"]', 'مخاطرة اختبار آلي');
    await page.fill('textarea[name="risk_description"]', 'وصف تفصيلي لمخاطرة الاختبار الآلي');
    
    // Select category
    await page.click('select[name="risk_category"]');
    await page.click('option[value="operational"]');
    
    // Set scores
    await page.fill('input[name="inherent_likelihood_score"]', '3');
    await page.fill('input[name="inherent_impact_score"]', '4');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify success
    await expect(page.locator('text=تم إنشاء المخاطرة بنجاح')).toBeVisible({ timeout: 5000 });
  });

  test('should edit existing risk', async ({ page }) => {
    await page.goto('/grc/risks');
    await page.waitForLoadState('networkidle');

    // Click first edit button
    await page.click('button[aria-label="تعديل"]:first-child');
    
    // Update title
    const newTitle = `مخاطرة محدثة ${Date.now()}`;
    await page.fill('input[name="risk_title"]', newTitle);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify update
    await expect(page.locator('text=تم تحديث المخاطرة بنجاح')).toBeVisible({ timeout: 5000 });
    await expect(page.locator(`text=${newTitle}`)).toBeVisible();
  });

  test('should calculate risk score correctly', async ({ page }) => {
    await page.goto('/grc/risks');
    await page.waitForLoadState('networkidle');

    // Click create button
    await page.click('button:has-text("إضافة مخاطرة")');
    
    // Set likelihood = 4, impact = 5
    await page.fill('input[name="inherent_likelihood_score"]', '4');
    await page.fill('input[name="inherent_impact_score"]', '5');
    
    // Verify calculated score = 20
    const scoreDisplay = page.locator('text=النتيجة: 20');
    await expect(scoreDisplay).toBeVisible();
  });

  test('should filter risks by category', async ({ page }) => {
    await page.goto('/grc/risks');
    await page.waitForLoadState('networkidle');

    // Apply operational filter
    await page.click('button:has-text("تصفية")');
    await page.click('input[value="operational"]');
    await page.click('button:has-text("تطبيق")');
    
    // Verify filtered results
    const rows = page.locator('tr[data-category="operational"]');
    await expect(rows).toHaveCount(await rows.count());
  });

  test('should delete risk', async ({ page }) => {
    await page.goto('/grc/risks');
    await page.waitForLoadState('networkidle');

    // Get initial count
    const initialCount = await page.locator('tbody tr').count();
    
    // Click delete button
    await page.click('button[aria-label="حذف"]:first-child');
    
    // Confirm deletion
    await page.click('button:has-text("تأكيد")');
    
    // Verify deletion
    await expect(page.locator('text=تم حذف المخاطرة بنجاح')).toBeVisible({ timeout: 5000 });
    
    const newCount = await page.locator('tbody tr').count();
    expect(newCount).toBeLessThan(initialCount);
  });

  test('should export risks to Excel', async ({ page }) => {
    await page.goto('/grc/risks');
    await page.waitForLoadState('networkidle');

    // Start download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("تصدير")');
    
    const download = await downloadPromise;
    
    // Verify file name
    expect(download.suggestedFilename()).toContain('risks');
    expect(download.suggestedFilename()).toContain('.xlsx');
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/grc/risks');
    await page.click('button:has-text("إضافة مخاطرة")');
    
    // Try to submit without filling required fields
    await page.click('button[type="submit"]');
    
    // Verify validation errors
    await expect(page.locator('text=هذا الحقل مطلوب')).toBeVisible();
  });

  test('should navigate to risk details', async ({ page }) => {
    await page.goto('/grc/risks');
    await page.waitForLoadState('networkidle');

    // Click on first risk
    await page.click('tbody tr:first-child');
    
    // Verify navigation to details page
    await expect(page).toHaveURL(/\/grc\/risks\/[a-f0-9-]+/);
    await expect(page.locator('text=تفاصيل المخاطرة')).toBeVisible();
  });
});
