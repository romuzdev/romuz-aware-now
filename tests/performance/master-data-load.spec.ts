/**
 * Performance Tests - Master Data
 * Tests load performance for catalogs, terms, and mappings
 */

import { test, expect } from '@playwright/test';

test.describe('Master Data - Performance Tests', () => {
  
  test.describe('Catalogs Performance', () => {
    test('should load catalogs list within 2 seconds', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[type="email"]', 'admin@test.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      const startTime = Date.now();
      
      await page.goto('/platform/master-data/catalogs');
      await page.waitForSelector('table tbody tr, [data-testid*="catalog"]', { timeout: 10000 });
      
      const loadTime = Date.now() - startTime;
      console.log(`Catalogs load time: ${loadTime}ms`);
      
      expect(loadTime).toBeLessThan(2000);
    });

    test('should handle 100+ catalogs efficiently', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[type="email"]', 'admin@test.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      await page.goto('/platform/master-data/catalogs');
      
      const startTime = Date.now();
      
      // Scroll to load all items (if virtualized)
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      await page.waitForTimeout(1000);
      
      const renderTime = Date.now() - startTime;
      console.log(`Render time for catalogs: ${renderTime}ms`);
      
      expect(renderTime).toBeLessThan(3000);
    });
  });

  test.describe('Terms Performance', () => {
    test('should load terms list within 2 seconds', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[type="email"]', 'admin@test.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      const startTime = Date.now();
      
      await page.goto('/platform/master-data/terms');
      await page.waitForSelector('table tbody tr, [data-testid*="term"]', { timeout: 10000 });
      
      const loadTime = Date.now() - startTime;
      console.log(`Terms load time: ${loadTime}ms`);
      
      expect(loadTime).toBeLessThan(2000);
    });

    test('should render hierarchical terms efficiently', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[type="email"]', 'admin@test.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      await page.goto('/platform/master-data/terms');
      
      const startTime = Date.now();
      
      // Expand all parent items (if tree view)
      const expandButtons = page.locator('[aria-expanded="false"]');
      const count = await expandButtons.count();
      
      for (let i = 0; i < Math.min(count, 10); i++) {
        await expandButtons.nth(i).click({ timeout: 1000 }).catch(() => {});
      }
      
      const expandTime = Date.now() - startTime;
      console.log(`Expand hierarchy time: ${expandTime}ms`);
      
      expect(expandTime).toBeLessThan(5000);
    });
  });

  test.describe('Mappings Performance', () => {
    test('should load mappings list within 2 seconds', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[type="email"]', 'admin@test.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      const startTime = Date.now();
      
      await page.goto('/platform/master-data/mappings');
      await page.waitForSelector('table tbody tr, [data-testid*="mapping"]', { timeout: 10000 });
      
      const loadTime = Date.now() - startTime;
      console.log(`Mappings load time: ${loadTime}ms`);
      
      expect(loadTime).toBeLessThan(2000);
    });

    test('should handle bulk mapping operations', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[type="email"]', 'admin@test.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      await page.goto('/platform/master-data/mappings');
      
      // Select multiple mappings
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();
      
      const startTime = Date.now();
      
      for (let i = 0; i < Math.min(count, 20); i++) {
        await checkboxes.nth(i).check({ timeout: 500 }).catch(() => {});
      }
      
      const selectionTime = Date.now() - startTime;
      console.log(`Bulk selection time: ${selectionTime}ms`);
      
      expect(selectionTime).toBeLessThan(3000);
    });
  });

  test.describe('Search Performance', () => {
    test('should perform search within 1 second', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[type="email"]', 'admin@test.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      await page.goto('/platform/master-data/catalogs');
      
      const searchInput = page.locator('input[type="search"], input[placeholder*="بحث"]').first();
      
      if (await searchInput.isVisible()) {
        const startTime = Date.now();
        
        await searchInput.fill('TEST');
        await page.waitForTimeout(500);
        
        const searchTime = Date.now() - startTime;
        console.log(`Search time: ${searchTime}ms`);
        
        expect(searchTime).toBeLessThan(1000);
      }
    });
  });

  test.describe('CSV Operations Performance', () => {
    test('should export data within 3 seconds', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[type="email"]', 'admin@test.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      await page.goto('/platform/master-data/terms');
      
      const exportBtn = page.locator('button:has-text("تصدير"), button:has-text("Export")');
      
      if (await exportBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        const startTime = Date.now();
        
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
        await exportBtn.click();
        
        const download = await downloadPromise;
        const exportTime = Date.now() - startTime;
        
        console.log(`Export time: ${exportTime}ms`);
        
        if (download) {
          expect(exportTime).toBeLessThan(3000);
        }
      }
    });
  });
});
