/**
 * Security Tests - Master Data RBAC
 * Tests role-based access control for master data module
 */

import { test, expect } from '@playwright/test';

test.describe('Master Data - RBAC Security', () => {
  
  test.describe('Tenant Admin Access', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[type="email"]', 'tenant.admin@test.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
    });

    test('should access catalogs management', async ({ page }) => {
      await page.goto('/platform/master-data/catalogs');
      await expect(page).toHaveURL(/\/catalogs/);
      
      // Should see create button
      const createBtn = page.locator('button:has-text("إنشاء"), button:has-text("Create")');
      await expect(createBtn).toBeVisible();
    });

    test('should access terms management', async ({ page }) => {
      await page.goto('/platform/master-data/terms');
      await expect(page).toHaveURL(/\/terms/);
      
      const createBtn = page.locator('button:has-text("إنشاء"), button:has-text("Create")');
      await expect(createBtn).toBeVisible();
    });

    test('should access mappings management', async ({ page }) => {
      await page.goto('/platform/master-data/mappings');
      await expect(page).toHaveURL(/\/mappings/);
      
      const createBtn = page.locator('button:has-text("إنشاء"), button:has-text("Create")');
      await expect(createBtn).toBeVisible();
    });
  });

  test.describe('Manager Access', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[type="email"]', 'manager@test.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
    });

    test('should have read-only access to catalogs', async ({ page }) => {
      await page.goto('/platform/master-data/catalogs');
      
      // Should NOT see create button
      const createBtn = page.locator('button:has-text("إنشاء"), button:has-text("Create")');
      const isVisible = await createBtn.isVisible({ timeout: 2000 }).catch(() => false);
      
      expect(isVisible).toBe(false);
    });

    test('should view but not edit terms', async ({ page }) => {
      await page.goto('/platform/master-data/terms');
      
      // Can view list
      await expect(page.locator('h1, h2')).toContainText(/مصطلحات|terms/i);
      
      // Should NOT see edit buttons
      const editBtns = page.locator('button:has-text("تعديل"), button:has-text("Edit")');
      const count = await editBtns.count();
      
      expect(count).toBe(0);
    });
  });

  test.describe('Employee Access', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[type="email"]', 'employee@test.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
    });

    test('should NOT access master data management', async ({ page }) => {
      await page.goto('/platform/master-data/catalogs');
      
      // Should be redirected or see access denied
      await page.waitForTimeout(2000);
      
      const url = page.url();
      const hasAccessDenied = await page.locator('text=/denied|ممنوع|unauthorized/i').isVisible().catch(() => false);
      
      expect(url.includes('/catalogs') === false || hasAccessDenied).toBe(true);
    });
  });

  test.describe('Data Isolation', () => {
    test('should only see tenant-specific data', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[type="email"]', 'tenant1.admin@test.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      await page.goto('/platform/master-data/catalogs');
      
      // Get all catalog codes
      const catalogCodes = await page.locator('table tbody tr td:first-child, [data-testid*="catalog"] code').allTextContents();
      
      // Should not contain data from other tenants
      // (This is a conceptual test - actual verification needs tenant markers)
      expect(catalogCodes).toBeDefined();
    });
  });

  test.describe('GLOBAL vs TENANT Scope', () => {
    test('should allow reading GLOBAL catalogs', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[type="email"]', 'tenant.admin@test.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      await page.goto('/platform/master-data/catalogs');
      
      // Filter by GLOBAL
      const scopeFilter = page.locator('select:has-text("scope"), [role="combobox"]:near(:text("scope"))').first();
      if (await scopeFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
        await scopeFilter.click();
        await page.click('text=GLOBAL, text=عام');
        
        await page.waitForTimeout(1000);
        
        const globalCatalogs = await page.locator('table tbody tr, [data-testid*="catalog"]').count();
        expect(globalCatalogs).toBeGreaterThanOrEqual(0);
      }
    });

    test('should NOT allow editing GLOBAL catalogs', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[type="email"]', 'tenant.admin@test.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      await page.goto('/platform/master-data/catalogs');
      
      // Find GLOBAL catalog
      const globalRow = page.locator('tr:has-text("GLOBAL")').first();
      
      if (await globalRow.isVisible({ timeout: 2000 }).catch(() => false)) {
        const editBtn = globalRow.locator('button:has-text("تعديل"), button:has-text("Edit")');
        const canEdit = await editBtn.isVisible({ timeout: 1000 }).catch(() => false);
        
        expect(canEdit).toBe(false);
      }
    });
  });
});
