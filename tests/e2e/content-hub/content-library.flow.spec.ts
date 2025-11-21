/**
 * M13.1 Content Hub - E2E Tests for Content Library Flow
 */

import { test, expect } from '@playwright/test';

test.describe('Content Library - Full User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Navigate to Content Library
    await page.goto('/content-hub');
    await page.waitForLoadState('networkidle');
  });

  test('should display content library with items', async ({ page }) => {
    // Check for content library container
    const library = page.locator('[data-testid="content-library"]').or(
      page.locator('text=Content Library')
    );
    await expect(library.first()).toBeVisible({ timeout: 10000 });

    // Check for content items (table or cards)
    const hasTable = await page.locator('table').count();
    const hasCards = await page.locator('[data-testid="content-card"]').count();

    expect(hasTable + hasCards).toBeGreaterThan(0);
  });

  test('should filter content by type', async ({ page }) => {
    // Wait for filter dropdown
    await page.waitForSelector('[data-testid="content-type-filter"]', {
      timeout: 5000,
    });

    // Click filter
    await page.click('[data-testid="content-type-filter"]');

    // Select article type
    await page.click('text=Article');

    // Wait for filtered results
    await page.waitForLoadState('networkidle');

    // Verify filtered results
    const contentItems = page.locator('[data-content-type="article"]');
    expect(await contentItems.count()).toBeGreaterThan(0);
  });

  test('should create new content item', async ({ page }) => {
    // Click create button
    await page.click('[data-testid="create-content-btn"]');

    // Fill form
    await page.fill('input[name="title"]', 'E2E Test Content');
    await page.selectOption('select[name="content_type"]', 'article');

    // Fill rich text editor (TipTap)
    const editor = page.locator('[contenteditable="true"]').first();
    await editor.click();
    await editor.fill('This is test content body created by E2E test');

    // Add category
    await page.click('[data-testid="category-selector"]');
    await page.click('text=Security Awareness');

    // Add tags
    await page.fill('input[name="tags"]', 'test,e2e,automation');

    // Save
    await page.click('button[type="submit"]');

    // Wait for success
    await expect(page.locator('text=Content created successfully')).toBeVisible({
      timeout: 5000,
    });

    // Verify new content appears in list
    await expect(page.locator('text=E2E Test Content')).toBeVisible();
  });

  test('should view content detail', async ({ page }) => {
    // Click on first content item
    await page.click('[data-testid="content-item"]').first();

    // Wait for detail view
    await expect(page.locator('[data-testid="content-detail"]')).toBeVisible({
      timeout: 5000,
    });

    // Verify content elements
    await expect(page.locator('[data-testid="content-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="content-body"]')).toBeVisible();
    await expect(page.locator('[data-testid="content-metadata"]')).toBeVisible();
  });

  test('should like content', async ({ page }) => {
    // Navigate to content detail
    await page.click('[data-testid="content-item"]').first();

    // Get initial like count
    const likeButton = page.locator('[data-testid="like-button"]');
    await expect(likeButton).toBeVisible();

    const initialCount = await page
      .locator('[data-testid="like-count"]')
      .textContent();

    // Click like button
    await likeButton.click();

    // Wait for update
    await page.waitForTimeout(1000);

    // Verify like count increased
    const newCount = await page
      .locator('[data-testid="like-count"]')
      .textContent();
    expect(parseInt(newCount || '0')).toBe(parseInt(initialCount || '0') + 1);

    // Verify button state changed
    await expect(likeButton).toHaveClass(/liked/);
  });

  test('should add comment', async ({ page }) => {
    // Navigate to content detail
    await page.click('[data-testid="content-item"]').first();

    // Scroll to comments section
    await page.locator('[data-testid="comments-section"]').scrollIntoViewIfNeeded();

    // Fill comment
    await page.fill(
      'textarea[data-testid="comment-input"]',
      'This is a test comment from E2E'
    );

    // Submit
    await page.click('[data-testid="submit-comment-btn"]');

    // Wait for success
    await expect(page.locator('text=Comment added successfully')).toBeVisible({
      timeout: 5000,
    });

    // Verify comment appears
    await expect(page.locator('text=This is a test comment from E2E')).toBeVisible();
  });

  test('should bookmark content', async ({ page }) => {
    // Navigate to content detail
    await page.click('[data-testid="content-item"]').first();

    // Click bookmark button
    const bookmarkButton = page.locator('[data-testid="bookmark-button"]');
    await bookmarkButton.click();

    // Wait for success toast
    await expect(page.locator('text=Bookmarked')).toBeVisible({ timeout: 5000 });

    // Verify button state
    await expect(bookmarkButton).toHaveClass(/bookmarked/);

    // Navigate to bookmarks
    await page.goto('/content-hub/bookmarks');

    // Verify content appears in bookmarks
    const bookmarkedItem = page.locator('[data-testid="bookmarked-content"]').first();
    await expect(bookmarkedItem).toBeVisible();
  });

  test('should share content', async ({ page }) => {
    // Navigate to content detail
    await page.click('[data-testid="content-item"]').first();

    // Click share button
    await page.click('[data-testid="share-button"]');

    // Wait for share dialog
    await expect(page.locator('[data-testid="share-dialog"]')).toBeVisible();

    // Click email share
    await page.click('[data-testid="share-email"]');

    // Verify share recorded
    await expect(page.locator('text=Share link copied')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should search content', async ({ page }) => {
    // Fill search input
    await page.fill('input[placeholder*="Search"]', 'security');

    // Wait for results
    await page.waitForLoadState('networkidle');

    // Verify filtered results
    const results = page.locator('[data-testid="content-item"]');
    const count = await results.count();
    expect(count).toBeGreaterThan(0);

    // Verify all results contain search term
    for (let i = 0; i < count; i++) {
      const text = await results.nth(i).textContent();
      expect(text?.toLowerCase()).toContain('security');
    }
  });

  test('should edit content', async ({ page }) => {
    // Click on content item
    await page.click('[data-testid="content-item"]').first();

    // Click edit button
    await page.click('[data-testid="edit-button"]');

    // Wait for editor
    await expect(page.locator('[data-testid="content-editor"]')).toBeVisible();

    // Update title
    await page.fill('input[name="title"]', 'Updated E2E Test Content');

    // Save
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator('text=Content updated successfully')).toBeVisible({
      timeout: 5000,
    });

    // Verify updated content
    await expect(page.locator('text=Updated E2E Test Content')).toBeVisible();
  });

  test('should publish content', async ({ page }) => {
    // Create draft content first
    await page.click('[data-testid="create-content-btn"]');
    await page.fill('input[name="title"]', 'Draft Content E2E');
    await page.selectOption('select[name="content_type"]', 'article');
    await page.click('button[type="submit"]');

    // Wait for creation
    await page.waitForLoadState('networkidle');

    // Find draft content
    await page.click('text=Draft Content E2E');

    // Click publish button
    await page.click('[data-testid="publish-button"]');

    // Confirm publish
    await page.click('[data-testid="confirm-publish"]');

    // Verify success
    await expect(page.locator('text=Content published successfully')).toBeVisible({
      timeout: 5000,
    });

    // Verify status changed
    await expect(page.locator('text=Published')).toBeVisible();
  });

  test('should delete content', async ({ page }) => {
    // Create content to delete
    await page.click('[data-testid="create-content-btn"]');
    await page.fill('input[name="title"]', 'Content To Delete E2E');
    await page.selectOption('select[name="content_type"]', 'article');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Find and open content
    await page.click('text=Content To Delete E2E');

    // Click delete button
    await page.click('[data-testid="delete-button"]');

    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]');

    // Verify success
    await expect(page.locator('text=Content deleted successfully')).toBeVisible({
      timeout: 5000,
    });

    // Verify content removed from list
    await expect(page.locator('text=Content To Delete E2E')).not.toBeVisible();
  });
});
