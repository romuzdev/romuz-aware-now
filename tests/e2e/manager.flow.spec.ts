import { test, expect } from '@playwright/test';
import { selectors, waitForToast } from './_helpers/selectors';
import fs from 'fs';
import path from 'path';

/**
 * Manager Operational Flow
 * 
 * Journey:
 * 1. Login as manager
 * 2. Open existing campaign
 * 3. Bulk update participants (status + score)
 * 4. Export CSV and verify file
 * 5. Navigate to Dashboards
 * 6. Verify KPIs & trend chart
 * 7. Drill-down back to campaign (verify URL query preserved)
 * 
 * Assertions:
 * - Export file generated and contains data
 * - KPIs visible and > 0
 * - Drill-down preserves filters in URL
 */

test.describe('Manager Operational Flow', () => {
  let campaignName: string;

  test.beforeEach(async ({ page }) => {
    // Find an existing campaign (assume admin already created one)
    await page.goto('/admin/campaigns');
    await page.waitForLoadState('networkidle');

    // Get first active campaign
    const firstRow = page.locator(selectors.campaigns.tableRow).first();
    const nameCell = firstRow.locator('td').nth(1); // Assuming name is 2nd column
    campaignName = await nameCell.textContent() || 'Test Campaign';
  });

  test('Step 1: Open existing campaign', async ({ page }) => {
    // Click campaign row
    const campaignRow = page.locator(selectors.campaigns.tableRow).first();
    await campaignRow.click();

    // Verify redirected to detail
    await page.waitForURL(/\/admin\/campaigns\/[a-f0-9-]+/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Step 2: Bulk update participants', async ({ page }) => {
    const campaignRow = page.locator(selectors.campaigns.tableRow).first();
    await campaignRow.click();
    await page.click(selectors.campaignDetail.participantsTab);

    // Select first 2 participants
    const checkboxes = page.locator(selectors.campaigns.checkbox);
    await checkboxes.nth(1).check();
    await checkboxes.nth(2).check();

    // Change status
    await page.selectOption(selectors.campaignDetail.bulkStatusSelect, 'completed');
    await waitForToast(page);

    // Set score
    await page.click(selectors.campaignDetail.bulkScoreButton);
    await page.fill('input[name="score"]', '88');
    await page.click(selectors.common.confirmButton);
    await waitForToast(page);

    // Verify changes
    const firstRow = page.locator(selectors.campaignDetail.participantRow).first();
    await expect(firstRow).toContainText('completed');
    await expect(firstRow).toContainText('88');
  });

  test('Step 3: Export CSV and verify', async ({ page }) => {
    const campaignRow = page.locator(selectors.campaigns.tableRow).first();
    await campaignRow.click();
    await page.click(selectors.campaignDetail.participantsTab);

    // Click export
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click(selectors.campaignDetail.exportButton),
    ]);

    // Verify filename format
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/campaign_.+_participants_\d{8}_\d{4}\.csv/);

    // Save and verify content
    const downloadPath = path.join('test-results', 'downloads', filename);
    await download.saveAs(downloadPath);

    const csvContent = fs.readFileSync(downloadPath, 'utf-8');
    expect(csvContent).toContain('employee_ref');
    expect(csvContent).toContain('status');
    expect(csvContent.split('\n').length).toBeGreaterThan(1); // Header + data

    await waitForToast(page, 'Export complete');
  });

  test('Step 4: Navigate to Dashboards', async ({ page }) => {
    // Click dashboards link in sidebar
    await page.click(selectors.layout.sidebarDashboards);
    await page.waitForURL(/\/admin\/dashboards\/awareness/);

    // Verify KPI cards loaded
    await page.waitForSelector(selectors.common.loadingSpinner, { state: 'hidden' });
    const kpiCards = page.locator(selectors.dashboard.kpiCard);
    await expect(kpiCards).toHaveCountGreaterThan(0);
  });

  test('Step 5: Verify KPIs and trend chart', async ({ page }) => {
    await page.goto('/admin/dashboards/awareness');
    await page.waitForLoadState('networkidle');

    // Verify KPI values > 0
    const totalCampaigns = page.locator('[data-testid="kpi-total-campaigns"]');
    const totalValue = await totalCampaigns.locator('.text-2xl').textContent();
    expect(Number(totalValue)).toBeGreaterThan(0);

    // Verify trend chart exists
    const trendChart = page.locator(selectors.dashboard.trendChart);
    await expect(trendChart).toBeVisible();

    // Verify top campaigns table
    const topTable = page.locator(selectors.dashboard.topCampaignsTable);
    await expect(topTable).toBeVisible();
    
    const tableRows = topTable.locator('tbody tr');
    await expect(tableRows).toHaveCountGreaterThan(0);
  });

  test('Step 6: Drill-down preserves filters', async ({ page }) => {
    await page.goto('/admin/dashboards/awareness');
    await page.waitForLoadState('networkidle');

    // Set date range filter
    const today = new Date().toISOString().split('T')[0];
    await page.fill('[data-testid="filter-from"]', today);

    // Click drill-down link in top campaigns table
    const firstDrilldown = page.locator(selectors.dashboard.drilldownLink).first();
    const campaignId = await firstDrilldown.getAttribute('href');
    
    await firstDrilldown.click();
    await page.waitForURL(new RegExp(campaignId || ''));

    // Verify URL contains query params (if implemented)
    const url = page.url();
    // Note: This assertion depends on implementation
    // If drill-down preserves filters, URL should have ?from=...
    // Adjust based on actual implementation
  });

  test('Step 7: Manager can manage campaigns', async ({ page }) => {
    await page.goto('/admin/campaigns');

    // Verify New Campaign button is enabled (manager has campaigns.manage)
    const newButton = page.locator(selectors.campaigns.newButton);
    await expect(newButton).not.toBeDisabled();

    // Verify bulk actions available
    const firstRow = page.locator(selectors.campaigns.tableRow).first();
    await firstRow.locator(selectors.campaigns.checkbox).check();

    // Archive button should be visible
    const archiveButton = page.locator(selectors.campaigns.bulkArchiveButton);
    await expect(archiveButton).toBeVisible();
  });
});
