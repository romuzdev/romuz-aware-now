import { test, expect } from '@playwright/test';

/**
 * GRC Audits E2E Tests
 * Tests audit planning and execution workflow
 */

test.describe('GRC Audits Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'admin@test.romuz.local');
    await page.fill('input[type="password"]', 'TestAdmin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/grc/, { timeout: 10000 });
  });

  test('should create audit plan', async ({ page }) => {
    await page.goto('/grc/audits');
    await page.click('button:has-text("إنشاء مراجعة")');
    
    await page.fill('input[name="audit_code"]', `AUD-TEST-${Date.now()}`);
    await page.fill('input[name="audit_title"]', 'مراجعة أمن المعلومات السنوية');
    await page.fill('textarea[name="audit_scope"]', 'مراجعة شاملة لضوابط أمن المعلومات');
    
    await page.selectOption('select[name="audit_type"]', 'internal');
    await page.fill('input[name="planned_start_date"]', '2025-02-01');
    await page.fill('input[name="planned_end_date"]', '2025-02-15');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=تم إنشاء المراجعة بنجاح')).toBeVisible({ timeout: 5000 });
  });

  test('should update audit status to in-progress', async ({ page }) => {
    await page.goto('/grc/audits');
    await page.waitForLoadState('networkidle');
    
    await page.click('tbody tr:first-child');
    await page.click('button:has-text("بدء المراجعة")');
    
    await page.fill('input[name="actual_start_date"]', new Date().toISOString().split('T')[0]);
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=تم بدء المراجعة')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=قيد التنفيذ')).toBeVisible();
  });

  test('should record audit finding', async ({ page }) => {
    await page.goto('/grc/audits');
    await page.click('tbody tr:first-child');
    
    await page.click('button:has-text("إضافة ملاحظة")');
    
    await page.fill('input[name="finding_title"]', 'ضعف في ضوابط الوصول');
    await page.fill('textarea[name="finding_description"]', 'تم اكتشاف صلاحيات زائدة لبعض المستخدمين');
    await page.selectOption('select[name="severity"]', 'high');
    await page.selectOption('select[name="status"]', 'open');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=تم تسجيل الملاحظة')).toBeVisible({ timeout: 5000 });
  });

  test('should create corrective action plan', async ({ page }) => {
    await page.goto('/grc/audits');
    await page.click('tbody tr:first-child');
    await page.click('tab:has-text("الملاحظات")');
    
    await page.click('button:has-text("إجراء تصحيحي"):first-child');
    
    await page.fill('textarea[name="action_plan"]', 'مراجعة وتحديث مصفوفة الصلاحيات');
    await page.fill('input[name="responsible_person"]', 'مدير أمن المعلومات');
    await page.fill('input[name="target_completion_date"]', '2025-03-31');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=تم إنشاء الإجراء التصحيحي')).toBeVisible({ timeout: 5000 });
  });

  test('should complete audit with report', async ({ page }) => {
    await page.goto('/grc/audits');
    await page.click('tbody tr:first-child');
    
    await page.click('button:has-text("إتمام المراجعة")');
    
    await page.fill('input[name="actual_end_date"]', new Date().toISOString().split('T')[0]);
    await page.fill('textarea[name="executive_summary"]', 'ملخص نتائج المراجعة');
    await page.fill('textarea[name="recommendations"]', 'التوصيات الرئيسية');
    await page.selectOption('select[name="overall_conclusion"]', 'satisfactory');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=تم إتمام المراجعة')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=مكتملة')).toBeVisible();
  });

  test('should filter audits by type', async ({ page }) => {
    await page.goto('/grc/audits');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("تصفية")');
    await page.click('input[value="internal"]');
    await page.click('button:has-text("تطبيق")');
    
    const filteredRows = await page.locator('tbody tr').count();
    expect(filteredRows).toBeGreaterThan(0);
  });

  test('should export audit report', async ({ page }) => {
    await page.goto('/grc/audits');
    await page.click('tbody tr:first-child');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("تصدير التقرير")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/audit-report.*\.pdf/);
  });

  test('should track finding resolution', async ({ page }) => {
    await page.goto('/grc/audits');
    await page.click('tbody tr:first-child');
    await page.click('tab:has-text("الملاحظات")');
    
    await page.click('button:has-text("تحديث الحالة"):first-child');
    await page.selectOption('select[name="status"]', 'resolved');
    await page.fill('textarea[name="resolution_notes"]', 'تم تطبيق الإجراءات التصحيحية وإعادة الاختبار');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=تم تحديث حالة الملاحظة')).toBeVisible({ timeout: 5000 });
  });
});
