import { test, expect } from '@playwright/test';

/**
 * GRC Reports E2E Tests
 * Tests comprehensive reporting functionality
 */

test.describe('GRC Reports & Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'admin@test.romuz.local');
    await page.fill('input[type="password"]', 'TestAdmin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/grc/, { timeout: 10000 });
  });

  test('should display risk heatmap', async ({ page }) => {
    await page.goto('/grc/reports/risk-heatmap');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=خريطة المخاطر الحرارية')).toBeVisible();
    
    // Verify chart is rendered
    await expect(page.locator('canvas, svg')).toBeVisible();
    
    // Verify legend
    await expect(page.locator('text=منخفض')).toBeVisible();
    await expect(page.locator('text=متوسط')).toBeVisible();
    await expect(page.locator('text=عالي')).toBeVisible();
    await expect(page.locator('text=حرج')).toBeVisible();
  });

  test('should generate risk register report', async ({ page }) => {
    await page.goto('/grc/reports');
    await page.click('button:has-text("سجل المخاطر")');
    
    // Select filters
    await page.selectOption('select[name="status"]', 'all');
    await page.selectOption('select[name="category"]', 'all');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("تصدير Excel")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('risk-register');
    expect(download.suggestedFilename()).toContain('.xlsx');
  });

  test('should display control effectiveness dashboard', async ({ page }) => {
    await page.goto('/grc/reports/control-effectiveness');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=فعالية الضوابط')).toBeVisible();
    
    // Verify KPI cards
    await expect(page.locator('text=الضوابط الفعالة')).toBeVisible();
    await expect(page.locator('text=الضوابط الجزئية')).toBeVisible();
    await expect(page.locator('text=الضوابط غير الفعالة')).toBeVisible();
    
    // Verify charts
    const charts = page.locator('canvas, svg');
    expect(await charts.count()).toBeGreaterThan(0);
  });

  test('should show compliance status report', async ({ page }) => {
    await page.goto('/grc/reports/compliance-status');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=حالة الامتثال')).toBeVisible();
    
    // Verify compliance by framework
    await expect(page.locator('text=PDPL')).toBeVisible();
    await expect(page.locator('text=NCA')).toBeVisible();
    
    // Verify percentage indicators
    const percentages = page.locator('text=/%/');
    expect(await percentages.count()).toBeGreaterThan(0);
  });

  test('should generate executive summary', async ({ page }) => {
    await page.goto('/grc/reports/executive-summary');
    
    // Select date range
    await page.fill('input[name="start_date"]', '2025-01-01');
    await page.fill('input[name="end_date"]', '2025-12-31');
    
    await page.click('button:has-text("إنشاء التقرير")');
    await page.waitForLoadState('networkidle');
    
    // Verify summary sections
    await expect(page.locator('text=ملخص تنفيذي')).toBeVisible();
    await expect(page.locator('text=المخاطر الرئيسية')).toBeVisible();
    await expect(page.locator('text=حالة الضوابط')).toBeVisible();
    await expect(page.locator('text=الامتثال التنظيمي')).toBeVisible();
  });

  test('should display audit findings trends', async ({ page }) => {
    await page.goto('/grc/reports/audit-trends');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=اتجاهات ملاحظات المراجعة')).toBeVisible();
    
    // Verify trend chart
    await expect(page.locator('canvas, svg')).toBeVisible();
    
    // Verify severity breakdown
    await expect(page.locator('text=عالي')).toBeVisible();
    await expect(page.locator('text=متوسط')).toBeVisible();
    await expect(page.locator('text=منخفض')).toBeVisible();
  });

  test('should filter reports by date range', async ({ page }) => {
    await page.goto('/grc/reports/risk-heatmap');
    
    await page.fill('input[name="start_date"]', '2025-01-01');
    await page.fill('input[name="end_date"]', '2025-06-30');
    await page.click('button:has-text("تطبيق")');
    
    await page.waitForLoadState('networkidle');
    
    // Verify data refreshed
    await expect(page.locator('text=يناير 2025')).toBeVisible();
  });

  test('should export comprehensive GRC report', async ({ page }) => {
    await page.goto('/grc/reports');
    await page.click('button:has-text("تقرير شامل")');
    
    // Select sections
    await page.check('input[name="include_risks"]');
    await page.check('input[name="include_controls"]');
    await page.check('input[name="include_compliance"]');
    await page.check('input[name="include_audits"]');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("تصدير PDF")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('grc-report');
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('should show treatment plan progress', async ({ page }) => {
    await page.goto('/grc/reports/treatment-progress');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=تقدم خطط المعالجة')).toBeVisible();
    
    // Verify progress bars
    const progressBars = page.locator('[role="progressbar"]');
    expect(await progressBars.count()).toBeGreaterThan(0);
    
    // Verify status indicators
    await expect(page.locator('text=مكتمل')).toBeVisible();
    await expect(page.locator('text=قيد التنفيذ')).toBeVisible();
  });
});
