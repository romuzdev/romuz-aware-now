# CI/CD Test Tasks Checklist — Romuz Awareness Platform

**Version:** 1.0  
**Date:** 2025-11-09  
**Status:** Planning (Implementation Pending)

---

## Overview

This document defines the **test tasks** that will be integrated into the CI/CD pipeline. These are **commands only** — actual test implementation will happen in subsequent parts.

---

## CI Pipeline Stages

```
┌─────────────┐
│   Commit    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Pre-Commit │  ← Lint, Format Check
└──────┬──────┘
       │
       ▼
┌─────────────┐
│     PR      │  ← Unit + Integration Tests
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Merge    │  ← Full Test Suite
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Deploy    │  ← E2E Smoke Tests
└─────────────┘
```

---

## Task Definitions

### 1. Pre-Commit Checks (Local)

**When:** Before every commit (Git hook)

**Tasks:**
```bash
# 1.1 Lint JavaScript/TypeScript
npm run lint

# 1.2 Type Check
npm run typecheck

# 1.3 Format Check (Prettier)
npm run format:check

# 1.4 Validate Imports
npm run validate:imports
```

**Exit Criteria:**
- ✅ No ESLint errors
- ✅ No TypeScript errors
- ✅ All files formatted correctly
- ✅ No circular dependencies

**Time Budget:** <30 seconds

---

### 2. Pull Request Tests

**When:** On every PR to `main` or `develop`

**Tasks:**
```bash
# 2.1 Install Dependencies
npm ci

# 2.2 Build Project
npm run build

# 2.3 Lint
npm run lint

# 2.4 Type Check
npm run typecheck

# 2.5 Unit Tests
npm run test:unit

# 2.6 Integration Tests
npm run test:int -- --run

# 2.7 Generate Coverage Report
npm run test:coverage

# 2.8 Upload Coverage
npm run coverage:upload
```

**Exit Criteria:**
- ✅ Build succeeds
- ✅ All linters pass
- ✅ All unit tests pass
- ✅ All integration tests pass
- ✅ Unit coverage ≥80%
- ✅ Integration coverage ≥70%

**Time Budget:** <5 minutes

**Fail Behavior:** Block PR merge

---

### 3. Main Branch Tests (Post-Merge)

**When:** After merge to `main`

**Tasks:**
```bash
# 3.1 Full Test Suite
npm run test

# 3.2 E2E Tests (Critical Paths)
npm run test:e2e -- --grep "@critical"

# 3.3 Security Audit
npm audit --audit-level=high

# 3.4 Database Migration Test
npm run db:migrate:test

# 3.5 Build Production Bundle
npm run build:prod

# 3.6 Bundle Size Check
npm run bundle:analyze
```

**Exit Criteria:**
- ✅ All test layers pass
- ✅ No high/critical vulnerabilities
- ✅ Migration runs successfully
- ✅ Bundle size < threshold
- ✅ Critical E2E paths pass

**Time Budget:** <10 minutes

**Fail Behavior:** Alert team, block deployment

---

### 4. Deployment Tests (Pre-Deploy)

**When:** Before deploying to staging/production

**Tasks:**
```bash
# 4.1 E2E Tests (Full Suite)
npm run test:e2e

# 4.2 Performance Tests
npm run test:perf

# 4.3 Accessibility Tests
npm run test:a11y

# 4.4 Visual Regression Tests
npm run test:visual

# 4.5 Database Backup Verification
npm run db:backup:verify
```

**Exit Criteria:**
- ✅ All E2E tests pass
- ✅ Performance within SLA (p95 < 300ms)
- ✅ No accessibility violations (WCAG AA)
- ✅ Visual diffs approved
- ✅ Backup verified

**Time Budget:** <20 minutes

**Fail Behavior:** Block deployment, rollback if necessary

---

### 5. Post-Deployment Tests (Smoke)

**When:** After deployment to staging/production

**Tasks:**
```bash
# 5.1 Health Check
npm run health:check

# 5.2 Smoke Tests (Critical Paths)
npm run test:smoke

# 5.3 Database Connectivity
npm run db:ping

# 5.4 API Endpoints
npm run api:ping

# 5.5 Monitor Errors (First 5 minutes)
npm run monitor:errors -- --duration=5m
```

**Exit Criteria:**
- ✅ All health checks pass
- ✅ Critical paths work
- ✅ No 5xx errors
- ✅ Error rate < 0.1%

**Time Budget:** <3 minutes

**Fail Behavior:** Trigger rollback, alert on-call

---

### 6. Scheduled Tests (Nightly)

**When:** Daily at 2:00 AM UTC

**Tasks:**
```bash
# 6.1 Full E2E Suite
npm run test:e2e:full

# 6.2 Security Scan
npm run security:scan

# 6.3 Dependency Check
npm run deps:check

# 6.4 Database Health
npm run db:health

# 6.5 Cleanup Orphaned Test Data
npm run test:cleanup

# 6.6 Generate Test Report
npm run test:report
```

**Exit Criteria:**
- ✅ All tests pass
- ✅ No new vulnerabilities
- ✅ No outdated critical deps
- ✅ Database metrics healthy

**Time Budget:** <30 minutes

**Fail Behavior:** Email report, create tickets

---

## Command Reference

### Test Commands

| Command | Description | Layer | Time |
|---------|-------------|-------|------|
| `npm run test` | Run all tests | All | ~15 min |
| `npm run test:unit` | Unit tests only | Unit | ~30 sec |
| `npm run test:int` | Integration tests | Integration | ~3 min |
| `npm run test:e2e` | E2E tests (full) | E2E | ~15 min |
| `npm run test:e2e -- --grep "@critical"` | Critical E2E only | E2E | ~5 min |
| `npm run test:smoke` | Smoke tests | E2E | ~2 min |
| `npm run test:watch` | Watch mode | Unit | ∞ |
| `npm run test:coverage` | Generate coverage | Unit + Int | ~4 min |
| `npm run test:ui` | Vitest UI | Unit | ∞ |

### Quality Commands

| Command | Description | Time |
|---------|-------------|------|
| `npm run lint` | ESLint | ~10 sec |
| `npm run lint:fix` | ESLint + auto-fix | ~15 sec |
| `npm run typecheck` | TypeScript | ~10 sec |
| `npm run format:check` | Prettier check | ~5 sec |
| `npm run format:write` | Prettier format | ~10 sec |
| `npm audit` | Security audit | ~5 sec |
| `npm run bundle:analyze` | Bundle size | ~30 sec |

### Database Commands

| Command | Description | Time |
|---------|-------------|------|
| `npm run db:migrate` | Run migrations | ~5 sec |
| `npm run db:migrate:test` | Test migrations | ~10 sec |
| `npm run db:seed` | Seed test data | ~10 sec |
| `npm run db:reset` | Reset DB | ~15 sec |
| `npm run db:health` | Health check | ~2 sec |
| `npm run test:cleanup` | Cleanup test data | ~5 sec |

### CI Helper Commands

| Command | Description | Time |
|---------|-------------|------|
| `npm run ci:prepare` | Prepare CI env | ~30 sec |
| `npm run ci:test` | Full CI test suite | ~15 min |
| `npm run ci:report` | Generate CI report | ~10 sec |
| `npm run coverage:upload` | Upload coverage | ~5 sec |
| `npm run health:check` | System health | ~2 sec |
| `npm run api:ping` | API health | ~2 sec |

---

## Environment Variables (CI)

```bash
# Test Environment
NODE_ENV=test
VITE_SUPABASE_URL=<test-instance-url>
VITE_SUPABASE_ANON_KEY=<test-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<test-service-role-key>

# CI/CD
CI=true
CI_PIPELINE_ID=<pipeline-id>
CI_COMMIT_SHA=<commit-hash>
CI_COMMIT_REF_NAME=<branch-name>

# Test Configuration
TEST_TIMEOUT=30000
TEST_RETRIES=2
TEST_PARALLEL=4
COVERAGE_THRESHOLD=80

# Playwright
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_SLOWMO=0
PLAYWRIGHT_BROWSER=chromium

# Database
DATABASE_URL=<test-db-url>
TEST_TENANT_PREFIX=ci-test-
CLEANUP_TEST_DATA=true
```

---

## GitHub Actions Workflow (Template)

**File:** `.github/workflows/test.yml`

```yaml
name: Test Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20.x'
  COVERAGE_THRESHOLD: 80

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  unit-tests:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  integration-tests:
    runs-on: ubuntu-latest
    needs: lint
    services:
      postgres:
        image: supabase/postgres:latest
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
      - run: npm ci
      - run: npm run db:migrate:test
      - run: npm run test:int

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## GitLab CI Configuration (Template)

**File:** `.gitlab-ci.yml`

```yaml
stages:
  - lint
  - test-unit
  - test-integration
  - test-e2e
  - deploy

variables:
  NODE_VERSION: "20"
  COVERAGE_THRESHOLD: "80"

lint:
  stage: lint
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm run lint
    - npm run typecheck
  cache:
    paths:
      - node_modules/

test-unit:
  stage: test-unit
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm run test:unit
    - npm run test:coverage
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

test-integration:
  stage: test-integration
  image: node:${NODE_VERSION}
  services:
    - postgres:latest
  variables:
    POSTGRES_DB: test_db
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
  script:
    - npm ci
    - npm run db:migrate:test
    - npm run test:int

test-e2e:
  stage: test-e2e
  image: mcr.microsoft.com/playwright:latest
  script:
    - npm ci
    - npm run build
    - npm run test:e2e
  only:
    - main
  artifacts:
    when: always
    paths:
      - playwright-report/
```

---

## Test Failure Handling

### Unit/Integration Test Failure
1. ❌ Block PR merge
2. 📧 Notify PR author
3. 🔍 Show detailed test output
4. ⏭️ Allow retry (max 2 attempts)

### E2E Test Failure
1. ❌ Block deployment
2. 📧 Notify on-call engineer
3. 📸 Attach screenshots/videos
4. 🔄 Auto-retry once (flake detection)
5. 🚨 Escalate if retry fails

### Post-Deployment Failure
1. 🚨 Trigger alert
2. 📞 Page on-call
3. 🔙 Auto-rollback (if enabled)
4. 📝 Create incident ticket

---

## Flaky Test Management

**Definition:** Test that passes/fails inconsistently

**Detection:**
- Test fails < 10% of runs
- Passes on retry

**Handling:**
1. 🏷️ Mark test with `@flaky` tag
2. 📝 Create ticket for investigation
3. ⏭️ Allow test to be skipped in CI (temporary)
4. 🔧 Fix root cause (race conditions, timing, etc.)
5. ✅ Remove `@flaky` tag when stable

**Quarantine Policy:**
- Flaky tests go to `tests/quarantine/`
- Excluded from PR checks
- Fixed within 1 sprint or deleted

---

## Performance Benchmarks

| Metric | Target | Alert |
|--------|--------|-------|
| Unit tests | <1 min | >2 min |
| Integration tests | <5 min | >10 min |
| E2E tests (critical) | <10 min | >20 min |
| E2E tests (full) | <30 min | >60 min |
| Build time | <2 min | >5 min |
| Total pipeline | <15 min | >30 min |

---

## Next Steps

### Phase 1: Setup (Week 1)
- [ ] Create test helper utilities
- [ ] Set up fixtures and seeds
- [ ] Configure Vitest and Playwright
- [ ] Write CI configuration files

### Phase 2: Unit Tests (Week 2-3)
- [ ] Implement critical unit tests
- [ ] Achieve 70% unit coverage
- [ ] Integrate with CI

### Phase 3: Integration Tests (Week 4-5)
- [ ] Implement RLS tests
- [ ] Implement DB operation tests
- [ ] Achieve 60% integration coverage

### Phase 4: E2E Tests (Week 6-7)
- [ ] Implement critical path E2E
- [ ] Implement RBAC E2E
- [ ] Achieve 80% E2E coverage

### Phase 5: CI/CD (Week 8)
- [ ] Deploy CI pipeline
- [ ] Monitor and tune performance
- [ ] Document process

---

**Last Updated:** 2025-11-09  
**Owner:** DevOps + QA Team  
**Status:** 📋 Planning — Implementation starts in next iteration
