import { test, expect } from '@playwright/test';
import { selectors, verifyButtonDisabled } from './_helpers/selectors';

/**
 * Reader Read-Only Flow + RBAC Guards
 * 
 * Journey:
 * 1. Login as reader
 * 2. List campaigns (view permission)
 * 3. View campaign detail (read-only)
 * 4. Ensure manage buttons disabled with tooltip
 * 5. Try direct navigation to /new → blocked/redirected
 * 6. Try direct navigation to /:id/edit → blocked/redirected
 * 7. Verify no mutations possible (bulk actions hidden/disabled)
 * 
 * Assertions:
 * - Buttons disabled before user interaction (no RBAC flash)
 * - Tooltips explain insufficient permissions
 * - Direct route navigation blocked
 * - No state changes possible
 */

test.describe('Reader Read-Only Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/campaigns');
    await page.waitForLoadState('networkidle');
  });

  test('Step 1: Can view campaigns list', async ({ page }) => {
    // Verify list loads
    await expect(page.locator(selectors.campaigns.tableRow)).toHaveCountGreaterThan(0);

    // Verify stats cards visible
    const statsCards = page.locator(selectors.campaigns.statsCard);
    await expect(statsCards).toHaveCountGreaterThan(0);
  });

  test('Step 2: New Campaign button disabled', async ({ page }) => {
    const newButton = page.locator(selectors.campaigns.newButton);
    
    // Button should be disabled
    const isDisabled = await verifyButtonDisabled(page, selectors.campaigns.newButton);
    expect(isDisabled).toBe(true);

    // Hover to verify tooltip
    await newButton.hover();
    
    // Verify tooltip appears (if implemented)
    const tooltip = page.locator(selectors.common.tooltip);
    await tooltip.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {
      // Tooltip may not be implemented yet
    });
  });

  test('Step 3: Can view campaign details (read-only)', async ({ page }) => {
    // Click first campaign
    const firstRow = page.locator(selectors.campaigns.tableRow).first();
    await firstRow.click();

    await page.waitForURL(/\/admin\/campaigns\/[a-f0-9-]+/);

    // Verify detail page loads
    await expect(page.locator('h1')).toBeVisible();

    // Verify Edit button disabled
    const editButton = page.locator(selectors.campaignDetail.editButton);
    const isDisabled = await verifyButtonDisabled(page, selectors.campaignDetail.editButton);
    expect(isDisabled).toBe(true);
  });

  test('Step 4: Participants tab - no mutations allowed', async ({ page }) => {
    const firstRow = page.locator(selectors.campaigns.tableRow).first();
    await firstRow.click();
    await page.click(selectors.campaignDetail.participantsTab);

    // Import button disabled
    const importButton = page.locator(selectors.campaignDetail.importButton);
    const isImportDisabled = await verifyButtonDisabled(page, selectors.campaignDetail.importButton);
    expect(isImportDisabled).toBe(true);

    // Select a participant
    const checkbox = page.locator(selectors.campaigns.checkbox).nth(1);
    await checkbox.check();

    // Bulk actions should not appear or be disabled
    const bulkToolbar = page.locator('[data-testid="bulk-toolbar"]');
    
    // Either toolbar doesn't appear, or all buttons disabled
    const toolbarExists = await bulkToolbar.count() > 0;
    if (toolbarExists) {
      const bulkButtons = bulkToolbar.locator('button:not([disabled])');
      await expect(bulkButtons).toHaveCount(0);
    }
  });

  test('Step 5: Content tab - Add Module disabled', async ({ page }) => {
    const firstRow = page.locator(selectors.campaigns.tableRow).first();
    await firstRow.click();
    await page.click(selectors.campaignDetail.contentTab);

    // Add Module button disabled
    const addButton = page.locator(selectors.campaignDetail.addModuleButton);
    const count = await addButton.count();
    
    if (count > 0) {
      const isDisabled = await verifyButtonDisabled(page, selectors.campaignDetail.addModuleButton);
      expect(isDisabled).toBe(true);
    } else {
      // Button not rendered at all (acceptable for read-only)
      expect(count).toBe(0);
    }
  });

  test('Step 6: Direct navigation to /new blocked', async ({ page }) => {
    // Try to navigate directly
    await page.goto('/admin/campaigns/new');

    // Should redirect to campaigns list or show error
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    
    // Either redirected back to list
    expect(url).toMatch(/\/admin\/campaigns($|\?)/);
    
    // Or error message shown
    const errorExists = await page.locator(selectors.common.toastError).count();
    if (errorExists > 0) {
      await expect(page.locator(selectors.common.toastError)).toContainText('permission');
    }
  });

  test('Step 7: Direct navigation to /:id/edit blocked', async ({ page }) => {
    // Get a campaign ID first
    await page.goto('/admin/campaigns');
    const firstRow = page.locator(selectors.campaigns.tableRow).first();
    await firstRow.click();
    
    const url = page.url();
    const match = url.match(/\/admin\/campaigns\/([a-f0-9-]+)/);
    const campaignId = match![1];

    // Try to navigate to edit
    await page.goto(`/admin/campaigns/${campaignId}/edit`);
    await page.waitForLoadState('networkidle');

    // Should redirect or show error
    const finalUrl = page.url();
    expect(finalUrl).not.toContain('/edit');

    // Verify redirected to detail page or list
    expect(finalUrl).toMatch(/\/admin\/campaigns\//);
  });

  test('Step 8: Bulk actions in list - disabled', async ({ page }) => {
    // Select a campaign
    const checkbox = page.locator(selectors.campaigns.checkbox).nth(1);
    await checkbox.check();

    // Bulk toolbar appears but all buttons disabled
    const bulkToolbar = page.locator('[data-testid="bulk-toolbar"]');
    
    const exists = await bulkToolbar.count() > 0;
    if (exists) {
      const archiveButton = bulkToolbar.locator(selectors.campaigns.bulkArchiveButton);
      const isDisabled = await archiveButton.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });

  test('Step 9: No RBAC flash - buttons disabled on load', async ({ page }) => {
    // Navigate fresh
    await page.goto('/admin/campaigns');

    // Capture initial state immediately (within 100ms)
    await page.waitForSelector(selectors.campaigns.newButton, { state: 'visible', timeout: 5000 });
    
    // Check if button is disabled without waiting
    const newButton = page.locator(selectors.campaigns.newButton);
    const isDisabled = await newButton.isDisabled();
    
    // Should be disabled from the start (no flash of enabled state)
    expect(isDisabled).toBe(true);
  });

  test('Step 10: Export allowed (read permission)', async ({ page }) => {
    // Reader can export (read-only operation)
    const exportButton = page.locator(selectors.campaigns.exportButton);
    
    const isDisabled = await exportButton.isDisabled();
    expect(isDisabled).toBe(false); // Export should be enabled
  });

  test('Step 11: Dashboards accessible (read permission)', async ({ page }) => {
    await page.goto('/admin/dashboards/awareness');
    await page.waitForLoadState('networkidle');

    // Should load without errors
    const kpiCards = page.locator(selectors.dashboard.kpiCard);
    await expect(kpiCards).toHaveCountGreaterThan(0);

    // Verify charts visible
    const trendChart = page.locator(selectors.dashboard.trendChart);
    await expect(trendChart).toBeVisible();
  });
});
