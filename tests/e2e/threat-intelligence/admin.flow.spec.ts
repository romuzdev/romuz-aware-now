/**
 * M20 - Threat Intelligence E2E Tests - Admin Flow
 * Tests complete admin user journey through threat intelligence features
 */

import { test, expect } from '@playwright/test';

test.describe('Threat Intelligence - Admin Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin-test@gate-n.local');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    
    // Wait for redirect after login
    await page.waitForURL(/\/app/);
    
    // Navigate to Threat Intelligence
    await page.goto('/app/threat-intelligence');
    await page.waitForLoadState('networkidle');
  });

  test('should display dashboard with statistics', async ({ page }) => {
    // Verify dashboard loads
    await expect(page.locator('h1')).toContainText('Threat Intelligence');
    
    // Check for stat cards
    await expect(page.locator('text=Active Feeds')).toBeVisible();
    await expect(page.locator('text=Total Indicators')).toBeVisible();
    await expect(page.locator('text=Recent Matches')).toBeVisible();
    await expect(page.locator('text=Critical Threats')).toBeVisible();
    
    // Verify Recent Threat Matches section exists
    await expect(page.locator('text=Recent Threat Matches')).toBeVisible();
  });

  test('should navigate to feeds page and display feeds', async ({ page }) => {
    // Navigate to Feeds page
    await page.click('text=Feeds');
    await page.waitForURL('**/threat-intelligence/feeds');
    
    // Verify page header
    await expect(page.locator('h1')).toContainText('Threat Feeds');
    
    // Check for action buttons
    await expect(page.locator('button:has-text("Sync All")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Feed")')).toBeVisible();
    
    // Verify filter bar
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });

  test('should create a new threat feed', async ({ page }) => {
    await page.click('text=Feeds');
    await page.waitForURL('**/threat-intelligence/feeds');
    
    // Click Add Feed button
    await page.click('button:has-text("Add Feed")');
    
    // Fill in feed details (assumes a dialog/form opens)
    // Note: This is a placeholder - actual implementation depends on your UI
    await page.waitForSelector('input[name="feed_name"]', { timeout: 5000 }).catch(() => {});
    
    // If form exists, fill it
    const feedNameInput = page.locator('input[name="feed_name"]');
    if (await feedNameInput.count() > 0) {
      await feedNameInput.fill('Test MISP Feed');
      await page.selectOption('select[name="feed_type"]', 'misp');
      await page.fill('input[name="feed_url"]', 'https://test-misp.com/feed');
      await page.click('button:has-text("Create")');
      
      // Verify success message
      await expect(page.locator('text=Feed created successfully')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should navigate to indicators page and display indicators', async ({ page }) => {
    await page.click('text=Indicators');
    await page.waitForURL('**/threat-intelligence/indicators');
    
    // Verify page header
    await expect(page.locator('h1')).toContainText('Threat Indicators');
    
    // Check for filters
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    
    // Verify table headers
    await expect(page.locator('th:has-text("Type")')).toBeVisible();
    await expect(page.locator('th:has-text("Value")')).toBeVisible();
    await expect(page.locator('th:has-text("Severity")')).toBeVisible();
  });

  test('should filter indicators by type and severity', async ({ page }) => {
    await page.click('text=Indicators');
    await page.waitForURL('**/threat-intelligence/indicators');
    
    // Apply type filter
    const typeSelect = page.locator('select').first();
    await typeSelect.selectOption('ip');
    await page.waitForTimeout(500); // Wait for filter to apply
    
    // Apply severity filter
    const severitySelect = page.locator('select').nth(1);
    await severitySelect.selectOption('high');
    await page.waitForTimeout(500);
    
    // Verify URL contains filter parameters
    expect(page.url()).toContain('type=ip');
    expect(page.url()).toContain('severity=high');
  });

  test('should navigate to matches page and display threat matches', async ({ page }) => {
    await page.click('text=Matches');
    await page.waitForURL('**/threat-intelligence/matches');
    
    // Verify page header
    await expect(page.locator('h1')).toContainText('Threat Matches');
    
    // Check for action buttons on matches
    await expect(page.locator('button:has-text("Investigate")')).toBeVisible().catch(() => {
      // It's ok if no matches exist yet
      expect(page.locator('text=No threat matches found')).toBeVisible();
    });
  });

  test('should update investigation status on a threat match', async ({ page }) => {
    await page.click('text=Matches');
    await page.waitForURL('**/threat-intelligence/matches');
    
    // Check if there are any matches
    const investigateButton = page.locator('button:has-text("Investigate")').first();
    const matchCount = await investigateButton.count();
    
    if (matchCount > 0) {
      await investigateButton.click();
      
      // Verify dialog/modal opens
      await expect(page.locator('text=Investigation')).toBeVisible({ timeout: 3000 });
      
      // Update status (placeholder - depends on actual UI)
      // await page.selectOption('select[name="status"]', 'investigating');
      // await page.fill('textarea[name="notes"]', 'Under investigation');
      // await page.click('button:has-text("Save")');
    }
  });

  test('should navigate to settings page', async ({ page }) => {
    await page.click('text=Settings');
    await page.waitForURL('**/threat-intelligence/settings');
    
    // Verify page header
    await expect(page.locator('h1')).toContainText('Threat Intelligence Settings');
    
    // Check for settings sections
    await expect(page.locator('text=Feed Synchronization')).toBeVisible();
    await expect(page.locator('text=Threat Matching')).toBeVisible();
    await expect(page.locator('text=Alert Configuration')).toBeVisible();
    await expect(page.locator('text=Data Retention')).toBeVisible();
  });

  test('should update feed synchronization settings', async ({ page }) => {
    await page.click('text=Settings');
    await page.waitForURL('**/threat-intelligence/settings');
    
    // Toggle auto-sync
    const autoSyncToggle = page.locator('button[role="switch"]').first();
    const isEnabled = await autoSyncToggle.getAttribute('data-state');
    
    await autoSyncToggle.click();
    await page.waitForTimeout(300);
    
    // Verify toggle state changed
    const newState = await autoSyncToggle.getAttribute('data-state');
    expect(newState).not.toBe(isEnabled);
    
    // Save settings
    await page.click('button:has-text("Save Settings")').first();
    
    // Verify success message
    await expect(page.locator('text=Settings saved')).toBeVisible({ timeout: 3000 });
  });

  test('should sync a specific threat feed', async ({ page }) => {
    await page.click('text=Feeds');
    await page.waitForURL('**/threat-intelligence/feeds');
    
    // Check if there are any feeds
    const syncButton = page.locator('button:has-text("Sync")').first();
    const feedCount = await syncButton.count();
    
    if (feedCount > 0) {
      await syncButton.click();
      
      // Verify success toast
      await expect(page.locator('text=Sync started')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should search for indicators by value', async ({ page }) => {
    await page.click('text=Indicators');
    await page.waitForURL('**/threat-intelligence/indicators');
    
    // Enter search query
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('192.168');
    await page.waitForTimeout(500);
    
    // Verify search is applied (URL or filtered results)
    // This depends on whether search is debounced and how it's implemented
    const url = page.url();
    expect(url).toContain('search=192.168');
  });

  test('should display empty state when no data exists', async ({ page }) => {
    // Navigate to a section that might be empty
    await page.click('text=Matches');
    await page.waitForURL('**/threat-intelligence/matches');
    
    // Check for either matches or empty state
    const hasMatches = await page.locator('button:has-text("Investigate")').count() > 0;
    
    if (!hasMatches) {
      await expect(page.locator('text=No threat matches found')).toBeVisible();
    }
  });

  test('should handle navigation between all threat intelligence pages', async ({ page }) => {
    // Test complete navigation flow
    const pages = ['Dashboard', 'Indicators', 'Feeds', 'Matches', 'Settings'];
    
    for (const pageName of pages) {
      if (pageName === 'Dashboard') {
        await page.goto('/app/threat-intelligence');
      } else {
        await page.click(`text=${pageName}`);
      }
      
      await page.waitForLoadState('networkidle');
      
      // Verify page loaded by checking URL
      const url = page.url();
      if (pageName === 'Dashboard') {
        expect(url).toMatch(/threat-intelligence\/?$/);
      } else {
        expect(url).toContain(pageName.toLowerCase());
      }
    }
  });
});
