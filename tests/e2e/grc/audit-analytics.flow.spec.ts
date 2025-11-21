/**
 * E2E Tests for Audit Analytics Flow
 * Tests the complete analytics workflow
 */

import { test, expect } from '@playwright/test';

test.describe('Audit Analytics Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should display analytics dashboard', async ({ page }) => {
    // Navigate to audit analytics
    await page.goto('/audit/analytics');
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("تحليلات التدقيق")');
    
    // Verify key metrics cards are visible
    await expect(page.locator('text=معدل الإنجاز')).toBeVisible();
    await expect(page.locator('text=النتائج الحرجة')).toBeVisible();
    await expect(page.locator('text=متوسط وقت الحل')).toBeVisible();
    await expect(page.locator('text=مستوى الامتثال')).toBeVisible();
  });

  test('should filter analytics by timeframe', async ({ page }) => {
    await page.goto('/audit/analytics');
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("تحليلات التدقيق")');
    
    // Click timeframe selector
    await page.click('button:has-text("الشهر الحالي")');
    
    // Select quarter
    await page.click('text=الربع الحالي');
    
    // Wait for data to refresh
    await page.waitForTimeout(1000);
    
    // Verify the filter was applied
    await expect(page.locator('button:has-text("الربع الحالي")')).toBeVisible();
  });

  test('should navigate between analytics tabs', async ({ page }) => {
    await page.goto('/audit/analytics');
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("تحليلات التدقيق")');
    
    // Navigate to findings tab
    await page.click('button[role="tab"]:has-text("النتائج والملاحظات")');
    await expect(page.locator('text=توزيع النتائج حسب الخطورة')).toBeVisible();
    
    // Navigate to compliance tab
    await page.click('button[role="tab"]:has-text("الامتثال")');
    await expect(page.locator('text=تحليل فجوات الامتثال')).toBeVisible();
    
    // Navigate to trends tab
    await page.click('button[role="tab"]:has-text("الاتجاهات")');
    await expect(page.locator('text=اتجاهات عمليات التدقيق')).toBeVisible();
  });

  test('should display severity distribution chart', async ({ page }) => {
    await page.goto('/audit/analytics');
    
    // Navigate to findings tab
    await page.click('button[role="tab"]:has-text("النتائج والملاحظات")');
    
    // Wait for chart to render
    await page.waitForSelector('.recharts-wrapper', { timeout: 5000 });
    
    // Verify chart is visible
    const chart = page.locator('.recharts-wrapper').first();
    await expect(chart).toBeVisible();
  });

  test('should display closure time statistics', async ({ page }) => {
    await page.goto('/audit/analytics');
    
    // Navigate to findings tab
    await page.click('button[role="tab"]:has-text("النتائج والملاحظات")');
    
    // Verify closure time stats are visible
    await expect(page.locator('text=المتوسط')).toBeVisible();
    await expect(page.locator('text=الوسيط')).toBeVisible();
    await expect(page.locator('text=الأسرع')).toBeVisible();
    await expect(page.locator('text=الأبطأ')).toBeVisible();
  });

  test('should display compliance gaps chart', async ({ page }) => {
    await page.goto('/audit/analytics');
    
    // Navigate to compliance tab
    await page.click('button[role="tab"]:has-text("الامتثال")');
    
    // Wait for chart to render
    await page.waitForSelector('.recharts-wrapper', { timeout: 5000 });
    
    // Verify chart is visible
    const chart = page.locator('.recharts-wrapper');
    await expect(chart).toBeVisible();
  });

  test('should display audit trends line chart', async ({ page }) => {
    await page.goto('/audit/analytics');
    
    // Navigate to trends tab
    await page.click('button[role="tab"]:has-text("الاتجاهات")');
    
    // Wait for chart to render
    await page.waitForSelector('.recharts-wrapper', { timeout: 5000 });
    
    // Verify line chart is visible
    const chart = page.locator('.recharts-wrapper');
    await expect(chart).toBeVisible();
    
    // Verify legend items
    await expect(page.locator('text=مكتملة')).toBeVisible();
    await expect(page.locator('text=جارية')).toBeVisible();
  });

  test('should handle export report action', async ({ page }) => {
    await page.goto('/audit/analytics');
    
    // Click export button
    await page.click('button:has-text("تصدير التقرير")');
    
    // Verify button was clicked (in real implementation, would download file)
    await page.waitForTimeout(500);
  });

  test('should handle empty state gracefully', async ({ page }) => {
    await page.goto('/audit/analytics');
    
    // Navigate to a tab that might be empty
    await page.click('button[role="tab"]:has-text("النتائج والملاحظات")');
    
    // If no data, should show empty state
    const emptyState = page.locator('text=لا توجد بيانات متاحة');
    
    // Either data is shown or empty state is shown
    const hasData = await page.locator('.recharts-wrapper').isVisible();
    const hasEmptyState = await emptyState.isVisible();
    
    expect(hasData || hasEmptyState).toBe(true);
  });

  test('should display loading skeletons', async ({ page }) => {
    await page.goto('/audit/analytics');
    
    // Look for skeleton loaders during initial load
    const skeleton = page.locator('.animate-pulse');
    
    // Skeletons should either be visible initially or disappear quickly
    const isVisible = await skeleton.first().isVisible().catch(() => false);
    
    // If skeletons are visible, they should disappear
    if (isVisible) {
      await expect(skeleton.first()).not.toBeVisible({ timeout: 10000 });
    }
  });
});
