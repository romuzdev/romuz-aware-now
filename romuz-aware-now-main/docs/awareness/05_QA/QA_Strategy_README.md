# QA Strategy & Testing Guidelines — Romuz Awareness Platform

**Project:** Cyber Zone GRC – Romuz Awareness App  
**Version:** 1.0  
**Date:** 2025-11-09  
**Status:** Active

---

## 1. Overview

This document defines the **Quality Assurance strategy** for the Romuz Awareness Platform, covering:
- Test layers and their scope
- Naming conventions and folder structure
- Test data policy (seeds, isolation, cleanup)
- CI/CD integration commands
- PR acceptance checklist

---

## 2. Test Layers

### 2.1 Unit Tests (Layer 1)

**Purpose:** Test pure functions, utilities, and isolated hooks with mocked dependencies.

**Scope:**
- ✅ Pure utility functions (`src/lib/`, `src/schemas/`)
- ✅ Custom hooks with mocked Supabase client
- ✅ Validation schemas (Zod)
- ✅ Export/import helpers
- ✅ Date/time utilities
- ❌ React components (use Integration or E2E)
- ❌ Database queries (use Integration)

**Framework:** Vitest + React Testing Library

**Location:**
```
tests/unit/
  lib/
    analytics/
      dateRangePresets.test.ts
      exportCSV.test.ts
    audit/
      log-event.test.ts
    rbac.test.ts
  schemas/
    campaigns.test.ts
  hooks/
    analytics/
      useAwarenessKPIs.test.ts (with mocked Supabase)
```

**Naming Convention:**
- File: `{module}.test.ts` or `{module}.spec.ts`
- Test block: `describe('functionName', () => { ... })`
- Test case: `it('should do X when Y', () => { ... })`

**Example:**
```typescript
// tests/unit/filters.spec.ts
import { describe, it, expect } from 'vitest';

describe('Campaign Filters: URL Serialization', () => {
  it('should serialize empty filters to empty params', () => {
    const params = filtersToURLParams(DEFAULTS);
    expect(params.toString()).toBe('');
  });

  it('should serialize all non-default values', () => {
    const filters = { q: 'Security', status: 'active', ... };
    const params = filtersToURLParams(filters);
    expect(params.get('q')).toBe('Security');
  });
});
```

**Coverage Target:** 80%+ for pure functions

**✅ IMPLEMENTED SUITES:**
- `filters.spec.ts` (30 tests) - URL query ↔ state round-trip
- `savedViews.spec.ts` (20 tests) - Client-side merge logic + immutability
- `quizGrading.spec.ts` (25 tests) - Grading logic + numeric stability
- `csvMappers.spec.ts` (30 tests) - CSV export + escaping
- `rbacCan.spec.ts` (20 tests) - Permission fallback behavior

**Total:** 125 unit tests covering core logic

---

### 2.2 Integration Tests (Layer 2)

**Purpose:** Test Supabase interactions, RLS policies, and multi-component workflows on test schema.

**Scope:**
- ✅ Database CRUD operations
- ✅ RLS policy enforcement (tenant isolation)
- ✅ View queries (`vw_awareness_campaign_kpis`, etc.)
- ✅ Edge functions (if added)
- ✅ Hook + Supabase integration
- ❌ Full UI rendering (use E2E)

**Framework:** Vitest + Supabase Test Client

**Location:**
```
tests/integration/
  supabase/
    campaigns/
      crud.test.ts
      rls.test.ts
      views.test.ts
    participants/
      crud.test.ts
      bulk-actions.test.ts
    analytics/
      kpis-view.test.ts
      trend-view.test.ts
  hooks/
    campaigns/
      useCampaignsList.integration.test.ts
```

**Setup Requirements:**
1. Test Supabase instance or local instance
2. Test schema with seed data
3. Isolated test tenants
4. Cleanup after each test

**Naming Convention:**
- File: `{module}.test.ts` or `{module}.integration.test.ts`
- Setup: `beforeEach()` for test data, `afterEach()` for cleanup

**Example:**
```typescript
// tests/integration/supabase/campaigns/rls.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestClient, seedTestTenant } from '@/tests/helpers/supabase';

describe('Campaigns RLS', () => {
  let client: SupabaseClient;
  let tenantId: string;

  beforeEach(async () => {
    client = await createTestClient();
    tenantId = await seedTestTenant(client);
  });

  afterEach(async () => {
    await cleanupTestData(client, tenantId);
  });

  it('should only return campaigns for current tenant', async () => {
    // Test implementation
  });
});
```

**Coverage Target:** 70%+ for database operations

---

### 2.3 End-to-End Tests (Layer 3)

**Purpose:** Test complete user workflows across UI, API, and database.

**Scope:**
- ✅ Critical user journeys (login → create campaign → view metrics)
- ✅ RBAC guards (permission checks)
- ✅ Multi-step workflows
- ✅ Cross-page navigation
- ✅ Export/import flows
- ❌ Unit-level details (use Unit tests)

**Framework:** Playwright

**Location:**
```
tests/e2e/
  auth/
    login.spec.ts
    signup.spec.ts
  campaigns/
    create-campaign.spec.ts
    edit-campaign.spec.ts
    manage-participants.spec.ts
  analytics/
    dashboard.spec.ts
    drill-down.spec.ts
    exports.spec.ts
  rbac/
    view-permissions.spec.ts
    manage-permissions.spec.ts
```

**Naming Convention:**
- File: `{feature}.spec.ts`
- Test block: `test.describe('Feature Name', () => { ... })`
- Test case: `test('should do X as Y role', async ({ page }) => { ... })`

**Example:**
```typescript
// tests/e2e/campaigns/create-campaign.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Create Campaign', () => {
  test('should create campaign as admin', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[name="email"]', 'admin@test.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    await page.goto('/admin/campaigns/new');
    await page.fill('[name="name"]', 'Test Campaign');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/admin\/campaigns\/[a-f0-9-]+$/);
  });
});
```

**Coverage Target:** 100% of critical paths, 80%+ of happy paths

---

## 3. Folder Structure

```
romuz-awareness/
├── tests/
│   ├── unit/
│   │   ├── lib/
│   │   ├── schemas/
│   │   └── hooks/
│   ├── integration/
│   │   ├── supabase/
│   │   └── hooks/
│   ├── e2e/
│   │   ├── auth/
│   │   ├── campaigns/
│   │   ├── analytics/
│   │   └── rbac/
│   ├── fixtures/
│   │   ├── campaigns.json
│   │   ├── participants.json
│   │   └── users.json
│   ├── helpers/
│   │   ├── supabase.ts
│   │   ├── auth.ts
│   │   └── seeds.ts
│   └── setup/
│       ├── vitest.config.ts
│       └── playwright.config.ts
├── src/
└── docs/
```

---

## 4. Test Data Policy

### 4.1 Seed Strategy

**Principles:**
1. **Isolation:** Each test gets its own tenant + data
2. **Predictability:** Fixed seed data for reproducible tests
3. **Cleanup:** Always cleanup after tests
4. **Minimal:** Only seed what's needed for the test

**Seed Files Location:**
```
tests/fixtures/
  tenants.json          # Test tenants
  users.json            # Test users (admin, manager, employee)
  campaigns.json        # Sample campaigns
  participants.json     # Sample participants
  modules.json          # Sample modules
  quizzes.json          # Sample quizzes
```

**Seed Format (JSON):**
```json
{
  "tenants": [
    {
      "id": "00000000-0000-0000-0000-000000000001",
      "name": "Test Tenant 1",
      "is_active": true
    }
  ],
  "users": [
    {
      "id": "11111111-1111-1111-1111-111111111111",
      "email": "admin@test-tenant1.com",
      "role": "admin"
    }
  ]
}
```

### 4.2 Tenant Isolation

**Rules:**
1. Each integration test creates a new test tenant
2. Test tenant ID follows pattern: `test-{timestamp}-{random}`
3. All test data includes `tenant_id` reference
4. RLS policies enforce tenant boundaries
5. No test uses production tenant IDs

**Helper Functions:**
```typescript
// tests/helpers/seeds.ts
export async function createTestTenant(client: SupabaseClient): Promise<string> {
  const tenantId = `test-${Date.now()}-${Math.random().toString(36)}`;
  await client.from('tenants').insert({ id: tenantId, name: 'Test Tenant' });
  return tenantId;
}

export async function createTestUser(
  client: SupabaseClient, 
  tenantId: string, 
  role: string
): Promise<User> {
  // Create auth user + tenant association
}
```

### 4.3 Cleanup Rules

**When:**
- `afterEach()` for test-specific data
- `afterAll()` for shared fixtures
- Manual cleanup scripts for orphaned data

**What:**
- Delete test tenants and all related data (cascade)
- Clear auth users (if using test auth)
- Reset sequences/counters

**Helper:**
```typescript
// tests/helpers/cleanup.ts
export async function cleanupTestTenant(
  client: SupabaseClient, 
  tenantId: string
): Promise<void> {
  await client.from('tenants').delete().eq('id', tenantId);
  // Cascade deletes handle related data
}
```

**Orphaned Data Detection:**
```sql
-- Run weekly to find orphaned test data
SELECT * FROM tenants 
WHERE name LIKE 'Test Tenant%' 
AND created_at < NOW() - INTERVAL '7 days';
```

---

## 5. CI/CD Integration

### 5.1 Test Commands

**Package.json scripts:**
```json
{
  "scripts": {
    "test": "npm run test:unit",
    "test:unit": "vitest run --config tests/setup/vitest.config.ts",
    "test:unit:watch": "vitest --config tests/setup/vitest.config.ts",
    "test:unit:ui": "vitest --ui --config tests/setup/vitest.config.ts",
    "test:coverage": "vitest run --coverage --config tests/setup/vitest.config.ts",
    "test:int": "vitest run --config tests/setup/vitest.integration.config.ts",
    "test:e2e": "playwright test"
  }
}
```

**✅ IMPLEMENTED:** Unit tests with Vitest (5 suites, 100+ test cases)  
**⏳ PENDING:** Integration and E2E tests (future implementation)

### 5.2 CI Pipeline (GitHub Actions / GitLab CI)

**Stages:**
```yaml
stages:
  - lint
  - test-unit
  - test-integration
  - test-e2e
  - build
  - deploy
```

**Test Stage Details:**

1. **Lint & Type Check**
   ```bash
   npm run lint
   npm run typecheck
   ```

2. **Unit Tests** (Runs on every PR)
   ```bash
   npm run test:unit
   ```
   - Fast (~30s)
   - No external dependencies
   - Fails PR if <80% coverage

3. **Integration Tests** (Runs on every PR)
   ```bash
   npm run test:int
   ```
   - Requires test Supabase instance
   - Medium speed (~2-5 min)
   - Fails PR if any test fails

4. **E2E Tests** (Runs on main branch / release)
   ```bash
   npm run test:e2e
   ```
   - Requires full stack (DB + API + UI)
   - Slow (~10-20 min)
   - Fails deployment if critical paths fail

### 5.3 Test Matrix

Run tests in parallel across:
- **Browsers:** Chromium, Firefox, Webkit (Playwright)
- **Node versions:** 18.x, 20.x
- **Environments:** Dev, Staging, Production (E2E only)

---

## 6. Test Matrix (Features × Layers)

| Feature | Unit | Integration | E2E | Priority |
|---------|------|-------------|-----|----------|
| **Auth** |  |  |  |  |
| → Login | ❌ | ✅ | ✅ | Critical |
| → Signup | ❌ | ✅ | ✅ | Critical |
| → Logout | ❌ | ❌ | ✅ | High |
| **Campaigns** |  |  |  |  |
| → CRUD | ✅ (schemas) | ✅ | ✅ | Critical |
| → Filters | ✅ (utils) | ✅ | ✅ | High |
| → Saved Views | ✅ (hooks) | ✅ | ✅ | Medium |
| → Bulk Actions | ✅ (utils) | ✅ | ✅ | High |
| **Participants** |  |  |  |  |
| → CRUD | ✅ (schemas) | ✅ | ✅ | Critical |
| → Import CSV | ✅ (parser) | ✅ | ✅ | High |
| → Export CSV | ✅ (export) | ✅ | ✅ | High |
| → Metrics | ✅ (calc) | ✅ | ✅ | High |
| **Modules** |  |  |  |  |
| → CRUD | ✅ (schemas) | ✅ | ✅ | Critical |
| → Quizzes | ✅ (grading) | ✅ | ✅ | Critical |
| → Progress | ❌ | ✅ | ✅ | High |
| **Analytics** |  |  |  |  |
| → Views (DB) | ❌ | ✅ | ✅ | Critical |
| → KPIs | ✅ (agg) | ✅ | ✅ | Critical |
| → Trend | ✅ (utils) | ✅ | ✅ | High |
| → Exports | ✅ (CSV) | ❌ | ✅ | High |
| **RBAC** |  |  |  |  |
| → Permission checks | ✅ (rbac) | ✅ | ✅ | Critical |
| → RLS enforcement | ❌ | ✅ | ✅ | Critical |
| → Tenant isolation | ❌ | ✅ | ✅ | Critical |
| **Policies** |  |  |  |  |
| → CRUD | ✅ (schemas) | ✅ | ✅ | High |
| → Versioning | ✅ (utils) | ✅ | ✅ | Medium |
| **Audit Log** |  |  |  |  |
| → Event logging | ✅ (logger) | ✅ | ✅ | High |
| → Query/filter | ✅ (utils) | ✅ | ✅ | Medium |

**Legend:**
- ✅ Test required
- ❌ Not applicable
- Priority: Critical > High > Medium > Low

---

## 7. PR Acceptance Checklist

### 7.1 Code Quality
- [ ] **Linting:** ESLint passes with no errors
- [ ] **Type Safety:** TypeScript compiles with no errors
- [ ] **Formatting:** Prettier applied consistently
- [ ] **No Console Logs:** Remove debug logs (except intentional logging)
- [ ] **No TODOs:** Resolve or create tickets for TODOs

### 7.2 Testing
- [ ] **Unit Tests:** All unit tests pass
- [ ] **Integration Tests:** All integration tests pass
- [ ] **Coverage:** Unit test coverage ≥80% for changed files
- [ ] **New Tests:** Added tests for new features/bug fixes
- [ ] **Test Data:** No hardcoded production IDs or secrets

### 7.3 Security
- [ ] **RLS Verified:** Database changes include RLS policies
- [ ] **Tenant Isolation:** Multi-tenant boundaries enforced
- [ ] **RBAC Checked:** Permission guards on new endpoints/pages
- [ ] **Input Validation:** All user inputs validated (Zod schemas)
- [ ] **No Secrets:** No API keys or passwords in code

### 7.4 Database
- [ ] **Migration Clean:** Migration runs successfully (up/down)
- [ ] **No Breaking Changes:** Existing data compatible
- [ ] **Indexes Added:** Indexes on new foreign keys/queries
- [ ] **RLS Policies:** Policies added for new tables
- [ ] **Audit Triggers:** Audit log triggers on critical tables

### 7.5 Documentation
- [ ] **Code Comments:** Complex logic documented
- [ ] **README Updated:** Feature docs updated if needed
- [ ] **API Contracts:** New endpoints documented
- [ ] **Migration Notes:** Database changes documented
- [ ] **Acceptance Criteria:** Feature meets requirements

### 7.6 Performance
- [ ] **Query Optimization:** No N+1 queries
- [ ] **Bundle Size:** Check for large dependency additions
- [ ] **Loading States:** Skeletons/spinners for async operations
- [ ] **Error Handling:** Proper error boundaries and messages

### 7.7 Accessibility
- [ ] **Semantic HTML:** Proper heading hierarchy
- [ ] **ARIA Labels:** Buttons/links have descriptive labels
- [ ] **Keyboard Navigation:** All interactive elements reachable
- [ ] **Color Contrast:** Meets WCAG AA standards

### 7.8 Manual Testing
- [ ] **Happy Path:** Feature works as expected
- [ ] **Edge Cases:** Tested with empty/invalid/extreme data
- [ ] **Browser Tested:** Tested in Chrome/Firefox/Safari
- [ ] **Mobile Responsive:** Tested on mobile viewport
- [ ] **RBAC Tested:** Tested with different user roles

---

## 8. Test Environments

### 8.1 Local Development
- **Database:** Local Supabase (Docker) or dev instance
- **Seed Data:** `npm run seed:dev`
- **Test Users:** 3 roles (admin, manager, employee)

### 8.2 CI/CD (GitHub Actions)
- **Database:** Ephemeral Supabase instance per pipeline
- **Seed Data:** Auto-seeded via fixtures
- **Test Users:** Seeded via setup scripts

### 8.3 Staging
- **Database:** Staging Supabase instance
- **Seed Data:** Production-like (anonymized)
- **Test Users:** Real test accounts

### 8.4 Production
- **E2E Tests:** Smoke tests only (critical paths)
- **Frequency:** Post-deployment + daily
- **Monitoring:** Alert on test failures

---

## 9. Testing Best Practices

### 9.1 General
- ✅ Write tests before fixing bugs (TDD for regressions)
- ✅ Keep tests independent (no shared state)
- ✅ Use descriptive test names (behavior, not implementation)
- ✅ Mock external APIs (use MSW for network mocking)
- ✅ Test one thing per test case
- ❌ Don't test implementation details
- ❌ Don't duplicate coverage (avoid testing same thing at multiple layers)

### 9.2 Unit Tests
- ✅ Focus on pure functions and utils
- ✅ Mock all external dependencies
- ✅ Test edge cases and error paths
- ✅ Keep tests fast (<1s per test)

### 9.3 Integration Tests
- ✅ Test actual database interactions
- ✅ Verify RLS policies with different users
- ✅ Use transactions for fast cleanup
- ✅ Test failure scenarios (DB errors, constraint violations)

### 9.4 E2E Tests
- ✅ Test critical user journeys only
- ✅ Use Page Object Model for maintainability
- ✅ Add explicit waits (avoid flakiness)
- ✅ Take screenshots on failure
- ❌ Don't test trivial UI details

---

## 10. Continuous Improvement

### 10.1 Metrics to Track
- Test coverage (per layer)
- Test execution time
- Flaky test rate
- Bug escape rate (bugs found in production)
- Time to fix failing tests

### 10.2 Review Cadence
- **Weekly:** Review failing tests and flaky tests
- **Monthly:** Review coverage reports and gaps
- **Quarterly:** Update test strategy based on learnings

### 10.3 Tooling Upgrades
- Keep testing dependencies up to date
- Evaluate new testing tools (e.g., Storybook for component testing)
- Automate where possible (visual regression, performance testing)

---

## 11. Getting Started

### 11.1 Setup Testing Environment

```bash
# Install dependencies
npm install -D vitest @vitest/ui @testing-library/react @testing-library/user-event
npm install -D playwright @playwright/test
npm install -D @vitest/coverage-v8

# Initialize Playwright
npx playwright install

# Create test config files
mkdir -p tests/setup
touch tests/setup/vitest.config.ts
touch tests/setup/playwright.config.ts
```

### 11.2 Run First Test

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

---

## 12. Support & Resources

**Internal:**
- QA Lead: [Name/Email]
- Test Issues: GitHub Issues with `test` label
- Questions: #qa-testing Slack channel

**External:**
- Vitest: https://vitest.dev/
- Playwright: https://playwright.dev/
- Testing Library: https://testing-library.com/

---

## 13. Appendix

### 13.1 Minimal CI Configuration (Placeholder)

**File:** `.github/workflows/test.yml`

```yaml
# To be implemented in next iteration
# Placeholder for CI test pipeline
name: Test Pipeline

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:int
      - run: npm run test:e2e
```

### 13.2 Sample Test Helper Signatures

```typescript
// tests/helpers/supabase.ts
export function createTestClient(): SupabaseClient;
export function createTestTenant(client: SupabaseClient): Promise<string>;
export function createTestUser(client: SupabaseClient, tenantId: string, role: string): Promise<User>;
export function cleanupTestData(client: SupabaseClient, tenantId: string): Promise<void>;

// tests/helpers/auth.ts
export function loginAsAdmin(page: Page): Promise<void>;
export function loginAsManager(page: Page): Promise<void>;
export function loginAsEmployee(page: Page): Promise<void>;

// tests/helpers/seeds.ts
export function seedCampaigns(client: SupabaseClient, tenantId: string, count: number): Promise<Campaign[]>;
export function seedParticipants(client: SupabaseClient, campaignId: string, count: number): Promise<Participant[]>;
```

---

**End of QA Strategy Document**

**Last Updated:** 2025-11-09  
**Next Review:** 2025-12-09
