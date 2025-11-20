import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Configuration for GRC Module
 * 
 * Test Structure:
 * - risks.flow.spec.ts: Risk management workflow
 * - controls.flow.spec.ts: Control management workflow
 * - compliance.flow.spec.ts: Compliance management workflow
 * - audits.flow.spec.ts: Audit management workflow
 * - reports.flow.spec.ts: Reports and analytics
 * - integration-workflow.spec.ts: End-to-end integration tests
 */

export default defineConfig({
  testDir: './tests/e2e/grc',
  
  // Timeout for each test
  timeout: 60 * 1000,
  
  // Global setup/teardown
  fullyParallel: true,
  
  // Fail fast on CI
  forbidOnly: !!process.env.CI,
  
  // Retries
  retries: process.env.CI ? 2 : 1,
  
  // Workers
  workers: process.env.CI ? 2 : 4,
  
  // Reporter
  reporter: [
    ['html', { outputFolder: 'test-results/grc/html' }],
    ['json', { outputFile: 'test-results/grc/results.json' }],
    ['junit', { outputFile: 'test-results/grc/results.xml' }],
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
    actionTimeout: 15 * 1000,
    navigationTimeout: 20 * 1000,
    
    // Locale and timezone
    locale: 'ar-SA',
    timezoneId: 'Asia/Riyadh',
  },

  // Projects for different test suites
  projects: [
    {
      name: 'grc-risks',
      testMatch: /risks\.flow\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'grc-controls',
      testMatch: /controls\.flow\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'grc-compliance',
      testMatch: /compliance\.flow\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'grc-audits',
      testMatch: /audits\.flow\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'grc-reports',
      testMatch: /reports\.flow\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'grc-integration',
      testMatch: /integration-workflow\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'grc-mobile',
      testMatch: /.*\.flow\.spec\.ts/,
      use: {
        ...devices['iPhone 13'],
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
