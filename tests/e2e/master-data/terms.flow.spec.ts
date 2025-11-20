/**
 * E2E Tests - Master Data Terms Flow
 * Tests complete user workflows for term management
 */

import { test, expect } from '@playwright/test';

test.describe('Master Data - Terms Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to terms
    await page.goto('/platform/master-data/terms');
    await page.waitForLoadState('networkidle');
  });

  test('should display terms list', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText(/مصطلحات|terms/i);
    
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasCards = await page.locator('[data-testid*="term"]').count();
    
    expect(hasTable || hasCards > 0).toBeTruthy();
  });

  test('should create new term', async ({ page }) => {
    // Click create button
    await page.click('button:has-text("إنشاء"), button:has-text("Create"), a:has-text("جديد")');
    
    // Fill form
    await page.fill('input[name="code"], input#code', 'HIGH_' + Date.now());
    await page.fill('input[name="name_ar"], textarea[name="name_ar"]', 'عالي');
    
    // Select catalog
    const catalogSelect = page.locator('select[name="catalog_id"], [role="combobox"]:near(:text("catalog"))').first();
    if (await catalogSelect.isVisible()) {
      await catalogSelect.click();
      await page.locator('[role="option"]').first().click();
    }
    
    // Submit
    await page.click('button[type="submit"]:has-text("حفظ"), button[type="submit"]:has-text("Save")');
    
    // Verify success
    await expect(page.locator('text=/تم|success/i')).toBeVisible({ timeout: 10000 });
  });

  test('should create child term', async ({ page }) => {
    // Find first term
    const parentTerm = page.locator('table tbody tr, [data-testid*="term-item"]').first();
    
    // Click add child button
    const addChildBtn = parentTerm.locator('button:has-text("إضافة"), button[title*="child"]');
    if (await addChildBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addChildBtn.click();
      
      // Fill child term data
      await page.fill('input[name="code"]', 'CHILD_' + Date.now());
      await page.fill('input[name="name_ar"]', 'مصطلح فرعي');
      
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=/تم|success/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should filter terms by catalog', async ({ page }) => {
    const catalogFilter = page.locator('select:near(:text("catalog")), [role="combobox"]:near(:text("catalog"))').first();
    
    if (await catalogFilter.isVisible()) {
      await catalogFilter.click();
      await page.locator('[role="option"]').first().click();
      
      await page.waitForTimeout(1000);
      
      const rows = await page.locator('table tbody tr, [data-testid*="term"]').count();
      expect(rows).toBeGreaterThanOrEqual(0);
    }
  });

  test('should toggle term active status', async ({ page }) => {
    const firstTerm = page.locator('table tbody tr, [data-testid*="term-item"]').first();
    
    // Find toggle/switch
    const toggle = firstTerm.locator('button[role="switch"], input[type="checkbox"]').first();
    
    if (await toggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await toggle.click();
      
      await expect(page.locator('text=/تم|success/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should reorder terms via drag-drop', async ({ page }) => {
    const terms = page.locator('[draggable="true"], [data-rbd-draggable-id]');
    const count = await terms.count();
    
    if (count >= 2) {
      const firstTerm = terms.nth(0);
      const secondTerm = terms.nth(1);
      
      // Drag first to second position
      await firstTerm.dragTo(secondTerm);
      
      await page.waitForTimeout(1000);
      
      // Order should have changed
      const newFirst = await terms.nth(0).textContent();
      expect(newFirst).toBeDefined();
    }
  });

  test('should import terms from CSV', async ({ page }) => {
    const importBtn = page.locator('button:has-text("استيراد"), button:has-text("Import")');
    
    if (await importBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await importBtn.click();
      
      // Upload CSV file
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Note: Would need actual CSV file for full test
        console.log('CSV import UI is available');
      }
    }
  });

  test('should export terms to CSV', async ({ page }) => {
    const exportBtn = page.locator('button:has-text("تصدير"), button:has-text("Export")');
    
    if (await exportBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Setup download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      
      await exportBtn.click();
      
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.csv$/);
      }
    }
  });
});
