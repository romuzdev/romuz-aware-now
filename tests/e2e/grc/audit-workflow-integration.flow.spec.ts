/**
 * E2E Integration Tests for Audit Workflows
 * 🔴 High Priority: End-to-end workflow testing
 * Tests the complete audit workflow lifecycle
 */

import { test, expect } from '@playwright/test';

test.describe('Audit Workflow Integration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin-test@gate-n.local');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should complete full workflow creation flow', async ({ page }) => {
    // Navigate to audit workflows
    await page.goto('/audit/workflows');
    await expect(page.locator('h1')).toContainText('إدارة سير العمل');

    // Click create workflow button
    await page.click('button:has-text("إنشاء سير عمل")');
    await expect(page.locator('h2')).toContainText('سير عمل جديد');

    // Fill workflow form
    await page.selectOption('select[name="workflow_type"]', 'planning');
    await page.fill('input[name="current_stage"]', 'مرحلة التخطيط');
    await page.fill('input[name="due_date"]', '2024-12-31');
    await page.selectOption('select[name="priority"]', 'high');
    await page.fill('textarea[name="notes"]', 'Test workflow creation');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator('.toast')).toContainText('تم إنشاء سير العمل بنجاح');
    
    // Verify workflow appears in list
    await expect(page.locator('[data-testid="workflow-list"]')).toContainText('مرحلة التخطيط');
  });

  test('should assign workflow to user', async ({ page }) => {
    await page.goto('/audit/workflows');

    // Click on first workflow
    await page.click('[data-testid="workflow-card"]:first-child');

    // Click assign button
    await page.click('button:has-text("تعيين")');

    // Select user from dropdown
    await page.selectOption('select[name="assigned_to"]', { index: 1 });
    await page.click('button:has-text("تأكيد التعيين")');

    // Verify success
    await expect(page.locator('.toast')).toContainText('تم التعيين بنجاح');
    await expect(page.locator('[data-testid="assigned-user"]')).not.toBeEmpty();
  });

  test('should update workflow progress', async ({ page }) => {
    await page.goto('/audit/workflows');

    // Open workflow details
    await page.click('[data-testid="workflow-card"]:first-child');

    // Update progress
    await page.click('button:has-text("تحديث التقدم")');
    await page.fill('input[name="progress_pct"]', '50');
    await page.fill('textarea[name="notes"]', 'Progress update test');
    await page.click('button:has-text("حفظ")');

    // Verify progress updated
    await expect(page.locator('.toast')).toContainText('تم تحديث التقدم');
    await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute('aria-valuenow', '50');
  });

  test('should complete workflow', async ({ page }) => {
    await page.goto('/audit/workflows');

    // Open workflow with high progress
    await page.click('[data-testid="workflow-card"]:first-child');

    // Click complete button
    await page.click('button:has-text("إكمال")');

    // Confirm completion
    await page.fill('textarea[name="completion_notes"]', 'Workflow completed successfully');
    await page.click('button:has-text("تأكيد الإكمال")');

    // Verify workflow completed
    await expect(page.locator('.toast')).toContainText('تم إكمال سير العمل');
    await expect(page.locator('[data-testid="workflow-status"]')).toContainText('مكتمل');
    await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute('aria-valuenow', '100');
  });

  test('should create and manage workflow stages', async ({ page }) => {
    await page.goto('/audit/workflows');
    await page.click('[data-testid="workflow-card"]:first-child');

    // Navigate to stages tab
    await page.click('button:has-text("المراحل")');

    // Add new stage
    await page.click('button:has-text("إضافة مرحلة")');
    await page.fill('input[name="stage_name"]', 'مرحلة جديدة');
    await page.fill('input[name="stage_name_ar"]', 'New Stage');
    await page.fill('input[name="sequence_order"]', '3');
    await page.check('input[name="approval_required"]');
    await page.click('button:has-text("حفظ المرحلة")');

    // Verify stage added
    await expect(page.locator('.toast')).toContainText('تم إضافة المرحلة');
    await expect(page.locator('[data-testid="stage-list"]')).toContainText('مرحلة جديدة');
  });

  test('should handle workflow errors gracefully', async ({ page }) => {
    await page.goto('/audit/workflows');

    // Try to create workflow with missing required fields
    await page.click('button:has-text("إنشاء سير عمل")');
    await page.click('button[type="submit"]');

    // Verify validation errors
    await expect(page.locator('.error-message')).toContainText('هذا الحقل مطلوب');
  });

  test('should filter and search workflows', async ({ page }) => {
    await page.goto('/audit/workflows');

    // Apply status filter
    await page.selectOption('select[name="status_filter"]', 'in_progress');
    await expect(page.locator('[data-testid="workflow-card"]')).toHaveCount(expect.any(Number));

    // Search by keyword
    await page.fill('input[name="search"]', 'تخطيط');
    await page.press('input[name="search"]', 'Enter');
    await expect(page.locator('[data-testid="workflow-card"]')).toContainText('تخطيط');
  });

  test('should display workflow analytics', async ({ page }) => {
    await page.goto('/audit/analytics');

    // Verify analytics dashboard loads
    await expect(page.locator('h1')).toContainText('تحليلات التدقيق');

    // Check for key metrics
    await expect(page.locator('[data-testid="total-audits"]')).not.toBeEmpty();
    await expect(page.locator('[data-testid="completion-rate"]')).not.toBeEmpty();
    await expect(page.locator('[data-testid="avg-resolution"]')).not.toBeEmpty();

    // Verify charts render
    await expect(page.locator('[data-testid="severity-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="trends-chart"]')).toBeVisible();
  });

  test('should export workflow data', async ({ page }) => {
    await page.goto('/audit/workflows');

    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("تصدير")');
    const download = await downloadPromise;

    // Verify download started
    expect(download.suggestedFilename()).toMatch(/workflows.*\.(csv|xlsx)$/);
  });
});
