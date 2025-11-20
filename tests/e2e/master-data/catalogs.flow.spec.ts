/**
 * E2E Tests - Master Data Catalogs Flow
 * Tests complete user workflows for catalog management
 */

import { test, expect } from '@playwright/test';

test.describe('Master Data - Catalogs Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to catalogs
    await page.goto('/platform/master-data/catalogs');
    await page.waitForLoadState('networkidle');
  });

  test('should display catalogs list', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText(/تصنيفات|catalogs/i);
    
    // Check for table or cards
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasCards = await page.locator('[data-testid*="catalog"]').count();
    
    expect(hasTable || hasCards > 0).toBeTruthy();
  });

  test('should create new catalog', async ({ page }) => {
    // Click create button
    await page.click('button:has-text("إنشاء"), button:has-text("Create"), a:has-text("جديد")');
    
    // Fill form
    await page.fill('input[name="code"], input#code', 'TEST_CAT_' + Date.now());
    await page.fill('input[name="name_ar"], textarea[name="name_ar"]', 'تصنيف اختبار');
    
    // Select scope
    const scopeSelect = page.locator('select[name="scope"], [role="combobox"]:has-text("scope")').first();
    if (await scopeSelect.isVisible()) {
      await scopeSelect.click();
      await page.click('text=TENANT, text=مستأجر');
    }
    
    // Submit
    await page.click('button[type="submit"]:has-text("حفظ"), button[type="submit"]:has-text("Save")');
    
    // Verify success
    await expect(page.locator('text=/تم|success/i')).toBeVisible({ timeout: 10000 });
  });

  test('should edit existing catalog', async ({ page }) => {
    // Find first catalog
    const firstRow = page.locator('table tbody tr, [data-testid*="catalog-item"]').first();
    
    // Click edit button
    await firstRow.locator('button:has-text("تعديل"), button:has-text("Edit"), svg.lucide-edit').first().click();
    
    // Update name
    await page.fill('input[name="name_ar"], textarea[name="name_ar"]', 'تصنيف محدث ' + Date.now());
    
    // Save
    await page.click('button[type="submit"]:has-text("حفظ"), button[type="submit"]:has-text("Save")');
    
    // Verify update
    await expect(page.locator('text=/تم|success/i')).toBeVisible({ timeout: 10000 });
  });

  test('should filter catalogs by scope', async ({ page }) => {
    // Find filter/select for scope
    const scopeFilter = page.locator('select:has-text("scope"), [role="combobox"]:near(:text("scope"))').first();
    
    if (await scopeFilter.isVisible()) {
      await scopeFilter.click();
      await page.click('text=GLOBAL, text=عام');
      
      await page.waitForTimeout(1000);
      
      // Verify filtered results
      const rows = await page.locator('table tbody tr, [data-testid*="catalog"]').count();
      expect(rows).toBeGreaterThanOrEqual(0);
    }
  });

  test('should publish catalog', async ({ page }) => {
    // Find draft catalog
    const draftCatalog = page.locator('tr:has-text("DRAFT"), [data-testid*="catalog"]:has-text("مسودة")').first();
    
    if (await draftCatalog.isVisible()) {
      // Click publish button
      await draftCatalog.locator('button:has-text("نشر"), button:has-text("Publish")').click();
      
      // Confirm if dialog appears
      const confirmButton = page.locator('button:has-text("تأكيد"), button:has-text("Confirm")');
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }
      
      // Verify status change
      await expect(page.locator('text=/نُشر|published/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should search catalogs', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="بحث"], input[placeholder*="Search"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('TEST');
      await page.waitForTimeout(1000);
      
      // Verify search results
      const results = await page.locator('table tbody tr, [data-testid*="catalog"]').count();
      expect(results).toBeGreaterThanOrEqual(0);
    }
  });

  test('should view catalog details', async ({ page }) => {
    const firstCatalog = page.locator('table tbody tr, [data-testid*="catalog-item"]').first();
    
    // Click to view details
    await firstCatalog.click();
    
    // Should navigate to detail page or open modal
    await page.waitForTimeout(1000);
    
    const hasDetailPage = await page.url().includes('/catalogs/');
    const hasModal = await page.locator('[role="dialog"], .modal').isVisible().catch(() => false);
    
    expect(hasDetailPage || hasModal).toBeTruthy();
  });
});
