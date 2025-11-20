import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Configuration for Awareness Module
 * 
 * Test Structure:
 * - admin.flow.spec.ts: Full lifecycle (create → manage → verify)
 * - manager.flow.spec.ts: Operational tasks (bulk actions, exports, dashboards)
 * - reader.flow.spec.ts: Read-only + RBAC guards
 */

export default defineConfig({
  testDir: './tests/e2e',
  
  // Timeout for each test
  timeout: 60 * 1000,
  
  // Global setup/teardown
  fullyParallel: false, // Run sequentially to avoid seed conflicts
  
  // Fail fast on CI
  forbidOnly: !!process.env.CI,
  
  // Retries
  retries: process.env.CI ? 1 : 0,
  
  // Workers
  workers: process.env.CI ? 1 : 1, // Single worker for deterministic seeds
  
  // Reporter
  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['list'],
  ],
  
  // Global test config
  use: {
    // Base URL from env or default to local dev
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    
    // Browser config
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Timeouts
    actionTimeout: 10 * 1000,
    navigationTimeout: 15 * 1000,
  },

  // Projects for different roles
  projects: [
    {
      name: 'admin-setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'admin-flow',
      testMatch: /admin\.flow\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'test-results/.auth/admin.json',
      },
      dependencies: ['admin-setup'],
    },
    {
      name: 'manager-flow',
      testMatch: /manager\.flow\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'test-results/.auth/manager.json',
      },
      dependencies: ['admin-setup'],
    },
    {
      name: 'reader-flow',
      testMatch: /reader\.flow\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'test-results/.auth/reader.json',
      },
      dependencies: ['admin-setup'],
    },
    {
      name: 'api-tests',
      testMatch: /api\..*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  // Dev server (if running locally)
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
