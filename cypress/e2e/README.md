# Gate-N Cypress E2E Tests

This directory contains comprehensive end-to-end tests for the Gate-N Admin Console using Cypress.

## Test Files Structure

### Main Admin Console Tests
- **`gate-n-admin-console.cy.ts`**: Core smoke tests for the admin console
  - Page loading and navigation
  - Tab switching (Status, Jobs, Settings)
  - Basic functionality verification
  - Error handling and loading states

### Detailed Feature Tests
- **`gate-n-settings.cy.ts`**: Comprehensive settings management tests
  - Settings form validation (negative numbers, zero values, required fields)
  - Update operations (SLA hours, retention periods, multiple settings)
  - Settings persistence after reload
  - Reset and cancel operations
  - Concurrent updates and edge cases

- **`gate-n-job-runs.cy.ts`**: Job execution history tests
  - Job runs list display with all columns
  - Filtering by status (success, failed, running)
  - Filtering by job type and date range
  - Job run details view
  - Pagination and page size controls
  - Manual refresh and auto-refresh for running jobs
  - Export functionality

- **`gate-n-alerts.cy.ts`**: Alert policies management tests
  - Alert policies CRUD operations
  - Policy creation with thresholds and conditions
  - Enable/disable policy status
  - Managing policy channels (add/remove)
  - Managing policy targets (campaigns, tags)
  - Error handling and empty states

## Running Tests

### Interactive Mode (Cypress UI)
```bash
# Open Cypress Test Runner
npx cypress open

# Select E2E Testing
# Choose a browser (Chrome, Firefox, Edge)
# Click on any test file to run it
```

### Headless Mode (CI/CD)
```bash
# Run all tests
npx cypress run

# Run specific test file
npx cypress run --spec "cypress/e2e/gate-n-settings.cy.ts"

# Run with specific browser
npx cypress run --browser chrome

# Run with video recording (enabled by default)
npx cypress run --video

# Run without video
npx cypress run --video false
```

### Run Gate-N Tests Only
```bash
# Run all Gate-N tests
npx cypress run --spec "cypress/e2e/gate-n-*.cy.ts"
```

## Test Data Setup

Before running tests, ensure test data is seeded:

```bash
# Seed test data
npm run test:seed

# Or use the custom Cypress command (if implemented)
# cy.seedGateNData()
```

## Custom Commands

The following custom commands are available (defined in `cypress/support/commands.ts`):

- **`cy.loginAsAdmin()`**: Login as tenant admin user
- **`cy.seedGateNData()`**: Seed Gate-N test data
- **`cy.visitGateN()`**: Navigate to Gate-N admin console

## Test Coverage

### Settings Tests Coverage
✅ Form validation (negative, zero, required fields)  
✅ Single and multiple field updates  
✅ Settings persistence  
✅ Concurrent updates  
✅ Error handling  
✅ Cancel/reset operations  

### Job Runs Tests Coverage
✅ List display with all columns  
✅ Filtering (status, type, date)  
✅ Details view  
✅ Pagination  
✅ Refresh operations  
✅ Export functionality  
✅ Error states  

### Alert Policies Tests Coverage
✅ CRUD operations  
✅ Threshold configuration  
✅ Enable/disable policies  
✅ Channel management  
✅ Target management  
✅ Error handling  

## Artifacts

Test artifacts are saved automatically:

- **Videos**: `cypress/videos/` (for all test runs)
- **Screenshots**: `cypress/screenshots/` (on test failure only)
- **Reports**: Check CI/CD workflow artifacts

## Configuration

Test configuration is in `cypress.config.ts`:

```typescript
{
  baseUrl: 'http://localhost:5173',
  video: true,
  screenshotOnRunFailure: true,
  retries: {
    runMode: 2,    // Retry failed tests twice in CI
    openMode: 0     // No retries in interactive mode
  },
  defaultCommandTimeout: 10000,
  requestTimeout: 10000,
  responseTimeout: 10000
}
```

## Best Practices

1. **Use data-testid attributes** for stable element selection
2. **Avoid hardcoded waits** - use Cypress's built-in retry logic
3. **Clean up test data** after each test when possible
4. **Use beforeEach** for common setup
5. **Test both happy paths and error cases**
6. **Keep tests independent** - don't rely on execution order

## Troubleshooting

### Tests Failing Locally
1. Ensure dev server is running: `npm run dev`
2. Check if test data is seeded: `npm run test:seed`
3. Clear Cypress cache: `npx cypress cache clear`
4. Check `.env.test` configuration

### Tests Timing Out
1. Increase timeout in `cypress.config.ts`
2. Check if backend services are running
3. Verify network requests in Cypress UI

### Flaky Tests
1. Add explicit waits: `cy.wait(1000)`
2. Use better selectors (data-testid)
3. Check for race conditions
4. Enable retries in `cypress.config.ts`

## CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests
- Manual workflow dispatch

See `.github/workflows/gate-n-tests.yml` for full CI/CD configuration.

## Future Enhancements

- [ ] Add visual regression testing
- [ ] Implement accessibility testing (cypress-axe)
- [ ] Add performance monitoring
- [ ] Create custom reporting dashboard
- [ ] Add API contract testing
- [ ] Implement test data factories
