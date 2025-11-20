import { test as setup } from '@playwright/test';
import { setupAuthState, TEST_USERS } from './_helpers/auth';
import path from 'path';
import fs from 'fs';

/**
 * Authentication Setup
 * 
 * Creates authenticated sessions for admin, manager, and reader roles
 * Saves session state to .auth/ directory for reuse in tests
 * 
 * Run before all tests to establish auth context
 */

const authDir = path.join('test-results', '.auth');

// Ensure auth directory exists
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

setup('authenticate as admin', async ({ page }) => {
  await setupAuthState(page, 'admin');
  await page.context().storageState({ path: path.join(authDir, 'admin.json') });
});

setup('authenticate as manager', async ({ page }) => {
  await setupAuthState(page, 'manager');
  await page.context().storageState({ path: path.join(authDir, 'manager.json') });
});

setup('authenticate as reader', async ({ page }) => {
  await setupAuthState(page, 'reader');
  await page.context().storageState({ path: path.join(authDir, 'reader.json') });
});
