/**
 * M13.1 Content Hub - E2E Tests for AI Content Wizard
 */

import { test, expect } from '@playwright/test';

test.describe('AI Content Wizard - Full User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Navigate to Content Hub
    await page.goto('/content-hub');
    await page.waitForLoadState('networkidle');
  });

  test('should open AI Content Wizard', async ({ page }) => {
    // Click AI wizard button
    await page.click('[data-testid="ai-wizard-button"]');

    // Wait for wizard dialog
    await expect(page.locator('[data-testid="ai-content-wizard"]')).toBeVisible({
      timeout: 5000,
    });

    // Verify wizard steps
    await expect(page.locator('text=Content Type')).toBeVisible();
  });

  test('should generate article with AI', async ({ page }) => {
    // Open wizard
    await page.click('[data-testid="ai-wizard-button"]');

    // Step 1: Select content type
    await page.click('[data-value="article"]');
    await page.click('button:has-text("Next")');

    // Step 2: Enter prompt
    await page.fill(
      'textarea[name="prompt"]',
      'Write an article about cybersecurity best practices for employees'
    );
    await page.click('button:has-text("Generate")');

    // Wait for AI generation
    await expect(page.locator('text=Generating content')).toBeVisible({
      timeout: 5000,
    });

    // Wait for completion (may take time)
    await expect(page.locator('[data-testid="generated-content"]')).toBeVisible({
      timeout: 30000,
    });

    // Verify generated content has text
    const content = await page
      .locator('[data-testid="generated-content"]')
      .textContent();
    expect(content?.length).toBeGreaterThan(100);

    // Save generated content
    await page.click('button:has-text("Save Content")');

    // Verify success
    await expect(
      page.locator('text=AI content saved successfully')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should generate image with AI', async ({ page }) => {
    // Open wizard
    await page.click('[data-testid="ai-wizard-button"]');

    // Select image type
    await page.click('[data-value="image"]');
    await page.click('button:has-text("Next")');

    // Enter image prompt
    await page.fill(
      'textarea[name="prompt"]',
      'A professional illustration showing cybersecurity concepts'
    );
    await page.click('button:has-text("Generate")');

    // Wait for generation
    await expect(page.locator('text=Generating image')).toBeVisible({
      timeout: 5000,
    });

    // Wait for image (longer timeout for image generation)
    await expect(page.locator('img[data-testid="generated-image"]')).toBeVisible({
      timeout: 60000,
    });

    // Verify image loaded
    const image = page.locator('img[data-testid="generated-image"]');
    const src = await image.getAttribute('src');
    expect(src).toBeTruthy();
  });

  test('should translate content with AI', async ({ page }) => {
    // Open wizard
    await page.click('[data-testid="ai-wizard-button"]');

    // Select translate option
    await page.click('[data-value="translate"]');
    await page.click('button:has-text("Next")');

    // Enter text to translate
    await page.fill(
      'textarea[name="source_text"]',
      'This is a test content for translation'
    );

    // Select target language
    await page.selectOption('select[name="target_language"]', 'ar');

    // Generate translation
    await page.click('button:has-text("Translate")');

    // Wait for translation
    await expect(page.locator('[data-testid="translated-content"]')).toBeVisible({
      timeout: 15000,
    });

    // Verify translation exists
    const translated = await page
      .locator('[data-testid="translated-content"]')
      .textContent();
    expect(translated?.length).toBeGreaterThan(0);
  });

  test('should use content template', async ({ page }) => {
    // Open wizard
    await page.click('[data-testid="ai-wizard-button"]');

    // Click use template
    await page.click('[data-testid="use-template-btn"]');

    // Select template
    await page.click('[data-testid="template-card"]').first();

    // Verify template fields populated
    const title = await page.locator('input[name="title"]').inputValue();
    expect(title.length).toBeGreaterThan(0);

    // Continue with template
    await page.click('button:has-text("Use This Template")');

    // Verify editor opens with template
    await expect(page.locator('[data-testid="content-editor"]')).toBeVisible();
  });

  test('should regenerate AI content', async ({ page }) => {
    // Open wizard and generate content
    await page.click('[data-testid="ai-wizard-button"]');
    await page.click('[data-value="article"]');
    await page.click('button:has-text("Next")');
    await page.fill('textarea[name="prompt"]', 'Test article about security');
    await page.click('button:has-text("Generate")');

    // Wait for first generation
    await expect(page.locator('[data-testid="generated-content"]')).toBeVisible({
      timeout: 30000,
    });

    const firstContent = await page
      .locator('[data-testid="generated-content"]')
      .textContent();

    // Click regenerate
    await page.click('[data-testid="regenerate-btn"]');

    // Wait for new generation
    await page.waitForTimeout(2000);

    // Verify content changed
    const secondContent = await page
      .locator('[data-testid="generated-content"]')
      .textContent();
    expect(secondContent).not.toBe(firstContent);
  });

  test('should handle AI generation errors gracefully', async ({ page }) => {
    // Open wizard
    await page.click('[data-testid="ai-wizard-button"]');

    // Try to generate without prompt
    await page.click('[data-value="article"]');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Generate")');

    // Verify error message
    await expect(page.locator('text=Please enter a prompt')).toBeVisible({
      timeout: 3000,
    });
  });
});
