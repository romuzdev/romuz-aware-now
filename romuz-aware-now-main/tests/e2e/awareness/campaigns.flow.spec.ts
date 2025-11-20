/**
 * E2E Tests: Awareness Campaigns Flow
 * اختبارات شاملة لمسار حملات التوعية الكامل
 */

import { test, expect } from '@playwright/test';

test.describe('Awareness Campaigns - Full User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: تسجيل الدخول كمدير مستأجر
    await page.goto('/awareness/campaigns');
  });

  test('Admin Flow: Create → Edit → Activate → Archive Campaign', async ({ page }) => {
    // Step 1: Navigate to campaigns page
    await expect(page).toHaveURL(/.*campaigns/);
    await expect(page.locator('h1')).toContainText(/حملات التوعية|Campaigns/i);

    // Step 2: Click create new campaign
    await page.click('button:has-text("إنشاء حملة"), button:has-text("Create Campaign")');
    await page.waitForSelector('[role="dialog"], .modal, .form');

    // Step 3: Fill campaign form
    const campaignName = `E2E Test Campaign ${Date.now()}`;
    await page.fill('input[name="name"], input[placeholder*="اسم"]', campaignName);
    await page.fill('textarea[name="description"]', 'Campaign created by E2E test');
    
    // Set dates
    await page.fill('input[type="date"]:first-of-type', '2025-06-01');
    await page.fill('input[type="date"]:last-of-type', '2025-12-31');

    // Step 4: Save campaign
    await page.click('button:has-text("حفظ"), button:has-text("Save")');
    await expect(page.locator('text=/نجح|Success|تم الحفظ/i')).toBeVisible({ timeout: 5000 });

    // Step 5: Verify campaign appears in list
    await expect(page.locator(`text="${campaignName}"`)).toBeVisible();

    // Step 6: Edit campaign
    await page.click(`tr:has-text("${campaignName}") button:has-text("تعديل"), tr:has-text("${campaignName}") button:has-text("Edit")`);
    await page.waitForSelector('[role="dialog"]');
    
    await page.fill('input[name="name"]', `${campaignName} - Edited`);
    await page.click('button:has-text("حفظ"), button:has-text("Save")');
    await expect(page.locator('text=/نجح|Success/i')).toBeVisible({ timeout: 5000 });

    // Step 7: Activate campaign
    await page.click(`tr:has-text("${campaignName}") button:has-text("تفعيل"), tr:has-text("${campaignName}") button:has-text("Activate")`);
    await expect(page.locator('text=/مفعل|Active/i')).toBeVisible();

    // Step 8: Archive campaign
    await page.click(`tr:has-text("${campaignName}") button[aria-label*="المزيد"], button[aria-label*="More"]`);
    await page.click('text=/أرشفة|Archive/i');
    await page.click('button:has-text("تأكيد"), button:has-text("Confirm")');
    
    await expect(page.locator('text=/تمت الأرشفة|Archived/i')).toBeVisible({ timeout: 5000 });
  });

  test('Manager Flow: View Campaigns → Export Report', async ({ page }) => {
    // Step 1: View campaigns list
    await expect(page).toHaveURL(/.*campaigns/);

    // Step 2: Apply filters
    await page.click('button:has-text("فلتر"), button:has-text("Filter")');
    await page.click('text=/نشط|Active/i');
    await page.waitForTimeout(1000);

    // Step 3: Verify filtered results
    const statusBadges = page.locator('[class*="badge"], [class*="status"]');
    await expect(statusBadges.first()).toBeVisible();

    // Step 4: Export data
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("تصدير"), button:has-text("Export")');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toMatch(/campaigns.*\.(xlsx|csv)/i);
  });

  test('Reader Flow: View Campaign Details (Read-Only)', async ({ page }) => {
    // Step 1: Click on first campaign
    await page.click('tr[role="row"]:first-of-type td:first-of-type');
    await page.waitForURL(/.*campaigns\/[a-z0-9-]+/);

    // Step 2: Verify details are visible
    await expect(page.locator('text=/اسم الحملة|Campaign Name/i')).toBeVisible();
    await expect(page.locator('text=/الحالة|Status/i')).toBeVisible();

    // Step 3: Verify edit buttons are disabled/hidden
    const editButton = page.locator('button:has-text("تعديل"), button:has-text("Edit")');
    const deleteButton = page.locator('button:has-text("حذف"), button:has-text("Delete")');
    
    await expect(editButton).toBeHidden();
    await expect(deleteButton).toBeHidden();
  });

  test('Error Handling: Invalid Campaign Data', async ({ page }) => {
    // Step 1: Open create form
    await page.click('button:has-text("إنشاء حملة"), button:has-text("Create Campaign")');

    // Step 2: Try to save without required fields
    await page.click('button:has-text("حفظ"), button:has-text("Save")');

    // Step 3: Verify validation errors
    await expect(page.locator('text=/مطلوب|Required/i')).toBeVisible();

    // Step 4: Enter invalid dates (end before start)
    await page.fill('input[name="name"]', 'Invalid Date Test');
    await page.fill('input[type="date"]:first-of-type', '2025-12-31');
    await page.fill('input[type="date"]:last-of-type', '2025-01-01');

    await page.click('button:has-text("حفظ"), button:has-text("Save")');
    
    // Should show date validation error
    await expect(page.locator('text=/تاريخ.*غير صحيح|Invalid date/i')).toBeVisible();
  });

  test('Performance: Campaigns List Load Time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/awareness/campaigns');
    await page.waitForSelector('[role="table"], [class*="table"]');
    
    const loadTime = Date.now() - startTime;
    
    // يجب أن تُحمّل الصفحة خلال 3 ثوانٍ
    expect(loadTime).toBeLessThan(3000);
  });
});
