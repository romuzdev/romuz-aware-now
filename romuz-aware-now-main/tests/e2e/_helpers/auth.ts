import { Page } from '@playwright/test';
import { selectors } from './selectors';

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Test users for E2E flows
 * These should be seeded before running tests
 */
export const TEST_USERS = {
  admin: {
    email: 'admin@test.romuz.local',
    password: 'TestAdmin123!',
    role: 'admin',
    permissions: ['campaigns.manage', 'campaigns.view'],
  },
  manager: {
    email: 'manager@test.romuz.local',
    password: 'TestManager123!',
    role: 'manager',
    permissions: ['campaigns.manage', 'campaigns.view'],
  },
  reader: {
    email: 'reader@test.romuz.local',
    password: 'TestReader123!',
    role: 'reader',
    permissions: ['campaigns.view'],
  },
} as const;

/**
 * Login helper with error handling and verification
 */
export async function login(page: Page, credentials: LoginCredentials) {
  await page.goto('/auth/login');
  
  // Fill form
  await page.fill(selectors.auth.emailInput, credentials.email);
  await page.fill(selectors.auth.passwordInput, credentials.password);
  
  // Submit
  await page.click(selectors.auth.submitButton);
  
  // Wait for redirect to campaigns list
  await page.waitForURL(/\/admin\/campaigns/, { timeout: 10000 });
}

/**
 * Logout helper
 */
export async function logout(page: Page) {
  // Navigate to campaigns first to ensure we're in app context
  await page.goto('/admin/campaigns');
  
  // Click user menu and logout
  await page.click(selectors.layout.userMenu);
  await page.click(selectors.layout.logoutButton);
  
  // Wait for redirect to login
  await page.waitForURL(/\/auth\/login/, { timeout: 5000 });
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await page.goto('/admin/campaigns', { waitUntil: 'networkidle' });
    const url = page.url();
    return !url.includes('/auth/login');
  } catch {
    return false;
  }
}

/**
 * Setup auth state for a role
 * Used in setup files to create storageState
 */
export async function setupAuthState(page: Page, role: keyof typeof TEST_USERS) {
  const user = TEST_USERS[role];
  await login(page, { email: user.email, password: user.password });
}
