import { test, expect } from '@playwright/test';
import { selectors, waitForToast } from './_helpers/selectors';
import path from 'path';

/**
 * Admin Full Lifecycle Flow
 * 
 * Journey:
 * 1. Login → Create campaign
 * 2. Add 2 modules (one video, one document)
 * 3. Attach quiz to module #1
 * 4. Import participants CSV
 * 5. Bulk set status for participants
 * 6. Send notifications (Send Now)
 * 7. Verify metrics
 * 8. Verify audit log entries
 * 
 * Assertions:
 * - Success toasts at each step
 * - Table row counts match expected
 * - Metrics > 0
 * - Audit log has recent entries
 */

test.describe('Admin Full Lifecycle', () => {
  let campaignId: string;
  let campaignName: string;

  test.beforeEach(async ({ page }) => {
    // Navigate to campaigns list
    await page.goto('/admin/campaigns');
    await page.waitForLoadState('networkidle');
  });

  test('Step 1: Create new campaign', async ({ page }) => {
    campaignName = `E2E Test Campaign ${Date.now()}`;

    // Click New Campaign button
    await page.click(selectors.campaigns.newButton);
    await page.waitForURL(/\/admin\/campaigns\/new/);

    // Fill form
    await page.fill(selectors.campaignForm.nameInput, campaignName);
    await page.fill(selectors.campaignForm.descriptionInput, 'E2E test campaign for admin flow');
    await page.selectOption(selectors.campaignForm.statusSelect, 'draft');
    
    // Set dates (30 days from now)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    await page.fill(selectors.campaignForm.startDateInput, startDate.toISOString().split('T')[0]);
    await page.fill(selectors.campaignForm.endDateInput, endDate.toISOString().split('T')[0]);
    await page.fill(selectors.campaignForm.ownerInput, 'Admin E2E');

    // Submit
    await page.click(selectors.campaignForm.submitButton);

    // Wait for success toast
    await waitForToast(page, 'Campaign created');

    // Verify redirect to detail page
    await page.waitForURL(/\/admin\/campaigns\/[a-f0-9-]+/);
    
    // Extract campaign ID from URL
    const url = page.url();
    const match = url.match(/\/admin\/campaigns\/([a-f0-9-]+)/);
    expect(match).not.toBeNull();
    campaignId = match![1];

    // Verify campaign name appears
    await expect(page.locator('h1')).toContainText(campaignName);
  });

  test('Step 2: Add 2 modules', async ({ page }) => {
    // Navigate to campaign (reuse from previous test via shared storage)
    await page.goto('/admin/campaigns');
    
    // Find and click our test campaign
    const campaignRow = page.locator(selectors.campaigns.tableRow, { hasText: campaignName });
    await campaignRow.click();

    // Go to Content tab
    await page.click(selectors.campaignDetail.contentTab);

    // Add Module 1: Video
    await page.click(selectors.campaignDetail.addModuleButton);
    await page.fill(selectors.moduleForm.titleInput, 'Cybersecurity Basics Video');
    await page.selectOption(selectors.moduleForm.typeSelect, 'video');
    await page.fill(selectors.moduleForm.urlInput, 'https://example.com/video1.mp4');
    await page.check(selectors.moduleForm.isRequiredCheckbox);
    await page.fill(selectors.moduleForm.estimatedMinutesInput, '15');
    await page.click(selectors.moduleForm.saveButton);
    
    // Wait for success
    await waitForToast(page, 'Module created');

    // Verify module appears in table
    const moduleRows = page.locator(selectors.campaignDetail.moduleRow);
    await expect(moduleRows).toHaveCount(1);

    // Add Module 2: Document
    await page.click(selectors.campaignDetail.addModuleButton);
    await page.fill(selectors.moduleForm.titleInput, 'Security Policy Document');
    await page.selectOption(selectors.moduleForm.typeSelect, 'document');
    await page.fill(selectors.moduleForm.contentTextarea, 'Review the security policy...');
    await page.check(selectors.moduleForm.isRequiredCheckbox);
    await page.fill(selectors.moduleForm.estimatedMinutesInput, '10');
    await page.click(selectors.moduleForm.saveButton);
    
    await waitForToast(page, 'Module created');
    
    // Verify 2 modules
    await expect(moduleRows).toHaveCount(2);
  });

  test('Step 3: Attach quiz to module #1', async ({ page }) => {
    await page.goto('/admin/campaigns');
    const campaignRow = page.locator(selectors.campaigns.tableRow, { hasText: campaignName });
    await campaignRow.click();
    await page.click(selectors.campaignDetail.contentTab);

    // Click quiz icon on first module
    const firstModule = page.locator(selectors.campaignDetail.moduleRow).first();
    await firstModule.locator(selectors.campaignDetail.attachQuizButton).click();

    // Add quiz questions
    await page.fill(selectors.quizForm.questionInput, 'What is phishing?');
    
    // Add 4 options
    await page.fill('input[name="option-0"]', 'A type of fish');
    await page.fill('input[name="option-1"]', 'A social engineering attack');
    await page.fill('input[name="option-2"]', 'A firewall');
    await page.fill('input[name="option-3"]', 'An antivirus');
    
    // Mark option 1 as correct
    await page.check('input[name="correct-1"]');
    
    await page.fill(selectors.quizForm.passScoreInput, '70');
    await page.click(selectors.quizForm.saveButton);
    
    await waitForToast(page, 'Quiz saved');
  });

  test('Step 4: Import participants CSV', async ({ page }) => {
    await page.goto('/admin/campaigns');
    const campaignRow = page.locator(selectors.campaigns.tableRow, { hasText: campaignName });
    await campaignRow.click();
    await page.click(selectors.campaignDetail.participantsTab);

    // Click Import button
    await page.click(selectors.campaignDetail.importButton);

    // Upload CSV
    const csvPath = path.join(__dirname, '_fixtures', 'participants.csv');
    await page.setInputFiles(selectors.importDialog.fileInput, csvPath);
    await page.click(selectors.importDialog.uploadButton);

    // Wait for success
    await waitForToast(page, 'Imported');

    // Verify participants count
    const participantRows = page.locator(selectors.campaignDetail.participantRow);
    await expect(participantRows).toHaveCount(10); // CSV has 10 rows
  });

  test('Step 5: Bulk set status', async ({ page }) => {
    await page.goto('/admin/campaigns');
    const campaignRow = page.locator(selectors.campaigns.tableRow, { hasText: campaignName });
    await campaignRow.click();
    await page.click(selectors.campaignDetail.participantsTab);

    // Select first 3 participants
    const checkboxes = page.locator(selectors.campaigns.checkbox);
    await checkboxes.nth(1).check(); // Skip header checkbox
    await checkboxes.nth(2).check();
    await checkboxes.nth(3).check();

    // Change status to in_progress
    await page.selectOption(selectors.campaignDetail.bulkStatusSelect, 'in_progress');

    await waitForToast(page, 'Status updated');

    // Verify status changed
    const firstRow = page.locator(selectors.campaignDetail.participantRow).first();
    await expect(firstRow).toContainText('in_progress');
  });

  test('Step 6: Send notifications (Send Now)', async ({ page }) => {
    await page.goto('/admin/campaigns');
    const campaignRow = page.locator(selectors.campaigns.tableRow, { hasText: campaignName });
    await campaignRow.click();
    await page.click(selectors.campaignDetail.notificationsTab);

    // Select template
    await page.selectOption(selectors.campaignDetail.templateSelect, 'reminder');

    // Click Send Now
    await page.click(selectors.campaignDetail.sendNowButton);

    // Confirm
    await page.click(selectors.common.confirmButton);

    await waitForToast(page, 'Notifications sent');

    // Verify queue table has entries
    const queueTable = page.locator('table[data-testid="notification-queue"]');
    const queueRows = queueTable.locator('tbody tr');
    await expect(queueRows).toHaveCountGreaterThan(0);
  });

  test('Step 7: Verify metrics', async ({ page }) => {
    await page.goto('/admin/campaigns');
    const campaignRow = page.locator(selectors.campaigns.tableRow, { hasText: campaignName });
    await campaignRow.click();
    await page.click(selectors.campaignDetail.metricsTab);

    // Wait for metrics to load
    await page.waitForSelector(selectors.common.loadingSpinner, { state: 'hidden' });

    // Verify KPI cards exist and have values > 0
    const kpiCards = page.locator('[data-testid="metrics-card"]');
    await expect(kpiCards).toHaveCountGreaterThan(0);

    // Check total participants
    const totalCard = kpiCards.filter({ hasText: 'Total' });
    const totalValue = await totalCard.locator('.text-2xl').textContent();
    expect(Number(totalValue)).toBeGreaterThan(0);
  });

  test('Step 8: Verify audit log', async ({ page }) => {
    await page.goto('/admin/campaigns');
    const campaignRow = page.locator(selectors.campaigns.tableRow, { hasText: campaignName });
    await campaignRow.click();
    await page.click(selectors.campaignDetail.activityTab);

    // Wait for audit log
    await page.waitForSelector(selectors.common.loadingSpinner, { state: 'hidden' });

    // Verify entries exist
    const auditEntries = page.locator(selectors.campaignDetail.auditLogEntry);
    await expect(auditEntries).toHaveCountGreaterThan(0);

    // Verify recent actions (create, update, etc.)
    await expect(page.locator('text=create')).toBeVisible();
    await expect(page.locator('text=update')).toBeVisible();
  });
});
